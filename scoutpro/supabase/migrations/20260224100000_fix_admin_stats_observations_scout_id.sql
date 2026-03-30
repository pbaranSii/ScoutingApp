-- Fix: observations table has scout_id (and created_by), not user_id.
-- Replace observations.user_id with observations.scout_id in admin stats RPCs.

-- 1) admin_usage_overview: role_stats avg_obs uses o.scout_id
create or replace function public.admin_usage_overview(p_month date default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := coalesce(p_month, date_trunc('month', current_date)::date);
  v_month_start timestamptz := v_month::timestamptz;
  v_month_end timestamptz := (v_month + interval '1 month')::timestamptz;
  v_prev_start timestamptz := (v_month - interval '1 month')::timestamptz;
  v_prev_end timestamptz := v_month_start;
  v_30d_start timestamptz := (current_date - interval '30 days')::timestamptz;
  v_mau bigint;
  v_mau_prev bigint;
  v_observations_month bigint;
  v_avg_session_min numeric;
  v_new_users bigint;
  v_records_month bigint;
  v_last_activity jsonb;
  v_active_users_count bigint;
  v_by_role jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select count(distinct user_id) into v_mau
  from public.user_sessions
  where started_at >= v_30d_start;

  select count(distinct user_id) into v_mau_prev
  from public.user_sessions
  where started_at >= v_prev_start and started_at < v_prev_end;

  select count(*) into v_observations_month
  from public.observations
  where created_at >= v_month_start and created_at < v_month_end;

  select coalesce(avg(duration_seconds), 0) / 60.0 into v_avg_session_min
  from public.user_sessions
  where ended_at is not null and duration_seconds is not null;

  select count(*) into v_new_users
  from public.users
  where created_at >= v_month_start and created_at < v_month_end;

  select count(*) into v_records_month
  from (
    select id from public.observations where created_at >= v_month_start and created_at < v_month_end
    union all
    select id from public.players where created_at >= v_month_start and created_at < v_month_end
    union all
    select id from public.pipeline_history where created_at >= v_month_start and created_at < v_month_end
  ) t;

  select count(*) into v_active_users_count
  from public.user_sessions
  where started_at >= v_30d_start;

  select jsonb_build_object(
    'user_id', s.user_id,
    'full_name', u.full_name,
    'action', 'login',
    'started_at', s.started_at
  ) into v_last_activity
  from public.user_sessions s
  join public.users u on u.id = s.user_id
  order by s.started_at desc
  limit 1;

  with active_30 as (
    select distinct user_id from public.user_sessions where started_at >= v_30d_start
  ),
  role_stats as (
    select
      u.business_role,
      count(*) as total_users,
      count(au.user_id) as active_30d,
      round(avg((select count(*) from public.observations o where o.scout_id = u.id and o.created_at >= v_month_start)), 1) as avg_obs,
      round(avg((select coalesce(avg(s.duration_seconds), 0) / 60.0 from public.user_sessions s where s.user_id = u.id and s.ended_at is not null))::numeric, 1) as avg_min
    from public.users u
    left join active_30 au on au.user_id = u.id
    where u.is_active = true
    group by u.business_role
  )
  select jsonb_agg(
    jsonb_build_object(
      'role', business_role,
      'total_users', total_users,
      'active_30d', active_30d,
      'active_pct', case when total_users > 0 then round((active_30d::numeric / total_users * 100), 1) else 0 end,
      'avg_observations_month', coalesce(avg_obs, 0),
      'avg_session_min', coalesce(avg_min, 0)
    )
  ) into v_by_role
  from role_stats;

  return jsonb_build_object(
    'mau', coalesce(v_mau, 0),
    'mau_prev', coalesce(v_mau_prev, 0),
    'observations_month', coalesce(v_observations_month, 0),
    'avg_session_minutes', round(coalesce(v_avg_session_min, 0)::numeric, 1),
    'new_users_month', coalesce(v_new_users, 0),
    'records_month', coalesce(v_records_month, 0),
    'active_users_count_30d', coalesce(v_active_users_count, 0),
    'last_activity', v_last_activity,
    'by_role', coalesce(v_by_role, '[]'::jsonb)
  );
end $$;

-- 2) admin_usage_users: observations_month by scout_id
create or replace function public.admin_usage_users(
  p_status text default 'all',
  p_role text default 'all',
  p_sort_by text default 'activity',
  p_page int default 1,
  p_per_page int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_30d_start timestamptz := (current_date - interval '30 days')::timestamptz;
  v_month_start timestamptz := date_trunc('month', current_date)::timestamptz;
  v_result jsonb;
  v_total bigint;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with active_users as (
    select distinct user_id from public.user_sessions where started_at >= v_30d_start
  ),
  user_stats as (
    select
      u.id,
      u.full_name,
      u.email,
      u.business_role,
      u.last_login_at,
      u.login_count,
      (select count(*) from public.user_sessions s where s.user_id = u.id) as total_logins,
      (select coalesce(avg(s.duration_seconds), 0) / 60.0 from public.user_sessions s where s.user_id = u.id and s.ended_at is not null) as avg_session_min,
      (select count(*) from public.observations o where o.scout_id = u.id and o.created_at >= v_month_start) as observations_month,
      case when au.user_id is not null then true else false end as is_active_30d
    from public.users u
    left join active_users au on au.user_id = u.id
    where u.is_active = true
      and (p_role = 'all' or u.business_role::text = p_role)
      and (
        p_status = 'all'
        or (p_status = 'active' and au.user_id is not null)
        or (p_status = 'inactive' and au.user_id is null)
      )
  ),
  ordered as (
    select * from user_stats
    order by
      case when p_sort_by = 'last_login' then last_login_at end desc nulls last,
      case when p_sort_by = 'name' then full_name end asc nulls last,
      case when p_sort_by = 'activity' then (total_logins * 10 + observations_month * 20) end desc nulls last
  ),
  paginated as (
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'full_name', full_name,
        'email', email,
        'business_role', business_role,
        'last_login_at', last_login_at,
        'login_count', coalesce(login_count, 0),
        'avg_session_min', round(coalesce(avg_session_min, 0)::numeric, 1),
        'observations_month', coalesce(observations_month, 0),
        'is_active_30d', is_active_30d
      )
    ) as data
    from (select * from ordered offset (greatest(p_page, 1) - 1) * greatest(p_per_page, 1) limit greatest(p_per_page, 1)) sub
  ),
  tot as (
    select count(*)::int as total from user_stats
  )
  select jsonb_build_object(
    'data', coalesce((select data from paginated), '[]'::jsonb),
    'total', (select total from tot)
  ) into v_result;

  return v_result;
