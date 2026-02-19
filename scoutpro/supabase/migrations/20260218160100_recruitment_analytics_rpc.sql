-- Recruitment Pipeline Analytics RPC (Module 1 only)
-- Provides server-side aggregations for analytics dashboard.

-- Helper: current business role (safe for RLS).
create or replace function public.current_business_role()
returns public.user_business_role
language sql
stable
security definer
set search_path = public
as $$
  select u.business_role
    from public.users u
   where u.id = auth.uid()
   limit 1
$$;

-- Helper: read analytics settings as jsonb map.
create or replace function public.analytics_settings_get()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(s.setting_key, to_jsonb(s.setting_value)),
    '{}'::jsonb
  )
  from public.analytics_settings s
$$;

-- Helper: upsert analytics settings (admin only).
create or replace function public.analytics_settings_upsert(p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  v text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  if p_settings is null then
    return;
  end if;

  for k, v in
    select key, value::text
      from jsonb_each(coalesce(p_settings, '{}'::jsonb))
  loop
    insert into public.analytics_settings(setting_key, setting_value, updated_by, updated_at)
    values (k, trim(both '"' from v), auth.uid(), now())
    on conflict (setting_key)
    do update set
      setting_value = excluded.setting_value,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at;
  end loop;
end $$;

-- Trends RPC: event-based time series.
create or replace function public.analytics_trends(
  p_date_from date,
  p_date_to date,
  p_granularity text,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_business_role;
  v_start timestamptz;
  v_end timestamptz;
  v_gran text;
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return jsonb_build_object('buckets', '[]'::jsonb);
  end if;

  v_start := (p_date_from::timestamptz);
  v_end := ((p_date_to + 1)::timestamptz);
  v_gran := case lower(coalesce(p_granularity,'week'))
    when 'day' then 'day'
    when 'week' then 'week'
    when 'month' then 'month'
    when 'quarter' then 'quarter'
    else 'week'
  end;

  with
  scout_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'scout_ids','[]'::jsonb)) t(value)
  ),
  region_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'region_ids','[]'::jsonb)) t(value)
  ),
  club_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'club_ids','[]'::jsonb)) t(value)
  ),
  birth_years as (
    select array_agg(value::int) as v
      from jsonb_array_elements_text(coalesce(p_filters->'birth_years','[]'::jsonb)) t(value)
  ),
  positions as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'positions','[]'::jsonb)) t(value)
  ),
  sources as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'sources','[]'::jsonb)) t(value)
  ),
  ranks as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'ranks','[]'::jsonb)) t(value)
  ),
  first_contact_events as (
    select
      tp.player_id,
      t.created_at as fc_at,
      t.created_by as actor_id,
      t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source,
      null::text as rank,
      'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select
      o.player_id,
      o.first_contact_date as fc_at,
      o.scout_id as actor_id,
      o.scout_id as assignee_id,
      o.source::text as source,
      o.rank as rank,
      'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.*
    from first_contact_events e
    cross join scout_ids si
    cross join sources so
    cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0
        or e.actor_id = any(si.v)
        or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (
        v_role <> 'scout'
        or public.is_admin()
        or e.actor_id = auth.uid()
        or e.assignee_id = auth.uid()
      )
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn
    from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at
    from ranked_fc
    where rn = 1
  ),
  cohort as (
    select en.player_id, en.first_contact_at
    from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select
      c.player_id,
      c.first_contact_at,
      p.birth_year,
      p.primary_position,
      p.pipeline_status,
      p.club_id,
      p.region_id,
      cl.region_id as club_region_id
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or p.region_id = any(ri.v) or cl.region_id = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  -- time buckets that have any activity
  fc_counts as (
    select date_trunc(v_gran, cp.first_contact_at) as bucket_at, count(*) as n
    from cohort_players cp
    group by 1
  ),
  obs_first as (
    select o.player_id, min(o.created_at) as first_obs_at
    from public.observations o
    group by o.player_id
  ),
  observed_counts as (
    select date_trunc(v_gran, f.first_obs_at) as bucket_at, count(*) as n
    from cohort_players cp
    join obs_first f on f.player_id = cp.player_id
    where f.first_obs_at >= v_start and f.first_obs_at < v_end
    group by 1
  ),
  status_counts as (
    select date_trunc(v_gran, h.created_at) as bucket_at, h.to_status as status, count(distinct h.player_id) as n
    from public.pipeline_history h
    join cohort_players cp on cp.player_id = h.player_id
    where h.created_at >= v_start and h.created_at < v_end
      and h.to_status in ('shortlist','trial','offer','signed','rejected')
    group by 1, 2
  ),
  all_buckets as (
    select bucket_at from fc_counts
    union
    select bucket_at from observed_counts
    union
    select bucket_at from status_counts
  ),
  assembled as (
    select
      b.bucket_at,
      coalesce(fc.n,0) as first_contact,
      coalesce(ob.n,0) as observed,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='shortlist'),0) as shortlist,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='trial'),0) as trial,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='offer'),0) as offer,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='signed'),0) as signed,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='rejected'),0) as rejected
    from all_buckets b
    left join fc_counts fc on fc.bucket_at=b.bucket_at
    left join observed_counts ob on ob.bucket_at=b.bucket_at
  )
  select jsonb_build_object(
    'granularity', v_gran,
    'buckets', coalesce(jsonb_agg(jsonb_build_object(
      't', to_char(a.bucket_at,'YYYY-MM-DD'),
      'first_contact', a.first_contact,
      'observed', a.observed,
      'shortlist', a.shortlist,
      'trial', a.trial,
      'offer', a.offer,
      'signed', a.signed,
      'rejected', a.rejected
    ) order by a.bucket_at), '[]'::jsonb)
  )
  into v_result
  from assembled a;

  return v_result;
