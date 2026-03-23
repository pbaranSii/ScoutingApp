-- Optional hardening:
-- Backfill auth.users raw_user_meta_data.area_access from public.users.area_access
-- for users where the value is missing in auth metadata.

update auth.users au
set raw_user_meta_data = jsonb_set(
  coalesce(au.raw_user_meta_data, '{}'::jsonb),
  '{area_access}',
  to_jsonb(pu.area_access::text),
  true
)
from public.users pu
where pu.id = au.id
  and pu.area_access is not null
  and coalesce(au.raw_user_meta_data->>'area_access', au.raw_app_meta_data->>'area_access') is null;

