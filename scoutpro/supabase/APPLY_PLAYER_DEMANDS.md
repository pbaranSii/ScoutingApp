# Moduł „Zapotrzebowania na zawodników” – tabele w bazie

Jeśli w strukturze bazy danych (np. w Supabase Dashboard → Table Editor) **nie widać tabel** `player_demands` i `player_demand_candidates`, zastosuj migrację ręcznie.

## Sposób 1: SQL w Dashboardzie (najprostszy)

1. Otwórz w edytorze plik:  
   **`supabase/migrations/20260226100000_player_demands.sql`**
2. **Skopiuj całą zawartość** pliku (od pierwszego `--` do końca).
3. W **Supabase Dashboard** → **SQL Editor** → **New query** wklej skopiowany SQL.
4. Kliknij **Run** (lub Ctrl+Enter).
5. Jeśli pojawią się błędy typu „type already exists” lub „policy already exists” – to znaczy, że część migracji już była wykonana; możesz je zignorować albo uruchomić tylko brakujące fragmenty (np. od `create table if not exists public.player_demands`).

Migracja używa `create table if not exists` i `drop policy if exists`, więc **bezpiecznie można uruchomić ją ponownie** – nie usunie istniejących danych.

## Sposób 2: Wymuszenie ponownego uruchomienia przez CLI

Jeśli `supabase db push` raportuje „Remote database is up to date”, ale tabel nadal nie ma, zdalna baza może mieć wpis tej migracji w historii mimo że tabele nie powstały. Możesz usunąć wpis i zrobić push ponownie:

1. W **Supabase Dashboard** → **SQL Editor** uruchom:

```sql
-- Sprawdź nazwę tabeli z historią migracji
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name LIKE '%migration%';
```

2. Zazwyczaj będzie to `supabase_migrations.schema_migrations`. Usuń wpis migracji zapotrzebowań:

```sql
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20260226100000';
```

3. W katalogu projektu (gdzie jest `supabase/`), w terminalu:

```bash
npx supabase db push
```

Po tym zdalna baza powinna wykonać migrację i utworzyć tabele `player_demands` oraz `player_demand_candidates`.

## Weryfikacja

W **SQL Editor** uruchom:

```sql
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_demands') AS has_demands,
       EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'player_demand_candidates') AS has_candidates;
```

Oba pola powinny zwrócić `true`. W **Table Editor** w schemacie **public** powinny być widoczne tabele **player_demands** i **player_demand_candidates**.

## Odświeżenie cache schemy (opcjonalnie)

Po ręcznym uruchomieniu SQL:

- **Project Settings** (ikona zębatki) → **API** → **Reload schema cache**  
  albo w **SQL Editor**:

```sql
NOTIFY pgrst, 'reload schema';
```
