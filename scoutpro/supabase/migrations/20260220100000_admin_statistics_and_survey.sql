-- Admin Statistics & User Satisfaction Survey
-- Tables: user_sessions, user_surveys; extend users (login_count); RLS; RPCs.

-- 1) Extend users: login_count
alter table if exists public.users
  add column if not exists login_count integer not null default 0;

-- 2) user_sessions
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  device_type varchar(20),
  browser varchar(50),
  ip_address varchar(45),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_started_at_idx on public.user_sessions (started_at desc);

alter table public.user_sessions enable row level security;

-- Users can insert/update own sessions only
create policy "Users can insert own sessions"
  on public.user_sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own sessions"
  on public.user_sessions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can select all (for usage stats)
create policy "Admins can select all sessions"
  on public.user_sessions for select to authenticated
  using (public.is_admin());

-- 3) user_surveys
create table if not exists public.user_surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  survey_type varchar(50) not null default 'satisfaction',
  csat_rating integer not null check (csat_rating >= 1 and csat_rating <= 5),
  ces_rating integer not null check (ces_rating >= 1 and ces_rating <= 5),
  nps_score integer not null check (nps_score >= 0 and nps_score <= 10),
  best_feature varchar(100) not null,
  feedback_text text,
  submitted_at timestamptz not null default now(),
  user_role varchar(50)
);

create index if not exists user_surveys_user_id_idx on public.user_surveys (user_id);
create index if not exists user_surveys_submitted_at_idx on public.user_surveys (submitted_at desc);
create index if not exists user_surveys_survey_type_idx on public.user_surveys (survey_type);

alter table public.user_surveys enable row level security;

create policy "Users can insert own surveys"
  on public.user_surveys for insert to authenticated
  with check (user_id = auth.uid());

create policy "Admins can select all surveys"
  on public.user_surveys for select to authenticated
  using (public.is_admin());

-- 4) RPC: user_session_start - call after login
create or replace function public.user_session_start(
  p_device_type varchar default null,
  p_browser varchar default null,
  p_ip_address varchar default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_session_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  insert into public.user_sessions (user_id, device_type, browser, ip_address, user_agent)
  values (v_user_id, p_device_type, p_browser, p_ip_address, p_user_agent)
  returning id into v_session_id;

  update public.users
  set last_login_at = now(),
      login_count = coalesce(login_count, 0) + 1
  where id = v_user_id;

  return v_session_id;
end $$;

-- 5) RPC: user_session_end - call before logout
create or replace function public.user_session_end(p_session_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_row record;
begin
  v_session_id := p_session_id;
  if v_session_id is null then
    select id into v_session_id
    from public.user_sessions
    where user_id = auth.uid() and ended_at is null
    order by started_at desc
    limit 1;
  end if;

  if v_session_id is null then
    return;
  end if;

  update public.user_sessions
  set ended_at = now(),
      duration_seconds = extract(epoch from (now() - started_at))::integer
  where id = v_session_id and user_id = auth.uid();
end $$;

-- 6) RPC: admin_usage_overview
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
      round(avg((select count(*) from public.observations o where o.user_id = u.id and o.created_at >= v_month_start)), 1) as avg_obs,
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

-- 7) RPC: admin_usage_users
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
      (select count(*) from public.observations o where o.user_id = u.id and o.created_at >= v_month_start) as observations_month,
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

-- 8) RPC: admin_usage_user_detail
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
    select count(*) as c from public.observations where user_id = p_user_id and created_at >= v_month_start
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

