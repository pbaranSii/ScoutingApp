# Wdrożenie migracji multimediów (naprawa 404)

Jeśli endpoint `rest/v1/multimedia` zwraca **404**, na zdalnym projekcie Supabase (wskazanym przez `VITE_SUPABASE_URL`) nie zostały uruchomione migracje tabeli `multimedia` i bucketu storage.

## Sposób 1: Supabase CLI (zalecane)

W katalogu `scoutpro`:

```bash
npx supabase link --project-ref <TWÓJ_PROJECT_REF>
npx supabase db push
```

`<TWÓJ_PROJECT_REF>` to identyfikator projektu z URL Supabase (np. z `https://xxxxx.supabase.co` → `xxxxx`).

## Sposób 2: SQL Editor w Supabase Dashboard

1. Otwórz [Supabase Dashboard](https://supabase.com/dashboard) → wybierz projekt.
2. **SQL Editor** → New query.
3. Skopiuj i uruchom w kolejności:
   - zawartość pliku `migrations/20260210160000_add_multimedia_table_and_storage.sql`
   - zawartość pliku `migrations/20260210160001_storage_bucket_scoutpro_media.sql`

Po wdrożeniu sprawdź: w Table Editor powinna być tabela `public.multimedia`, w Storage — bucket `scoutpro-media`.
