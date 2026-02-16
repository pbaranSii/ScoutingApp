# Migracje Supabase – jak zastosować

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
