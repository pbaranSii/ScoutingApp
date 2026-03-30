-- Observation v2: match_observations, observations extensions, motor_evaluations,
-- categories default_form_type, players extra fields, evaluation_criteria section/code,
-- observation_criterion_notes. Enums and RLS.

-- 1. New enums
do $$ begin
  create type public.observation_context_type as enum ('match', 'tournament');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.observation_category_type as enum ('match_player', 'individual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.form_type as enum ('simplified', 'extended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.recommendation_type as enum ('positive', 'to_observe', 'negative');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.criterion_section as enum ('defense', 'offense', 'transition_oa', 'transition_ao');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.default_form_type_enum as enum ('simplified', 'extended');
exception when duplicate_object then null;
end $$;

-- 2. Table match_observations
create table if not exists public.match_observations (
  id uuid primary key default gen_random_uuid(),
  context_type public.observation_context_type not null default 'match',
  observation_date date not null default current_date,
  competition text not null,
  home_team text,
  away_team text,
  match_result text,
  location text,
  source public.observation_source not null default 'scouting',
  scout_id uuid not null references public.users(id) on delete restrict,
  home_team_formation text,
  away_team_formation text,
  match_notes text,
  status text not null default 'active',
  is_offline_created boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_match_observations_scout_id on public.match_observations(scout_id);
create index if not exists idx_match_observations_observation_date on public.match_observations(observation_date);

comment on table public.match_observations is 'Header for match/tournament observations; groups N player observations.';

-- 3. Extend observations
alter table public.observations
  add column if not exists match_observation_id uuid references public.match_observations(id) on delete set null,
  add column if not exists observation_category public.observation_category_type,
  add column if not exists form_type public.form_type,
  add column if not exists match_performance_rating smallint check (match_performance_rating is null or (match_performance_rating >= 1 and match_performance_rating <= 5)),
  add column if not exists recommendation public.recommendation_type,
  add column if not exists summary text,
  add column if not exists mental_description text;

comment on column public.observations.match_observation_id is 'FK to match_observations when observation is part of a match/tournament';
comment on column public.observations.observation_category is 'match_player or individual';
comment on column public.observations.form_type is 'simplified or extended form used';
comment on column public.observations.match_performance_rating is '1-5 rating in match context';
comment on column public.observations.recommendation is 'positive / to_observe / negative';
comment on column public.observations.summary is 'Single summary field (replaces notes for v2)';
comment on column public.observations.mental_description is 'Mental abilities description (extended form)';

-- Backfill existing rows
update public.observations
set observation_category = 'individual'::public.observation_category_type,
    form_type = 'simplified'::public.form_type
where observation_category is null;

-- Make columns not null with defaults for new rows (keep nullable for backfill compatibility)
alter table public.observations
  alter column observation_category set default 'individual'::public.observation_category_type,
  alter column form_type set default 'simplified'::public.form_type;

create index if not exists idx_observations_match_observation_id on public.observations(match_observation_id);
create index if not exists idx_observations_observation_category on public.observations(observation_category);

-- 4. Table motor_evaluations (one row per extended observation)
create table if not exists public.motor_evaluations (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  speed smallint not null check (speed >= 1 and speed <= 5),
  endurance smallint not null check (endurance >= 1 and endurance <= 5),
  jumping smallint not null check (jumping >= 1 and jumping <= 5),
  agility smallint not null check (agility >= 1 and agility <= 5),
  acceleration smallint not null check (acceleration >= 1 and acceleration <= 5),
  strength smallint not null check (strength >= 1 and strength <= 5),
  description text,
  created_at timestamptz not null default now(),
  unique(observation_id)
);

create index if not exists idx_motor_evaluations_observation_id on public.motor_evaluations(observation_id);

-- 5. Categories: default_form_type
alter table public.categories
  add column if not exists default_form_type public.default_form_type_enum not null default 'simplified';

comment on column public.categories.default_form_type is 'Default observation form type for this age category';

-- Seed default_form_type: Seniorzy extended, rest stay simplified (column default)
update public.categories set default_form_type = 'extended'::public.default_form_type_enum
where name ilike '%senior%';

-- 6. Players: contract_end_date, body_build
alter table public.players
  add column if not exists contract_end_date date,
  add column if not exists body_build text;

comment on column public.players.contract_end_date is 'Contract end date (extended observation)';
comment on column public.players.body_build is 'Body build from dictionary (extended observation)';

-- 7. evaluation_criteria: section and code
alter table public.evaluation_criteria
  add column if not exists section public.criterion_section,
  add column if not exists code text;

comment on column public.evaluation_criteria.section is 'Group for extended form: defense, offense, transition_oa, transition_ao';
comment on column public.evaluation_criteria.code is 'Technical code per position (e.g. def_1v1)';

-- 8. observation_criterion_notes (extended form positional criteria as text)
create table if not exists public.observation_criterion_notes (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  criteria_id uuid not null references public.evaluation_criteria(id) on delete cascade,
  description text,
  created_at timestamptz not null default now(),
  unique(observation_id, criteria_id)
);

create index if not exists idx_observation_criterion_notes_observation_id on public.observation_criterion_notes(observation_id);

-- 9. RLS match_observations
alter table public.match_observations enable row level security;

drop policy if exists "Match observations viewable by authenticated" on public.match_observations;
create policy "Match observations viewable by authenticated"
  on public.match_observations for select to authenticated using (true);

drop policy if exists "Users can insert own match observations" on public.match_observations;
create policy "Users can insert own match observations"
  on public.match_observations for insert to authenticated
  with check (auth.uid() = scout_id);

drop policy if exists "Users can update own match observations" on public.match_observations;
create policy "Users can update own match observations"
  on public.match_observations for update to authenticated
  using (auth.uid() = scout_id);

drop policy if exists "Users can delete own match observations" on public.match_observations;
create policy "Users can delete own match observations"
  on public.match_observations for delete to authenticated
  using (auth.uid() = scout_id);

-- 10. RLS motor_evaluations (same as observations visibility via observation_id)
alter table public.motor_evaluations enable row level security;

drop policy if exists "Motor evaluations viewable by authenticated" on public.motor_evaluations;
create policy "Motor evaluations viewable by authenticated"
  on public.motor_evaluations for select to authenticated using (true);

drop policy if exists "Motor evaluations insert by authenticated" on public.motor_evaluations;
create policy "Motor evaluations insert by authenticated"
  on public.motor_evaluations for insert to authenticated with check (true);

drop policy if exists "Motor evaluations update by authenticated" on public.motor_evaluations;
create policy "Motor evaluations update by authenticated"
  on public.motor_evaluations for update to authenticated using (true);

drop policy if exists "Motor evaluations delete by authenticated" on public.motor_evaluations;
create policy "Motor evaluations delete by authenticated"
  on public.motor_evaluations for delete to authenticated using (true);

-- 11. RLS observation_criterion_notes
alter table public.observation_criterion_notes enable row level security;

drop policy if exists "Observation criterion notes viewable by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes viewable by authenticated"
  on public.observation_criterion_notes for select to authenticated using (true);

drop policy if exists "Observation criterion notes insert by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes insert by authenticated"
  on public.observation_criterion_notes for insert to authenticated with check (true);

drop policy if exists "Observation criterion notes update by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes update by authenticated"
  on public.observation_criterion_notes for update to authenticated using (true);

drop policy if exists "Observation criterion notes delete by authenticated" on public.observation_criterion_notes;
create policy "Observation criterion notes delete by authenticated"
  on public.observation_criterion_notes for delete to authenticated using (true);