-- 9) RPC: admin_usage_login_history
create or replace function public.admin_usage_login_history(
  p_user_id uuid default null,
  p_date_from date default null,
  p_date_to date default null,
  p_device_type text default null,
  p_page int default 1,
  p_per_page int default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz := coalesce(p_date_from, current_date - 30)::timestamptz;
  v_to timestamptz := (coalesce(p_date_to, current_date) + 1)::timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with base as (
    select
      s.id,
      s.user_id,
      s.started_at,
      s.ended_at,
      s.duration_seconds,
      s.device_type,
      s.browser,
      s.ip_address,
      u.full_name,
      u.business_role
    from public.user_sessions s
    join public.users u on u.id = s.user_id
    where s.started_at >= v_from and s.started_at < v_to
      and (p_user_id is null or s.user_id = p_user_id)
      and (p_device_type is null or p_device_type = '' or s.device_type = p_device_type)
  ),
  tot as (
    select count(*)::int as total from base
  ),
  paginated as (
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'full_name', full_name,
        'business_role', business_role,
        'started_at', started_at,
        'ended_at', ended_at,
        'duration_seconds', duration_seconds,
        'device_type', device_type,
        'browser', browser,
        'ip_address', ip_address
      )
    ) as data
    from (select * from base order by started_at desc offset (greatest(p_page, 1) - 1) * greatest(p_per_page, 1) limit greatest(p_per_page, 1)) sub
  )
  select jsonb_build_object(
    'data', coalesce((select data from paginated), '[]'::jsonb),
    'total', (select total from tot)
  ) into v_result;

  return v_result;
end $$;

-- 10) RPC: admin_usage_trends
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
        (select count(*) from public.observations o where o.user_id = u.id and o.created_at >= (current_date - 30)::timestamptz) as observations_30d,
        coalesce(sum(s.duration_seconds), 0) / 3600.0 as total_hours,
        (count(distinct s.id) * 10) + (select count(*) from public.observations o where o.user_id = u.id and o.created_at >= (current_date - 30)::timestamptz) * 20 + (coalesce(sum(s.duration_seconds), 0) / 3600.0 * 5)::int as activity_points
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

-- 11) RPC: survey_can_submit
create or replace function public.survey_can_submit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last timestamptz;
  v_days int;
begin
  if v_user_id is null then
    return jsonb_build_object('can_submit', false, 'last_submitted_at', null, 'days_until_next', 90);
  end if;

  select max(submitted_at) into v_last
  from public.user_surveys
  where user_id = v_user_id and survey_type = 'satisfaction';

  if v_last is null then
    return jsonb_build_object('can_submit', true, 'last_submitted_at', null, 'days_until_next', 0);
  end if;

  v_days := 90 - extract(day from (now() - v_last))::int;
  if v_days < 0 then
    v_days := 0;
  end if;

  return jsonb_build_object(
    'can_submit', (now() - v_last) > interval '90 days',
    'last_submitted_at', v_last,
    'days_until_next', v_days
  );
end $$;

