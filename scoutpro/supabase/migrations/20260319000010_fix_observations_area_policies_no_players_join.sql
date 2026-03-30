-- Break RLS recursion between players<->observations area policies.
-- Current observation policies join public.players inside the RLS USING clause,
-- which combined with players policies that SELECT from observations can create
-- an infinite recursion (42P17).
--
-- Fix: replace players join with a SECURITY DEFINER helper that reads players
-- with row_security disabled.

create or replace function public.player_belongs_to_current_area(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with _ as (select set_config('row_security', 'off', true))
  select exists (
    select 1
    from public.players p
    join public.categories c on c.id = p.age_category_id
    where p.id = p_player_id
      and c.area::text = public.current_area_access()::text
  );
$$;

drop policy if exists "Observations area gate select" on public.observations;
create policy "Observations area gate select"
on public.observations
as restrictive
for select
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or public.player_belongs_to_current_area(observations.player_id)
);

drop policy if exists "Observations area gate insert" on public.observations;
create policy "Observations area gate insert"
on public.observations
as restrictive
for insert
to authenticated
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or public.player_belongs_to_current_area(observations.player_id)
);

drop policy if exists "Observations area gate update" on public.observations;
create policy "Observations area gate update"
on public.observations
as restrictive
for update
to authenticated
using (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or public.player_belongs_to_current_area(observations.player_id)
)
with check (
  public.is_admin()
  or public.current_area_access() = 'ALL'::public.area_access_type
  or public.player_belongs_to_current_area(observations.player_id)
);

