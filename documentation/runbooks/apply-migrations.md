# Runbook: Stosowanie migracji

## Kiedy używać `db push`

**Zalecane** w normalnym cyklu rozwoju:

```bash
cd scoutpro
npx supabase link   # jeśli projekt nie jest jeszcze powiązany z instancją Supabase
npm run db:push     # lub: npx supabase db push
```

`db push` stosuje wszystkie migracje z katalogu `scoutpro/supabase/migrations/`, które jeszcze nie zostały zastosowane na powiązanej bazie (zdalnej lub lokalnej), **w kolejności nazw plików**.

- **Środowisko zdalne (DEV/PROD):** po `supabase link` do danego projektu – migracje trafiają na tę instancję.
- **Środowisko lokalne:** po `supabase start` – migracje trafiają na lokalną bazę.

## Kiedy stosować ręcznie (SQL Editor lub APPLY_*.md)

Użyj ręcznego wykonania SQL, gdy:

1. **CLI nie może połączyć się z bazą** lub nie masz Supabase CLI.
2. **Migracja już została oznaczona jako zastosowana**, ale tabele/funkcje nie powstały (np. błąd w przeszłości) – wtedy po ewentualnym usunięciu wpisu z tabeli historii migracji możesz ponowić `db push`, albo wykonać tylko wybrane fragmenty SQL ręcznie.
3. **Procedury opisane w APPLY_*.md** – np. gdy tabele istnieją bez polityk i trzeba je dodać bez ponownego tworzenia tabel.

## Dokumenty APPLY_*.md w scoutpro/supabase/

| Plik | Opis |
|------|------|
| README_MIGRATIONS.md | Ogólne zasady migracji i lista plików. |
| APPLY_ADMIN_STATS_SURVEY.md | Moduł statystyk i ankiet: tabele `user_sessions`, `user_surveys`, funkcje RPC; sekcja „Błąd 400” przy statystykach. |
| APPLY_PLAYER_DEMANDS.md | Moduł zapotrzebowań na zawodników: tabele `player_demands`, `player_demand_candidates`. |
| APPLY_MULTIMEDIA_MIGRATIONS.md | Tabela `multimedia` i bucket storage. |
| PUSH_FAVORITES_FIX.md | Poprawki dla list ulubionych (jeśli dotyczy). |
| DEPLOY_ANALYTICS.md | Moduł analityki rekrutacji (analytics_settings, RPC). |
| PROD_AUTH_NO_EMAIL_CONFIRM.md | Wyłączenie potwierdzenia e-mail w Supabase Auth (PROD). |

Przed ręcznym stosowaniem sprawdź, czy dana migracja nie jest już uwzględniona w `db push` – zwykle całość powinna iść przez `db push`, a APPLY_*.md służą jako fallback lub instrukcje krok po kroku dla konkretnych modułów.

## Kolejność migracji

Źródło prawdy: **nazwy plików** w `scoutpro/supabase/migrations/`. Kolejność leksykograficzna (np. 20260101000000 przed 20260220100000). Nie zmieniaj kolejności wykonywania; w razie konfliktu dostosuj nową migrację do stanu bazy.

## Regeneracja typów TypeScript (opcjonalnie)

Po zmianie schematu (nowe tabele, kolumny, RPC) można wygenerować typy dla frontendu:

```bash
cd scoutpro
npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
```

(Rzeczywista komenda zależna od wersji Supabase CLI – zob. dokumentację Supabase.)
