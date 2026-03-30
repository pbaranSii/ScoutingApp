# Zawodnik i obserwacje - wymagania i widoki

Dokument opisuje wymagania i widoki dla **zawodnika** oraz **obserwacji** w aktualnej wersji ScoutApp: rejestrację informacji, powiązania danych i strukturę używaną w aplikacji. Przeznaczony jest do zapoznania biznesu oraz jako punkt odniesienia przy implementacji i rozwoju funkcjonalności.

**Źródło prawdy:** model z migracji Supabase, typy w `scoutpro/src/types/database.types.ts`, formularze w `PlayerForm`, `ObservationWizard`, `EditObservationPage`.

---

## 1. Zawodnik (Player)

### 1.1 Widoki i trasy

| Widok | Trasa | Opis |
|-------|-------|------|
| Lista zawodników | `/players` | Lista z filtrami, wyszukiwanie |
| Nowy zawodnik | `/players/new` | Formularz rejestracji zawodnika |
| Szczegóły zawodnika | `/players/:id` | Profil 360: dane, obserwacje, pipeline, kontakty, media, listy ulubionych, zapotrzebowania |
| Edycja zawodnika | `/players/:id/edit` | Edycja danych i kontaktów |

### 1.2 Rejestracja danych - tabela `players`

**Pola w bazie (aktualny stan):**

| Pole | Typ | Wymagane w formularzu | Opis |
|------|-----|------------------------|------|
| id | uuid | — | Klucz główny (auto) |
| first_name | string | Tak | Imię |
| last_name | string | Tak | Nazwisko |
| birth_year | number | Tak | Rok urodzenia (2000-2030 w PlayerForm) |
| club_id | uuid | Nie | Klub (słownik clubs) |
| region_id | uuid | Nie | Region (słownik regions) |
| primary_position | string | Nie | Pozycja główna (słownik pozycji) |
| secondary_positions | string[] | Nie | Pozycje dodatkowe |
| dominant_foot | enum | Nie | left / right / both |
| height_cm | number | Nie | Wzrost [cm] |
| weight_kg | number | Nie | Masa [kg] |
| nationality | string | Nie | Narodowość |
| guardian_name | string | Nie | Imię i nazwisko opiekuna |
| guardian_phone | string | Nie | Telefon opiekuna |
| guardian_email | string | Nie | E-mail opiekuna |
| photo_urls | string[] | Nie | Adresy zdjęć |
| video_urls | string[] | Nie | Adresy wideo |
| pipeline_status | enum | Tak (domyślnie) | Status w pipeline (np. unassigned) |
| decision_status | string | Nie | Status decyzji rekrutacyjnej |
| decision_notes | string | Nie | Notatki do decyzji |
| birth_date | string | Nie | Pełna data urodzenia (opcjonalnie) |
| created_at, updated_at | timestamp | — | Audyt |

Formularz rejestracji: **PlayerForm** (`scoutpro/src/features/players/components/PlayerForm.tsx`) - schema walidacji (playerSchema) definiuje wymagania i mapowanie na powyższe pola (m.in. club_name → club_id przez ClubSelect).

### 1.3 Powiązania zawodnika

- **player_contacts** (1:N) - kontakty opiekunów/agentów (contact_type: parent, guardian, agent, other); pola: contact_name, phone, email, is_primary, notes.
- **observations** (1:N) - wszystkie obserwacje zawodnika.
- **pipeline_history** (1:N) - historia zmian statusu pipeline.
- **favorite_list_members** - członkostwo w listach ulubionych.
- **player_demand_candidates** - przypisania do zapotrzebowań na zawodników.
- **task_players** - powiązania z zadaniami.
- **multimedia** - pliki powiązane z zawodnikiem/obserwacją.

Słowniki: **clubs**, **regions**, **positions** / słownik pozycji taktycznych (moduł tactical).

---

## 2. Obserwacja (Observation)

### 2.1 Widoki i trasy

