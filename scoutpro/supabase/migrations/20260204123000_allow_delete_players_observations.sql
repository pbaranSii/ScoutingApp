-- Allow authenticated users to delete players and observations.
alter table if exists public.players enable row level security;
alter table if exists public.observations enable row level security;

drop policy if exists "allow_delete_players_authenticated" on public.players;
create policy "allow_delete_players_authenticated"
on public.players
for delete
to authenticated
using (true);

drop policy if exists "allow_delete_observations_authenticated" on public.observations;
create policy "allow_delete_observations_authenticated"
on public.observations
for delete
to authenticated
using (true);
