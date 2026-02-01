# 03 - Model Danych

## 1. Diagram ERD (Entity-Relationship)

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │    invitations      │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ email               │       │ email               │
│ full_name           │       │ invited_by (FK)     │
│ role                │       │ token               │
│ phone               │       │ expires_at          │
│ avatar_url          │       │ used_at             │
│ is_active           │       │ created_at          │
│ created_at          │       └─────────────────────┘
│ last_login_at       │
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│    observations     │◄──────│       matches       │
├─────────────────────┤  N:1  ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ player_id (FK)      │       │ team_home           │
│ match_id (FK)       │       │ team_away           │
│ scout_id (FK)       │       │ score_home          │
│ source              │       │ score_away          │
│ rank                │       │ match_date          │
│ notes               │       │ location            │
│ potential_now       │       │ league_id (FK)      │
│ potential_future    │       │ category_id (FK)    │
│ status              │       │ type                │
│ created_at          │       │ notes               │
│ synced_at           │       │ created_at          │
│ is_deleted          │       └─────────────────────┘
└─────────────────────┘
         │
         │ N:1
         ▼
┌─────────────────────────────────────────────────────┐
│                      players                        │
├─────────────────────────────────────────────────────┤
│ id (PK)                                             │
│ first_name                                          │
│ last_name                                           │
│ birth_year                                          │
│ birth_date                                          │
│ club_id (FK)                                        │
│ region_id (FK)                                      │
│ primary_position                                    │
│ secondary_positions []                              │
│ dominant_foot                                       │
│ height_cm                                           │
│ weight_kg                                           │
│ photo_urls []                                       │
│ video_urls []                                       │
│ pipeline_status                                     │
│ decision_status                                     │
│ decision_notes                                      │
│ created_at                                          │
│ updated_at                                          │
└─────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐       ┌─────────────────────┐
│  player_contacts    │       │  player_evaluations │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ player_id (FK)      │       │ observation_id (FK) │
│ contact_type        │       │ criteria_id (FK)    │
│ contact_name        │       │ score               │
│ phone               │       │ created_at          │
│ email               │       └─────────────────────┘
│ is_primary          │
│ notes               │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│       clubs         │       │      regions        │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ name                │       │ name                │
│ city                │       │ is_active           │
│ region_id (FK)      │       │ created_at          │
│ is_active           │       └─────────────────────┘
│ created_at          │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│      leagues        │       │    categories       │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ name                │       │ name (U8, U9...)    │
│ level               │       │ min_birth_year      │
│ is_active           │       │ max_birth_year      │
│ created_at          │       │ created_at          │
└─────────────────────┘       └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│     positions       │       │ evaluation_criteria │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ code (1, 2, 3...)   │       │ position_id (FK)    │
│ name (GK, CB...)    │       │ name                │
│ category            │       │ weight              │
│ created_at          │       │ sort_order          │
└─────────────────────┘       │ created_at          │
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│  pipeline_history   │       │   offline_queue     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ player_id (FK)      │       │ user_id (FK)        │
│ from_status         │       │ action_type         │
│ to_status           │       │ payload (JSONB)     │
│ changed_by (FK)     │       │ created_at          │
│ reason              │       │ synced_at           │
│ created_at          │       │ sync_status         │
└─────────────────────┘       │ error_message       │
                              └─────────────────────┘