end $$;

-- Comparisons RPC: aggregated breakdowns.
create or replace function public.analytics_comparisons(
  p_type text,
  p_date_from date,
  p_date_to date,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_business_role;
  v_start timestamptz;
  v_end timestamptz;
  v_kind text;
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return '[]'::jsonb;
  end if;

  v_kind := lower(coalesce(p_type,'scouts'));
  v_start := (p_date_from::timestamptz);
  v_end := ((p_date_to + 1)::timestamptz);

  with
  scout_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'scout_ids','[]'::jsonb)) t(value)
  ),
  region_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'region_ids','[]'::jsonb)) t(value)
  ),
  club_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'club_ids','[]'::jsonb)) t(value)
  ),
  birth_years as (
    select array_agg(value::int) as v
      from jsonb_array_elements_text(coalesce(p_filters->'birth_years','[]'::jsonb)) t(value)
  ),
  positions as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'positions','[]'::jsonb)) t(value)
  ),
  sources as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'sources','[]'::jsonb)) t(value)
  ),
  ranks as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'ranks','[]'::jsonb)) t(value)
  ),
  first_contact_events as (
    select
      tp.player_id,
      t.created_at as fc_at,
      t.created_by as actor_id,
      t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source,
      null::text as rank,
      'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select
      o.player_id,
      o.first_contact_date as fc_at,
      o.scout_id as actor_id,
      o.scout_id as assignee_id,
      o.source::text as source,
      o.rank as rank,
      'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.*
    from first_contact_events e
    cross join scout_ids si
    cross join sources so
    cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0
        or e.actor_id = any(si.v)
        or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (
        v_role <> 'scout'
        or public.is_admin()
        or e.actor_id = auth.uid()
        or e.assignee_id = auth.uid()
      )
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn
    from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at, actor_id as first_contact_actor, source as first_contact_source
    from ranked_fc
    where rn = 1
  ),
  cohort as (
    select *
    from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select
      c.player_id,
      c.first_contact_actor,
      c.first_contact_source,
      c.first_contact_at,
      p.birth_year,
      p.primary_position,
      p.pipeline_status,
      p.club_id,
      p.region_id,
      cl.region_id as club_region_id
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or p.region_id = any(ri.v) or cl.region_id = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  signed as (
    select distinct h.player_id
    from public.pipeline_history h
    where h.to_status = 'signed'
  ),
  base as (
    select
      cp.*,
      (cp.player_id in (select player_id from signed) or cp.pipeline_status = 'signed') as is_signed
    from cohort_players cp
  )
  select
    case
      when v_kind = 'scouts' then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', u.id,
          'label', coalesce(nullif(u.full_name,''), u.email),
          'first_contact', cnt.first_contact,
          'signed', cnt.signed,
          'success_rate', case when cnt.first_contact > 0 then round((cnt.signed::numeric / cnt.first_contact::numeric) * 100.0, 1) else 0 end
        ) order by cnt.signed desc), '[]'::jsonb)
        from (
          select b.first_contact_actor as user_id,
                 count(*) as first_contact,
                 count(*) filter (where b.is_signed) as signed
          from base b
          group by 1
        ) cnt
        join public.users u on u.id = cnt.user_id
      )
      when v_kind = 'regions' then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', r.id,
          'label', r.name,
          'first_contact', cnt.first_contact,
          'signed', cnt.signed,
          'success_rate', case when cnt.first_contact > 0 then round((cnt.signed::numeric / cnt.first_contact::numeric) * 100.0, 1) else 0 end
        ) order by cnt.signed desc), '[]'::jsonb)
        from (
          select coalesce(b.region_id, b.club_region_id) as region_id,
                 count(*) as first_contact,
                 count(*) filter (where b.is_signed) as signed
          from base b
          group by 1
        ) cnt
        join public.regions r on r.id = cnt.region_id
      )
      when v_kind = 'positions' then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', coalesce(cnt.primary_position,'unknown'),
          'label', coalesce(cnt.primary_position,'(brak)'),
          'first_contact', cnt.first_contact,
          'signed', cnt.signed,
          'success_rate', case when cnt.first_contact > 0 then round((cnt.signed::numeric / cnt.first_contact::numeric) * 100.0, 1) else 0 end
        ) order by cnt.signed desc), '[]'::jsonb)
        from (
          select b.primary_position,
                 count(*) as first_contact,
                 count(*) filter (where b.is_signed) as signed
          from base b
          group by 1
        ) cnt
      )
      when v_kind = 'sources' then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', coalesce(cnt.first_contact_source,'unknown'),
          'label', coalesce(cnt.first_contact_source,'(brak)'),
          'first_contact', cnt.first_contact,
          'signed', cnt.signed,
          'success_rate', case when cnt.first_contact > 0 then round((cnt.signed::numeric / cnt.first_contact::numeric) * 100.0, 1) else 0 end
        ) order by cnt.signed desc), '[]'::jsonb)
        from (
          select b.first_contact_source,
                 count(*) as first_contact,
                 count(*) filter (where b.is_signed) as signed
          from base b
          group by 1
        ) cnt
      )
      when v_kind = 'ages' then (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', cnt.age_label,
          'label', cnt.age_label,
          'first_contact', cnt.first_contact,
          'signed', cnt.signed,
          'success_rate', case when cnt.first_contact > 0 then round((cnt.signed::numeric / cnt.first_contact::numeric) * 100.0, 1) else 0 end
        ) order by cnt.age_label), '[]'::jsonb)
        from (
          select
            ('U' || greatest(0, extract(year from current_date)::int - b.birth_year)) as age_label,
            count(*) as first_contact,
            count(*) filter (where b.is_signed) as signed
          from base b
          group by 1
        ) cnt
      )
      else '[]'::jsonb
    end
  into v_result;

  return v_result;
