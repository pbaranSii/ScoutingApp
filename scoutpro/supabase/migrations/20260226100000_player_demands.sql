-- Player demands (Zapotrzebowania na zawodników): demands and candidates.
-- Create/update/delete restricted to director, coach, admin. All authenticated can view and add candidates.

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'demand_priority') then
    create type public.demand_priority as enum ('critical', 'high', 'standard');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'demand_status') then
    create type public.demand_status as enum ('open', 'in_progress', 'filled', 'cancelled');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'demand_assignment_type') then
    create type public.demand_assignment_type as enum ('manual', 'suggested');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'demand_preferred_foot') then
    create type public.demand_preferred_foot as enum ('left', 'right', 'both', 'any');
  end if;
end$$;

-- 2. Table player_demands
create table if not exists public.player_demands (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  season text not null,
  league_ids uuid[] not null default '{}',
  position text not null,
  quantity_needed integer not null default 1 check (quantity_needed >= 1),
  priority public.demand_priority not null default 'standard',
  age_min integer,
  age_max integer,
  preferred_foot public.demand_preferred_foot default 'any',
  style_notes text,
  notes text,
  status public.demand_status not null default 'open',
  filled_by_player_id uuid references public.players(id) on delete set null,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_player_demands_club_id on public.player_demands(club_id);
create index if not exists idx_player_demands_status on public.player_demands(status);
create index if not exists idx_player_demands_priority on public.player_demands(priority);
create index if not exists idx_player_demands_season on public.player_demands(season);
create index if not exists idx_player_demands_created_at on public.player_demands(created_at desc);

-- 3. Table player_demand_candidates
create table if not exists public.player_demand_candidates (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid not null references public.player_demands(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  assignment_type public.demand_assignment_type not null default 'manual',
  accepted boolean default true,
  assigned_by uuid not null references public.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unique(demand_id, player_id)
);

create index if not exists idx_player_demand_candidates_demand_id on public.player_demand_candidates(demand_id);
create index if not exists idx_player_demand_candidates_player_id on public.player_demand_candidates(player_id);

-- 4. RLS
alter table public.player_demands enable row level security;
alter table public.player_demand_candidates enable row level security;

-- Helper: user can create/edit/delete demands (director, coach, admin)
create or replace function public.demand_can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.is_active = true
      and u.business_role in ('director', 'coach', 'admin')
  );
$$;

-- All authenticated can view demands
drop policy if exists "Player demands select" on public.player_demands;
create policy "Player demands select"
  on public.player_demands for select to authenticated
  using (true);

drop policy if exists "Player demands insert" on public.player_demands;
create policy "Player demands insert"
  on public.player_demands for insert to authenticated
  with check (public.demand_can_manage() and created_by = auth.uid());

drop policy if exists "Player demands update" on public.player_demands;
create policy "Player demands update"
  on public.player_demands for update to authenticated
  using (public.demand_can_manage())
  with check (public.demand_can_manage());

drop policy if exists "Player demands delete" on public.player_demands;
create policy "Player demands delete"
  on public.player_demands for delete to authenticated
  using (public.demand_can_manage());

-- Candidates: all authenticated can view and add/remove
drop policy if exists "Player demand candidates select" on public.player_demand_candidates;
create policy "Player demand candidates select"
  on public.player_demand_candidates for select to authenticated
  using (true);

drop policy if exists "Player demand candidates insert" on public.player_demand_candidates;
create policy "Player demand candidates insert"
  on public.player_demand_candidates for insert to authenticated
  with check (assigned_by = auth.uid());

drop policy if exists "Player demand candidates delete" on public.player_demand_candidates;
create policy "Player demand candidates delete"
  on public.player_demand_candidates for delete to authenticated
  using (true);

-- 5. Trigger updated_at
create or replace function public.player_demands_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists player_demands_updated_at on public.player_demands;
create trigger player_demands_updated_at
  before update on public.player_demands
  for each row execute function public.player_demands_updated_at();
