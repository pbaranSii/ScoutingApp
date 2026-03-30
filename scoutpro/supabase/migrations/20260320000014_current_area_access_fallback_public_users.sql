-- Stabilize public.current_area_access():
-- - Prefer auth.users raw metadata: raw_user_meta_data->>'area_access' / raw_app_meta_data->>'area_access'
-- - If missing/NULL: fallback to public.users.area_access for auth.uid()
-- - Finally: default to AKADEMIA
--
-- This prevents scenarios where UI (public.users) shows one area, but RLS (current_area_access) defaulted to AKADEMIA.

create or replace function public.current_area_access()
returns public.area_access_type
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security', 'off', true))
  select coalesce(
    (
      select coalesce(
        u.raw_user_meta_data->>'area_access',
        u.raw_app_meta_data->>'area_access'
      )::public.area_access_type
      from auth.users u
      where u.id = auth.uid()
    ),
    (
      select u.area_access
      from public.users u
      where u.id = auth.uid()
    ),
    'AKADEMIA'::public.area_access_type
  );
$$;

