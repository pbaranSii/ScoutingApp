-- Allow coach/director to update players within their current area.
-- Previously, "Users can update players" allowed only:
-- - admins, or
-- - created_by = auth.uid(), or
-- - scouts that have observations for that player
-- That blocked coach/director pipeline updates and player form pipeline_status edits.

drop policy if exists "Users can update players" on public.players;
create policy "Users can update players"
on public.players
for update
to authenticated
using (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.observations o
    where o.player_id = players.id
      and o.scout_id = auth.uid()
  )
  or (
    public.current_business_role() <> 'scout'::public.user_business_role
    and (
      public.current_area_access() = 'ALL'::public.area_access_type
      or exists (
        select 1
        from public.categories c
        where c.id = players.age_category_id
          and c.area::text = public.current_area_access()::text
      )
    )
  )
)
with check (
  public.is_admin()
  or created_by = auth.uid()
  or exists (
    select 1
    from public.observations o
    where o.player_id = players.id
      and o.scout_id = auth.uid()
  )
  or (
    public.current_business_role() <> 'scout'::public.user_business_role
    and (
      public.current_area_access() = 'ALL'::public.area_access_type
      or exists (
        select 1
        from public.categories c
        where c.id = players.age_category_id
          and c.area::text = public.current_area_access()::text
      )
    )
  )
);