```

---

## 2. Opis Tabel

### 2.1 users
Użytkownicy systemu (scouts, trenerzy, admini).

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| email | VARCHAR(255) | NO | - | Unikalny email |
| full_name | VARCHAR(255) | YES | - | Imię i nazwisko |
| role | ENUM | NO | 'user' | 'admin' lub 'user' |
| phone | VARCHAR(20) | YES | - | Telefon |
| avatar_url | TEXT | YES | - | URL do avatara |
| is_active | BOOLEAN | NO | true | Czy konto aktywne |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |
| last_login_at | TIMESTAMPTZ | YES | - | Ostatnie logowanie |

**Indeksy:**
- `users_email_idx` UNIQUE (email)
- `users_role_idx` (role)

---

### 2.2 players
Zawodnicy obserwowani przez scouts.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| first_name | VARCHAR(100) | NO | - | Imię |
| last_name | VARCHAR(100) | NO | - | Nazwisko |
| birth_year | INTEGER | NO | - | Rocznik (np. 2011) |
| birth_date | DATE | YES | - | Pełna data urodzenia |
| club_id | UUID | YES | - | FK do clubs |
| region_id | UUID | YES | - | FK do regions |
| primary_position | VARCHAR(10) | YES | - | Główna pozycja (np. "4/5") |
| secondary_positions | TEXT[] | YES | {} | Dodatkowe pozycje |
| dominant_foot | ENUM | YES | - | 'left', 'right', 'both' |
| height_cm | INTEGER | YES | - | Wzrost w cm |
| weight_kg | DECIMAL(4,1) | YES | - | Waga w kg |
| photo_urls | TEXT[] | YES | {} | URLe zdjęć |
| video_urls | TEXT[] | YES | {} | URLe wideo |
| pipeline_status | ENUM | NO | 'observed' | Status w pipeline |
| decision_status | VARCHAR(50) | YES | - | Status decyzji końcowej |
| decision_notes | TEXT | YES | - | Notatki do decyzji |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NO | now() | Data modyfikacji |

**ENUM pipeline_status:**
- observed
- shortlist
- trial
- offer
- signed
- rejected

**ENUM dominant_foot:**
- left
- right
- both

**Indeksy:**
- `players_name_idx` (last_name, first_name)
- `players_birth_year_idx` (birth_year)
- `players_club_idx` (club_id)
- `players_pipeline_idx` (pipeline_status)
- `players_search_idx` GIN (to_tsvector('polish', first_name || ' ' || last_name))

---

### 2.3 observations
Pojedyncze obserwacje zawodników na meczach.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| player_id | UUID | NO | - | FK do players |
| match_id | UUID | YES | - | FK do matches (opcjonalnie) |
| scout_id | UUID | NO | - | FK do users |
| source | ENUM | NO | 'scouting' | Źródło obserwacji |
| rank | CHAR(1) | YES | - | Ranga A/B/C/D |
| notes | TEXT | YES | - | Komentarz tekstowy |
| potential_now | INTEGER | YES | - | Potencjał teraz (1-5) |
| potential_future | INTEGER | YES | - | Potencjał na przyszłość (1-5) |
| observation_date | DATE | NO | CURRENT_DATE | Data obserwacji |
| status | VARCHAR(20) | NO | 'active' | Status (active/deleted) |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |
| synced_at | TIMESTAMPTZ | YES | - | Data synchronizacji (offline) |
| is_offline_created | BOOLEAN | NO | false | Czy utworzone offline |

**ENUM source:**
- scouting
- referral (polecenie)
- application (zgłoszenie)
- trainer_report (od trenera)
- scout_report (od zewnętrznego skauta)

**Indeksy:**
- `observations_player_idx` (player_id)
- `observations_scout_idx` (scout_id)
- `observations_date_idx` (observation_date DESC)
- `observations_rank_idx` (rank)

---

### 2.4 matches
Mecze obserwowane przez scouts.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| team_home | VARCHAR(100) | NO | - | Drużyna gospodarzy |
| team_away | VARCHAR(100) | NO | - | Drużyna gości |
| score_home | INTEGER | YES | - | Wynik gospodarzy |
| score_away | INTEGER | YES | - | Wynik gości |
| match_date | DATE | NO | - | Data meczu |
| location | VARCHAR(200) | YES | - | Miejsce |
| league_id | UUID | YES | - | FK do leagues |
| category_id | UUID | YES | - | FK do categories |
| type | ENUM | NO | 'live' | 'live' lub 'video' |
| notes | TEXT | YES | - | Uwagi |
| created_by | UUID | NO | - | FK do users |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

**Indeksy:**
- `matches_date_idx` (match_date DESC)
- `matches_teams_idx` (team_home, team_away)

---

### 2.5 player_contacts
Kontakty do rodziców/opiekunów zawodnika.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| player_id | UUID | NO | - | FK do players |
| contact_type | ENUM | NO | 'parent' | Typ kontaktu |
| contact_name | VARCHAR(200) | YES | - | Imię i nazwisko |
| phone | VARCHAR(20) | YES | - | Telefon |
| email | VARCHAR(255) | YES | - | Email |
| is_primary | BOOLEAN | NO | false | Czy główny kontakt |
| notes | TEXT | YES | - | Notatki |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

**ENUM contact_type:**
- parent
- guardian
- agent
- other

---

### 2.6 player_evaluations
Szczegółowe oceny według kryteriów pozycyjnych.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| observation_id | UUID | NO | - | FK do observations |
| criteria_id | UUID | NO | - | FK do evaluation_criteria |
| score | INTEGER | NO | - | Ocena 1-5 |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

**Constraints:**
- CHECK (score >= 1 AND score <= 5)
- UNIQUE (observation_id, criteria_id)

---

### 2.7 clubs
Słownik klubów piłkarskich.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | VARCHAR(200) | NO | - | Nazwa klubu |
| city | VARCHAR(100) | YES | - | Miasto |
| region_id | UUID | YES | - | FK do regions |
| is_active | BOOLEAN | NO | true | Czy aktywny |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

**Indeksy:**
- `clubs_name_idx` (name)
- `clubs_search_idx` GIN (to_tsvector('polish', name))

---

### 2.8 regions
Słownik regionów/województw.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | VARCHAR(100) | NO | - | Nazwa regionu |
| is_active | BOOLEAN | NO | true | Czy aktywny |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

### 2.9 leagues
Słownik lig i rozgrywek.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | VARCHAR(100) | NO | - | Nazwa ligi |
| level | INTEGER | YES | - | Poziom rozgrywek |
| is_active | BOOLEAN | NO | true | Czy aktywna |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

### 2.10 categories
Słownik kategorii wiekowych.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | VARCHAR(10) | NO | - | Nazwa (U8, U9...) |
| min_birth_year | INTEGER | YES | - | Minimalny rocznik |
| max_birth_year | INTEGER | YES | - | Maksymalny rocznik |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

### 2.11 positions
Słownik pozycji na boisku.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| code | VARCHAR(10) | NO | - | Kod (1, 2, 3...) |
| name | VARCHAR(50) | NO | - | Nazwa (GK, CB...) |
| category | VARCHAR(20) | YES | - | Kategoria (defense, midfield, attack) |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

### 2.12 evaluation_criteria
Kryteria oceny per pozycja.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| position_id | UUID | NO | - | FK do positions |
| name | VARCHAR(100) | NO | - | Nazwa kryterium |
| weight | DECIMAL(3,2) | NO | 1.00 | Waga kryterium |
| sort_order | INTEGER | NO | 0 | Kolejność wyświetlania |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

### 2.13 pipeline_history
Historia zmian statusów w pipeline.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| player_id | UUID | NO | - | FK do players |
| from_status | VARCHAR(20) | YES | - | Poprzedni status |
| to_status | VARCHAR(20) | NO | - | Nowy status |
| changed_by | UUID | NO | - | FK do users |
| reason | TEXT | YES | - | Powód zmiany |
| created_at | TIMESTAMPTZ | NO | now() | Data zmiany |

---

### 2.14 offline_queue
Kolejka operacji offline do synchronizacji.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | - | FK do users |
| action_type | VARCHAR(50) | NO | - | Typ akcji (create_observation, update_player...) |
| payload | JSONB | NO | - | Dane do synchronizacji |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |
| synced_at | TIMESTAMPTZ | YES | - | Data synchronizacji |
| sync_status | VARCHAR(20) | NO | 'pending' | Status (pending/synced/failed) |
| error_message | TEXT | YES | - | Komunikat błędu |

---

### 2.15 invitations
Zaproszenia do systemu.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| id | UUID | NO | gen_random_uuid() | PK |
| email | VARCHAR(255) | NO | - | Email zaproszonej osoby |
| invited_by | UUID | NO | - | FK do users (admin) |
| token | VARCHAR(100) | NO | - | Token zaproszenia |
| expires_at | TIMESTAMPTZ | NO | - | Data wygaśnięcia |
| used_at | TIMESTAMPTZ | YES | - | Data użycia |
| created_at | TIMESTAMPTZ | NO | now() | Data utworzenia |

---

## 3. Relacje

| Tabela źródłowa | Tabela docelowa | Typ | Klucz obcy |
|-----------------|-----------------|-----|------------|
| observations | players | N:1 | player_id |
| observations | matches | N:1 | match_id |
| observations | users | N:1 | scout_id |
| players | clubs | N:1 | club_id |
| players | regions | N:1 | region_id |
| player_contacts | players | N:1 | player_id |
| player_evaluations | observations | N:1 | observation_id |
| player_evaluations | evaluation_criteria | N:1 | criteria_id |
| clubs | regions | N:1 | region_id |
| matches | leagues | N:1 | league_id |
| matches | categories | N:1 | category_id |
| evaluation_criteria | positions | N:1 | position_id |
| pipeline_history | players | N:1 | player_id |
| pipeline_history | users | N:1 | changed_by |
| offline_queue | users | N:1 | user_id |
| invitations | users | N:1 | invited_by |

---

## 4. Row Level Security (RLS) Policies

### users
```sql
-- Każdy widzi wszystkich aktywnych użytkowników
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (is_active = true);

