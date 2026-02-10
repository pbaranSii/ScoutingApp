-- Enable RLS on all public tables and apply baseline policies.

alter table if exists public.users enable row level security;
alter table if exists public.players enable row level security;
alter table if exists public.observations enable row level security;
alter table if exists public.matches enable row level security;
alter table if exists public.player_contacts enable row level security;
alter table if exists public.player_evaluations enable row level security;
alter table if exists public.pipeline_history enable row level security;
alter table if exists public.offline_queue enable row level security;
alter table if exists public.invitations enable row level security;
alter table if exists public.regions enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.leagues enable row level security;
alter table if exists public.positions enable row level security;
alter table if exists public.evaluation_criteria enable row level security;
alter table if exists public.clubs enable row level security;

-- Users
drop policy if exists "Users are viewable by authenticated users" on public.users;
create policy "Users are viewable by authenticated users"
on public.users
for select
to authenticated
using (is_active = true);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Re-apply admin policy to be safe.
drop policy if exists "Only admins can modify users" on public.users;
create policy "Only admins can modify users"
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Players
drop policy if exists "Players are viewable by authenticated users" on public.players;
create policy "Players are viewable by authenticated users"
on public.players
for select
to authenticated
using (true);

drop policy if exists "Users can insert players" on public.players;
create policy "Users can insert players"
on public.players
for insert
to authenticated
with check (true);

drop policy if exists "Users can update players" on public.players;
create policy "Users can update players"
on public.players
for update
to authenticated
using (true)
with check (true);

-- Observations
drop policy if exists "Observations are viewable by authenticated users" on public.observations;
create policy "Observations are viewable by authenticated users"
on public.observations
for select
to authenticated
using (true);

drop policy if exists "Users can create observations" on public.observations;
create policy "Users can create observations"
on public.observations
for insert
to authenticated
with check (scout_id = auth.uid() or public.is_admin());

-- Matches
drop policy if exists "Matches are viewable by authenticated users" on public.matches;
create policy "Matches are viewable by authenticated users"
on public.matches
for select
to authenticated
using (true);

drop policy if exists "Users can manage matches" on public.matches;
create policy "Users can manage matches"
on public.matches
for all
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

-- Player contacts
drop policy if exists "Player contacts are viewable by authenticated users" on public.player_contacts;
create policy "Player contacts are viewable by authenticated users"
on public.player_contacts
for select
to authenticated
using (true);

drop policy if exists "Users can manage player contacts" on public.player_contacts;
create policy "Users can manage player contacts"
on public.player_contacts
for all
to authenticated
using (true)
with check (true);

-- Player evaluations
drop policy if exists "Player evaluations are viewable by authenticated users" on public.player_evaluations;
create policy "Player evaluations are viewable by authenticated users"
on public.player_evaluations
for select
to authenticated
using (true);

drop policy if exists "Users can manage player evaluations" on public.player_evaluations;
create policy "Users can manage player evaluations"
on public.player_evaluations
for all
to authenticated
using (true)
with check (true);

-- Pipeline history
drop policy if exists "Pipeline history is viewable by authenticated users" on public.pipeline_history;
create policy "Pipeline history is viewable by authenticated users"
on public.pipeline_history
for select
to authenticated
using (true);

drop policy if exists "Allow insert pipeline history authenticated" on public.pipeline_history;
create policy "Allow insert pipeline history authenticated"
on public.pipeline_history
for insert
to authenticated
with check (true);

-- Offline queue (user scoped)
drop policy if exists "Offline queue is viewable by owner" on public.offline_queue;
create policy "Offline queue is viewable by owner"
on public.offline_queue
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can manage own offline queue" on public.offline_queue;
create policy "Users can manage own offline queue"
on public.offline_queue
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- Invitations (admin only)
drop policy if exists "Admins can manage invitations" on public.invitations;
create policy "Admins can manage invitations"
on public.invitations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Lookup tables (read for all authenticated, write for admin)
drop policy if exists "Regions are viewable by authenticated users" on public.regions;
create policy "Regions are viewable by authenticated users"
on public.regions
for select
to authenticated
using (true);

drop policy if exists "Admin can manage regions" on public.regions;
create policy "Admin can manage regions"
on public.regions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Categories are viewable by authenticated users" on public.categories;
create policy "Categories are viewable by authenticated users"
on public.categories
for select
to authenticated
using (true);

drop policy if exists "Admin can manage categories" on public.categories;
create policy "Admin can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Leagues are viewable by authenticated users" on public.leagues;
create policy "Leagues are viewable by authenticated users"
on public.leagues
for select
to authenticated
using (true);

drop policy if exists "Admin can manage leagues" on public.leagues;
create policy "Admin can manage leagues"
on public.leagues
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Positions are viewable by authenticated users" on public.positions;
create policy "Positions are viewable by authenticated users"
on public.positions
for select
to authenticated
using (true);

drop policy if exists "Admin can manage positions" on public.positions;
create policy "Admin can manage positions"
on public.positions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Evaluation criteria are viewable by authenticated users" on public.evaluation_criteria;
create policy "Evaluation criteria are viewable by authenticated users"
on public.evaluation_criteria
for select
to authenticated
using (true);

drop policy if exists "Admin can manage evaluation criteria" on public.evaluation_criteria;
create policy "Admin can manage evaluation criteria"
on public.evaluation_criteria
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Clubs are viewable by authenticated users" on public.clubs;
create policy "Clubs are viewable by authenticated users"
on public.clubs
for select
to authenticated
using (true);

drop policy if exists "Admin can manage clubs" on public.clubs;
create policy "Admin can manage clubs"
on public.clubs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
