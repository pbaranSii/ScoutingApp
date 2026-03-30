# Checklist wdrożenia: Moduł Metryk i Lejka Rekrutacji

Migracje tego modułu rozszerzają tabele `pipeline_history`, `observations`, `players`, dodają tabelę `analytics_settings` oraz funkcje RPC do agregacji. Poniżej bezpieczny sposób wdrożenia lokalnie i na produkcji.

---

## 1. Przed wdrożeniem

- [ ] **Backup bazy** (produkcja): W Supabase Dashboard → **Database** → **Backups** upewnij się, że masz ostatni backup. Na prod przed pierwszą migracją warto zrobić punkt przywracania.
- [ ] **Kolejność migracji**: Wszystkie pliki muszą być uruchomione **w kolejności nazw** (timestamp w nazwie). Zależności:
  - `20260218160000` – rozszerzenia tabel, `analytics_settings`, indeksy
  - `20260218160001` – backfill `entered_pipeline_at` z zadań obserwacyjnych (wymaga `tasks`, `task_players`)
  - `20260218160100` – funkcje RPC (wymagają `analytics_settings`, `current_business_role`, `is_admin`)
  - `20260218160110` – RPC heatmap i sankey
- [ ] **Zależności**: Migracje analityki zakładają, że są już zastosowane: `user_business_role` (20260209110000), `pipeline_history`, `tasks`/`task_players` (jeśli używasz zadań obserwacyjnych). Jeśli brakuje wcześniejszych migracji, najpierw je zastosuj.

---

## 2. Wdrożenie lokalne (Supabase local)

```bash
cd scoutpro
supabase start
supabase db reset
# albo tylko nowe migracje:
supabase migration up
```

Jeśli nie używasz CLI i masz lokalną bazę ręcznie:

1. W kolejności wykonaj w SQL Editor (np. psql lub GUI) zawartość plików:
   - `20260218160000_recruitment_analytics_module.sql`
   - `20260218160001_recruitment_analytics_entered_pipeline_from_tasks.sql`
   - `20260218160100_recruitment_analytics_rpc.sql`
   - `20260218160110_recruitment_analytics_heatmap_sankey.sql`
2. Po każdej migracji sprawdź, że nie ma błędów (np. „column already exists” przy ponownym uruchomieniu można zignorować przy `add column if not exists`).

---

## 3. Wdrożenie na produkcję (Supabase hosted)

### Opcja A: Supabase CLI (zalecane)

```bash
cd scoutpro
supabase link --project-ref <PROJECT_REF>
supabase db push
```

To zastosuje tylko migracje, których jeszcze nie ma w historii na zdalnej bazie.

### Opcja B: Ręcznie przez SQL Editor

1. Wejdź na [supabase.com](https://supabase.com) → **projekt produkcyjny**.
2. **SQL Editor** → **New query**.
3. Skopiuj **całą zawartość** pierwszego pliku migracji (`20260218160000_recruitment_analytics_module.sql`), wklej, **Run**.
4. Sprawdź wynik (Success). W razie błędu (np. brakująca tabela `tasks`) najpierw zastosuj brakujące migracje.
5. Powtórz dla kolejnych plików w kolejności:
   - `20260218160001_recruitment_analytics_entered_pipeline_from_tasks.sql`
   - `20260218160100_recruitment_analytics_rpc.sql`
   - `20260218160110_recruitment_analytics_heatmap_sankey.sql`
6. **Obowiązkowo** odśwież cache schemy PostgREST:
   - **Project Settings** (ikona zębatki) → **API** → **Reload schema cache**
   - albo w SQL Editor: `NOTIFY pgrst, 'reload schema';`

---

## 4. Po wdrożeniu

- [ ] **Reload schema cache** (patrz wyżej) – inaczej RPC mogą zwracać 404 lub stare sygnatury.
- [ ] **Weryfikacja**: W aplikacji wejdź na `/analytics/recruitment-pipeline`. Sprawdź, że:
  - ładują się KPI i lejek (RPC `analytics_pipeline_metrics`),
  - lista kandydatów w drill-down działa (`analytics_player_list`),
  - admin ma dostęp do `/admin/settings/analytics` (odczyt/zapis `analytics_settings`).
- [ ] **Role**: Użytkownicy z rolą `scout`, `coach`, `director`, `admin` (bez `suspended`) widzą menu Analytics; dane są filtrowane po stronie RPC według `business_role`. Upewnij się, że w tabeli `users` kolumna `business_role` jest poprawnie ustawiona.

---

## 5. Rollback (awaryjnie)

Nie ma jednej migracji „cofającej” ten moduł. W razie potrzeby cofnięcia:

1. **Nie usuwać** danych z `players`/`observations`/`pipeline_history` – nowe kolumny można zostawić (nullable lub z wartościami).
2. Usunięcie **funkcji RPC** usunie dostęp z aplikacji do analityki, ale nie przywróci stanu sprzed migracji. Przykład usunięcia (tylko jeśli naprawdę potrzebne):

```sql
drop function if exists public.analytics_sankey(date, date, jsonb);
drop function if exists public.analytics_heatmap(date, date, jsonb);
drop function if exists public.analytics_player_list(text, date, date, jsonb, int, int);
drop function if exists public.analytics_comparisons(text, date, date, jsonb);
drop function if exists public.analytics_trends(date, date, text, jsonb);
drop function if exists public.analytics_pipeline_metrics(date, date, jsonb);
drop function if exists public.analytics_settings_upsert(jsonb);
drop function if exists public.analytics_settings_get();
drop function if exists public.current_business_role();
```

Tabelę `analytics_settings` można zostawić lub usunąć (`drop table if exists public.analytics_settings;`) po usunięciu funkcji, które z niej korzystają.

---

## 6. Mapowanie ról a dostęp do Analytics

| Rola w systemie (`users.business_role`) | Dostęp do menu Analytics | Zakres danych (RPC) |
|----------------------------------------|---------------------------|----------------------|
| `scout`                                | Tak                       | Własne obserwacje i przypisani zawodnicy |
| `coach`                                | Tak                       | Region (gdy zaimplementowane przypisanie regionu do użytkownika) |
| `director`                             | Tak                       | Wszystkie dane |
| `admin`                                | Tak                       | Wszystkie dane + ustawienia analityki (`/admin/settings/analytics`) |
| `suspended`                            | Nie                       | Brak dostępu |

Filtrowanie danych realizują funkcje RPC (np. `analytics_pipeline_metrics`) na podstawie `auth.uid()` i `current_business_role()`; frontend tylko pokazuje/ukrywa menu według tej samej listy ról.
