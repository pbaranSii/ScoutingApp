# Opis modułów (features)

Moduły odpowiadają katalogom w `scoutpro/src/features/` oraz trasom w `scoutpro/src/App.tsx`. Poniżej: odpowiedzialność, główne pliki API/hooks oraz trasy.

| Moduł | Odpowiedzialność | Główne pliki / trasy |
|-------|------------------|----------------------|
| **auth** | Logowanie, zaproszenia, reset hasła, ochrona tras (ProtectedRoute, AdminRoute, AnalyticsRoute) | `useAuth`, `ProtectedRoute`, `AdminRoute`, `AnalyticsRoute`; trasy: /login, /reset-password, /accept-invite |
| **observations** | Wizard obserwacji, lista, szczegóły, edycja; oceny kryterialne | api: observations.api; trasy: /observations, /observations/new, /observations/:id, /observations/:id/edit |
| **players** | Profile zawodników, CRUD, kontakty, powiązanie ze słownikami | api: players; trasy: /players, /players/new, /players/:id, /players/:id/edit |
| **pipeline** | Statusy pipeline (Kanban), historia zmian | PipelinePage; trasa: /pipeline |
| **demands** | Zapotrzebowania na zawodników: CRUD, kandydaci, sugestie | api: demands.api, candidates.api; trasy: /demands, /demands/new, /demands/:id, /demands/:id/edit |
| **admin-stats** | Statystyki użytkowników: sesje, logowania, trendy, rozliczenia miesięczne | api: usageStatistics.api, sessions.api; trasy: /settings/admin/usage-statistics (admin) |
| **survey** | Ankieta satysfakcji: can_submit, formularz, submit; wyniki dla admina | api: survey.api, surveyResults.api; trasy: /survey/satisfaction, /survey/thank-you, /settings/admin/user-satisfaction (admin) |
| **analytics** | Metryki rekrutacji, lejek, heatmapa, Sankey, ustawienia analityki | api: recruitmentAnalytics.api, analyticsSettings.api; trasy: /analytics/recruitment-pipeline (AnalyticsRoute), /admin/settings/analytics |
| **favorites** | Listy ulubionych zawodników, członkowie, współpracownicy | api: favorites; trasy: /favorites, /favorites/:id |
| **tasks** | Zadania powiązane z zawodnikami | api: tasks; trasy: /tasks, /tasks/new, /tasks/:id/edit |
| **dictionaries** | Słowniki: regiony, ligi, kategorie, kluby, pozycje, kryteria ocen, dict_* | api: dictionaries.api; trasy: /settings/dictionaries, /settings/dictionaries/:route |
| **multimedia** | Zdjęcia/wideo: tabela multimedia, bucket scoutpro_media | api: multimedia; komponenty: MediaLightbox itd. |
| **users** | Zarządzanie użytkownikami (admin): lista, edycja, rola | api: users; trasa: /settings/users (admin) |
| **dashboard** | KPI, podsumowania, ostatnie obserwacje | DashboardPage; trasa: /dashboard |
| **offline** | Kolejka operacji offline, synchronizacja, cache | hooks: useCacheData, useOfflineQueue; integracja z observations/players |

Uwaga: role **business_role** (scout, coach, director, admin) i **role** (admin, user) – szczegóły w dokumentacji użytkowników i RLS; dostęp do tras admin (np. statystyki, ankiety) wymusza AdminRoute.