| Widok | Trasa | Opis |
|-------|-------|------|
| Lista obserwacji | `/observations` | Lista z filtrami |
| Nowa obserwacja | `/observations/new` | Kreator (wizard) - wybór/dodanie zawodnika + dane obserwacji |
| Szczegóły obserwacji | `/observations/:id` | Podgląd obserwacji |
| Edycja obserwacji | `/observations/:id/edit` | Edycja obserwacji (i ewentualna aktualizacja zawodnika) |

### 2.2 Scenariusze wejścia do formularza obserwacji

1. **Z listy obserwacji** (`/observations/new`) - bez kontekstu zawodnika: wyszukanie istniejącego zawodnika lub utworzenie nowego w kreatorze.
2. **Z profilu zawodnika** (`/observations/new?player_id=...`) - zawodnik ustawiony (prefill), pola zawodnika zablokowane lub zminimalizowane; uzupełniane są tylko dane obserwacji.

Szczegóły scenariuszy i różnic: [Materials/observation-form-analysis.md](../Materials/observation-form-analysis.md).

### 2.3 Rejestracja danych - tabela `observations`

**Pola w bazie (aktualny stan):**

| Grupa | Pola | Opis |
|-------|------|------|
| Identyfikacja | id, player_id, scout_id | Zawodnik, scout (user) |
| Kontekst | observation_date, competition, match_result, location, match_id | Data, zawody, wynik, miejsce, opcjonalnie mecz |
| Źródło | source | observation_source: scouting, referral, application, trainer_report, scout_report |
| Oceny | overall_rating (1-10), technical_rating, speed_rating, motor_rating, tactical_rating, mental_rating (1-5), potential_now, potential_future (1-5) | Ocena ogólna i składowe |
| Klasyfikacja | rank, team_role | Ranga, rola w zespole (słowniki) |
| Treść | strengths, strengths_notes, weaknesses, weaknesses_notes, notes, recommendations | Mocne/słabe strony, notatki, rekomendacje |
| Pozycje | positions | Pozycje w tej obserwacji (tablica) |
| Media | photo_url | Zdjęcie (legacy); multimedia przez tabelę multimedia |
| Audyt | created_by, created_by_name, created_by_role, updated_at, updated_by, updated_by_name, updated_by_role | Kto i kiedy |
| Techniczne | status, is_offline_created, synced_at | Status rekordu, offline, synchronizacja |

Formularz: **ObservationWizard** (`scoutpro/src/features/observations/components/ObservationWizard.tsx`) - wizardSchema definiuje pola (m.in. first_name, last_name, age → zawodnik; match_date, overall_rating, rank, potential_now, potential_future, source itd.).

### 2.4 Oceny kryterialne - tabela `player_evaluations`

Dla każdej obserwacji można zapisać oceny per kryterium pozycji:

| Pole | Opis |
|------|------|
| observation_id | Powiązanie z obserwacją |
| criteria_id | Kryterium z evaluation_criteria (zależne od pozycji) |
| score | Ocena (liczba) |
| created_at | Audyt |

Kryteria są ładowane według wybranej pozycji (fetchEvaluationCriteriaByPositionCode / evaluation_criteria).

### 2.5 Powiązania obserwacji

- **players** (N:1) - jedna obserwacja zawsze do jednego zawodnika.
- **users** (scout_id) - scout wykonujący obserwację.
- **matches** (match_id, opcjonalnie) - powiązanie z meczem.
- **player_evaluations** (1:N) - oceny kryteriów; kryteria z **evaluation_criteria** (po position_id).
- **multimedia** - pliki powiązane z obserwacją.

---

## 3. Połączenie danych i przepływ

### 3.1 Relacja zawodnik - obserwacje

- **Zawodnik 1 : N Obserwacje.** Jedna obserwacja zawsze należy do jednego zawodnika.
- Na profilu zawodnika wyświetlana jest lista obserwacji; z poziomu profilu można dodać nową obserwację (prefill zawodnika).

