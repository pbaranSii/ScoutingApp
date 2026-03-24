-- Fix infinite recursion in RLS policy evaluation.
-- Root cause: users SELECT policy calls public.is_admin(), while public.is_admin()
-- itself SELECTs from public.users. Without disabling row_security inside the
-- SECURITY DEFINER function, Postgres can recurse and throw 42P17.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- Same protection for current_area_access() (used inside players/observations RLS).
create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select u.area_access from public.users u where u.id = auth.uid()),
    'AKADEMIA'::public.area_access_type
  );
$$;

