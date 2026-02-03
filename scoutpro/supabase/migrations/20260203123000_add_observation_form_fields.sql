alter table public.observations
  add column if not exists competition text,
  add column if not exists overall_rating integer,
  add column if not exists strengths text,
  add column if not exists weaknesses text,
  add column if not exists photo_url text;