-- Tylko admin może modyfikować użytkowników
CREATE POLICY "Only admins can modify users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Użytkownik może edytować swój profil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

### observations
```sql
-- Wszyscy widzą wszystkie obserwacje
CREATE POLICY "Observations are viewable by authenticated users"
ON observations FOR SELECT
TO authenticated
USING (true);

-- Każdy może dodawać obserwacje
CREATE POLICY "Users can create observations"
ON observations FOR INSERT
TO authenticated
WITH CHECK (scout_id = auth.uid());

-- Edycja własnych lub przez admina
CREATE POLICY "Users can update own observations"
ON observations FOR UPDATE
TO authenticated
USING (
  scout_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

### players
```sql
-- Wszyscy widzą wszystkich zawodników
CREATE POLICY "Players are viewable by authenticated users"
ON players FOR SELECT
TO authenticated
USING (true);

-- Wszyscy mogą dodawać i edytować zawodników
CREATE POLICY "Users can manage players"
ON players FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## 5. Dane początkowe (Seed)

### Regiony
```sql
INSERT INTO regions (name) VALUES
('mazowieckie'),
('kujawsko-pomorskie'),
('śląskie'),
('małopolskie'),
('wielkopolskie'),
('pomorskie'),
('dolnośląskie'),
('łódzkie'),
('lubelskie'),
('podlaskie'),
('zachodniopomorskie'),
('warmińsko-mazurskie'),
('podkarpackie'),
('świętokrzyskie'),
('opolskie'),
('lubuskie');
```

