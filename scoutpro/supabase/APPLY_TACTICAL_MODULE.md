# Zastosowanie migracji modułu ustawień taktycznych

Jeśli tabel `position_dictionary`, `formations`, `tactical_slots`, `player_position_mapping` **nie ma** w Twojej bazie (np. patrzysz na inny projekt niż ten, na który wykonałeś `supabase db push`), zastosuj migracje **ręcznie** w Supabase Dashboard.

## Krok 1: Otwórz SQL Editor

1. Wejdź na [supabase.com](https://supabase.com) i otwórz **swój projekt** (ten, z którego korzysta aplikacja ScoutPro).
2. W menu po lewej wybierz **SQL Editor**.
3. Kliknij **New query**.

## Krok 2: Wykonaj pierwszą migrację (tabele + RLS + RPC + seed pozycji)

1. Otwórz plik:
   ```
   scoutpro/supabase/migrations/20260227000000_tactical_module.sql
   ```
2. **Skopiuj całą zawartość** pliku i wklej do zapytania w SQL Editor.
3. Kliknij **Run** (lub Ctrl+Enter).
4. Sprawdź, czy nie ma błędów. Powinny powstać:
   - tabela `public.position_dictionary`
   - tabela `public.formations`
   - tabela `public.tactical_slots`
   - tabela `public.player_position_mapping`
   - polityki RLS
   - funkcja `public.formation_set_default`
   - 14 wierszy w `position_dictionary` (słownik pozycji)

## Krok 3: Wykonaj drugą migrację (seed schematów)

1. Otwórz plik:
   ```
   scoutpro/supabase/migrations/20260227000001_tactical_module_seed.sql
   ```
2. **Skopiuj całą zawartość** i wklej do **nowego** zapytania w SQL Editor.
3. Kliknij **Run**.
4. Powinny powstać wiersze w `formations` i `tactical_slots` (10 wbudowanych schematów: 4-4-2, 4-3-3, 4-2-3-1 itd.).

## Krok 4: Odśwież cache schemy (obowiązkowo)

Po zastosowaniu migracji:

- **Project Settings** (ikona zębatki) → **API** → na dole strony przycisk **Reload schema cache**

albo w SQL Editor uruchom:

```sql
NOTIFY pgrst, 'reload schema';
```

Bez tego PostgREST może zwracać 404 dla nowych tabel.

## Weryfikacja

W SQL Editor uruchom:

```sql
-- Czy tabele modułu taktycznego istnieją?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('position_dictionary', 'formations', 'tactical_slots', 'player_position_mapping')
ORDER BY table_name;
```

Oczekiwany wynik: 4 wiersze (`formations`, `player_position_mapping`, `position_dictionary`, `tactical_slots`).

```sql
-- Liczba pozycji w słowniku (powinno być 14)
SELECT count(*) FROM public.position_dictionary;

-- Liczba schematów systemowych (powinno być 10)
SELECT count(*) FROM public.formations WHERE is_system = true;
```

## Uwagi

- Migracje są idempotentne w części tworzenia tabel (`create table if not exists`), ale **seed w pierwszej migracji** używa `on conflict do nothing` – powtórne uruchomienie nie zduplikuje pozycji.
- **Druga migracja** (seed schematów) **nie** jest idempotentna – przy drugim uruchomieniu wstawi ponownie 10 schematów i setki slotów. Uruchom ją **tylko raz**. Jeśli już uruchomiłeś ją wcześniej i widzisz duplikaty, możesz wyczyścić: `DELETE FROM public.tactical_slots; DELETE FROM public.formations WHERE is_system = true;` i ponownie uruchomić tylko drugi plik (wtedy będzie dokładnie 10 schematów).
