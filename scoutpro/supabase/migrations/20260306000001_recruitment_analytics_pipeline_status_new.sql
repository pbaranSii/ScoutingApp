-- Recruitment Analytics: use new pipeline_status codes (in_contact, evaluation, rejected_by_club, etc.).
-- Run after 20260306000000_pipeline_status_new_enum.sql.

-- analytics_trends: new status list and bucket keys
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
      and h.to_status in ('in_contact','evaluation','offer','signed','rejected_by_club','rejected_by_player','out_of_reach')
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
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='in_contact'),0) as in_contact,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='evaluation'),0) as evaluation,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='offer'),0) as offer,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='signed'),0) as signed,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='rejected_by_club'),0) as rejected_by_club,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='rejected_by_player'),0) as rejected_by_player,
      coalesce((select n from status_counts s where s.bucket_at=b.bucket_at and s.status='out_of_reach'),0) as out_of_reach
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
      'in_contact', a.in_contact,
      'evaluation', a.evaluation,
      'offer', a.offer,
      'signed', a.signed,
      'rejected_by_club', a.rejected_by_club,
      'rejected_by_player', a.rejected_by_player,
      'out_of_reach', a.out_of_reach
    ) order by a.bucket_at), '[]'::jsonb)
  )
  into v_result
  from assembled a;

  return v_result;
end $$;

-- analytics_player_list: filter by new status codes
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
        when v_status in ('observed','in_contact','evaluation','offer','signed','rejected_by_club','rejected_by_player','out_of_reach') then (pipeline_status::text = v_status)
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

