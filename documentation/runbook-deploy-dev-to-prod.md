# Runbook: Wdrożenie zmian ze środowiska DEV na PROD

Dokument opisuje kroki przeniesienia zmian (aplikacja + baza danych) z DEV do PROD oraz listę zmian do weryfikacji przed wykonaniem.

## 1. Zakres wdrożenia

- **Aplikacja (frontend)** – nowy build i publikacja na PROD. Aplikacja jest już hostowana na PROD (Vercel); wdrożenie oznacza opublikowanie nowej wersji (build + deploy).
- **Baza danych (Supabase PROD)** – wykonanie migracji SQL, które nie były wcześniej uruchomione na PROD.

**Kolejność:** najpierw baza danych, potem aplikacja.

### Środowiska PROD

- **Aplikacja PROD (istniejąca):**
  - Vercel: [https://vercel.com/pbaransiis-projects/scouting-app](https://vercel.com/pbaransiis-projects/scouting-app)
  - Aplikacja jest już wdrożona na PROD; wdrożenie = aktualizacja (nowy build/deploy z wybranego brancha/commita).
- **Baza danych PROD:**
  - Supabase Dashboard: [https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn)
  - Project REF (do CLI): **`digrvtbfonatvytwpbbn`**

---

## 2. Zmiany do weryfikacji przed wdrożeniem

### 2.1 Zmiany w aplikacji

Wersja z brancha `fix/players-observations-pipeline` (commit „feat: status Nieprzypisany…”):

| Obszar | Opis zmian |
|--------|------------|
| Status „Nieprzypisany” | Nowy status `unassigned` w formularzach, filtrach, etykietach. Na widoku Pipeline brak kolumny „Nieprzypisany” (tylko `PIPELINE_BOARD_COLUMNS`). |
| Domyślny status | Nowi zawodnicy i domyślna wartość w formularzach: „Nieprzypisany” zamiast „Obserwacja”. |
| Pipeline – przycisk „+” | W każdej kolumnie Pipeline przycisk „+” otwierający modal wyszukiwania i dodania zawodnika do kolumny. |
| Typy / listy | `ALL_PIPELINE_STATUSES`, `PIPELINE_BOARD_COLUMNS`, `PipelineStatus` z `unassigned`. |
| Pozostałe | RLS, admin see all, Edge functions – zależnie od stanu PROD. |

**Weryfikacja:** zmienne środowiskowe PROD muszą wskazywać na projekt Supabase PROD (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### 2.2 Migracje bazy danych (kolejność wykonywania)

| # | Plik | Krótki opis |
|---|------|-------------|
| 1 | `20260101000000_init_schema.sql` | Schemat początkowy. |
| 2 | `20260131230635_remote_schema.sql` | Zrzut/aktualizacja schematu. |
| 3 | `20260203120000_add_player_contact_fields.sql` | Pola kontaktowe zawodnika. |
| 4 | `20260203123000_add_observation_form_fields.sql` | Pola formularza obserwacji. |
| 5 | `20260203124500_update_player_positions.sql` | Pozycje zawodników. |
| 6 | `20260203130000_add_missing_player_observation_fields.sql` | Brakujące pola obserwacji. |
| 7 | `20260203133000_add_observation_audit_fields.sql` | Pola audytu obserwacji. |
| 8 | `20260204120000_add_observation_audit_display_fields.sql` | Pola do wyświetlania audytu. |
| 9 | `20260204123000_allow_delete_players_observations.sql` | Usuwanie zawodników/obserwacji. |
| 10 | `20260204150000_fix_rls_admin_policy.sql` | Poprawki polityk RLS (admin). |
| 11 | `20260205120000_backfill_pipeline_history.sql` | Uzupełnienie historii pipeline. |
| 12 | `20260205123000_update_observation_rating_decimal.sql` | Rating obserwacji (decimal). |
| 13 | `20260206140000_enable_rls_policies.sql` | Włączenie RLS i polityki. |
| 14 | `20260206150000_fix_pipeline_history_fk_cascade.sql` | FK/cascade w historii pipeline. |
| 15 | `20260209110000_add_user_business_role.sql` | Kolumna roli biznesowej użytkownika. |
| 16 | `20260209111000_update_user_rls.sql` | RLS dla użytkowników. |
| 17 | `20260210120000_users_admin_see_all.sql` | Admin widzi wszystkich użytkowników. |
| 18 | `20260210140000_add_unassigned_pipeline_status.sql` | **Dodanie wartości `unassigned` do enuma `pipeline_status`.** |
| 19 | `20260210140001_set_unassigned_default_and_migrate.sql` | **Domyślna wartość `unassigned` w `players` oraz UPDATE: `observed` → `unassigned`.** |

Na PROD wykonaj **tylko migracje, które jeszcze nie były zastosowane**. Dla statusu „Nieprzypisany” kluczowe są **18** i **19**.

**Uwaga:** Migracja 19 zmienia wszystkie wiersze `players` z `pipeline_status = 'observed'` na `'unassigned'`. Po wdrożeniu w UI „Obserwacja” będzie tylko dla zawodników już w kolumnie Obserwacja na Pipeline; reszta w formularzach/filtrach jako „Nieprzypisany”.

---

## 3. Wymagania przed wdrożeniem

- Dostęp do projektu Supabase PROD (Dashboard lub CLI).
- Możliwość wdrożenia frontendu (Vercel, Netlify, serwer).
- Backup bazy PROD przed migracjami.
- Zaplanowane okno wdrożenia.

---

## 4. Instrukcja krok po kroku

### Krok 1: Weryfikacja stanu PROD

**Baza PROD**

- W Supabase Dashboard (PROD): **Database → Migrations** – sprawdź, które migracje są wykonane. Dashboard: [link w sekcji Środowiska PROD](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn).
- Lub w terminalu (projekt powiązany z PROD):
  ```bash
  cd scoutpro
  npx supabase link --project-ref digrvtbfonatvytwpbbn
  npx supabase migration list
  ```
- Zapisz listę **brakujących** migracji (szczególnie 20260210140000 i 20260210140001).

**Aplikacja PROD**

- Sprawdź aktualną wersję (commit/branch ostatniego deployu).
- Upewnij się, że wdrożenie będzie z brancha **master** (zmiany z brancha feature zmergowane do master). W tym repo branch produkcyjny to **master**.

### Krok 2: Backup bazy PROD

1. W [Supabase Dashboard PROD](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn): **Database → Backups** – sprawdź backup automatyczny (PITR jeśli dostępny).
2. Opcjonalnie: w **SQL Editor** (PROD) lub narzędziem zewnętrznym zrób eksport tabel `players` (kolumna `pipeline_status`), `pipeline_history`, ewentualnie `observations`. Lub **Database → Backups → Create backup** (jeśli dostępne).

### Krok 3: Wykonanie migracji na bazie PROD

**Opcja A – Supabase CLI (zalecane)**

1. W katalogu projektu:
   ```bash
   cd scoutpro
   ```
2. Powiązanie z PROD (jeśli nie zrobione):
   ```bash
   npx supabase link --project-ref digrvtbfonatvytwpbbn
   ```
   (Project REF: `digrvtbfonatvytwpbbn` – Dashboard PROD → Project Settings → General.)
3. Wysłanie migracji:
   ```bash
   npx supabase db push
   ```
   Potwierdź wykonanie brakujących migracji.
4. Sprawdzenie:
   ```bash
   npx supabase migration list
   ```
   Wszystkie powinny być oznaczone jako zastosowane.

**Opcja B – Ręcznie w SQL Editor (PROD)**

1. Dla każdej **brakującej** migracji (w kolejności nazw plików): otwórz plik z `scoutpro/supabase/migrations/`, skopiuj zawartość do **SQL Editor** w Supabase PROD i uruchom.
2. Dla statusu „Nieprzypisany” **koniecznie w tej kolejności**:
   - Najpierw: `20260210140000_add_unassigned_pipeline_status.sql` (dodanie wartości enuma).
   - Potem: `20260210140001_set_unassigned_default_and_migrate.sql` (default + UPDATE).

### Krok 4: Weryfikacja bazy PROD po migracji

W **SQL Editor** w [Supabase Dashboard PROD](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn) uruchom:

1. Enum zawiera `unassigned`:
   ```sql
   SELECT enumlabel FROM pg_enum
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pipeline_status');
   ```
   Powinna być wartość `unassigned`.

2. Domyślna wartość kolumny:
   ```sql
   SELECT column_default
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'pipeline_status';
   ```
   Oczekiwane: `'unassigned'::public.pipeline_status` (lub równoważne).

3. Rozkład statusów:
   ```sql
   SELECT pipeline_status, count(*) FROM public.players GROUP BY pipeline_status;
   ```
   Po migracji 19 nie powinno być wierszy z `observed` (albo count = 0).

### Krok 5: Build i wdrożenie aplikacji

1. W katalogu `scoutpro`:
   ```bash
   npm ci
   npm run build
   ```
   Sprawdź, że build się powiódł (katalog `dist/`).

2. Deploy PROD = aktualizacja istniejącego projektu na Vercel. Wgraj nową wersję:
   - **Branch produkcyjny: master.** Wypchnij: `git push origin master` (po merge brancha z zmianami do master). Vercel: [scouting-app](https://vercel.com/pbaransiis-projects/scouting-app) – build z master lub **Redeploy** w Vercel dla wybranego commita.
   - Alternatywnie: ręczne wgranie plików z `dist/` na inny hosting.

3. Upewnij się, że zmienne środowiskowe PROD w Vercel wskazują na **Supabase PROD** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`).

### Krok 6: Weryfikacja po wdrożeniu (smoke test)

1. Otwórz aplikację PROD w przeglądarce.
2. Zaloguj się i sprawdź:
   - Lista zawodników – filtr statusu zawiera „Nieprzypisany”.
   - Dodanie nowego zawodnika – domyślny status „Nieprzypisany”.
   - Widok Pipeline – brak kolumny „Nieprzypisany”, przycisk „+” w kolumnie – wyszukiwanie i dodanie zawodnika.
   - Edycja zawodnika – wybór statusu z „Nieprzypisany”.
3. W razie błędów: konsola przeglądarki, logi hostingu; w bazie – zapytania z Kroku 4.

---

## 5. Rollback (awaryjnie)

- **Aplikacja:** powrót do poprzedniego deploya (np. poprzedni commit/build na hostingu).
- **Baza:** automatycznego rollbacku migracji nie ma. Ewentualne cofnięcie wymaga ręcznie:
  - `UPDATE public.players SET pipeline_status = 'observed' WHERE pipeline_status = 'unassigned';`
  - `ALTER TABLE public.players ALTER COLUMN pipeline_status SET DEFAULT 'observed';`
  - Ewentualnie usunięcie wartości `unassigned` z enuma (złożone w PostgreSQL). **Backup przed migracją jest kluczowy.**

---

## 6. Weryfikacja przed wdrożeniem (lokalnie)

W katalogu `scoutpro` uruchom:

```bash
npm run deploy:verify
```

Skrypt zbuduje aplikację i wypisze listę plików migracji (do porównania z listą migracji na PROD). Jeśli build się nie powiedzie, nie wdrażaj.

## 7. Checklist przed wdrożeniem

- [ ] Wiem, które migracje są już na PROD, a których brakuje.
- [ ] Zrobiony backup bazy PROD (lub potwierdzony PITR/backup automatyczny).
- [ ] Zmienne środowiskowe PROD wskazują na projekt Supabase PROD.
- [ ] Build OK (`npm run deploy:verify`); zmiany zmergowane do **master**; deploy = `git push origin master`.
- [ ] Zaplanowane okno wdrożenia i ewentualna krótka przerwa w dostępie.
- [ ] Uruchomiono `npm run deploy:verify` – build przeszedł, lista migracji sprawdzona.

---

Zob. też: [rekomendacje-wdrozen.md](rekomendacje-wdrozen.md) (przed każdą aktualizacją), [deployment.md](deployment.md), [operations-dev-prod.md](operations-dev-prod.md), [future-migrations.md](future-migrations.md) (proces na kolejne aktualizacje).
