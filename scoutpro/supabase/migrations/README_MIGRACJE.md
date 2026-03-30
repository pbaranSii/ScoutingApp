# Migracje bazy danych

## Aby uniknąć błędów związanych z listami ulubionych (favorite_lists)

Upewnij się, że na bazie wykonana jest migracja dodająca kolumnę `slot_assignments` do tabeli `favorite_lists`:

- **Plik:** `20260228000000_favorite_lists_slot_assignments.sql`

### Wykonanie migracji

Z katalogu projektu (scoutpro):

```bash
npx supabase db push
```

lub, jeśli używasz lokalnego Supabase:

```bash
supabase db push
```

W razie gdyby migracja nie była wcześniej zastosowana, powyższa komenda wykona wszystkie oczekujące migracje, w tym dodanie kolumny `slot_assignments` (JSONB, domyślnie `{}`).
