# Model danych

Zrodlem prawdy jest schemat w `scoutpro/supabase/migrations/20260101000000_init_schema.sql`
oraz kolejne migracje.

## Typy ENUM
- user_role: admin, user
- pipeline_status: observed, shortlist, trial, offer, signed, rejected
- dominant_foot: left, right, both
- observation_source: scouting, referral, application, trainer_report, scout_report
- match_type: live, video
- sync_status: pending, synced, failed
- contact_type: parent, guardian, agent, other

## Kluczowe tabele (skrot)
### users
Uzytkownicy systemu (scout, admin).

### players
Profil zawodnika (dane osobowe, klub, region, pozycje, status pipeline).

### observations
Obserwacje zawodnikow. Pole `overall_rating` jest numeric(3,1) po migracji
`20260205123000_update_observation_rating_decimal.sql`.

### matches
Mecze (opcjonalne powiazanie z obserwacjami).

### player_contacts
Kontakty opiekunow / agentow.

### player_evaluations
Oceny kryterialne per pozycja (powiazane z evaluation_criteria).

### pipeline_history
Historia zmian statusu zawodnika (wypelniana rowniez migracja backfill).

### offline_queue
Kolejka operacji offline (sync i retry).

### slowniki
- regions
- categories
- leagues
- positions
- evaluation_criteria
- clubs

## Relacje (skrot)
- users 1..N observations (scout_id)
- players 1..N observations
- observations 1..N player_evaluations
- players 1..N player_contacts
- players 1..N pipeline_history
- clubs 1..N players
- regions 1..N clubs
- positions 1..N evaluation_criteria

## RLS
RLS jest wlaczone na wszystkich tabelach publicznych. Polityki sa
utrzymywane w migracji `20260206140000_enable_rls_policies.sql` i wspierane
przez helper `public.is_admin()` z migracji `20260204150000_fix_rls_admin_policy.sql`.
