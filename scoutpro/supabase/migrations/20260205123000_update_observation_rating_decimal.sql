-- Allow decimal ratings like 9.5.
alter table if exists public.observations
  alter column overall_rating type numeric(3,1)
  using overall_rating::numeric;
