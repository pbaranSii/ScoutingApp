# Model danych

Źródłem prawdy jest zestaw migracji w `scoutpro/supabase/migrations/` w **kolejności nazw plików** (sortowanie leksykograficzne). Pełna lista tabel i polityk RLS wynika z zastosowania tych migracji. Typy TypeScript dla frontendu: `scoutpro/src/types/database.types.ts` (rekomendacja: generowanie przez `supabase gen types` po zmianie schematu).

## Typy ENUM

- **user_role:** admin, user
- **pipeline_status:** observed, shortlist, trial, offer, signed, rejected; od migracji `20260210140000` także **unassigned**
- **dominant_foot:** left, right, both
- **observation_source:** scouting, referral, application, trainer_report, scout_report
- **match_type:** live, video
- **sync_status:** pending, synced, failed
- **contact_type:** parent, guardian, agent, other

(Słowniki rozszerzane w migracjach: dict_preferred_foot, dict_player_sources, dict_recruitment_decisions, dict_strengths, dict_weaknesses, dict_team_roles itd.)

## Tabele (pełna lista z migracji)

### Schemat init + słowniki podstawowe

| Tabela | Opis |
|--------|------|
| regions | Regiony |
| categories | Kategorie wiekowe |
| leagues | Ligi |
| positions | Pozycje |
| evaluation_criteria | Kryteria ocen (powiązane z positions) |
| clubs | Kluby (region_id) |
| users | Użytkownicy (role, business_role w późniejszych migracjach) |
| players | Zawodnicy (klub, region, pozycje, pipeline_status itd.) |
| matches | Mecze |
| observations | Obserwacje (overall_rating numeric(3,1) po migracji 20260205123000) |
| player_contacts | Kontakty opiekunów / agentów |
| player_evaluations | Oceny kryterialne per obserwacja |
| pipeline_history | Historia zmian statusu pipeline |
| offline_queue | Kolejka operacji offline |
| invitations | Zaproszenia do rejestracji |

### Słowniki rozszerzone (dict_*)

- dict_preferred_foot, dict_player_sources, dict_recruitment_decisions (migracja 20260214100000)
- dict_strengths, dict_weaknesses (20260214130000)
- dict_team_roles (20260215100000)

### Moduły funkcjonalne

| Tabela | Migracja / opis |
|--------|------------------|
| multimedia | 20260210160000 / 20260216100000 – pliki multimedialne, powiązanie z obserwacją/zawodnikiem |
| user_sessions | 20260220100000 – sesje użytkowników (statystyki, rozliczenia) |
| user_surveys | 20260220100000 – odpowiedzi ankiet satysfakcji |
| favorite_lists, favorite_list_members, favorite_list_collaborators | 20260219100000 – listy ulubionych |
| tasks, task_players | 20260217100000 – zadania i powiązania z zawodnikami |
| analytics_settings | 20260218160000 – ustawienia modułu analityki rekrutacji |
| player_demands, player_demand_candidates | 20260226100000 – zapotrzebowania na zawodników i kandydaci |

## Relacje (skrót)

- users 1..N observations (scout_id)
- players 1..N observations
- observations 1..N player_evaluations
- players 1..N player_contacts
- players 1..N pipeline_history
- clubs 1..N players
- regions 1..N clubs
- positions 1..N evaluation_criteria
- player_demands 1..N player_demand_candidates (player_id, demand_id)
- favorite_lists 1..N favorite_list_members (player_id)
- tasks 1..N task_players (player_id)

## RLS

RLS jest włączone na wszystkich tabelach publicznych. Polityki są utrzymywane m.in. w migracji `20260206140000_enable_rls_policies.sql` i wspierane przez helper `public.is_admin()` (migracja `20260204150000_fix_rls_admin_policy.sql`). Kolejne migracje dodają lub modyfikują polityki dla nowych tabel (user_sessions, user_surveys, player_demands, multimedia, favorite_lists, tasks, analytics_settings itd.). Szczegóły – w plikach migracji.
