# 10 - Sample Data (Import z Excel)

## 1. Przegląd danych źródłowych

Dane pochodzą z pliku Excel: `EWIDENCJA_Zawodników_Ciekawych_2025_2026.xlsx`

### Statystyki

| Arkusz | Liczba rekordów | Opis |
|--------|-----------------|------|
| ZAPISANI | 715 | Główna lista obserwacji |
| PRZETESTOWANI | 62 | Zawodnicy na testach |
| OD TRENERÓW | 112 | Rekomendacje od trenerów |
| OD SKAUTÓW | 72 | Raporty zewnętrznych skautów |
| MECZE NA ŻYWO | 80 | Obserwowane mecze (live) |
| MECZE WIDEO | 7 | Obserwowane mecze (wideo) |

### Unikalne wartości
- **Kluby:** 129 unikalnych klubów
- **Regiony:** 12 (województwa + kadry narodowe)
- **Roczniki:** 2007-2018 (U8-U19)

---

## 2. Mapowanie pól Excel → Baza danych

### ZAPISANI → observations + players

| Kolumna Excel | Tabela | Pole |
|---------------|--------|------|
| Nazwisko | players | last_name |
| Imię | players | first_name |
| Klub | clubs → players.club_id | name |
| Kadra | regions → players.region_id | name |
| Rocznik | players | birth_year |
| Data obserwacji | observations | observation_date |
| Pozycja | players | primary_position |
| Noga | players | dominant_foot |
| Ranga | observations | rank |
| Opis | observations | notes |

---

## 3. Przykładowe dane z Excel

### Zawodnik Ranga A (TOP)
```json
{
  "Nazwisko": "Ziętek",
  "Imię": "Ryszard",
  "Klub": "Chemik Bydgoszcz",
  "Kadra": "kujawsko-pomorskie",
  "Rocznik": 2011,
  "Data obserwacji": "2025-07-04",
  "Pozycja": "9",
  "Noga": "prawa",
  "Ranga": "A",
  "Opis": "średni wzrost, bdb motoryka, poruszanie, balans; prowadzenie i ochrona piłki, mobilny, dużo zejść w dół/na boki, otwierające podania"
}
```

### Zawodnik Ranga B (Dobry)
```json
{
  "Nazwisko": "Galasiński",
  "Imię": "Jakub",
  "Klub": "MUKS Bydgoszcz",
  "Kadra": "kujawsko-pomorskie",
  "Rocznik": 2011,
  "Pozycja": "10",
  "Noga": "lewa",
  "Ranga": "B",
  "Opis": "wysoki, lewa noga, lekkość w poruszaniu się z piłką i dobre prowadzenie, zaangażowanie w defensywę, agresywne doskoki"
}
```

### Zawodnik Ranga C (Szeroka kadra)
```json
{
  "Nazwisko": "Mik",
  "Imię": "Błażej",
  "Klub": "Olimpia Grudziądz",
  "Rocznik": 2011,
  "Pozycja": "11",
  "Noga": "prawa",
  "Ranga": "C",
  "Opis": "średni wzrost, nie tworzy przewagi prowadzeniem/dryblingiem, szybko oddaje piłkę, szuka długich podań"
}
```

---

## 4. SQL Seed Data

### 4.1 Regiony

```sql
INSERT INTO regions (name, is_active) VALUES
  ('mazowieckie', true),
  ('kujawsko-pomorskie', true),
  ('śląskie', true),
  ('małopolskie', true),
  ('wielkopolskie', true),
  ('pomorskie', true),
  ('dolnośląskie', true),
  ('łódzkie', true),
  ('lubelskie', true),
  ('podlaskie', true),
  ('warmińsko-mazurskie', true),
  ('podkarpackie', true),
  ('świętokrzyskie', true),
  ('opolskie', true),
  ('lubuskie', true),
  ('zachodniopomorskie', true);
```

### 4.2 Przykładowe kluby

```sql
INSERT INTO clubs (name, city, is_active) VALUES
  ('Chemik Bydgoszcz', 'Bydgoszcz', true),
  ('MUKS Bydgoszcz', 'Bydgoszcz', true),
  ('Olimpia Grudziądz', 'Grudziądz', true),
  ('Juventus Academy Toruń', 'Toruń', true),
  ('Zawisza Bydgoszcz', 'Bydgoszcz', true),
  ('Polonia Warszawa', 'Warszawa', true),
  ('Escola Varsovia', 'Warszawa', true),
  ('Legia Warszawa', 'Warszawa', true),
  ('Raków Częstochowa', 'Częstochowa', true),
  ('Warta Poznań', 'Poznań', true);
```

### 4.3 Kategorie wiekowe

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

### 4.4 Pozycje i kryteria oceny

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
SELECT id, 'Refleks', 1 FROM positions WHERE code = '1'
UNION ALL SELECT id, 'Gra nogami', 2 FROM positions WHERE code = '1'
UNION ALL SELECT id, 'Wyjścia', 3 FROM positions WHERE code = '1'
UNION ALL SELECT id, 'Komunikacja', 4 FROM positions WHERE code = '1'
UNION ALL SELECT id, 'Pozycjonowanie', 5 FROM positions WHERE code = '1';

-- Kryteria dla napastnika
INSERT INTO evaluation_criteria (position_id, name, sort_order) 
SELECT id, 'Wykończenie', 1 FROM positions WHERE code = '9'
UNION ALL SELECT id, 'Główkowanie', 2 FROM positions WHERE code = '9'
UNION ALL SELECT id, 'Gra tyłem', 3 FROM positions WHERE code = '9'
UNION ALL SELECT id, 'Ruch bez piłki', 4 FROM positions WHERE code = '9'
UNION ALL SELECT id, 'Pressing', 5 FROM positions WHERE code = '9';
```

---

## 5. JSON dla testów frontendu

### Lista zawodników (mock)

```json
[
  {
    "id": "player-001",
    "first_name": "Ryszard",
    "last_name": "Ziętek",
    "birth_year": 2011,
    "primary_position": "9",
    "dominant_foot": "right",
    "pipeline_status": "shortlist",
    "club": { "name": "Chemik Bydgoszcz" },
    "region": { "name": "kujawsko-pomorskie" },
    "observations_count": 3
  },
  {
    "id": "player-002",
    "first_name": "Jakub",
    "last_name": "Galasiński",
    "birth_year": 2011,
    "primary_position": "10",
    "dominant_foot": "left",
    "pipeline_status": "observed",
    "club": { "name": "MUKS Bydgoszcz" },
    "region": { "name": "kujawsko-pomorskie" },
    "observations_count": 2
  }
]
```

### Lista obserwacji (mock)

```json
[
  {
    "id": "obs-001",
    "player": {
      "first_name": "Ryszard",
      "last_name": "Ziętek"
    },
    "scout": {
      "full_name": "Mateusz Sokołowski"
    },
    "source": "scouting",
    "rank": "A",
    "notes": "średni wzrost, bdb motoryka...",
    "potential_now": 5,
    "potential_future": 5,
    "observation_date": "2025-07-04",
    "created_at": "2025-07-04T14:30:00Z"
  }
]
```

---

## 6. Skrypt importu danych

```bash
# Uruchom migracje
supabase db push

# Import seed data
supabase db seed

# Weryfikacja
supabase db execute "SELECT COUNT(*) FROM players;"
supabase db execute "SELECT COUNT(*) FROM observations;"
supabase db execute "SELECT COUNT(*) FROM clubs;"
```
