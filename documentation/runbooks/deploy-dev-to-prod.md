# Runbook: Wdrożenie zmian ze środowiska DEV na PROD

Dokument opisuje kroki przeniesienia zmian (aplikacja + baza danych) z DEV do PROD oraz listę zmian do weryfikacji przed wykonaniem.

## 1. Zakres wdrożenia

- **Aplikacja (frontend)** – nowy build i publikacja na PROD. Aplikacja jest hostowana na PROD (Vercel); wdrożenie oznacza opublikowanie nowej wersji (build + deploy).
- **Baza danych (Supabase PROD)** – wykonanie migracji SQL, które nie były wcześniej uruchomione na PROD.

**Kolejność:** najpierw baza danych, potem aplikacja.

### Środowiska PROD

- **Aplikacja PROD:** Vercel – [scouting-app](https://vercel.com/pbaransiis-projects/scouting-app). Branch produkcyjny: **master**.
- **Baza danych PROD:** Supabase – Project REF: **digrvtbfonatvytwpbbn**. Dashboard: Project Settings → General.

## 2. Lista migracji (kolejność wykonywania)

Pełna lista migracji znajduje się w katalogu `scoutpro/supabase/migrations/`. Migracje należy stosować **w kolejności nazw plików** (sortowanie leksykograficzne po nazwie).

Aktualną listę migracji można uzyskać poleceniem:

```bash
cd scoutpro
npx supabase migration list
```

Lub przeglądając pliki w `scoutpro/supabase/migrations/*.sql` (kolejność: 20260101…, 20260203…, … 20260226…).

**Uwaga:** Na PROD wykonuj tylko migracje, które jeszcze nie zostały zastosowane. Przed wdrożeniem sprawdź stan migracji w Supabase Dashboard (Database → Migrations) lub przez CLI.

## 3. Wymagania przed wdrożeniem

- Dostęp do projektu Supabase PROD (Dashboard lub CLI).
- Możliwość wdrożenia frontendu (Vercel).
- Backup bazy PROD przed migracjami.
- Zaplanowane okno wdrożenia.

## 4. Instrukcja krok po kroku

### Krok 1: Weryfikacja stanu PROD

**Baza PROD**

- W Supabase Dashboard (PROD): **Database → Migrations** – sprawdź, które migracje są wykonane.
- Lub w terminalu (projekt powiązany z PROD):
  ```bash
  cd scoutpro
  npx supabase link --project-ref digrvtbfonatvytwpbbn
  npx supabase migration list
  ```
- Zapisz listę **brakujących** migracji.

**Aplikacja PROD**

- Sprawdź aktualną wersję (commit/branch ostatniego deployu).
- Upewnij się, że wdrożenie będzie z brancha **master** (zmiany zmergowane z develop do master).

### Krok 2: Backup bazy PROD

1. W Supabase Dashboard PROD: **Database → Backups** – sprawdź backup automatyczny (PITR jeśli dostępny).
2. Opcjonalnie: **SQL Editor** lub zewnętrzne narzędzie – eksport krytycznych tabel lub **Create backup** jeśli dostępne.

### Krok 3: Wykonanie migracji na bazie PROD

**Opcja A – Supabase CLI (zalecane)**

1. W katalogu projektu: `cd scoutpro`
2. Powiązanie z PROD (jeśli nie zrobione): `npx supabase link --project-ref digrvtbfonatvytwpbbn`
3. Wysłanie migracji: `npx supabase db push` – potwierdź wykonanie brakujących migracji.
4. Sprawdzenie: `npx supabase migration list` – wszystkie powinny być oznaczone jako zastosowane.

**Opcja B – Ręcznie w SQL Editor (PROD)**

1. Dla każdej **brakującej** migracji (w kolejności nazw plików): otwórz plik z `scoutpro/supabase/migrations/`, skopiuj zawartość do **SQL Editor** w Supabase PROD i uruchom.
2. W przypadku modułów z osobnymi procedurami (np. statystyki admina, zapotrzebowania) zob. pliki `scoutpro/supabase/APPLY_*.md`.

### Krok 4: Weryfikacja bazy PROD po migracji

W **SQL Editor** (PROD) sprawdź m.in.:

- Istnienie nowych tabel (np. `user_sessions`, `user_surveys`, `player_demands` – jeśli te migracje były w zestawie).
- Enumy i domyślne wartości – w zależności od wdrożonych migracji.

### Krok 5: Build i wdrożenie aplikacji

1. W katalogu `scoutpro`: `npm ci` (lub `npm install`), `npm run build` – sprawdź, że build się powiódł (katalog `dist/`).
2. Deploy PROD: wypchnij zmiany na **master** (`git push origin master`) lub w Vercel wykonaj **Redeploy** dla brancha master.
3. Zmienne środowiskowe PROD w Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL` – muszą wskazywać na Supabase PROD.
4. **Auth:** W Supabase PROD można wyłączyć potwierdzenie e-mail dla nowych użytkowników – zob. `scoutpro/supabase/PROD_AUTH_NO_EMAIL_CONFIRM.md`.

### Krok 6: Weryfikacja po wdrożeniu (smoke test)

1. Otwórz aplikację PROD w przeglądarce.
2. Zaloguj się i sprawdź kluczowe ścieżki: dashboard, zawodnicy, obserwacje, pipeline, zapotrzebowania, ustawienia (jeśli admin – statystyki użytkowników, ankiety, analityka rekrutacji).
3. W razie błędów: konsola przeglądarki, logi Vercel; w bazie – zapytania weryfikacyjne.

## 5. Rollback (awaryjnie)

- **Aplikacja:** powrót do poprzedniego deploya w Vercel (np. poprzedni commit/build).
- **Baza:** automatycznego rollbacku migracji nie ma. Cofnięcie wymaga ręcznych skryptów lub przywrócenia z backupu. **Backup przed migracją jest kluczowy.**

## 6. Weryfikacja przed wdrożeniem (lokalnie)

W katalogu `scoutpro` uruchom:

```bash
npm run deploy:verify
```

Skrypt zbuduje aplikację i wypisze listę plików migracji. Jeśli build się nie powiedzie, nie wdrażaj.

## 7. Checklist przed wdrożeniem

- [ ] Wiem, które migracje są już na PROD, a których brakuje.
- [ ] Zrobiony backup bazy PROD (lub potwierdzony PITR/backup automatyczny).
- [ ] Zmienne środowiskowe PROD wskazują na projekt Supabase PROD.
- [ ] Build OK (`npm run deploy:verify`); zmiany zmergowane do **master**; deploy = push na master / Redeploy.
- [ ] Zaplanowane okno wdrożenia.

Zob. też: [apply-migrations.md](apply-migrations.md), [../deployment.md](../deployment.md).
