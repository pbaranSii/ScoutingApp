-- Remove deprecated admin data transfer module.
-- Idempotent cleanup: RPC + staging/audit tables + RLS policies.

begin;

-- RPC used by the import pipeline
drop function if exists public.admin_data_transfer_publish(uuid);

-- Staging + audit tables
drop table if exists public.import_stg_bundle cascade;
drop table if exists public.import_entity_map cascade;
drop table if exists public.import_user_map cascade;
drop table if exists public.import_run_issues cascade;
drop table if exists public.import_runs cascade;
drop table if exists public.export_runs cascade;

commit;

