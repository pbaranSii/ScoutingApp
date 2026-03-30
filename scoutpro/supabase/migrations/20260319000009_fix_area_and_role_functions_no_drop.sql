-- Fix: do not drop helper functions referenced by many RLS policies.
-- Replace function bodies only, using auth.users metadata to avoid RLS recursion.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and coalesce(
        u.raw_user_meta_data->>'business_role',
        u.raw_app_meta_data->>'business_role'
      ) = 'admin'
  );
$$;

create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select coalesce(
        u.raw_user_meta_data->>'area_access',
        u.raw_app_meta_data->>'area_access'
      )::public.area_access_type
      from auth.users u
      where u.id = auth.uid()
    ),
    'AKADEMIA'::public.area_access_type
  );
$$;

-- This function is used in multiple RLS policies.
-- Keep it auth-metadata-only to avoid touching public.users from inside policy evaluation.
create or replace function public.current_business_role()
returns public.user_business_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select coalesce(
        u.raw_user_meta_data->>'business_role',
        u.raw_app_meta_data->>'business_role'
      )::public.user_business_role
      from auth.users u
      where u.id = auth.uid()
    ),
    'scout'::public.user_business_role
  );
$$;

