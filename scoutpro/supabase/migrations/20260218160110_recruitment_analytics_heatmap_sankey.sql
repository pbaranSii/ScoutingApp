-- Additional RPC helpers for Recruitment Analytics: heatmap + sankey datasets.

create or replace function public.analytics_heatmap(
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
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return '[]'::jsonb;
  end if;

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
    select player_id, fc_at as first_contact_at
    from ranked_fc
    where rn = 1
  ),
  cohort as (
    select en.player_id
    from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select
      p.id as player_id,
      p.pipeline_status::text as status,
      coalesce(p.region_id, cl.region_id) as region_id,
      r.name as region_name
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    left join public.regions r on r.id = coalesce(p.region_id, cl.region_id)
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or coalesce(p.region_id, cl.region_id) = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  agg as (
    select
      region_id,
      coalesce(region_name,'(brak)') as region_name,
      count(*) filter (where status='observed') as observed,
      count(*) filter (where status='shortlist') as shortlist,
      count(*) filter (where status='trial') as trial,
      count(*) filter (where status='offer') as offer,
      count(*) filter (where status='signed') as signed,
      count(*) filter (where status='rejected') as rejected
    from cohort_players
    group by 1,2
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'region_id', a.region_id,
    'region_name', a.region_name,
    'observed', a.observed,
    'shortlist', a.shortlist,
    'trial', a.trial,
    'offer', a.offer,
    'signed', a.signed,
    'rejected', a.rejected
  ) order by (a.signed + a.trial + a.offer) desc), '[]'::jsonb)
  into v_result
  from agg a;

  return v_result;
end $$;

create or replace function public.analytics_sankey(
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
  v_result jsonb;
begin
  v_role := public.current_business_role();
  if v_role is null or v_role = 'suspended' then
    return jsonb_build_object('nodes','[]'::jsonb,'links','[]'::jsonb);
  end if;

  v_start := (p_date_from::timestamptz);
  v_end := ((p_date_to + 1)::timestamptz);

  with
  scout_ids as (
    select array_agg(value::uuid) as v
      from jsonb_array_elements_text(coalesce(p_filters->'scout_ids','[]'::jsonb)) t(value)
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
    select en.player_id
    from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  transitions as (
    select
      coalesce(h.from_status,'first_contact') as source,
      h.to_status as target,
      count(*) as value
    from public.pipeline_history h
    join cohort c on c.player_id = h.player_id
    where h.created_at >= v_start and h.created_at < v_end
      and h.to_status in ('observed','shortlist','trial','offer','signed','rejected')
    group by 1,2
  ),
  nodes as (
    select distinct x.id
    from (
      select source as id from transitions
      union all
      select target as id from transitions
    ) x
  )
  select jsonb_build_object(
    'nodes', coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'label', n.id) order by n.id), '[]'::jsonb),
    'links', coalesce((select jsonb_agg(jsonb_build_object('source', t.source, 'target', t.target, 'value', t.value)) from transitions t), '[]'::jsonb)
  )
  into v_result
  from nodes n;

  return v_result;
end $$;

