# Moduł „Statystyki użytkowników i Ankieta satysfakcji”

Jeśli w projekcie Supabase **nie ma tabel** `user_sessions` i `user_surveys` (migracja jest oznaczona jako zastosowana, ale tabele nie powstały), zastosuj migrację **ręcznie** w SQL Editorze.

## Krok 1: Usuń stare polityki (jeśli tabele istnieją bez polityk)

W **Supabase Dashboard** → **SQL Editor** → **New query** uruchom:

```sql
-- Usuń polityki, żeby migracja mogła je utworzyć ponownie (jeśli tabele już istnieją)
drop policy if exists "Users can insert own sessions" on public.user_sessions;
drop policy if exists "Users can update own sessions" on public.user_sessions;
drop policy if exists "Admins can select all sessions" on public.user_sessions;
drop policy if exists "Users can insert own surveys" on public.user_surveys;
drop policy if exists "Admins can select all surveys" on public.user_surveys;
```

Kliknij **Run**. (Możesz dostać błąd „relation user_sessions does not exist” – wtedy ten krok pomiń.)

## Krok 2: Zastosuj pełną migrację

1. Otwórz plik:  
   `supabase/migrations/20260220100000_admin_statistics_and_survey.sql`
2. **Skopiuj całą zawartość** pliku.
3. W **SQL Editor** → **New query** wklej i kliknij **Run** (Ctrl+Enter).
4. Jeśli pojawią się błędy typu „policy already exists”, najpierw uruchom zapytanie z Kroku 1, potem ponownie Krok 2.

## Krok 3: Odśwież cache schemy

- **Project Settings** (ikona zębatki) → **API** → **Reload schema cache**  
  albo w **SQL Editor** uruchom:

```sql
NOTIFY pgrst, 'reload schema';
```

## Weryfikacja

W **SQL Editor** uruchom:

```sql
select exists (select from information_schema.tables where table_schema = 'public' and table_name = 'user_sessions') as has_sessions,
       exists (select from information_schema.tables where table_schema = 'public' and table_name = 'user_surveys') as has_surveys;
```

Oba pola powinny zwrócić `true`.

## Alternatywa: CLI

W katalogu projektu (gdzie jest `supabase/`):

```bash
npx supabase
npm run db:push
```

Jeśli `db push` nadal raportuje „Remote database is up to date”, a tabel brakuje, użyj Kroków 1–2 powyżej.

## Opcjonalnie: wymuszenie ponownego zastosowania migracji przez CLI

Jeśli chcesz, żeby `db push` ponownie uruchomił migrację `20260220100000`, usuń jej wpis z historii na zdalnej bazie:

1. W **SQL Editor** w Supabase uruchom (użyj dokładnie tej tabeli, jeśli istnieje w Twoim projekcie):

```sql
-- Sprawdź, czy tabela historii migracji istnieje i jak się nazywa
select table_schema, table_name
from information_schema.tables
where table_name like '%migration%';
```

2. Jeśli zobaczysz np. `supabase_migrations.schema_migrations` lub `supabase_migrations.migrations`, usuń wpis naszej migracji:

```sql
delete from supabase_migrations.schema_migrations
where version = '20260220100000';
```

(Nazwa tabeli może być inna – dostosuj po wyniku z kroku 1.)

3. W katalogu projektu uruchom ponownie:

```bash
npm run db:push
```

Po tym zdalna baza powinna wykonać migrację `20260220100000` i utworzyć tabele oraz funkcje.

---

## Błąd 400 przy „Statystyki użytkowników” (Overview)

Jeśli w zakładce **Statystyki użytkowników → Overview** w konsoli przeglądarki pojawia się:

`POST …/rpc/admin_usage_overview 400 (Bad Request)`

to na zdalnej bazie **nie została zastosowana migracja korygująca RPC** (`20260224100000`). W oryginalnej migracji funkcje statystyk odwołują się do kolumny `observations.user_id`, której nie ma w schemacie (tabela `observations` ma `scout_id` i `created_by`). Migracja korygująca zamienia te odwołania na `observations.scout_id`.

### Rozwiązanie

1. **Zastosuj migrację korygującą** na zdalnej bazie.

   **Opcja A – CLI (zalecane)**  
   W katalogu projektu (np. `scoutpro/`):

   ```bash
   npx supabase link   # jeśli jeszcze nie połączono z projektem
   npm run db:push
   ```

   Upewnij się, że w folderze `supabase/migrations/` jest plik  
   `20260224100000_fix_admin_stats_observations_scout_id.sql`.  
   `db:push` zastosuje wszystkie migracje, które jeszcze nie są na zdalnej bazie.

   **Opcja B – Ręcznie w Supabase**  
   1. Otwórz plik  
      `supabase/migrations/20260224100000_fix_admin_stats_observations_scout_id.sql`  
   2. Skopiuj **całą** zawartość.  
   3. W Supabase Dashboard → **SQL Editor** → New query wklej i uruchom (**Run**).  
   4. Opcjonalnie: **Project Settings** → **API** → **Reload schema cache**.

2. Odśwież stronę Statystyk użytkowników – Overview powinien się załadować bez błędu 400, a dane z obserwacji i rejestracji zawodników powinny być widoczne.
