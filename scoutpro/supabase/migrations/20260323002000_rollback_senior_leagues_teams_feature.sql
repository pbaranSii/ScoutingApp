-- Rollback: senior leagues/teams feature (schema + RLS artifacts).
-- Defensive migration: uses IF EXISTS to support partial states across environments.

begin;

-- Policies that might have been created for senior feature tables.
drop policy if exists "kraje_select_authenticated" on public.kraje;
drop policy if exists "kraje_write_admin" on public.kraje;
drop policy if exists "ligi_select_authenticated" on public.ligi;
drop policy if exists "ligi_write_admin" on public.ligi;
drop policy if exists "druzyny_select_authenticated" on public.druzyny;
drop policy if exists "druzyny_write_admin" on public.druzyny;
drop policy if exists "druzyna_liga_sezon_select_authenticated" on public.druzyna_liga_sezon;
drop policy if exists "druzyna_liga_sezon_write_admin" on public.druzyna_liga_sezon;
drop policy if exists "zawodnik_klub_historia_select_scope" on public.zawodnik_klub_historia;
drop policy if exists "zawodnik_klub_historia_insert_scope" on public.zawodnik_klub_historia;
drop policy if exists "zawodnik_klub_historia_update_scope" on public.zawodnik_klub_historia;
drop policy if exists "zawodnik_klub_historia_delete_scope" on public.zawodnik_klub_historia;
drop policy if exists "Player club history select" on public.zawodnik_klub_historia;
drop policy if exists "Player club history insert" on public.zawodnik_klub_historia;
drop policy if exists "Player club history update" on public.zawodnik_klub_historia;
drop policy if exists "Player club history delete" on public.zawodnik_klub_historia;

-- Remove columns added by senior feature.
alter table if exists public.players
  drop column if exists aktualny_klub_id,
  drop column if exists aktualny_klub_text;

alter table if exists public.observations
  drop column if exists druzyna_id,
  drop column if exists liga_id_snapshot,
  drop column if exists poziom_ligi,
  drop column if exists sezon_snapshot,
  drop column if exists druzyna_text;

-- Drop senior dictionaries/history tables.
drop table if exists public.zawodnik_klub_historia cascade;
drop table if exists public.druzyna_liga_sezon cascade;
drop table if exists public.druzyny cascade;
drop table if exists public.ligi cascade;
drop table if exists public.kraje cascade;

-- Helper function introduced for historia write checks.
-- Keep this at the end because policies/tables may still depend on it.
drop function if exists public.player_can_be_updated_by_current_user(uuid) cascade;

commit;
