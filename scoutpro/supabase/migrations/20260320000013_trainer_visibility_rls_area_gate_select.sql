-- Fix data leak for coach/director: ensure SELECT visibility is also filtered by area.
-- Root cause: scout-only visibility policy for non-scout roles used to allow TRUE (no area filter).
-- This migration recreates those policies with:
-- - scouts: only their own (created_by / scout_id)
-- - coach/director (non-scout): only players/observations that belong to current_area_access

drop policy if exists "Players are viewable by authenticated users" on public.players;
create policy "Players are viewable by authenticated users"
on public.players
for select
to authenticated
using (
  public.is_admin()
  or (
    public.current_business_role() = 'scout'::public.user_business_role
    and created_by = auth.uid()
  )
  or public.current_area_access() = 'ALL'::public.area_access_type
  or exists (
    select 1
    from public.categories c
    where c.id = players.age_category_id
      and c.area::text = public.current_area_access()::text
  )
);

drop policy if exists "Observations are viewable by authenticated users" on public.observations;
create policy "Observations are viewable by authenticated users"
on public.observations
for select
to authenticated
using (
  public.is_admin()
  or (
    public.current_business_role() = 'scout'::public.user_business_role
    and scout_id = auth.uid()
  )
  or public.current_area_access() = 'ALL'::public.area_access_type
  or public.player_belongs_to_current_area(observations.player_id)
);

