-- Fix Supabase linter: rls_disabled_in_public on public.import_stg_bundle
-- Assumption: import_stg_bundle is a staging/import table and should not be accessible via PostgREST for anon/authenticated.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'import_stg_bundle'
      and c.relkind = 'r'
  ) then
    execute 'alter table public.import_stg_bundle enable row level security';

    execute 'drop policy if exists "no_access_anon" on public.import_stg_bundle';
    execute 'create policy "no_access_anon" on public.import_stg_bundle for all to anon using (false) with check (false)';

    execute 'drop policy if exists "no_access_authenticated" on public.import_stg_bundle';
    execute 'create policy "no_access_authenticated" on public.import_stg_bundle for all to authenticated using (false) with check (false)';
  end if;
end
$$;

