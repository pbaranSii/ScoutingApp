-- Fix Supabase linter: rls_disabled_in_public on public.tmp_import_future_fix
-- Assumption: tmp_import_future_fix is a technical/import table and should not be accessible via PostgREST for anon/authenticated.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'tmp_import_future_fix'
      and c.relkind = 'r'
  ) then
    execute 'alter table public.tmp_import_future_fix enable row level security';

    execute 'drop policy if exists "no_access_anon" on public.tmp_import_future_fix';
    execute 'create policy "no_access_anon" on public.tmp_import_future_fix for all to anon using (false) with check (false)';

    execute 'drop policy if exists "no_access_authenticated" on public.tmp_import_future_fix';
    execute 'create policy "no_access_authenticated" on public.tmp_import_future_fix for all to authenticated using (false) with check (false)';
  end if;
end
$$;

