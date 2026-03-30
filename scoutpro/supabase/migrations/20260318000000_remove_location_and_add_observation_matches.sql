-- 1) Remove unused location fields
alter table if exists public.observations
  drop column if exists location;

alter table if exists public.match_observations
  drop column if exists location;

-- 1b) Extend players with club formation (tactical scheme)
alter table if exists public.players
  add column if not exists club_formation text null;

-- 2) Support multiple matches per individual observation
create table if not exists public.observation_matches (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  match_date date not null,
  competition text null,
  league text null,
  home_team text null,
  away_team text null,
  match_result text null,
  source public.observation_source null,
  home_team_formation text null,
  away_team_formation text null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists observation_matches_observation_id_idx
  on public.observation_matches(observation_id);

alter table public.observation_matches enable row level security;

-- RLS: mirror observations visibility. Allow if user can access parent observation.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observation_matches'
      and policyname = 'observation_matches_select'
  ) then
    create policy observation_matches_select
      on public.observation_matches
      for select
      using (
        exists (
          select 1 from public.observations o
          where o.id = observation_matches.observation_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observation_matches'
      and policyname = 'observation_matches_insert'
  ) then
    create policy observation_matches_insert
      on public.observation_matches
      for insert
      with check (
        exists (
          select 1 from public.observations o
          where o.id = observation_matches.observation_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observation_matches'
      and policyname = 'observation_matches_update'
  ) then
    create policy observation_matches_update
      on public.observation_matches
      for update
      using (
        exists (
          select 1 from public.observations o
          where o.id = observation_matches.observation_id
        )
      )
      with check (
        exists (
          select 1 from public.observations o
          where o.id = observation_matches.observation_id
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'observation_matches'
      and policyname = 'observation_matches_delete'
  ) then
    create policy observation_matches_delete
      on public.observation_matches
      for delete
      using (
        exists (
          select 1 from public.observations o
          where o.id = observation_matches.observation_id
        )
      );
  end if;
end $$;

