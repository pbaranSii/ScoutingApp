# Runbook: Import / Export zawodników i obserwacji (JSON bundle)

## 1) Wymagania wstępne

- Zastosowane migracje Supabase (w szczególności):
  - `scoutpro/supabase/migrations/20260330000001_data_transfer_import_export_tables.sql`
- Wdrożona Edge Function:
  - `scoutpro/supabase/functions/admin-data-transfer`
- W aplikacji dostępny ekran:
  - `Ustawienia -> Import / Export danych` (`/settings/admin/data-transfer`)
- Uprawnienia: użytkownik zalogowany jako **admin** (`public.users.role = 'admin'`, `is_active = true`).

## 2) Kontrakt bundla

Kontrakt bundla jest opisany typami w:
- `scoutpro/src/features/dataTransfer/types.ts`

Wersja aktualna:
- `bundleVersion = "1.0"`

## 3) Eksport (Dev)

1. Zaloguj się jako admin na środowisku źródłowym (dev).
2. Wejdź w **Ustawienia → Import / Export danych**.
3. Kliknij **Pobierz eksport (JSON)**.
4. Zapisz plik jako artefakt migracji (np. do folderu `Materials/`).

## 4) Import (Prod) – bezpieczny przebieg

### 4.1 Preflight (obowiązkowy)

1. Zaloguj się jako admin na środowisku docelowym (prod).
2. Wejdź w **Ustawienia → Import / Export danych**.
3. Wybierz plik bundla JSON.
4. Kliknij **Preflight (sprawdź i raportuj)**.

Wynik:
- Jeśli `ok = false` lub pojawią się `issues` o `severity = error` → **import zablokowany**.
- Raport jest audytowany w tabeli `public.import_runs` (status `preflight_ok` lub `preflight_error`).

### 4.2 Commit (dopiero po OK)

1. Upewnij się, że preflight zwrócił `ok = true`.
2. Kliknij **Wykonaj import**.

Import wykona:
- upsert referencji (`regions`, `clubs`, `categories`) po kluczach naturalnych,
- mapowanie użytkowników po emailu + utworzenie brakujących (invite) w Auth i w `public.users`,
- import zawodników (deduplikacja po `first_name,last_name,birth_year,club`),
- import obserwacji (deduplikacja po `player+scout+date+source`).

## 5) Weryfikacja po imporcie

- Losowo zweryfikuj kilka zawodników i obserwacji w UI.
- Sprawdź, czy „autorzy” danych są widoczni poprawnie (scout przypisany do obserwacji).
- Opcjonalnie sprawdź audit w `import_runs.stats`.

## 6) Test plan (minimalny)

- **Case A**: bundle z 1 zawodnikiem i 1 obserwacją → import OK.
- **Case B**: duplikat użytkownika w `users[]` (ten sam email 2x) → preflight error, import zablokowany.
- **Case C**: duplikat zawodnika w `players[]` (ten sam klucz) → preflight warning.
- **Case D**: obserwacja wskazuje `player_sourceId` nieistniejący w `players[]` → preflight powinien być rozszerzony (jeśli pojawi się taki przypadek, traktować jako błąd).
- **Case E**: brak użytkownika docelowego → commit tworzy użytkownika (invite) i zachowuje mapowanie.

## 7) Uwagi operacyjne

- Import jest „best effort” w warstwie API – jeżeli w połowie commit wystąpi błąd sieciowy, część danych może być już zapisana. W takim przypadku zalecane jest:
  - ponowne uruchomienie preflight,
  - uruchomienie commit (mechanizmy deduplikacji powinny ograniczyć duplikaty),
  - w razie potrzeby manualny cleanup po `import_runs`.

