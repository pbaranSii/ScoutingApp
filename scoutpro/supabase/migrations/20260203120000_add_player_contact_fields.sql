alter table public.players
  add column if not exists nationality text,
  add column if not exists guardian_name text,
  add column if not exists guardian_phone text,
  add column if not exists guardian_email text;