end $$;

-- Player list RPC: drill-down for funnel / heatmap.
create or replace function public.analytics_player_list(
  p_status text,
  p_date_from date,
  p_date_to date,
  p_filters jsonb default '{}'::jsonb,
  p_page int default 1,
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_business_role;
  v_start timestamptz;
  v_end timestamptz;
  v_status text;
  v_offset int;
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return jsonb_build_object('total', 0, 'items', '[]'::jsonb);
  end if;

  v_start := (p_date_from::timestamptz);
  v_end := ((p_date_to + 1)::timestamptz);
  v_status := lower(coalesce(p_status,'first_contact'));
  v_offset := greatest(0, (coalesce(p_page,1) - 1) * coalesce(p_limit,20));

  with
  scout_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'scout_ids','[]'::jsonb)) t(value)
  ),
  region_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'region_ids','[]'::jsonb)) t(value)
  ),
  club_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'club_ids','[]'::jsonb)) t(value)
  ),
  birth_years as (
    select array_agg(value::int) as v
      from jsonb_array_elements_text(coalesce(p_filters->'birth_years','[]'::jsonb)) t(value)
  ),
  positions as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'positions','[]'::jsonb)) t(value)
  ),
  sources as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'sources','[]'::jsonb)) t(value)
  ),
  ranks as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'ranks','[]'::jsonb)) t(value)
  ),
  first_contact_events as (
    select
      tp.player_id,
      t.created_at as fc_at,
      t.created_by as actor_id,
      t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source,
      null::text as rank,
      'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select
      o.player_id,
      o.first_contact_date as fc_at,
      o.scout_id as actor_id,
      o.scout_id as assignee_id,
      o.source::text as source,
      o.rank as rank,
      'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.*
    from first_contact_events e
    cross join scout_ids si
    cross join sources so
    cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0
        or e.actor_id = any(si.v)
        or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (
        v_role <> 'scout'
        or public.is_admin()
        or e.actor_id = auth.uid()
        or e.assignee_id = auth.uid()
      )
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn
    from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at
    from ranked_fc
    where rn = 1
  ),
  cohort as (
    select en.player_id, en.first_contact_at
    from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select
      c.player_id,
      c.first_contact_at,
      p.first_name,
      p.last_name,
      p.birth_year,
      p.primary_position,
      p.pipeline_status,
      p.days_in_current_status,
      p.last_status_change,
      cl.name as club_name,
      p.club_id,
      p.region_id,
      cl.region_id as club_region_id
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or p.region_id = any(ri.v) or cl.region_id = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  obs_stats as (
    select
      o.player_id,
      max(o.created_at) as last_observation_at,
      count(*) as total_observations,
      (array_agg(o.rank order by o.created_at desc))[1] as last_rank
    from public.observations o
    group by o.player_id
  ),
  with_obs as (
    select cp.*, os.last_observation_at, os.total_observations, os.last_rank
    from cohort_players cp
    left join obs_stats os on os.player_id = cp.player_id
  ),
  filtered as (
    select *
    from with_obs
    where
      case
        when v_status = 'first_contact' then (last_observation_at is null)
        when v_status in ('observed','shortlist','trial','offer','signed','rejected') then (pipeline_status::text = v_status)
        else true
      end
  ),
  total as (
    select count(*) as n from filtered
  ),
  page_items as (
    select *
    from filtered
    order by coalesce(days_in_current_status,0) desc, last_name asc, first_name asc
    offset v_offset
    limit coalesce(p_limit,20)
  )
  select jsonb_build_object(
    'total', (select n from total),
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', i.player_id,
      'first_name', i.first_name,
      'last_name', i.last_name,
      'birth_year', i.birth_year,
      'position', i.primary_position,
      'club', i.club_name,
      'status', i.pipeline_status::text,
      'days_in_status', i.days_in_current_status,
      'last_observation_at', case when i.last_observation_at is null then null else to_char(i.last_observation_at,'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') end,
      'rank', i.last_rank,
      'total_observations', coalesce(i.total_observations,0)
    )), '[]'::jsonb)
  )
  into v_result
  from page_items i;

  return v_result;
