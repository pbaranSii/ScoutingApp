-- Scout-only visibility for SELECT queries (RLS).
-- Applies only when users.business_role = 'scout' (via public.current_business_role()).
-- Other business roles keep prior visibility. Admin override always applies.

-- Players: scouts see only players they created.
drop policy if exists "Players are viewable by authenticated users" on public.players;
create policy "Players are viewable by authenticated users"
on public.players
for select
to authenticated
using (
  public.is_admin()
  or public.current_business_role() <> 'scout'
  or created_by = auth.uid()
);

-- Observations: scouts see only their own observations.
drop policy if exists "Observations are viewable by authenticated users" on public.observations;
create policy "Observations are viewable by authenticated users"
on public.observations
for select
to authenticated
using (
  public.is_admin()
  or public.current_business_role() <> 'scout'
  or scout_id = auth.uid()
);

-- Tasks: scouts see tasks assigned to them OR created by them.
drop policy if exists "Tasks viewable by authenticated" on public.tasks;
create policy "Tasks viewable by authenticated"
on public.tasks
for select
to authenticated
using (
  public.is_admin()
  or public.current_business_role() <> 'scout'
  or assigned_to = auth.uid()
  or created_by = auth.uid()
);

