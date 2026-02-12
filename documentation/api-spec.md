# API

ScoutPro korzysta z Supabase PostgREST (REST API) oraz Edge Functions.

## Base URLs
- REST API: `https://{project}.supabase.co/rest/v1`
- Auth API: `https://{project}.supabase.co/auth/v1`
- Storage API: `https://{project}.supabase.co/storage/v1`
- Edge Functions: `https://{project}.supabase.co/functions/v1`

## Autoryzacja
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
```

## Auth
- POST `/auth/v1/token?grant_type=password` (login)
- POST `/auth/v1/recover` (reset hasla)

## Players
- GET `/rest/v1/players`
- GET `/rest/v1/players?id=eq.{uuid}`
- POST `/rest/v1/players`
- PATCH `/rest/v1/players?id=eq.{uuid}`

## Observations
- GET `/rest/v1/observations`
- POST `/rest/v1/observations`
- PATCH `/rest/v1/observations?id=eq.{uuid}`

## Player evaluations
- POST `/rest/v1/player_evaluations`

## Matches
- GET `/rest/v1/matches`
- POST `/rest/v1/matches`

## Settings (slowniki)
- GET `/rest/v1/regions`
- GET `/rest/v1/leagues`
- GET `/rest/v1/categories`
- GET `/rest/v1/clubs`
- GET `/rest/v1/positions`
- GET `/rest/v1/evaluation_criteria?position_id=eq.{uuid}`
- POST/PATCH/DELETE dla slownikow tylko dla admina (RLS).

## Users (admin)
- GET `/rest/v1/users`
- PATCH `/rest/v1/users?id=eq.{uuid}`

## Edge Functions
- POST `/functions/v1/send-invitation`
- POST `/functions/v1/accept-invitation`

## Storage
Bucket: `player-photos`.

## RLS i uprawnienia
RLS jest wlaczone na wszystkich tabelach publicznych. Uprawnienia sa wymuszane
po stronie bazy (patrz `data-model.md`).
