-- Final hardening: re-define helper functions used inside RLS policies
-- with `row_security` forcibly disabled in the function body.
-- This prevents any recursive evaluation caused by RLS on public.users.

-- IMPORTANT: do not DROP these functions. They are referenced by many RLS policies
-- and PostgreSQL will block dropping due to dependencies. Use CREATE OR REPLACE below.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security','off',true))
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(
        u.raw_user_meta_data->>'business_role',
        u.raw_app_meta_data->>'business_role'
      ) = 'admin'
  )
  or exists (
    select 1
    from public.users u2
    where u2.id = auth.uid()
      and u2.role = 'admin'
      and u2.is_active = true
  );
$$;

create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security','off',true))
  select coalesce(
    (
      select
        coalesce(
          u.raw_user_meta_data->>'area_access',
          u.raw_app_meta_data->>'area_access'
        )::public.area_access_type
      from auth.users u
      where u.id = auth.uid()
    ),
    (
      select u2.area_access
      from public.users u2
      where u2.id = auth.uid()
    ),
    'AKADEMIA'::public.area_access_type
  );
$$;

create or replace function public.current_business_role()
returns public.user_business_role
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security','off',true))
  select coalesce(
    (
      select
        coalesce(
          u.raw_user_meta_data->>'business_role',
          u.raw_app_meta_data->>'business_role'
        )::public.user_business_role
      from auth.users u
      where u.id = auth.uid()
    ),
    (
      select u2.business_role::public.user_business_role
      from public.users u2
      where u2.id = auth.uid()
    )
  );
$$;

