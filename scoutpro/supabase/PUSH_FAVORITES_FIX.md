# Naprawa 404 dla favorite_lists

## Przyczyna

Aplikacja łączy się z projektem Supabase **uurhkivwcludnfkswqaa** (z `.env` / `VITE_SUPABASE_URL`).
`supabase db push` było wcześniej wykonane na **innym** zlinkowanym projekcie (digrvtbfonatvytwpbbn), więc tabela `favorite_lists` powstała tam, a nie w projekcie używanym przez aplikację.

## Rozwiązanie

1. Zlinkuj CLI z projektem, z którego korzysta aplikacja:

   ```bash
   cd scoutpro
   npx supabase link --project-ref uurhkivwcludnfkswqaa
   ```

   (Podaj hasło do bazy, jeśli CLI o nie poprosi.)

2. Wypchnij migracje na ten projekt:

   ```bash
   npx supabase db push
   ```

   Zaakceptuj zastosowanie migracji (w tym `20260219100000_favorite_lists.sql`).

3. Odśwież aplikację – zapytania do `favorite_lists` powinny przechodzić (bez 404).

## Weryfikacja

W Supabase Dashboard (projekt uurhkivwcludnfkswqaa) → **Table Editor** sprawdź, czy są tabele: `favorite_lists`, `favorite_list_members`, `favorite_list_collaborators`.
