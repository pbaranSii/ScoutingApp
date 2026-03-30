# Kontrakty API (REST, RPC, Edge, Storage)

ScoutPro korzysta z Supabase: PostgREST (REST), funkcje RPC, Edge Functions oraz Storage.

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

---

## REST (PostgREST)

Dostęp do tabel zgodnie z politykami RLS. Skrót najważniejszych zasobów:

| Zasób | Metody | Uwagi |
|-------|--------|--------|
| players | GET, POST, PATCH | Filtrowanie po id, klub, pipeline_status itd. |
| observations | GET, POST, PATCH | scout_id, player_id, observation_date |
| player_evaluations | POST | Powiązane z observation_id |
| matches | GET, POST | match_date, league_id, category_id |
| regions, leagues, categories, clubs, positions | GET; POST/PATCH/DELETE (admin) | Słowniki |
| evaluation_criteria | GET (position_id=eq.{uuid}); mutacje admin | |
| users | GET, PATCH | Admin – lista użytkowników |
| player_demands | GET, POST, PATCH, DELETE | Zapotrzebowania |
| player_demand_candidates | GET, POST, DELETE | Kandydaci do zapotrzebowań |
| multimedia | GET, POST, PATCH, DELETE | Pliki powiązane z obserwacją/zawodnikiem |
| favorite_lists, favorite_list_members, favorite_list_collaborators | GET, POST, PATCH, DELETE | Listy ulubionych |
| tasks, task_players | GET, POST, PATCH, DELETE | Zadania |

---

## RPC (funkcje PostgreSQL)

### Sesje użytkownika

| Funkcja | Parametry | Zwraca | Uprawnienia |
|---------|-----------|--------|-------------|
| user_session_start | p_device_type, p_browser, p_ip_address, p_user_agent | uuid (session_id) | Zalogowany użytkownik |
| user_session_end | p_session_id (uuid) | — | Zalogowany użytkownik |

### Statystyki użytkowników (admin)

| Funkcja | Parametry | Zwraca | Uprawnienia |
|---------|-----------|--------|-------------|
| admin_usage_overview | p_month (text, opcjonalnie) | Obiekt: m.in. liczba użytkowników, sesji, logowań | Admin |
| admin_usage_users | p_status, p_role, p_sort_by, p_page, p_per_page | Lista użytkowników + total | Admin |
| admin_usage_user_detail | p_user_id | Szczegóły użytkownika (statystyki) | Admin |
| admin_usage_login_history | p_user_id, p_date_from, p_date_to, p_device_type, p_page, p_per_page | Historia logowań | Admin |
| admin_usage_trends | p_date_from, p_date_to, p_granularity | Serie czasowe (trends) | Admin |
| admin_usage_monthly_breakdown | p_date_from, p_date_to | Rozliczenia miesięczne (obserwacje/zawodnicy) | Admin |

### Ankieta satysfakcji

| Funkcja | Parametry | Zwraca | Uprawnienia |
|---------|-----------|--------|-------------|
| survey_can_submit | — | { can_submit, last_submitted_at, days_until_next } | Zalogowany |
| survey_submit | p_csat_rating, p_ces_rating, p_nps_score, p_best_feature, p_feedback_text | { survey_id, submitted_at } | Zalogowany |
| admin_survey_results | (parametry wg implementacji) | Agregowane wyniki ankiet | Admin |
| admin_survey_responses | (parametry wg implementacji) | Lista odpowiedzi | Admin |

### Analityka rekrutacji

| Funkcja | Parametry | Zwraca | Uprawnienia |
|---------|-----------|--------|-------------|
| analytics_settings_get | — | Obiekt ustawień (klucz–wartość) | Uprawniony (np. admin) |
| analytics_settings_upsert | p_settings (jsonb/obiekt) | — | Uprawniony |
| analytics_pipeline_metrics | p_date_from, p_date_to, p_filters (scout_ids, club_ids, region_ids, birth_years, positions, sources, ranks) | PipelineMetricsResponse | Uprawniony |
| analytics_player_list | p_status, p_date_from, p_date_to, p_filters, p_page, p_limit | PlayerListResponse | Uprawniony |
| analytics_trends | p_date_from, p_date_to, p_granularity, p_filters | TrendsResponse | Uprawniony |
| analytics_comparisons | p_type (scouts/regions/positions/sources/ages), p_date_from, p_date_to, p_filters | Tablica { id, label, first_contact, signed, success_rate } | Uprawniony |
| analytics_heatmap | p_date_from, p_date_to, p_filters | HeatmapRow[] | Uprawniony |
| analytics_sankey | p_date_from, p_date_to, p_filters | SankeyResponse | Uprawniony |

---

## Edge Functions

- **POST** `/functions/v1/send-invitation` – wysłanie zaproszenia (e-mail).
- **POST** `/functions/v1/accept-invitation` – obsługa akceptacji zaproszenia.

---

## Storage

- **Bucket:** `scoutpro_media` (używany w aplikacji; w starszej dokumentacji występował „player-photos” – aktualna nazwa to `scoutpro_media`).
- Polityki: select, insert, delete – zgodnie z migracjami (np. `20260210160001_storage_bucket_scoutpro_media.sql`, `20260216100000_ensure_multimedia_table_and_storage.sql`).
- Użycie: upload/odczyt plików multimedialnych powiązanych z zawodnikami/obserwacjami (moduł multimedia).

---

## Auth

- **POST** `/auth/v1/token?grant_type=password` – logowanie.
- **POST** `/auth/v1/recover` – reset hasła.

---

Zob. też: [api-spec.md](api-spec.md) (skrót), [data-model.md](data-model.md), [CHANGE-MANAGEMENT.md](CHANGE-MANAGEMENT.md).
