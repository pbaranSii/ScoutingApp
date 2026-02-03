alter table public.players
  add column if not exists photo_urls text[];

alter table public.observations
  add column if not exists potential_now integer,
  add column if not exists potential_future integer,
  add column if not exists observation_date date;
