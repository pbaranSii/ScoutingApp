# Dev -> Prod i operacje

## Runbook wdrożenia DEV → PROD

Pełna instrukcja (migracje, backup, weryfikacja, smoke test): **[runbooks/deploy-dev-to-prod.md](runbooks/deploy-dev-to-prod.md)**. Historyczna wersja: [runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md).

## Standardowy flow pracy
1. Zmiana lokalnie + testy.
2. PR na branch docelowy.
3. Deploy na preview/staging.
4. Akceptacja.
5. Deploy na production.

## Migracje bazy
Źródłem prawdy są migracje w `scoutpro/supabase/migrations`.
Zasady:
- Nie edytować danych na prod ręcznie.
- Każda zmiana schematu = nowa migracja.
- Migracje uruchamiac najpierw na dev/staging.

Przykłady aktualnych migracji:
- `20260101000000_init_schema.sql` (schemat bazowy)
- `20260204150000_fix_rls_admin_policy.sql` (helper is_admin)
- `20260205120000_backfill_pipeline_history.sql`
- `20260205123000_update_observation_rating_decimal.sql`
- `20260206140000_enable_rls_policies.sql`

## Słowniki (lookup tables)
Słowniki to tabele: regions, categories, leagues, positions, evaluation_criteria, clubs.
Zasady:
- CRUD tylko dla admina (RLS).
- Zmiany w słownikach wprowadzać przez migracje lub kontrolowane seedy.
- Dev -> Prod: te same skrypty/migracje, bez ręcznych zmian na prod.

## Migracja danych Dev -> Prod
W repo znajdują się skrypty:
- `scoutpro/scripts/migrate-auth.ts` (Auth users)
- `scoutpro/scripts/migrate-data.ts` (tabele publiczne)
- `scoutpro/scripts/migrate-storage.ts` (Storage bucket)

Wspólne wymagania:
- Zmienne środowiskowe: DEV_SUPABASE_URL, DEV_SUPABASE_SERVICE_ROLE_KEY,
  PROD_SUPABASE_URL, PROD_SUPABASE_SERVICE_ROLE_KEY.
- Uruchamianie tylko z kontem z uprawnieniami admin/service role.

### migrate-auth.ts
Tryby:
- MIGRATE_MODE=invite (domyślnie) lub password
- MIGRATE_DEFAULT_PASSWORD wymagane w trybie password
- COPY_METADATA=true kopiuje metadata

### migrate-data.ts
- Kolejnosc tabel zdefiniowana w skrypcie (TABLE_ORDER).
- Remapowanie user_id po emailu.
- Umożliwia ALLOW_ORPHAN_USERS=true dla rekordow bez emaila (zachowuje id).

### migrate-storage.ts
- Przenosi pliki z bucket `player-photos`.
- STORAGE_UPSERT=true pozwala nadpisywać pliki.

## RLS i admin
Polityki RLS są utrzymane w migracjach. Admin sprawdzany jest przez
`public.is_admin()` (SECURITY DEFINER) z migracji `20260204150000_fix_rls_admin_policy.sql`.
