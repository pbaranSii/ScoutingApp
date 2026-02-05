-- Allow authenticated inserts into pipeline_history and backfill initial entries.
alter table if exists public.pipeline_history enable row level security;

drop policy if exists "allow_insert_pipeline_history_authenticated" on public.pipeline_history;
create policy "allow_insert_pipeline_history_authenticated"
on public.pipeline_history
for insert
to authenticated
with check (
  changed_by = auth.uid()
  or public.is_admin()
);

do $$
declare
  admin_id uuid;
begin
  select id
    into admin_id
    from public.users
   where role = 'admin'
     and is_active = true
   order by created_at asc
   limit 1;

  if admin_id is null then
    raise notice 'No active admin found, skipping pipeline history backfill.';
    return;
  end if;

  insert into public.pipeline_history (player_id, from_status, to_status, changed_by, created_at)
  select p.id,
         null,
         p.pipeline_status,
         admin_id,
         p.created_at
    from public.players p
   where not exists (
     select 1
       from public.pipeline_history h
      where h.player_id = p.id
   );
end $$;