end $$;

-- Core RPC: pipeline metrics.
create or replace function public.analytics_pipeline_metrics(
  p_date_from date,
  p_date_to date,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_business_role;
  v_settings jsonb;
  v_start timestamptz;
  v_end timestamptz;
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return jsonb_build_object('kpi', jsonb_build_object(), 'funnel', jsonb_build_object());
  end if;

  v_settings := public.analytics_settings_get();
  v_start := (p_date_from::timestamptz);
  v_end := ((p_date_to + 1)::timestamptz); -- end-exclusive

  with
  scout_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'scout_ids','[]'::jsonb)) t(value)
  ),
  region_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'region_ids','[]'::jsonb)) t(value)
  ),
  club_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'club_ids','[]'::jsonb)) t(value)
  ),
  birth_years as (
    select array_agg(value::int) as v
      from jsonb_array_elements_text(coalesce(p_filters->'birth_years','[]'::jsonb)) t(value)
  ),
  positions as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'positions','[]'::jsonb)) t(value)
  ),
  sources as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'sources','[]'::jsonb)) t(value)
  ),
  ranks as (
    select array_agg(value::text) as v
      from jsonb_array_elements_text(coalesce(p_filters->'ranks','[]'::jsonb)) t(value)
  ),

  -- First-contact candidates come from observation tasks OR observations.
  first_contact_events as (
    select
      tp.player_id,
      t.created_at as fc_at,
      t.created_by as actor_id,
      t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source,
      null::text as rank,
      'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select
      o.player_id,
      o.first_contact_date as fc_at,
      o.scout_id as actor_id,
      o.scout_id as assignee_id,
      o.source::text as source,
      o.rank as rank,
      'observation'::text as fc_type
    from public.observations o
  ),

  -- Apply event-level filters first (scout/source/rank) so that "first contact" respects selected dimensions.
  filtered_fc_events as (
    select e.*
    from first_contact_events e
    cross join scout_ids si
    cross join sources so
    cross join ranks ra
    where
      -- date bounds applied later on the per-player minimum, not per-event
      (si.v is null or cardinality(si.v) = 0
        or e.actor_id = any(si.v)
        or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (
        v_role <> 'scout'
        or public.is_admin()
        or e.actor_id = auth.uid()
        or e.assignee_id = auth.uid()
      )
  ),

  ranked_fc as (
    select
      e.*,
      row_number() over (partition by e.player_id order by e.fc_at asc) as rn
    from filtered_fc_events e
  ),
  entered as (
    select
      player_id,
      fc_at as first_contact_at,
      source as first_contact_source
    from ranked_fc
    where rn = 1
  ),
  cohort as (
    select
      en.player_id,
      en.first_contact_at,
      en.first_contact_source
    from entered en
    where en.first_contact_at >= v_start
      and en.first_contact_at < v_end
  ),
  cohort_players as (
    select
      c.player_id,
      c.first_contact_at,
      p.birth_year,
      p.primary_position,
      p.pipeline_status,
      p.club_id,
      p.region_id,
      p.last_status_change,
      p.days_in_current_status,
      cl.region_id as club_region_id
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or p.region_id = any(ri.v) or cl.region_id = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  stage_reached as (
    select
      cp.player_id,
      -- observed: at least one observation exists (report created)
      exists (select 1 from public.observations o where o.player_id = cp.player_id) as reached_observed,
      (cp.pipeline_status in ('shortlist','trial','offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('shortlist','trial','offer','signed')) as reached_shortlist,
      (cp.pipeline_status in ('trial','offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('trial','offer','signed')) as reached_trial,
      (cp.pipeline_status in ('offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('offer','signed')) as reached_offer,
      (cp.pipeline_status = 'signed') or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status = 'signed') as reached_signed,
      (cp.pipeline_status = 'rejected') or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status = 'rejected') as reached_rejected
    from cohort_players cp
  ),
  signed_times as (
    select
      cp.player_id,
      min(h.created_at) as signed_at
    from cohort_players cp
    join public.pipeline_history h on h.player_id = cp.player_id and h.to_status = 'signed'
    group by cp.player_id
  ),
  kpis as (
    select
      (select count(*) from cohort_players) as total_candidates,
      (select count(*) from stage_reached where reached_observed) as observed_candidates,
      (select count(*) from stage_reached where reached_shortlist) as shortlist_candidates,
      (select count(*) from stage_reached where reached_trial) as trial_candidates,
      (select count(*) from stage_reached where reached_offer) as offer_candidates,
      (select count(*) from stage_reached where reached_signed) as signed_candidates,
      (select count(*) from stage_reached where reached_rejected) as rejected_candidates,
      (select count(*) from cohort_players where pipeline_status = 'trial') as active_trials,
      (select avg(extract(epoch from (st.signed_at - cp.first_contact_at))/86400.0)
         from cohort_players cp
         join signed_times st on st.player_id = cp.player_id
        where st.signed_at is not null
      ) as avg_time_to_hire_days
  ),
  bottlenecks as (
    select jsonb_agg(jsonb_build_object(
      'player_id', cp.player_id,
      'status', cp.pipeline_status::text,
      'days_in_status', cp.days_in_current_status,
      'max_days', case cp.pipeline_status::text
        when 'observed' then nullif(v_settings->>'max_days_in_observed','')::int
        when 'shortlist' then nullif(v_settings->>'max_days_in_shortlist','')::int
        when 'trial' then nullif(v_settings->>'max_days_in_trial','')::int
        when 'offer' then nullif(v_settings->>'max_days_in_offer','')::int
        else null
      end
    )) filter (where
      cp.days_in_current_status is not null and
      case cp.pipeline_status::text
        when 'observed' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_observed','')::int, 1000000)
        when 'shortlist' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_shortlist','')::int, 1000000)
        when 'trial' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_trial','')::int, 1000000)
        when 'offer' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_offer','')::int, 1000000)
        else false
      end
    ) as items
    from cohort_players cp
  )
  select jsonb_build_object(
    'kpi', jsonb_build_object(
      'totalCandidates', k.total_candidates,
      'conversionRate', case when k.total_candidates > 0
        then round((k.signed_candidates::numeric / k.total_candidates::numeric) * 100.0, 1)
        else 0 end,
      'timeToHireDaysAvg', coalesce(round(k.avg_time_to_hire_days::numeric, 1), 0),
      'activeTrials', k.active_trials,
      'signed', k.signed_candidates,
      'firstContact', k.total_candidates
    ),
    'funnel', jsonb_build_object(
      'first_contact', k.total_candidates,
      'observed', k.observed_candidates,
      'shortlist', k.shortlist_candidates,
      'trial', k.trial_candidates,
      'offer', k.offer_candidates,
      'signed', k.signed_candidates,
      'rejected', k.rejected_candidates
    ),
    'bottlenecks', coalesce((select items from bottlenecks), '[]'::jsonb),
    'settings', v_settings
  )
  into v_result
  from kpis k;

  return v_result;
end $$;

