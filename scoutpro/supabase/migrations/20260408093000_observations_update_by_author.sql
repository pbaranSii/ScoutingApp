-- Allow observation authors to edit their observations.
-- Area access is still enforced by restrictive "Observations area gate update" policy.

drop policy if exists "Users can update observations" on public.observations;
create policy "Users can update observations"
on public.observations
for update
to authenticated
using (public.is_admin() or scout_id = auth.uid())
with check (public.is_admin() or scout_id = auth.uid());