### Kategorie wiekowe
```sql
INSERT INTO categories (name, min_birth_year, max_birth_year) VALUES
('U8', 2018, 2018),
('U9', 2017, 2017),
('U10', 2016, 2016),
('U11', 2015, 2015),
('U12', 2014, 2014),
('U13', 2013, 2013),
('U14', 2012, 2012),
('U15', 2011, 2011),
('U16', 2010, 2010),
('U17', 2009, 2009),
('U18', 2008, 2008),
('U19', 2007, 2007);
```

### Pozycje i kryteria
```sql
-- Pozycje
INSERT INTO positions (code, name, category) VALUES
('1', 'Bramkarz (GK)', 'goalkeeper'),
('2', 'Prawy obrońca (RB)', 'defense'),
('3', 'Lewy obrońca (LB)', 'defense'),
('4', 'Środkowy obrońca (CB)', 'defense'),
('5', 'Środkowy obrońca (CB)', 'defense'),
('6', 'Defensywny pomocnik (CDM)', 'midfield'),
('8', 'Środkowy pomocnik (CM)', 'midfield'),
('10', 'Ofensywny pomocnik (CAM)', 'midfield'),
('7', 'Prawy skrzydłowy (RW)', 'attack'),
('11', 'Lewy skrzydłowy (LW)', 'attack'),
('9', 'Napastnik (ST)', 'attack');

-- Kryteria dla bramkarza
INSERT INTO evaluation_criteria (position_id, name, sort_order) 
SELECT id, 'Refleks', 1 FROM positions WHERE code = '1';
INSERT INTO evaluation_criteria (position_id, name, sort_order) 
SELECT id, 'Gra nogami', 2 FROM positions WHERE code = '1';
-- ... etc
```

---

## 6. Migracje

Plik: `supabase/migrations/001_initial_schema.sql`

Zawiera pełną strukturę tabel opisaną powyżej.

Plik: `supabase/migrations/002_rls_policies.sql`

Zawiera polityki RLS.

Plik: `supabase/migrations/003_seed_data.sql`

Zawiera dane początkowe (słowniki).

Plik: `supabase/migrations/004_import_excel.sql`

Zawiera import danych z pliku Excel (dane historyczne).
