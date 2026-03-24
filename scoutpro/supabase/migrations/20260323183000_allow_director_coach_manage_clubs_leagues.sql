-- Allow director and coach roles to manage clubs and leagues dictionaries.

drop policy if exists "Admin can manage clubs" on public.clubs;
create policy "Admin director coach can manage clubs"
on public.clubs
for all
to authenticated
using (public.current_business_role() in ('admin', 'director', 'coach'))
with check (public.current_business_role() in ('admin', 'director', 'coach'));

drop policy if exists "Admin can manage leagues" on public.leagues;
create policy "Admin director coach can manage leagues"
on public.leagues
for all
to authenticated
using (public.current_business_role() in ('admin', 'director', 'coach'))
with check (public.current_business_role() in ('admin', 'director', 'coach'));