### 3.2 Tworzenie obserwacji

- **Wybór istniejącego zawodnika:** wyszukiwanie w kreatorze (PlayerSearchDialog); ewentualna deduplikacja (checkDuplicatePlayers) przed utworzeniem nowego.
- **Utworzenie nowego zawodnika:** w kreatorze - imię, nazwisko, wiek (birth_year), klub, pozycja; po zapisie obserwacji zawodnik jest tworzony lub aktualizowany (shouldUpdatePlayer).
- **Wejście z profilu zawodnika:** tylko uzupełnienie danych obserwacji; dane zawodnika mogą być ewentualnie uaktualnione (pozycja, pipeline_status).

### 3.3 Różnice: tworzenie vs edycja obserwacji

| Aspekt | Tworzenie (wizard) | Edycja |
|--------|---------------------|--------|
| rank | Wymagane | Opcjonalne |
| potential_now, potential_future | Wymagane | Opcjonalne |
| pipeline_status | Nie w formularzu (domyślny status zawodnika) | W formularzu - można zmienić |

Ryzyko: przy edycji pola rank/potential mogą zostać wyzerowane (NULL). Zalecenie: ujednolicenie wymagań i wspólny model formularza (szczegóły w [observation-forms.md](observation-forms.md), [observation-form-analysis.md](../Materials/observation-form-analysis.md)).

### 3.4 Tryb offline

- Obserwacja (i ewentualnie nowy zawodnik) zapisywane są do kolejki offline (offline_queue).
- Przy tworzeniu zawodnika offline zapisywany jest ograniczony zestaw pól (imię, nazwisko, rocznik, pozycja); club_id i pipeline_status mogą być uzupełniane dopiero po synchronizacji.

---

## 4. Słowniki i enumy (skrót)

- **observation_source:** scouting, referral, application, trainer_report, scout_report  
- **pipeline_status:** unassigned, observed, shortlist, trial, offer, signed, rejected  
- **dominant_foot:** left, right, both  
- **contact_type:** parent, guardian, agent, other  

Słowniki **dict_***: dict_strengths, dict_weaknesses, dict_team_roles, dict_player_sources, dict_recruitment_decisions, dict_preferred_foot itd. - zarządzane w ustawieniach (słowniki); pełna lista w [data-model.md](data-model.md).

---

## 5. Odniesienia

| Dokument | Zawartość |
|----------|-----------|
| [data-model.md](data-model.md) | Model danych, tabele, relacje, RLS |
| [observation-forms.md](observation-forms.md) | Scenariusze i grupy danych formularza obserwacji |
| [functional-requirements.md](functional-requirements.md) | Epiki E02 (Obserwacje), E03 (Profile zawodników 360) |
| [07-business-flows.md](07-business-flows.md) | Przepływ tworzenia i edycji obserwacji |
| [04-modules.md](04-modules.md) | Moduły (players, observations), trasy |
| [06-api-contracts.md](06-api-contracts.md) | REST, RPC - players, observations, player_evaluations |

Rozszerzona wizja formularza obserwacji (scenariusze, user flow, struktura): patrz `Materials/Formularz Ogólnej Obserwacji Zawodnika/Formularz Ogólnej Obserwacji.md` - dokument referencyjny; aktualna implementacja jest opisana powyżej.

---

## 6. Rozwój (krótko)

- **Deduplikacja zawodników:** sprawdzanie (first_name + last_name + birth_year [+ club_id]) przed utworzeniem; obecnie częściowo (DuplicateWarningDialog).
- **Ujednolicenie formularza obserwacji:** wspólny model i te same wymagania pól przy tworzeniu i edycji; spójne mapowanie offline.
- **Kontakty:** w obserwacji zbierane są tylko guardian_* na poziomie zawodnika; pełna rejestracja kontaktów w **player_contacts** w formularzu profilu zawodnika.
