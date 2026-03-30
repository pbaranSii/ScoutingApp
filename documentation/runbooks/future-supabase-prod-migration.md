# Runbook: Przyszła migracja do „właściwej” bazy Supabase PROD (faza 2)

## Cel

Scenariusz **drugiej fazy** migracji: utworzenie **nowego** projektu Supabase przeznaczonego wyłącznie na produkcję, przeniesienie schematu, danych (Auth, tabele publiczne, storage), a następnie przełączenie **obu** frontendów (Vercel i Azure SWA) na nowe URL i klucze.

Ten runbook należy wykonać **po** ustabilizowaniu dual hostingu (Vercel + Azure SWA na obecnym Supabase PROD).

## Źródła wiedzy

- Migracje schematu: [scoutpro/supabase/README_MIGRATIONS.md](../../scoutpro/supabase/README_MIGRATIONS.md), [apply-migrations.md](apply-migrations.md).
- Skrypty migracji danych: [documentation/operations-dev-prod.md](../operations-dev-prod.md) (sekcja „Migracja danych Dev -> Prod”).

## Etapy (skrót)

### 1. Nowy projekt Supabase

- Utwórz nowy projekt w [Supabase](https://supabase.com/dashboard) (region, plan – wg wymagań).
- Zapisz **Project URL** i **anon key** (oraz **service_role key** na potrzeby skryptów migracji).

### 2. Schemat i migracje

- Powiąż projekt z repo: `npx supabase link --project-ref <ref>` w katalogu `scoutpro/`.
- Uruchom migracje: `npx supabase db push` (lub ręcznie w SQL Editor według kolejności plików z `scoutpro/supabase/migrations/`).
- Po wdrożeniu: **Project Settings → API → Reload schema cache**.

### 3. Migracja Auth (użytkownicy)

- Zmienne: `DEV_SUPABASE_URL`, `DEV_SUPABASE_SERVICE_ROLE_KEY` (obecny PROD jako „źródło”), `PROD_SUPABASE_URL`, `PROD_SUPABASE_SERVICE_ROLE_KEY` (nowy projekt).
- Uruchom: `scoutpro/scripts/migrate-auth.ts` (tryb invite lub password – zob. operations-dev-prod.md).

### 4. Migracja danych (tabele publiczne)

- Uruchom: `scoutpro/scripts/migrate-data.ts` (kolejność tabel zdefiniowana w skrypcie, remapowanie user_id po emailu).

### 5. Migracja Storage

- Uruchom: `scoutpro/scripts/migrate-storage.ts` (bucket np. `player-photos` / `scoutpro-media` – zależnie od nazw w projekcie).

### 6. Edge Functions (jeśli używane)

- Funkcje wywoływane przez aplikację (np. `send-invitation`, `admin-create-user`, `admin-set-password`) muszą być wdrożone w **nowym** projekcie Supabase (np. `supabase functions deploy`).

### 7. Konfiguracja Auth w nowym Supabase

- **Redirect URLs**: dodać zarówno adres Vercel, jak i Azure SWA (tak jak w [supabase-prod-config-for-multi-frontends.md](supabase-prod-config-for-multi-frontends.md)).
- **Site URL**: ustawić główny adres produkcyjny (Vercel lub SWA).

### 8. Przełączenie frontendów

- **Vercel**: w ustawieniach projektu zmienić zmienne środowiskowe **VITE_SUPABASE_URL** i **VITE_SUPABASE_ANON_KEY** na wartości z nowego projektu; wykonać redeploy.
- **Azure DevOps**: w variable group **scoutapp-swadeploy** zaktualizować **VITE_SUPABASE_URL** i **VITE_SUPABASE_ANON_KEY**; uruchomić pipeline (np. z brancha `main`).

### 9. Weryfikacja i rollback

- Smoke test na obu frontach: logowanie, kluczowe moduły, multimedia.
- W razie problemów: przywrócenie starych URL/kluczy w Vercel i variable group oraz powrót do starego projektu Supabase.

## Uwagi

- Wymagany jest **backup** obecnej bazy przed migracją (eksport, snapshot – zależnie od oferty Supabase).
- Skrypty migracji wymagają **service_role** – nie używaj ich w środowisku frontowym; uruchamiaj z zaufanego środowiska (lokalnie lub CI z sekretami).
