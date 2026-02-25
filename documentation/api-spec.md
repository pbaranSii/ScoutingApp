# API

ScoutPro korzysta z Supabase PostgREST (REST API), funkcji RPC, Edge Functions oraz Storage. Pełny opis kontraktów (REST, RPC z parametrami, Edge, Storage) znajduje się w **[06-api-contracts.md](06-api-contracts.md)**.

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
- POST `/auth/v1/recover` (reset hasła)

## REST (skrót)
- Players, observations, player_evaluations, matches – standardowe CRUD.
- Settings (słowniki): regions, leagues, categories, clubs, positions, evaluation_criteria – GET dla wszystkich; POST/PATCH/DELETE tylko dla admina (RLS).
- Users (admin): GET, PATCH.
- player_demands, player_demand_candidates, multimedia, favorite_lists, tasks – patrz 06-api-contracts.md.

## RPC (skrót)
Używane m.in.: user_session_start / user_session_end, admin_usage_* (overview, users, user_detail, login_history, trends, monthly_breakdown), survey_can_submit / survey_submit, admin_survey_results / admin_survey_responses, analytics_settings_get / analytics_settings_upsert, analytics_pipeline_metrics, analytics_player_list, analytics_trends, analytics_comparisons, analytics_heatmap, analytics_sankey. Parametry i zwroty: **[06-api-contracts.md](06-api-contracts.md)**.

## Edge Functions
- POST `/functions/v1/send-invitation`
- POST `/functions/v1/accept-invitation`

## Storage
Bucket: `scoutpro_media` (multimedia powiązane z zawodnikami/obserwacjami).

## RLS i uprawnienia
RLS jest włączone na wszystkich tabelach publicznych. Uprawnienia są wymuszane po stronie bazy (patrz `data-model.md`).
