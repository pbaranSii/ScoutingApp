alter table public.observations
  add column if not exists created_by_name text,
  add column if not exists created_by_role text,
  add column if not exists updated_by_name text,
  add column if not exists updated_by_role text;

alter table public.observations
  drop constraint if exists observations_created_by_fkey,
  drop constraint if exists observations_updated_by_fkey;

update public.observations as o
set
  created_by_name = coalesce(created_by_name, u.full_name),
  created_by_role = coalesce(created_by_role, u.role::text)
from public.users as u
where o.created_by = u.id;

update public.observations as o
set
  updated_by_name = coalesce(updated_by_name, u.full_name),
  updated_by_role = coalesce(updated_by_role, u.role::text)
from public.users as u
where o.updated_by = u.id;