-- 12) RPC: survey_submit
create or replace function public.survey_submit(
  p_csat_rating int,
  p_ces_rating int,
  p_nps_score int,
  p_best_feature varchar(100),
  p_feedback_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_id uuid;
  v_submitted_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  if p_csat_rating is null or p_csat_rating < 1 or p_csat_rating > 5 then
    raise exception 'invalid csat_rating';
  end if;
  if p_ces_rating is null or p_ces_rating < 1 or p_ces_rating > 5 then
    raise exception 'invalid ces_rating';
  end if;
  if p_nps_score is null or p_nps_score < 0 or p_nps_score > 10 then
    raise exception 'invalid nps_score';
  end if;
  if trim(coalesce(p_best_feature, '')) = '' then
    raise exception 'best_feature required';
  end if;
  if length(coalesce(p_feedback_text, '')) > 500 then
    raise exception 'feedback_text max 500 chars';
  end if;

  select business_role::text into v_role from public.users where id = v_user_id;

  insert into public.user_surveys (user_id, survey_type, csat_rating, ces_rating, nps_score, best_feature, feedback_text, user_role)
  values (v_user_id, 'satisfaction', p_csat_rating, p_ces_rating, p_nps_score, left(trim(p_best_feature), 100), nullif(trim(p_feedback_text), ''), v_role)
  returning id, submitted_at into v_id, v_submitted_at;

  return jsonb_build_object('survey_id', v_id, 'submitted_at', v_submitted_at);
end $$;

-- 13) RPC: admin_survey_results
create or replace function public.admin_survey_results(
  p_period text default 'month',
  p_role text default 'all'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz;
  v_result jsonb;
  v_total bigint;
  v_csat_avg numeric;
  v_ces_avg numeric;
  v_nps_score numeric;
  v_promoters bigint;
  v_passives bigint;
  v_detractors bigint;
  v_csat_dist jsonb;
  v_best_feature jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_from := case p_period
    when 'quarter' then (current_date - interval '3 months')::timestamptz
    when 'year' then (current_date - interval '1 year')::timestamptz
    when 'all' then '1970-01-01'::timestamptz
    else (current_date - interval '1 month')::timestamptz
  end;

  with filtered as (
    select s.*
    from public.user_surveys s
    where s.survey_type = 'satisfaction'
      and s.submitted_at >= v_from
      and (p_role = 'all' or s.user_role = p_role)
  ),
  agg as (
    select
      count(*) as total,
      avg(csat_rating) as csat_avg,
      avg(ces_rating) as ces_avg,
      count(*) filter (where nps_score >= 9) as promoters,
      count(*) filter (where nps_score >= 7 and nps_score <= 8) as passives,
      count(*) filter (where nps_score <= 6) as detractors
    from filtered
  )
  select total, csat_avg, ces_avg, promoters, passives, detractors
  into v_total, v_csat_avg, v_ces_avg, v_promoters, v_passives, v_detractors
  from agg;

  if v_total > 0 then
    v_nps_score := round(((v_promoters::numeric / v_total * 100) - (v_detractors::numeric / v_total * 100))::numeric, 0);
  else
    v_nps_score := 0;
  end if;

  with filtered as (
    select * from public.user_surveys
    where survey_type = 'satisfaction' and submitted_at >= v_from
      and (p_role = 'all' or user_role = p_role)
  ),
  csat_dist as (
    select jsonb_object_agg(rating, cnt) as dist
    from (
      select csat_rating as rating, count(*) as cnt
      from filtered group by csat_rating
    ) t
  ),
  best_feat as (
    select jsonb_agg(
      jsonb_build_object('feature', best_feature, 'count', cnt) order by cnt desc
    ) as arr
    from (
      select best_feature, count(*) as cnt
      from filtered
      group by best_feature
      order by count(*) desc
    ) t
    where best_feature is not null and trim(best_feature) <> ''
  )
  select (select dist from csat_dist), (select arr from best_feat) into v_csat_dist, v_best_feature;

  return jsonb_build_object(
    'total', coalesce(v_total, 0),
    'csat_avg', round(coalesce(v_csat_avg, 0)::numeric, 1),
    'ces_avg', round(coalesce(v_ces_avg, 0)::numeric, 1),
    'nps_score', v_nps_score,
    'promoters', coalesce(v_promoters, 0),
    'passives', coalesce(v_passives, 0),
    'detractors', coalesce(v_detractors, 0),
    'csat_distribution', coalesce(v_csat_dist, '{}'::jsonb),
    'best_feature_ranking', coalesce(v_best_feature, '[]'::jsonb)
  );
end $$;

-- 14) RPC: admin_survey_responses
create or replace function public.admin_survey_responses(
  p_period text default 'month',
  p_role text default 'all',
  p_page int default 1,
  p_per_page int default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  v_from := case p_period
    when 'quarter' then (current_date - interval '3 months')::timestamptz
    when 'year' then (current_date - interval '1 year')::timestamptz
    when 'all' then '1970-01-01'::timestamptz
    else (current_date - interval '1 month')::timestamptz
  end;

  with filtered as (
    select s.id, s.user_id, s.csat_rating, s.ces_rating, s.nps_score, s.best_feature, s.feedback_text, s.submitted_at, s.user_role,
           u.full_name
    from public.user_surveys s
    join public.users u on u.id = s.user_id
    where s.survey_type = 'satisfaction'
      and s.submitted_at >= v_from
      and (p_role = 'all' or s.user_role = p_role)
  ),
  tot as (
    select count(*)::int as total from filtered
  ),
  paginated as (
    select jsonb_agg(
      jsonb_build_object(
        'id', id,
        'user_id', user_id,
        'full_name', full_name,
        'user_role', user_role,
        'csat_rating', csat_rating,
        'ces_rating', ces_rating,
        'nps_score', nps_score,
        'best_feature', best_feature,
        'feedback_text', feedback_text,
        'submitted_at', submitted_at
      )
    ) as data
    from (select * from filtered order by submitted_at desc offset (greatest(p_page, 1) - 1) * greatest(p_per_page, 1) limit greatest(p_per_page, 1)) sub
  )
  select jsonb_build_object(
    'data', coalesce((select data from paginated), '[]'::jsonb),
    'total', (select total from tot)
  ) into v_result;

  return v_result;
end $$;
