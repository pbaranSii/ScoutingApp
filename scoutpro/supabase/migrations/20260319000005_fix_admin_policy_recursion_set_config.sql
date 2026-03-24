-- Alternative/robust fix for infinite recursion in RLS.
-- Some environments may not honor `SET row_security = off` in function options.
-- We disable row security inside the function query via set_config().

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security', 'off', true))
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security', 'off', true))
  select coalesce(
    (select u.area_access from public.users u where u.id = auth.uid()),
    'AKADEMIA'::public.area_access_type
  );
$$;