end $$;

-- 3) admin_usage_user_detail: obs_30d by scout_id
create or replace function public.admin_usage_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_30d_start timestamptz := (current_date - interval '30 days')::timestamptz;
  v_month_start timestamptz := (current_date - interval '30 days')::timestamptz;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with u as (
    select id, full_name, email, business_role, last_login_at, login_count
    from public.users where id = p_user_id
  ),
  sess_avg as (
    select coalesce(avg(duration_seconds), 0) / 60.0 as avg_min
    from public.user_sessions where user_id = p_user_id and ended_at is not null
  ),
  logins_30d as (
    select count(*) as c from public.user_sessions where user_id = p_user_id and started_at >= v_30d_start
  ),
  obs_30d as (
    select count(*) as c from public.observations where scout_id = p_user_id and created_at >= v_month_start
  ),
  players_30d as (
    select 0 as c
  ),
  ph_30d as (
    select count(*) as c from public.pipeline_history where changed_by = p_user_id and created_at >= v_month_start
  ),
  last_10_sessions as (
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'started_at', started_at,
        'ended_at', ended_at,
        'duration_seconds', duration_seconds,
        'device_type', device_type,
        'browser', browser
      ) order by started_at desc
    ) as arr
    from (select * from public.user_sessions where user_id = p_user_id order by started_at desc limit 10) sub
  )
  select jsonb_build_object(
    'user', (select to_jsonb(u.*) from u),
    'avg_session_min', (select round(avg_min::numeric, 1) from sess_avg),
    'logins_30d', (select c from logins_30d),
    'logins_per_week', round((select c::numeric from logins_30d) / 4.3, 1),
    'observations_30d', (select c from obs_30d),
    'players_30d', (select c from players_30d),
    'pipeline_changes_30d', (select c from ph_30d),
    'last_logins', coalesce((select arr from last_10_sessions), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

-- 4) admin_usage_trends: top10 observations_30d and activity_points by scout_id
create or replace function public.admin_usage_trends(
  p_date_from date,
  p_date_to date,
  p_granularity text default 'day'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_start timestamptz := p_date_from::timestamptz;
  v_end timestamptz := (p_date_to + 1)::timestamptz;
  v_gran text := case lower(coalesce(p_granularity, 'day'))
    when 'week' then 'week'
    when 'month' then 'month'
    else 'day'
  end;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with period as (
    select
      date_trunc(v_gran, s.started_at)::date as bucket,
      count(distinct s.user_id) as active_users,
      count(*) as sessions_count,
      coalesce(avg(case when s.ended_at is not null then s.duration_seconds end), 0) / 60.0 as avg_session_min
    from public.user_sessions s
    where s.started_at >= v_start and s.started_at < v_end
    group by 1
  ),
  obs_period as (
    select
      date_trunc(v_gran, o.created_at)::date as bucket,
      count(*) as observations_count
    from public.observations o
    where o.created_at >= v_start and o.created_at < v_end
    group by 1
  ),
  buckets as (
    select distinct bucket from period
    union
    select distinct bucket from obs_period
  ),
  series as (
    select
      b.bucket,
      coalesce(p.active_users, 0) as active_users,
      coalesce(o.observations_count, 0) as observations_count,
      round(coalesce(p.avg_session_min, 0)::numeric, 1) as avg_session_min
    from buckets b
    left join period p on p.bucket = b.bucket
    left join obs_period o on o.bucket = b.bucket
    order by b.bucket
  ),
  top10 as (
    select jsonb_agg(
      jsonb_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'logins_30d', logins_30d,
        'observations_30d', observations_30d,
        'total_hours', round(total_hours::numeric, 1),
        'activity_points', activity_points
      ) order by activity_points desc
    ) as arr
    from (
      select
        u.id as user_id,
        u.full_name,
        count(distinct s.id) as logins_30d,
        (select count(*) from public.observations o where o.scout_id = u.id and o.created_at >= (current_date - 30)::timestamptz) as observations_30d,
        coalesce(sum(s.duration_seconds), 0) / 3600.0 as total_hours,
        (count(distinct s.id) * 10) + (select count(*) from public.observations o where o.scout_id = u.id and o.created_at >= (current_date - 30)::timestamptz) * 20 + (coalesce(sum(s.duration_seconds), 0) / 3600.0 * 5)::int as activity_points
      from public.users u
      left join public.user_sessions s on s.user_id = u.id and s.started_at >= (current_date - 30)::timestamptz
      where u.is_active = true
      group by u.id, u.full_name
      order by activity_points desc nulls last
      limit 10
    ) sub
  )
  select jsonb_build_object(
    'series', (select jsonb_agg(to_jsonb(series) order by bucket) from series),
    'top10', coalesce((select arr from top10), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;
