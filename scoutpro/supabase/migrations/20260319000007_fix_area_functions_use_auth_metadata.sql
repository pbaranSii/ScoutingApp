-- Robust RLS recursion guard:
-- Re-implement admin/area access helpers to read from auth.users metadata
-- (raw_user_meta_data), avoiding SELECTs on public.users which are RLS-protected.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(
      u.raw_user_meta_data->>'business_role',
      u.raw_app_meta_data->>'business_role'
    ) is not null then
      coalesce(
        u.raw_user_meta_data->>'business_role',
        u.raw_app_meta_data->>'business_role'
      ) = 'admin'
    else
      exists (
        select 1
        from public.users u2
        where u2.id = auth.uid()
          and u2.role = 'admin'
          and u2.is_active = true
      )
  end
  from auth.users u
  where u.id = auth.uid();
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
      select
        coalesce(
          u.raw_user_meta_data->>'area_access',
          u.raw_app_meta_data->>'area_access'
        )::public.area_access_type
      from auth.users u
      where u.id = auth.uid()
    ),
    'AKADEMIA'::public.area_access_type
  );
$$;

