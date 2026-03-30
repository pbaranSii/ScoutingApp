-- Fix analytics_pipeline_metrics after area-access migration:
-- previous definition used legacy pipeline statuses ('shortlist','trial','rejected'),
-- which causes 22P02 on enum pipeline_status in current schema.
-- This version uses the new statuses and keeps area-access filtering.

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
    join public.categories cat on cat.id = p.age_category_id
    left join public.clubs cl on cl.id = p.club_id
    cross join region_ids ri
    cross join club_ids ci
    cross join birth_years bys
    cross join positions pos
    where
      (
        public.current_area_access() = 'ALL'::public.area_access_type
        or cat.area::text = public.current_area_access()::text
      )
      and (ri.v is null or cardinality(ri.v) = 0 or p.region_id = any(ri.v) or cl.region_id = any(ri.v))
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

