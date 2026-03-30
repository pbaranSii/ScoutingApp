## Historia zmian

### 2026-02-26

- Moduł zapotrzebowań na zawodników: tabele `player_demands`, `player_demand_candidates`; trasy /demands, /demands/new, /demands/:id, /demands/:id/edit.

### 2026-02-25

- Rozliczenia miesięczne (admin): RPC `admin_usage_monthly_breakdown`; zakładka Rozliczenia w statystykach użytkowników.

### 2026-02-24

- Poprawki statystyk admina: migracja `fix_admin_stats_observations_scout_id` (poprawne powiązanie obserwacji z scout_id).

### 2026-02-20

- Moduł statystyk użytkowników i ankiet: tabele `user_sessions`, `user_surveys`; RPC sesji (user_session_start, user_session_end), RPC statystyk (admin_usage_overview, admin_usage_users, admin_usage_user_detail, admin_usage_login_history, admin_usage_trends), RPC ankiet (survey_can_submit, survey_submit, admin_survey_results, admin_survey_responses). Trasy: /settings/admin/usage-statistics, /settings/admin/user-satisfaction, /survey/satisfaction, /survey/thank-you.

### 2026-02-19

- Listy ulubionych: tabele `favorite_lists`, `favorite_list_members`, `favorite_list_collaborators`; trasy /favorites, /favorites/:id.

### 2026-02-18

- Moduł analityki rekrutacji: tabele `analytics_settings`, RPC (analytics_pipeline_metrics, analytics_player_list, analytics_trends, analytics_comparisons, analytics_heatmap, analytics_sankey, analytics_settings_get/upsert); trasa /analytics/recruitment-pipeline, strona ustawień analityki. Migracje: recruitment_analytics_module, entered_pipeline_from_tasks, recruitment_analytics_rpc, recruitment_analytics_heatmap_sankey. Seed klubów, regionów, miast (20260218170000).

### 2026-02-17

- Moduł zadań (tasks): tabele `tasks`, `task_players`; trasy /tasks, /tasks/new, /tasks/:id/edit.

### 2026-02-14 – 2026-02-16

- Słowniki rozszerzone: dict_preferred_foot, dict_player_sources, dict_recruitment_decisions, dict_strengths, dict_weaknesses, dict_team_roles; seed słowników i pozycji. Tabela `multimedia`, bucket storage `scoutpro_media`; ulepszenia formularza obserwacji i pozycji.

### 2026-02-10 – 2026-02-13

- Status pipeline „Nieprzypisany” (unassigned); użytkownicy admin see all; migracje multimedia i storage.

### 2026-02-09

- Dodano role biznesowe użytkowników oraz zarządzanie użytkownikami przez administratora.
- Dodano możliwość zmiany hasła w ustawieniach aplikacji.
- Ujednolicenie terminologii i polskich znaków w dokumentacji; nawigacja ustawień (słowniki, użytkownicy, statystyki, ankiety).
- Testy Vitest: sessions.api.test.ts, usageStatistics.api.test.ts (moduł admin-stats).
