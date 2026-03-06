# Specyfikacja formularzy obserwacji — wymagania i struktura

Dokument opisuje **wymagania**, **strukturę** oraz **zasady działania** formularzy obserwacji w systemie ScoutPro. Ma służyć programistom do budowy lub odtworzenia struktury od zera oraz jako źródło prawdy przy dalszym rozwoju (np. dodawanie pól, nowe kryteria, zmiany walidacji).

**Nie wprowadza zmian w aplikacji** — stanowi wyłącznie dokumentację referencyjną.

---

## Spis treści

1. [Przegląd: co to są formularze obserwacji](#1-przegląd-co-to-są-formularze-obserwacji)
2. [Typy formularzy: meczowe vs indywidualne](#2-typy-formularzy-meczowe-vs-indywidualne)
3. [Warianty formularza: uproszczony vs rozszerzony](#3-warianty-formularza-uproszczony-vs-rozszerzony)
4. [Jakie informacje zbierają formularze](#4-jakie-informacje-zbierają-formularze)
5. [Jak funkcjonują formularze (przepływ, logika)](#5-jak-funkcjonują-formularze-przepływ-logika)
6. [Struktura danych (baza, enums, tabele)](#6-struktura-danych-baza-enums-tabele)
7. [Rozwój: dodawanie pól i zmian](#7-rozwój-dodawanie-pól-i-zmian)
8. [Źródła i powiązane dokumenty](#8-źródła-i-powiązane-dokumenty)

---

## 1. Przegląd: co to są formularze obserwacji

Formularze obserwacji służą do:

- **Rejestracji oceny zawodnika** podczas meczu, turnieju lub treningu
- **Dokumentowania umiejętności** (technika, fizyka, taktyka, mentalność)
- **Gromadzenia danych** wspierających decyzje rekrutacyjne
- **Budowania historii** rozwoju zawodnika w pipeline

Użytkownicy: scout, trener, analityk, pracownik akademii. Jeden szablon formularza dla wszystkich ról (z możliwością przyszłego różnicowania uprawnień).

Kluczowe rozróżnienia:

| Wymiar | Opis |
|--------|------|
| **Kontekst obserwacji** | **Meczowa** — obserwacja w ramach jednego spotkania (nagłówek meczu + N zawodników). **Indywidualna** — pojedyncza obserwacja zawodnika bez nagłówka meczu. |
| **Wariant formularza** | **Uproszczony** — szybka ocena, mniej pól. **Rozszerzony** — pełny arkusz z kryteriami pozycyjnymi, motoryką, opisem mentalnym. |

Użytkownik musi rozumieć:

- **Formularze meczowe** — najpierw wypełnia się dane spotkania (data, rozgrywki, gospodarz, gość, wynik itd.), potem dodaje się zawodników; każdy zawodnik ma kartę z formularzem (uproszczonym lub rozszerzonym).
- **Formularze indywidualne** — jedna obserwacja jednego zawodnika, bez powiązania z nagłówkiem meczu; można wybrać wariant uproszczony lub rozszerzony.
- **Uproszczone** — mniej pól, szybsze wypełnianie (np. ocena ogólna, ocena za występ, podsumowanie, rekomendacja, potencjał, tagi mocne/słabe).
- **Rozszerzone** — wszystko z uproszczonego plus: dane fizyczne (wzrost, waga, budowa), zdolności motoryczne (6 składowych w skali 1–5), opis zdolności mentalnych, **kryteria pozycyjne** (dynamicznie wg pozycji: defensywa, ofensywa, fazy przejściowe).

---

## 2. Typy formularzy: meczowe vs indywidualne

### 2.1 Obserwacja meczowa

| Aspekt | Opis |
|--------|------|
| **Kod / enum** | Kontekst: `match` lub `tournament`. Kategoria obserwacji: `match_player`. |
| **Kiedy** | Scout obserwuje spotkanie (mecz lub turniej) i chce zapisać kilku wyróżniających się zawodników. |
| **Struktura** | **Nagłówek spotkania** (jedna encja, np. `match_observations`) + **N obserwacji zawodników** (tabela `observations` z `match_observation_id`). |
| **Dane nagłówka** | Data, rozgrywki (ze słownika kategorii), typ kontekstu (mecz / turniej), przy meczu: gospodarz, gość, wynik; opcjonalnie: lokalizacja, źródło, formacje, notatki do meczu. |
| **Per zawodnik** | Każdy dodany zawodnik to osobna obserwacja (`observations`) z wybranym wariantem formularza (uproszczony/rozszerzony). W kontekście meczu często wymagana jest **ocena za występ** (1–5). |

### 2.2 Obserwacja indywidualna

| Aspekt | Opis |
|--------|------|
| **Kod / enum** | Kategoria obserwacji: `individual`. Brak nagłówka meczu. |
| **Kiedy** | Obserwacja pojedynczego zawodnika (np. z profilu zawodnika lub z listy „Nowa obserwacja” bez kontekstu meczu). |
| **Struktura** | Jedna encja w `observations` z `match_observation_id = NULL`, `observation_category = 'individual'`. |
| **Wejście** | Z listy obserwacji („Nowa obserwacja”) lub z profilu zawodnika („Dodaj obserwację”) — w drugim przypadku dane zawodnika są zablokowane/wypełnione. |

---

## 3. Warianty formularza: uproszczony vs rozszerzony

### 3.1 Uproszczony (`simplified`)

- **Cel:** Szybka obserwacja na meczu/turnieju (szczególnie U8–U19).
- **Zakres:** Dane zawodnika (identyfikacja, klub, pozycja), oceny ogólne (np. ocena 1–10, ocena za występ 1–5, technika/szybkość/motoryka/taktyka/mentalność 1–5), jedno pole podsumowania + tagi mocne/słabe (ze słowników), rekomendacja (pozytywna / do obserwacji / negatywna), ranga, potencjał na teraz i na przyszłość (1–5), opcjonalnie zdjęcie.
- **UX:** Wszystkie sekcje na jednym widoku (single-page scroll), bez kroków wizarda.

### 3.2 Rozszerzony (`extended`)

- **Cel:** Pełny arkusz obserwacji (np. seniorzy, szczegółowa analiza).
- **Zakres:** Wszystko z uproszczonego plus:
  - **Dane fizyczne i osobowe:** wzrost, waga, budowa ciała, narodowość, lepsza noga, formacja drużyny; opcjonalnie agent (imię, telefon), data końca kontraktu, numer kontaktowy zawodnika.
  - **Zdolności motoryczne:** 6 kryteriów w skali 1–5 (szybkość, wytrzymałość, skoczność, zwrotność, szybkość startowa, siła) + opcjonalny opis tekstowy.
  - **Zdolności mentalne:** jedno pole tekstowe (opis).
  - **Kryteria pozycyjne:** lista kryteriów zależna od **pozycji** zawodnika (defensywa, ofensywa, faza O→A, faza A→O) — każde kryterium to pole tekstowe (textarea). Zestaw kryteriów jest inny dla pozycji 2/3, 4/5, 6, 7/11, 8, 9 (bramkarz — do uzupełnienia przez biznes).
- **UX:** Single-page scroll z nawigacją po sekcjach (np. floating menu, anchor links).

### 3.3 Dobór wariantu (uproszczony vs rozszerzony)

- System może **domyślnie** ustawiać wariant na podstawie **kategorii wiekowej** zawodnika (rocznik → słownik kategorii → pole `default_form_type`: `simplified` lub `extended`). Np. U8–U19 → uproszczony, Seniorzy → rozszerzony.
- Użytkownik ma **przełącznik** (toggle) i może w dowolnym momencie zmienić typ formularza.
- Przy przełączeniu **uproszczony → rozszerzony:** pola wspólne zachowane, sekcje rozszerzone pojawiają się puste.
- Przy przełączeniu **rozszerzony → uproszczony:** sekcje rozszerzone są ukrywane; dane można trzymać w pamięci (np. state), ale przy **zapisie** zapisywane są tylko pola aktywnego wariantu.

---

## 4. Jakie informacje zbierają formularze

### 4.1 Wspólne grupy danych (uproszczony i rozszerzony)

| Grupa | Przykładowe pola | Gdzie zapisywane |
|-------|------------------|------------------|
| **Zawodnik** | imię, nazwisko, rocznik, data urodzenia, klub, pozycja główna, pozycje dodatkowe | `players` (tworzenie/aktualizacja), powiązanie `observations.player_id` |
| **Kontekst** | data obserwacji, rozgrywki (kategoria) | `observations.observation_date`, `observations.competition`; przy meczu także `match_observations` |
| **Oceny ogólne** | ocena ogólna (1–10), ocena za występ (1–5), technika/szybkość/motoryka/taktyka/mentalność (1–5) | `observations` (overall_rating, match_performance_rating, technical_rating, speed_rating, …) |
| **Podsumowanie** | jedno pole tekstowe podsumowania, tagi mocne/słabe strony, rekomendacja, ranga, potencjał na teraz i na przyszłość, rola w zespole | `observations` (summary, strengths/weaknesses lub tagi, recommendation, rank, potential_now, potential_future, team_role) |
| **Źródło i media** | źródło obserwacji (scouting / analiza wideo / fragmenty), zdjęcie | `observations.source`, `observations.photo_url` |
| **Audyt** | created_by, updated_by, updated_at | `observations` |

### 4.2 Tylko formularz rozszerzony

| Grupa | Przykładowe pola | Gdzie zapisywane |
|-------|------------------|------------------|
| **Dane fizyczne / osobowe** | narodowość, lepsza noga, formacja drużyny, wzrost, waga, budowa ciała, agent (imię, tel.), data końca kontraktu, telefon zawodnika | `players` (height, weight, foot, body_build, contract_end_date itd.), kontakty w `player_contacts` (type=agent) |
| **Motoryka** | 6 składowych 1–5 + opis | `motor_evaluations` (observation_id, speed, endurance, jumping, agility, acceleration, strength, description) lub pola w `observations` (zależnie od implementacji) |
| **Mentalność** | opis zdolności mentalnych | `observations.mental_description` |
| **Kryteria pozycyjne** | tekstowe opisy per kryterium (defensywa, ofensywa, O→A, A→O) | `observation_criterion_notes` (observation_id, criteria_id, description) lub odpowiednia tabela powiązań |

### 4.3 Tylko obserwacja meczowa (nagłówek)

| Grupa | Pola | Gdzie zapisywane |
|-------|------|------------------|
| **Spotkanie** | typ kontekstu (mecz/turniej), data, rozgrywki, gospodarz, gość, wynik, lokalizacja, źródło, formacje, notatki | Tabela `match_observations` |

Szczegółowe listy pól (nazwy techniczne, walidacja, wymagalność) są w materiałach: `Materials/Implementacja poprawy obserwacji/zadanie-2-implementacja-obserwacji.md` oraz `Materials/Formularz Ogólnej Obserwacji Zawodnika/Formularz Ogólnej Obserwacji.md`.

---

## 5. Jak funkcjonują formularze (przepływ, logika)

### 5.1 Punkty wejścia

- **Lista obserwacji** → „Nowa obserwacja” → wybór: obserwacja meczowa lub indywidualna.
- **Obserwacja meczowa** → tworzenie nagłówka spotkania → przycisk „Dodaj zawodnika” → formularz per zawodnik (uproszczony/rozszerzony).
- **Profil zawodnika** → „Dodaj obserwację” → formularz indywidualny z zablokowanymi danymi zawodnika (lub tylko do odczytu).

### 5.2 Scenariusze zapisu

- **Nowa obserwacja (indywidualna):**  
  - Jeśli wybrany istniejący zawodnik → `observations.player_id` = ten zawodnik.  
  - Jeśli „nowy zawodnik” → najpierw tworzony jest rekord w `players`, potem obserwacja z `player_id`.
- **Nowa obserwacja meczowa:**  
  - Zapis nagłówka w `match_observations`.  
  - Dla każdego dodanego zawodnika: tworzenie/wybór `players` + rekord w `observations` z `match_observation_id` i wybranym `form_type`.
- **Edycja obserwacji:** aktualizacja `observations` (i ewentualnie `players`, `motor_evaluations`, `observation_criterion_notes`). Wymagania pól powinny być spójne z tworzeniem (np. rank i potencjały zawsze wymagane lub zawsze opcjonalne — do ujednolicenia wg rekomendacji z analizy).

### 5.3 Offline

- Draft można zapisywać lokalnie (np. IndexedDB).  
- Przy braku sieci: zapis do kolejki offline z flagą `is_offline_created`; po powrocie sieci synchronizacja (nagłówek meczu + obserwacje zawodników w jednym payloadzie lub sekwencyjnie).  
- Zalecenie: ten sam zestaw pól i mapowanie przy tworzeniu online i offline, żeby uniknąć „ubogich” rekordów po synchronizacji.

### 5.4 Deduplikacja zawodników

- Przy dodawaniu „nowego” zawodnika z formularza obserwacji zaleca się sprawdzanie duplikatów (np. first_name + last_name + birth_year; opcjonalnie club_id).  
- UX: lista „możliwych duplikatów” i wybór: użyj istniejącego zawodnika lub potwierdź „to nowy zawodnik”.

---

## 6. Struktura danych (baza, enums, tabele)

### 6.1 Enumeracje istotne dla formularzy

| Enum | Wartości | Użycie |
|------|----------|--------|
| `observation_context_type` | `match`, `tournament` | Kontekst nagłówka spotkania |
| `observation_category_type` | `match_player`, `individual` | Czy obserwacja jest z meczu czy standalone |
| `form_type` | `simplified`, `extended` | Wariant formularza użyty przy zapisie |
| `recommendation_type` | `positive`, `to_observe`, `negative` | Rekomendacja z formularza |
| `criterion_section` | `defense`, `offense`, `transition_oa`, `transition_ao` | Grupowanie kryteriów pozycyjnych (formularz rozszerzony) |
| `default_form_type_enum` | `simplified`, `extended` | Domyślny typ formularza w słowniku kategorii wiekowych |
| `observation_source` | np. scouting, video_analysis, video_clips | Źródło obserwacji |

### 6.2 Główne tabele

| Tabela | Rola |
|--------|------|
| **match_observations** | Nagłówek spotkania (mecz/turniej): data, rozgrywki, gospodarz, gość, wynik, lokalizacja, źródło, formacje, notatki, scout_id. |
| **observations** | Jedna obserwacja jednego zawodnika: player_id, scout_id, observation_date, competition, source, form_type, observation_category, match_observation_id (nullable), oceny (overall_rating, match_performance_rating, technical_rating, …), summary, strengths, weaknesses, recommendation, rank, potential_now, potential_future, mental_description, photo_url, audyt, status, is_offline_created itd. |
| **players** | Dane zawodnika (imię, nazwisko, birth_year, club_id, primary_position, pozycje dodatkowe, wzrost, waga, foot, body_build, contract_end_date, …). |
| **motor_evaluations** | Jedna wiersz na obserwację rozszerzoną: observation_id, speed, endurance, jumping, agility, acceleration, strength, description (1–5 + opis). |
| **evaluation_criteria** | Słownik kryteriów pozycyjnych: position (lub position_id), section (defense/offense/transition_oa/transition_ao), code (np. def_1v1), nazwa. |
| **observation_criterion_notes** | Opisy kryteriów dla danej obserwacji: observation_id, criteria_id, description (textarea). |
| **categories** | Kategorie wiekowe (rozgrywki); pole `default_form_type` — domyślny typ formularza dla tej kategorii. |
| **clubs** | Kluby (autocomplete w polu klub zawodnika). |

### 6.3 Relacje (skrót)

- `observations.player_id` → `players.id`
- `observations.match_observation_id` → `match_observations.id` (nullable)
- `observations.scout_id` → `users.id`
- `motor_evaluations.observation_id` → `observations.id`
- `observation_criterion_notes.observation_id` → `observations.id`, `observation_criterion_notes.criteria_id` → `evaluation_criteria.id`
- `players.club_id` → `clubs.id`
- `categories.default_form_type` — używane do ustawienia domyślnego `form_type` przy nowej obserwacji (na podstawie rocznika → kategoria).

Dokładna definicja kolumn jest w migracjach Supabase (`scoutpro/supabase/migrations/`), w szczególności: `20260101000000_init_schema.sql`, `20260215100000_observation_form_improvements.sql`, `20260227120000_add_observation_motor_fields.sql`, `20260229100000_observation_v2_schema.sql`, oraz w typach TypeScript generowanych z bazy.

---

## 7. Rozwój: dodawanie pól i zmian

Poniższe zasady ułatwiają spójne rozszerzanie formularzy bez rozjechania się z dokumentacją i bazą.

### 7.1 Dodawanie nowego pola do formularza

1. **Określ:**  
   - czy pole dotyczy **zawodnika** (`players`), **obserwacji** (`observations`), **nagłówka meczu** (`match_observations`), **motoryki** (`motor_evaluations`), czy **kryteriów pozycyjnych** (`observation_criterion_notes` / `evaluation_criteria`).  
   - czy pole ma być tylko w **uproszczonym**, tylko w **rozszerzonym**, czy w **obu**.
2. **Baza:** dodaj kolumnę w odpowiedniej tabeli (migracja Supabase); w razie potrzeby dodaj enum.
3. **Typy:** zaktualizuj typy (np. `database.types.ts` lub generowane z Supabase).
4. **Formularz:** dodaj kontrolkę w odpowiedniej sekcji (uproszczony/rozszerzony) i mapowanie przy zapisie/odczycie.
5. **Walidacja:** ustal wymagalność i reguły (min/max, format); zachowaj spójność create vs edit.
6. **Dokumentacja:** zaktualizuj ten plik (sekcje 4–6) oraz ewentualnie `Materials/Implementacja poprawy obserwacji/` lub `Formularz Ogólnej Obserwacji`.

### 7.2 Dodawanie nowego kryterium pozycyjnego (formularz rozszerzony)

1. **Słownik:** dodaj rekord do `evaluation_criteria` z przypisaniem do pozycji i sekcji (`defense`/`offense`/`transition_oa`/`transition_ao`), kodem i nazwą.
2. **UI:** formularz rozszerzony ładuje kryteria wg pozycji; nowe kryterium pojawi się w odpowiedniej sekcji po odświeżeniu listy kryteriów.
3. **Zapis:** wartość zapisywana w `observation_criterion_notes` (observation_id, criteria_id, description).
4. **Dokumentacja:** zaktualizuj listę kryteriów per pozycja (np. w `Materials/Porownanie formularzy obserwacji/porownanie_formularzy_obserwacji.md` lub w tym dokumencie).

### 7.3 Zmiana wymagań (wymagane/opcjonalne)

- Zdefiniuj jednolite reguły dla **tworzenia** i **edycji** (np. rank i potencjały zawsze wymagane lub zawsze opcjonalne).  
- Zaktualizuj walidację w UI i ewentualnie constrainty w bazie.  
- Opisz zmianę w tym dokumencie i w analizie formularzy (`observation-form-analysis.md` / `observation-forms.md`).

### 7.4 Nowy typ formularza lub nowa kategoria obserwacji

- Wymaga rozszerzenia enumów i ewentualnie nowych tabel lub kolumn.  
- Zaktualizuj sekcje 2–3 i 6 tego dokumentu oraz dokumentację modelu danych (`data-model.md`).

---

## 8. Źródła i powiązane dokumenty

| Dokument | Zawartość |
|----------|-----------|
| [observation-forms.md](observation-forms.md) | Krótki opis scenariuszy, grup danych, różnic create vs edit, rekomendacje. |
| [zawodnik-obserwacje-wymagania-widoki.md](zawodnik-obserwacje-wymagania-widoki.md) | Scenariusze wejścia do formularza, widoki, ryzyka. |
| `Materials/observation-form-analysis.md` | Analiza formularzy nowej vs edycji, wspólny model danych, deduplikacja, mapowanie. |
| `Materials/Implementacja poprawy obserwacji/zadanie-2-implementacja-obserwacji.md` | Pełna specyfikacja: architektura formularzy, nagłówek meczu, pola uproszczony/rozszerzony, kryteria pozycyjne per pozycja, model danych, DoD. |
| `Materials/Formularz Ogólnej Obserwacji Zawodnika/Formularz Ogólnej Obserwacji.md` | Opis funkcjonalny, scenariusze, model zawodnika, struktura formularza, system ocen. |
| `Materials/Porownanie formularzy obserwacji/porownanie_formularzy_obserwacji.md` | Zestawienie danych obserwacji indywidualnej per pozycja (2/3, 4/5, 6, 7/11, 8, 9). |
| `scoutpro/supabase/migrations/` | Źródło prawdy dla schematu bazy (observations, match_observations, motor_evaluations, evaluation_criteria, observation_criterion_notes, categories). |

---

*Dokument utworzony na podstawie istniejącej dokumentacji i migracji. Przy zmianach w aplikacji lub w bazie należy zaktualizować odpowiednie sekcje tego pliku oraz powiązane materiały.*
