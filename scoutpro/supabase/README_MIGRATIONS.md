# Migracje Supabase – jak zastosować

## Moduł „Zadania i zaproszenia” (tasks)

Aby włączyć moduł zadań/zaproszeń/obserwacji planowanych:

1. Wejdź na [supabase.com](https://supabase.com) → swój projekt.
2. **SQL Editor** → **New query**.
3. Skopiuj **całą zawartość** pliku:
   - `supabase/migrations/20260217100000_tasks_module.sql`
4. Wklej do zapytania i kliknij **Run** (Ctrl+Enter).
5. **Obowiązkowo** odśwież cache schemy (inaczej API zwróci **404** dla `/rest/v1/tasks`):
   - **Project Settings** (ikona zębatki) → **API** → przycisk **Reload schema cache**
   - albo w **SQL Editor** uruchom: `NOTIFY pgrst, 'reload schema';`

Powstają: enum `task_type`, tabele **`tasks`** i **`task_players`** (widoczne w Table Editor) oraz polityki RLS. Jeśli tych tabel nie ma w bazie, moduł „Zadania” nie zadziała – trzeba uruchomić tę migrację w **tym samym** projekcie Supabase, z którego korzysta aplikacja.

### Błąd 404 (Not Found) na /rest/v1/tasks

Jeśli w konsoli przeglądarki widzisz **GET …/rest/v1/tasks 404 (Not Found)**:

- Tabela `tasks` jest w bazie, ale PostgREST używa starej cache schemy.
- **Rozwiązanie:** w Supabase Dashboard → **Project Settings** → **API** → **Reload schema cache** (na dole strony). Alternatywnie w SQL Editor wykonaj: `NOTIFY pgrst, 'reload schema';`
- Po odświeżeniu odśwież stronę aplikacji (F5).

---

## Upewnienie się, że tabela `multimedia` i storage są w projekcie

Jeśli w aplikacji **nie zapisują się pliki ani linki YouTube** z sekcji „6. Multimedia” w formularzu obserwacji, najpierw upewnij się, że w projekcie Supabase są:

- tabela `public.multimedia`
- bucket storage `scoutpro-media` oraz polityki dostępu

### Sposób 1: Supabase Dashboard (bez CLI)

1. Wejdź na [supabase.com](https://supabase.com) i otwórz **swój projekt**.
2. W menu po lewej wybierz **SQL Editor**.
3. Kliknij **New query**.
4. Otwórz plik migracji:
   - `supabase/migrations/20260216100000_ensure_multimedia_table_and_storage.sql`
5. **Skopiuj całą zawartość** tego pliku i wklej do zapytania w SQL Editor.
6. Kliknij **Run** (lub Ctrl+Enter).
7. Jeśli nie ma błędów (np. „relation already exists”), migracja jest zastosowana.
8. Opcjonalnie: **Project Settings** (ikona zębatki) → **API** → **Reload schema cache**.

### Sposób 2: Supabase CLI

W katalogu projektu (gdzie jest `supabase/`):

```bash
supabase db push
```

To uruchomi wszystkie migracje, które jeszcze nie były zastosowane (w tym `20260216100000_ensure_multimedia_table_and_storage.sql`).

---

## Sprawdzenie, czy tabela i storage istnieją

W **SQL Editor** w Supabase uruchom:

```sql
-- Czy tabela multimedia istnieje?
select exists (
  select from information_schema.tables
  where table_schema = 'public' and table_name = 'multimedia'
);

-- Czy bucket scoutpro-media istnieje?
select id from storage.buckets where id = 'scoutpro-media';
```

- Pierwsze zapytanie powinno zwrócić `true`.
- Drugie powinno zwrócić jeden wiersz z `id = 'scoutpro-media'`.

Jeśli czegoś brakuje, uruchom migrację `20260216100000_ensure_multimedia_table_and_storage.sql` jak wyżej.

---

## Produkcja (Vercel + Supabase)

- **Aplikacja:** Po pushu na branch `master` Vercel automatycznie buduje i wdraża produkcję. Użytkownicy z dostępem pozostają ci, którzy są zdefiniowani w projekcie produkcyjnym (Supabase Auth / ustawienia Vercel – nie zmieniamy ich przy deployu).
- **Baza produkcyjna:** W **produkcyjnym** projekcie Supabase uruchom te same migracje co w dev (np. w SQL Editor skopiuj i wykonaj pliki z `supabase/migrations/` w kolejności dat, w szczególności `20260216100000_ensure_multimedia_table_and_storage.sql` oraz `20260215100000_observation_form_improvements.sql` jeśli tabela `observations` ma mieć nowe kolumny). Po wykonaniu: **Project Settings → API → Reload schema cache**.

---

## Moduł „Metryki i Lejka Rekrutacji” (Recruitment Analytics)

Checklist wdrożenia migracji analityki (lokalnie i na prod), kolejność plików oraz rollback: **[DEPLOY_ANALYTICS.md](DEPLOY_ANALYTICS.md)**.

Migracje do uruchomienia w kolejności: `20260218160000_recruitment_analytics_module.sql`, `20260218160001_...`, `20260218160100_...`, `20260218160110_...`. Po wdrożeniu obowiązkowo: **Reload schema cache** (Project Settings → API lub `NOTIFY pgrst, 'reload schema';`).