-- analytics_pipeline_metrics: new stage names and funnel keys
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
    select tp.player_id, t.created_at as fc_at, t.created_by as actor_id, t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source, null::text as rank, 'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select o.player_id, o.first_contact_date as fc_at, o.scout_id as actor_id, o.scout_id as assignee_id,
      o.source::text as source, o.rank as rank, 'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.* from first_contact_events e
    cross join scout_ids si
    cross join sources so
    cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0 or e.actor_id = any(si.v) or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (v_role <> 'scout' or public.is_admin() or e.actor_id = auth.uid() or e.assignee_id = auth.uid())
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn
    from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at, source as first_contact_source from ranked_fc where rn = 1
  ),
  cohort as (
    select en.player_id, en.first_contact_at, en.first_contact_source from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select c.player_id, c.first_contact_at, p.birth_year, p.primary_position, p.pipeline_status,
      p.club_id, p.region_id, p.last_status_change, p.days_in_current_status, cl.region_id as club_region_id
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
    select cp.player_id,
      exists (select 1 from public.observations o where o.player_id = cp.player_id) as reached_observed,
      (cp.pipeline_status in ('in_contact','evaluation','offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('in_contact','evaluation','offer','signed')) as reached_in_contact,
      (cp.pipeline_status in ('evaluation','offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('evaluation','offer','signed')) as reached_evaluation,
      (cp.pipeline_status in ('offer','signed')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('offer','signed')) as reached_offer,
      (cp.pipeline_status = 'signed') or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status = 'signed') as reached_signed,
      (cp.pipeline_status in ('rejected_by_club','rejected_by_player','out_of_reach')) or
        exists (select 1 from public.pipeline_history h where h.player_id = cp.player_id and h.to_status in ('rejected_by_club','rejected_by_player','out_of_reach')) as reached_rejected
    from cohort_players cp
  ),
  signed_times as (
    select cp.player_id, min(h.created_at) as signed_at
    from cohort_players cp
    join public.pipeline_history h on h.player_id = cp.player_id and h.to_status = 'signed'
    group by cp.player_id
  ),
  kpis as (
    select
      (select count(*) from cohort_players) as total_candidates,
      (select count(*) from stage_reached where reached_observed) as observed_candidates,
      (select count(*) from stage_reached where reached_in_contact) as in_contact_candidates,
      (select count(*) from stage_reached where reached_evaluation) as evaluation_candidates,
      (select count(*) from stage_reached where reached_offer) as offer_candidates,
      (select count(*) from stage_reached where reached_signed) as signed_candidates,
      (select count(*) from stage_reached where reached_rejected) as rejected_candidates,
      (select count(*) from cohort_players where pipeline_status = 'rejected_by_club') as rejected_by_club_candidates,
      (select count(*) from cohort_players where pipeline_status = 'rejected_by_player') as rejected_by_player_candidates,
      (select count(*) from cohort_players where pipeline_status = 'out_of_reach') as out_of_reach_candidates,
      (select count(*) from cohort_players where pipeline_status = 'evaluation') as active_in_evaluation,
      (select avg(extract(epoch from (st.signed_at - cp.first_contact_at))/86400.0)
         from cohort_players cp
         join signed_times st on st.player_id = cp.player_id
        where st.signed_at is not null
      ) as avg_time_to_hire_days
    from (select 1) _
  ),
  bottlenecks as (
    select jsonb_agg(jsonb_build_object(
      'player_id', cp.player_id,
      'status', cp.pipeline_status::text,
      'days_in_status', cp.days_in_current_status,
      'max_days', case cp.pipeline_status::text
        when 'observed' then nullif(v_settings->>'max_days_in_observed','')::int
        when 'in_contact' then nullif(coalesce(v_settings->>'max_days_in_in_contact', v_settings->>'max_days_in_shortlist'),'')::int
        when 'evaluation' then nullif(coalesce(v_settings->>'max_days_in_evaluation', v_settings->>'max_days_in_trial'),'')::int
        when 'offer' then nullif(v_settings->>'max_days_in_offer','')::int
        else null
      end
    )) filter (where
      cp.days_in_current_status is not null and
      case cp.pipeline_status::text
        when 'observed' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_observed','')::int, 1000000)
        when 'in_contact' then cp.days_in_current_status > coalesce(nullif(coalesce(v_settings->>'max_days_in_in_contact', v_settings->>'max_days_in_shortlist'),'')::int, 1000000)
        when 'evaluation' then cp.days_in_current_status > coalesce(nullif(coalesce(v_settings->>'max_days_in_evaluation', v_settings->>'max_days_in_trial'),'')::int, 1000000)
        when 'offer' then cp.days_in_current_status > coalesce(nullif(v_settings->>'max_days_in_offer','')::int, 1000000)
        else false
      end
    ) as items
    from cohort_players cp
  )
  select jsonb_build_object(
    'kpi', jsonb_build_object(
      'totalCandidates', k.total_candidates,
      'conversionRate', case when k.total_candidates > 0 then round((k.signed_candidates::numeric / k.total_candidates::numeric) * 100.0, 1) else 0 end,
      'timeToHireDaysAvg', coalesce(round(k.avg_time_to_hire_days::numeric, 1), 0),
      'activeInEvaluation', k.active_in_evaluation,
      'signed', k.signed_candidates,
      'firstContact', k.total_candidates
    ),
    'funnel', jsonb_build_object(
      'first_contact', k.total_candidates,
      'observed', k.observed_candidates,
      'in_contact', k.in_contact_candidates,
      'evaluation', k.evaluation_candidates,
      'offer', k.offer_candidates,
      'signed', k.signed_candidates,
      'rejected_by_club', k.rejected_by_club_candidates,
      'rejected_by_player', k.rejected_by_player_candidates,
      'out_of_reach', k.out_of_reach_candidates
    ),
    'bottlenecks', coalesce((select items from bottlenecks), '[]'::jsonb),
    'settings', v_settings
  )
  into v_result
  from kpis k;

  return v_result;
end $$;

-- analytics_heatmap: new status columns
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
    select tp.player_id, t.created_at as fc_at, t.created_by as actor_id, t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source, null::text as rank, 'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select o.player_id, o.first_contact_date as fc_at, o.scout_id as actor_id, o.scout_id as assignee_id,
      o.source::text as source, o.rank as rank, 'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.* from first_contact_events e
    cross join scout_ids si cross join sources so cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0 or e.actor_id = any(si.v) or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (v_role <> 'scout' or public.is_admin() or e.actor_id = auth.uid() or e.assignee_id = auth.uid())
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at from ranked_fc where rn = 1
  ),
  cohort as (
    select en.player_id from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  cohort_players as (
    select p.id as player_id, p.pipeline_status::text as status,
      coalesce(p.region_id, cl.region_id) as region_id, r.name as region_name
    from cohort c
    join public.players p on p.id = c.player_id
    left join public.clubs cl on cl.id = p.club_id
    left join public.regions r on r.id = coalesce(p.region_id, cl.region_id)
    cross join region_ids ri cross join club_ids ci cross join birth_years bys cross join positions pos
    where
      (ri.v is null or cardinality(ri.v) = 0 or coalesce(p.region_id, cl.region_id) = any(ri.v))
      and (ci.v is null or cardinality(ci.v) = 0 or p.club_id = any(ci.v))
      and (bys.v is null or cardinality(bys.v) = 0 or p.birth_year = any(bys.v))
      and (pos.v is null or cardinality(pos.v) = 0 or p.primary_position = any(pos.v))
  ),
  agg as (
    select region_id, coalesce(region_name,'(brak)') as region_name,
      count(*) filter (where status='observed') as observed,
      count(*) filter (where status='in_contact') as in_contact,
      count(*) filter (where status='evaluation') as evaluation,
      count(*) filter (where status='offer') as offer,
      count(*) filter (where status='signed') as signed,
      count(*) filter (where status='rejected_by_club') as rejected_by_club,
      count(*) filter (where status='rejected_by_player') as rejected_by_player,
      count(*) filter (where status='out_of_reach') as out_of_reach
    from cohort_players
    group by 1,2
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'region_id', a.region_id,
    'region_name', a.region_name,
    'observed', a.observed,
    'in_contact', a.in_contact,
    'evaluation', a.evaluation,
    'offer', a.offer,
    'signed', a.signed,
    'rejected_by_club', a.rejected_by_club,
    'rejected_by_player', a.rejected_by_player,
    'out_of_reach', a.out_of_reach
  ) order by (a.signed + a.evaluation + a.offer) desc), '[]'::jsonb)
  into v_result
  from agg a;

  return v_result;
end $$;

-- analytics_sankey: new to_status list
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
    select tp.player_id, t.created_at as fc_at, t.created_by as actor_id, t.assigned_to as assignee_id,
      nullif(t.observation_source,'') as source, null::text as rank, 'task'::text as fc_type
    from public.tasks t
    join public.task_players tp on tp.task_id = t.id
    where t.type = 'observation'
    union all
    select o.player_id, o.first_contact_date as fc_at, o.scout_id as actor_id, o.scout_id as assignee_id,
      o.source::text as source, o.rank as rank, 'observation'::text as fc_type
    from public.observations o
  ),
  filtered_fc_events as (
    select e.* from first_contact_events e
    cross join scout_ids si cross join sources so cross join ranks ra
    where
      (si.v is null or cardinality(si.v) = 0 or e.actor_id = any(si.v) or (e.assignee_id is not null and e.assignee_id = any(si.v)))
      and (so.v is null or cardinality(so.v) = 0 or e.source = any(so.v))
      and (ra.v is null or cardinality(ra.v) = 0 or (e.fc_type = 'observation' and e.rank = any(ra.v)))
      and (v_role <> 'scout' or public.is_admin() or e.actor_id = auth.uid() or e.assignee_id = auth.uid())
  ),
  ranked_fc as (
    select e.*, row_number() over (partition by e.player_id order by e.fc_at asc) as rn from filtered_fc_events e
  ),
  entered as (
    select player_id, fc_at as first_contact_at from ranked_fc where rn = 1
  ),
  cohort as (
    select en.player_id from entered en
    where en.first_contact_at >= v_start and en.first_contact_at < v_end
  ),
  transitions as (
    select coalesce(h.from_status,'first_contact') as source, h.to_status as target, count(*) as value
    from public.pipeline_history h
    join cohort c on c.player_id = h.player_id
    where h.created_at >= v_start and h.created_at < v_end
      and h.to_status in ('observed','in_contact','evaluation','offer','signed','rejected_by_club','rejected_by_player','out_of_reach')
    group by 1,2
  ),
  nodes as (
    select distinct x.id from (select source as id from transitions union all select target as id from transitions) x
  )
  select jsonb_build_object(
    'nodes', coalesce(jsonb_agg(jsonb_build_object('id', n.id, 'label', n.id) order by n.id), '[]'::jsonb),
    'links', coalesce((select jsonb_agg(jsonb_build_object('source', t.source, 'target', t.target, 'value', t.value)) from transitions t), '[]'::jsonb)
  )
  into v_result
  from nodes n;

  return v_result;
end $$;
