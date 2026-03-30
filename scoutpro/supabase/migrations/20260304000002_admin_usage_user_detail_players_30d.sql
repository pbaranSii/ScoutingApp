-- Fix admin_usage_user_detail: players_30d was hardcoded to 0. Count players created by user in last 30 days.

create or replace function public.admin_usage_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_30d_start timestamptz := (current_date - interval '30 days')::timestamptz;
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
    select count(*) as c from public.observations where scout_id = p_user_id and created_at >= v_30d_start
  ),
  players_30d as (
    select count(*) as c from public.players where created_by = p_user_id and created_at >= v_30d_start
  ),
  ph_30d as (
    select count(*) as c from public.pipeline_history where changed_by = p_user_id and created_at >= v_30d_start
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
