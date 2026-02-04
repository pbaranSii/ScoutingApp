alter table public.observations
  add column if not exists created_by uuid references public.users(id),
  add column if not exists updated_by uuid references public.users(id),
  add column if not exists updated_at timestamptz;

update public.observations
set
  created_by = coalesce(created_by, scout_id),
  updated_by = coalesce(updated_by, scout_id),
  updated_at = coalesce(updated_at, created_at);
