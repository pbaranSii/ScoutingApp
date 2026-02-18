-- Odświeżenie cache schemy PostgREST (np. po dodaniu tabel tasks / task_players).
-- Uruchom w Supabase Dashboard → SQL Editor.
-- Po wykonaniu API (REST) zobaczy nowe tabele – np. /rest/v1/tasks przestanie zwracać 404.

NOTIFY pgrst, 'reload schema';
