-- Add detailed motor skills fields to observations (used by individual observation forms).

alter table public.observations
  add column if not exists motor_speed_rating integer;

alter table public.observations
  add column if not exists motor_endurance_rating integer;

alter table public.observations
  add column if not exists motor_jump_rating integer;

alter table public.observations
  add column if not exists motor_agility_rating integer;

alter table public.observations
  add column if not exists motor_acceleration_rating integer;

alter table public.observations
  add column if not exists motor_strength_rating integer;

alter table public.observations
  add column if not exists motor_description text;

-- Optional: basic range checks (1–5) for ratings.

alter table public.observations
  add constraint observations_motor_speed_rating_range
    check (motor_speed_rating between 1 and 5)
  not valid;

alter table public.observations
  add constraint observations_motor_endurance_rating_range
    check (motor_endurance_rating between 1 and 5)
  not valid;

alter table public.observations
  add constraint observations_motor_jump_rating_range
    check (motor_jump_rating between 1 and 5)
  not valid;

alter table public.observations
  add constraint observations_motor_agility_rating_range
    check (motor_agility_rating between 1 and 5)
  not valid;

alter table public.observations
  add constraint observations_motor_acceleration_rating_range
    check (motor_acceleration_rating between 1 and 5)
  not valid;

alter table public.observations
  add constraint observations_motor_strength_rating_range
    check (motor_strength_rating between 1 and 5)
  not valid;

