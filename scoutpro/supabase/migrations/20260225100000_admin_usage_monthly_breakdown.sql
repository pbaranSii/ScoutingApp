-- Rozliczenia: statystyki per użytkownik, per miesiąc (obserwacje + zawodnicy).
-- Tylko admin. Używane do rozliczeń z pracownikami.

create or replace function public.admin_usage_monthly_breakdown(
  p_date_from date,
  p_date_to date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  with months as (
    select date_trunc('month', d)::date as month
    from generate_series(
      date_trunc('month', p_date_from)::date,
      date_trunc('month', p_date_to)::date,
      '1 month'::interval
    ) d
  ),
  users_active as (
    select id, full_name, email, business_role
    from public.users
    where is_active = true
  ),
  grid as (
    select
      u.id as user_id,
      u.full_name,
      u.email,
      u.business_role,
      to_char(m.month, 'YYYY-MM') as month,
      (select count(*) from public.observations o
       where o.scout_id = u.id
         and o.created_at >= m.month
         and o.created_at < m.month + interval '1 month') as observations_count,
      (select count(*) from public.players p
       where p.created_by = u.id
         and p.created_at >= m.month
         and p.created_at < m.month + interval '1 month') as players_count
    from users_active u
    cross join months m
  )
  select jsonb_build_object(
    'data',
    coalesce(
      (select jsonb_agg(to_jsonb(t) order by t.full_name nulls last, t.month) from grid t),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end $$;
