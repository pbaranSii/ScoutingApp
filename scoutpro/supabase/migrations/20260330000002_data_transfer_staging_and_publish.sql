-- Admin data transfer: staging tables + publish RPC (atomic import of players/observations)

-- 1) Staging (raw bundle snapshot). Keep full data for audit and future remapping.
create table if not exists public.import_stg_bundle (
  run_id uuid primary key references public.import_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  bundle jsonb not null
);

-- 2) Publish RPC: moves staged bundle to production tables in one transaction.
-- Note: user creation in auth cannot happen inside SQL; caller must ensure users exist and
-- import_user_map has target_user_id for all referenced emails before calling publish.
create or replace function public.admin_data_transfer_publish(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.import_runs%rowtype;
  v_bundle jsonb;
  v_players jsonb;
  v_observations jsonb;
  v_inserted_players int := 0;
  v_updated_players int := 0;
  v_inserted_observations int := 0;
  p record;
  o record;
  v_first text;
  v_last text;
  v_birth_year int;
  v_club_name text;
  v_region_name text;
  v_cat_name text;
  v_cat_area text;
  v_created_by_email text;
  v_club_id uuid;
  v_region_id uuid;
  v_age_cat_id uuid;
  v_created_by uuid;
  v_existing_id uuid;
  v_player_source text;
  v_scout_email text;
  v_date date;
  v_source text;
  v_scout_id uuid;
  v_player_id uuid;
  v_exists uuid;
begin
  -- Only admin may publish (defense-in-depth; service role bypasses RLS anyway).
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;

  select * into v_run from public.import_runs where id = p_run_id for update;
  if not found then
    raise exception 'Import run not found';
  end if;

  if v_run.status not in ('preflight_ok', 'commit_running', 'staged') then
    raise exception 'Invalid run status: %', v_run.status;
  end if;

  select b.bundle into v_bundle
  from public.import_stg_bundle b
  where b.run_id = p_run_id;
  if v_bundle is null then
    raise exception 'Missing staged bundle';
  end if;

  v_players := coalesce(v_bundle->'players','[]'::jsonb);
  v_observations := coalesce(v_bundle->'observations','[]'::jsonb);

  -- Validate user mappings exist for referenced emails.
  if exists (
    select 1
    from (
      select distinct lower(trim(value::text)) as email
      from jsonb_array_elements(v_observations) o,
           jsonb_extract_path_text(o,'scout_email') as value
      where coalesce(jsonb_extract_path_text(o,'scout_email'), '') <> ''
    ) e
    left join public.import_user_map m
      on m.run_id = p_run_id and lower(trim(m.source_email)) = e.email
    where m.target_user_id is null
  ) then
    raise exception 'Missing user mapping for some scout emails';
  end if;

  -- Upsert reference dictionaries by natural keys (inside transaction).
  -- Regions
  insert into public.regions(name, is_active)
  select distinct r->>'name' as name, coalesce((r->>'is_active')::boolean, true) as is_active
  from jsonb_array_elements(coalesce(v_bundle->'regions','[]'::jsonb)) r
  where coalesce(r->>'name','') <> ''
  on conflict (name) do update set is_active = excluded.is_active;

  -- Clubs: minimal insert by name; keep existing if present
  insert into public.clubs(name, is_active, area)
  select distinct c->>'name' as name,
         coalesce((c->>'is_active')::boolean, true) as is_active,
         coalesce(c->>'area','ALL') as area
  from jsonb_array_elements(coalesce(v_bundle->'clubs','[]'::jsonb)) c
  where coalesce(c->>'name','') <> ''
  on conflict (name) do update set
    is_active = excluded.is_active,
    area = coalesce(nullif(excluded.area,''), public.clubs.area);

  -- Categories: insert by (name, area) if present; requires columns existing in schema.
  -- If your schema does not allow duplicate names across areas, adapt as needed.
  insert into public.categories(name, area, is_active)
  select distinct cat->>'name' as name,
         coalesce(cat->>'area','AKADEMIA') as area,
         coalesce((cat->>'is_active')::boolean, true) as is_active
  from jsonb_array_elements(coalesce(v_bundle->'categories','[]'::jsonb)) cat
  where coalesce(cat->>'name','') <> ''
  on conflict do nothing;

  -- Players: dedupe by (first_name,last_name,birth_year,club_name). No unique constraint in schema,
  -- so we do lookup + insert/update deterministically.
  for p in
    select value as row
    from jsonb_array_elements(v_players)
  loop
    v_first := p.row->>'first_name';
    v_last := p.row->>'last_name';
    v_birth_year := (p.row->>'birth_year')::int;
    v_club_name := nullif(p.row->>'club_name','');
    v_region_name := nullif(p.row->>'region_name','');
    v_cat_name := nullif(p.row->>'age_category_name','');
    v_cat_area := nullif(p.row->>'age_category_area','');
    v_created_by_email := lower(trim(coalesce(p.row->>'created_by_email','')));
    v_club_id := null;
    v_region_id := null;
    v_age_cat_id := null;
    v_created_by := null;
    v_existing_id := null;

      if coalesce(v_first,'') = '' or coalesce(v_last,'') = '' or v_birth_year is null then
        raise exception 'Invalid player row (missing name or birth_year)';
      end if;

      select id into v_club_id from public.clubs where name = v_club_name limit 1;
      select id into v_region_id from public.regions where name = v_region_name limit 1;
      if v_cat_name is not null then
        select id into v_age_cat_id from public.categories where name = v_cat_name and (v_cat_area is null or area::text = v_cat_area) limit 1;
      end if;
      if v_created_by_email <> '' then
        select target_user_id into v_created_by from public.import_user_map
        where run_id = p_run_id and lower(trim(source_email)) = v_created_by_email
        limit 1;
      end if;

      select id into v_existing_id
      from public.players
      where first_name = v_first
        and last_name = v_last
        and birth_year = v_birth_year
        and ((club_id is null and v_club_id is null) or club_id = v_club_id)
      order by created_at desc
      limit 1;

      if v_existing_id is null then
        insert into public.players(
          first_name,last_name,birth_year,birth_date,nationality,dominant_foot,height_cm,weight_kg,body_build,
          primary_position,secondary_positions,contract_end_date,club_id,region_id,age_category_id,created_by,pipeline_status
        ) values (
          v_first,
          v_last,
          v_birth_year,
          nullif(p.row->>'birth_date','')::date,
          nullif(p.row->>'nationality',''),
          nullif(p.row->>'dominant_foot','')::public.dominant_foot,
          nullif(p.row->>'height_cm','')::int,
          nullif(p.row->>'weight_kg','')::numeric,
          nullif(p.row->>'body_build',''),
          nullif(p.row->>'primary_position',''),
          case when jsonb_typeof(p.row->'secondary_positions')='array' then (select array_agg(x::text) from jsonb_array_elements_text(p.row->'secondary_positions') x) else null end,
          nullif(p.row->>'contract_end_date','')::date,
          v_club_id,
          v_region_id,
          v_age_cat_id,
          v_created_by,
          'unassigned'::public.pipeline_status
        );
        v_inserted_players := v_inserted_players + 1;
      else
        update public.players
        set
          birth_date = coalesce(nullif(p.row->>'birth_date','')::date, birth_date),
          nationality = coalesce(nullif(p.row->>'nationality',''), nationality),
          dominant_foot = coalesce(nullif(p.row->>'dominant_foot','')::public.dominant_foot, dominant_foot),
          height_cm = coalesce(nullif(p.row->>'height_cm','')::int, height_cm),
          weight_kg = coalesce(nullif(p.row->>'weight_kg','')::numeric, weight_kg),
          body_build = coalesce(nullif(p.row->>'body_build',''), body_build),
          primary_position = coalesce(nullif(p.row->>'primary_position',''), primary_position),
          region_id = coalesce(v_region_id, region_id),
          age_category_id = coalesce(v_age_cat_id, age_category_id),
          created_by = coalesce(v_created_by, created_by)
        where id = v_existing_id;
        v_updated_players := v_updated_players + 1;
      end if;
  end loop;

  -- Observations: insert only if missing by key (player+scout+date+source).
  for o in
    select value as row
    from jsonb_array_elements(v_observations)
  loop
    v_player_source := o.row->>'player_sourceId';
    v_scout_email := lower(trim(coalesce(o.row->>'scout_email','')));
    v_date := (o.row->>'observation_date')::date;
    v_source := coalesce(nullif(o.row->>'source',''), 'scouting');
    v_scout_id := null;
    v_player_id := null;
    v_exists := null;

      if v_scout_email = '' then
        raise exception 'Observation missing scout_email';
      end if;

      select target_user_id into v_scout_id
      from public.import_user_map
      where run_id = p_run_id and lower(trim(source_email)) = v_scout_email
      limit 1;
      if v_scout_id is null then
        raise exception 'Observation scout mapping missing: %', v_scout_email;
      end if;

      -- Resolve player in DB by matching player fields from bundle by sourceId:
      -- We re-find the player deterministically by (first,last,birth_year,club_name) to avoid relying on UUID from source.
      select p.id into v_player_id
      from public.players p
      join lateral (
        select value as pr
        from jsonb_array_elements(v_players)
        where value->>'sourceId' = v_player_source
        limit 1
      ) src on true
      left join public.clubs c on c.id = p.club_id
      where p.first_name = src.pr->>'first_name'
        and p.last_name = src.pr->>'last_name'
        and p.birth_year = (src.pr->>'birth_year')::int
        and (
          (src.pr->>'club_name') is null
          or (src.pr->>'club_name') = ''
          or c.name = src.pr->>'club_name'
        )
      order by p.created_at desc
      limit 1;

      if v_player_id is null then
        raise exception 'Observation references missing player';
      end if;

      select id into v_exists
      from public.observations
      where player_id = v_player_id
        and scout_id = v_scout_id
        and observation_date = v_date
        and source::text = v_source
      limit 1;
      if v_exists is not null then
        continue;
      end if;

      insert into public.observations(
        player_id, scout_id, observation_date, source, status,
        notes, summary, rank, competition, potential_now, potential_future, recommendation,
        observation_category, form_type, created_by, updated_by
      ) values (
        v_player_id,
        v_scout_id,
        v_date,
        v_source::public.observation_source,
        coalesce(nullif(o.row->>'status',''), 'active'),
        nullif(o.row->>'notes',''),
        nullif(o.row->>'summary',''),
        nullif(o.row->>'rank',''),
        nullif(o.row->>'competition',''),
        nullif(o.row->>'potential_now','')::numeric,
        nullif(o.row->>'potential_future','')::numeric,
        nullif(o.row->>'recommendation','')::public.recommendation_type,
        'individual'::public.observation_category_type,
        'simplified'::public.form_type,
        null,
        null
      );
      v_inserted_observations := v_inserted_observations + 1;
  end loop;

  update public.import_runs
  set status = 'commit_done',
      stats = jsonb_set(
        coalesce(stats,'{}'::jsonb),
        '{publish}',
        jsonb_build_object(
          'insertedPlayers', v_inserted_players,
          'updatedPlayers', v_updated_players,
          'insertedObservations', v_inserted_observations
        ),
        true
      )
  where id = p_run_id;

  return jsonb_build_object(
    'status','ok',
    'insertedPlayers', v_inserted_players,
    'updatedPlayers', v_updated_players,
    'insertedObservations', v_inserted_observations
  );
end;
$$;

