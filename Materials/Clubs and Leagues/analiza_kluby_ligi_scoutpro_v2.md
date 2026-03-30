# Analiza Biznesowa: Moduł Zarządzania Klubami i Ligami w ScoutPro

**Dokument:** Analiza funkcjonalna i architektoniczna  
**Wersja:** 2.0  
**Data:** 2025-03-19  
**Autor (rola):** Projektant / Architekt / Programista  
**Status:** Draft do przeglądu

---

## Spis treści

1. [Kontekst i motywacja](#1-kontekst-i-motywacja)
2. [Analiza obecnego stanu systemu (AS-IS)](#2-analiza-obecnego-stanu-systemu-as-is)
3. [Struktura lig i drużyn w Europie](#3-struktura-lig-i-dru%C5%BCyn-w-europie)
4. [Zakres funkcjonalny (TO-BE)](#4-zakres-funkcjonalny-to-be)
5. [Model danych](#5-model-danych)
6. [Logika przynależności klubowej i historyczności](#6-logika-przynale%C5%BCno%C5%9Bci-klubowej-i-historyczno%C5%9Bci)
7. [Strategia importu danych](#7-strategia-importu-danych)
8. [Automatyzacja: awanse / spadki](#8-automatyzacja-awanse--spadki)
9. [Interfejs użytkownika — wymagania UX](#9-interfejs-u%C5%BCytkownika--wymagania-ux)
10. [Architektura rozwiązania i API](#10-architektura-rozwi%C4%85zania-i-api)
11. [Plan wdrożenia — fazy](#11-plan-wdro%C5%BCenia--fazy)
12. [Obserwowane ligi — zakres początkowy (Senior)](#12-obserwowane-ligi--zakres-pocz%C4%85tkowy-senior)
13. [Pliki importu](#13-pliki-importu)
14. [Ryzyka i ograniczenia](#14-ryzyka-i-ograniczenia)
15. [Pytania otwarte](#15-pytania-otwarte)

---

## 1. Kontekst i motywacja

### 1.1 Problem biznesowy

ScoutPro rejestruje przynależność klubową zawodnika oraz ligę meczu jako **wolny tekst** (pola `Klub`, `Liga/ranga`, `Drużyna1/Drużyna2`). Skutki:

- **Brak spójności** — ten sam klub zapisywany jest różnymi nazwami (np. "Chemik Bydgoszcz" / "AP Chemik Bydgoszcz" / "Chemik Bydg.")
- **Brak hierarchii ligowej** — niemożliwe porównywanie kandydatów według poziomu rywalizacji
- **Brak historii transferów** — system nie śledzi, w jakim klubie i lidze zawodnik był w danym momencie
- **Brak kontekstu obserwacji** — ocena zawodnika powinna być interpretowana przez pryzmat poziomu ligi

### 1.2 Wartość biznesowa

| Interesariusz | Korzyść |
|---|---|
| Skaut | Szybki wybór drużyny z autocomplete — koniec z literówkami |
| Trener | Filtrowanie kandydatów wg ligi i jej poziomu |
| Dyrektor | KPI: skąd rekrutujemy, z jakich lig pochodzi potencjał |
| System | Podstawa pod scoring z uwzględnieniem poziomu rozgrywek |

---

## 2. Analiza obecnego stanu systemu (AS-IS)

### 2.1 Arkusze z polem "Klub" (wolny tekst)

| Arkusz | Kolumna | Uwagi |
|---|---|---|
| PRZETESTOWANI | Klub | Zawiera klub z okresu obserwacji |
| ZAPISANI | Klub | Zawiera klub z okresu obserwacji |
| ZAPROSZENIA | Klub | |
| OD TRENERÓW | Klub | |
| OD SKAUTÓW | Klub | |
| ZAWODNICY DO OBEJRZENIA | Klub | |
| DRUŻYNY DO OBEJRZENIA C.D. | Drużyna | |

### 2.2 Arkusze z polem "Liga" (wolny tekst)

| Arkusz | Kolumna | Przykładowe wartości |
|---|---|---|
| MECZE NA ŻYWO | Liga/ranga | "I liga okręgowa", "towarzyski", "n/d" |
| MECZE WIDEO | Liga/ranga | "CLJ U15", "Puchar Deyny" |
| SKAUCI - MECZE | Liga/ranga | "I liga okręgowa", "I liga wojewódzka" |

### 2.3 Zidentyfikowane problemy

| Problem | Wpływ | Priorytet |
|---|---|---|
| Brak normalizacji nazw klubów | Duplikaty, fałszywe statystyki | Krytyczny |
| Brak hierarchii ligowej | Niemożliwość porównań poziomowych | Wysoki |
| Brak sezonowości przypisania | Nieczytelna historia zawodnika | Wysoki |
| Brak powiązania mecz → drużyna → liga | Brak integralności danych | Średni |

---

## 3. Struktura lig i drużyn w Europie

### 3.1 Zasada piramidy ligowej

Każdy kraj posiada własną, niezależną hierarchię rozgrywek. Poziom "1" oznacza najwyższy szczebel krajowy.

```
Poziom 1 — Najwyższa liga krajowa (np. Ekstraklasa, Premier League, Bundesliga)
Poziom 2 — Druga liga krajowa
Poziom 3 — Trzecia liga / regionalne
Poziom 4+ — Niższe ligi / rozgrywki regionalne
```

### 3.2 Podział kategorii w systemie ScoutPro

System obsługuje dwie kategorie rozgrywek:

| Kategoria | Opis | Użycie |
|---|---|---|
| **Seniorzy** | Drużyny dorosłe, rozgrywki senior | Główny cel tego modułu |
| **Akademia** | Drużyny juniorskie U8–U19, CLJ, ligi okręgowe | Osobna gałąź struktury |

> **Zakres tej analizy:** Pełna implementacja modułu dla kategorii **Seniorzy** ze wskazaną listą lig. Akademia — w odrębnym dokumencie lub rozszerzeniu Fazy 4.

### 3.3 Ligi objęte obserwacją — Senior (zakres MVP)

Poniższe 37 lig stanowi zakres importu i obserwacji w ramach MVP modułu Senior:

| Kraj | Kod | Poziom | Nazwa wyświetlana | Liczba drużyn |
|---|---|---|---|---|
| Bułgaria | BG | 1 | efbet Liga - 1.liga | 14 |
| Cypr | CY | 1 | 1. Division - 1.liga | 14 |
| Czechy | CZ | 1 | Fortuna liga - 1.liga | 16 |
| Czechy | CZ | 2 | Fortuna:Národní liga - 2.liga | 16 |
| Dania | DK | 2 | 1. Division - 2.liga | 14 |
| Estonia | EE | 1 | Meistriliiga - 1.liga | 10 |
| Finlandia | FI | 1 | Veikkausliiga - 1.liga | 12 |
| Francja | FR | 3 | National - 3.liga | 18 |
| Gruzja | GE | 1 | Erovnuli Liga - 1.liga | 10 |
| Holandia | NL | 2 | Keuken Kampioen Divisie - 2.liga | 20 |
| Hiszpania | ES | 3 | Primera Federación - 3.liga | 20 |
| Hiszpania | ES | 4 | 2ª Federación Gr.1 - 4.liga | 18 |
| Litwa | LT | 1 | A Lyga - 1.liga | 10 |
| Łotwa | LV | 1 | Virslīga - 1.liga | 10 |
| Niemcy | DE | 3 | 3. Liga - 3.liga | 20 |
| Norwegia | NO | 1 | Eliteserien - 1.liga | 16 |
| Norwegia | NO | 2 | Obos-ligaen (1. divisjon) - 2.liga | 16 |
| Norwegia | NO | 3 | 2. divisjon - 3.liga | 16 |
| Polska | PL | 1 | PKO BP Ekstraklasa - 1.liga | 18 |
| Polska | PL | 2 | Betclic 1 Liga - 2.liga | 18 |
| Polska | PL | 3 | Betclic 2 Liga - 3.liga | 18 |
| Portugalia | PT | 2 | Liga Portugal 2 - 2.liga | 18 |
| Portugalia | PT | 3 | Liga 3 - 3.liga | 22 |
| Rumunia | RO | 1 | SuperLiga - 1.liga | 16 |
| Rumunia | RO | 2 | Casa Pariurilor Liga II - 2.liga | 18 |
| Serbia | RS | 1 | SuperLiga Srbije - 1.liga | 16 |
| Serbia | RS | 2 | Prva Liga Srbije - 2.liga | 16 |
| Słowacja | SK | 1 | Niké liga - 1.liga | 12 |
| Słowacja | SK | 2 | II. liga (SK) - 2.liga | 16 |
| Słowenia | SI | 1 | NLB liga (Prva liga) - 1.liga | 10 |
| Szwecja | SE | 1 | Allsvenskan - 1.liga | 16 |
| Szwecja | SE | 2 | Superettan - 2.liga | 16 |
| Szwecja | SE | 3 | Ettan Norra - 3.liga | 14 |
| Szwecja | SE | 3 | Ettan Södra - 3.liga | 14 |
| Ukraina | UA | 1 | УПЛ (Premier Liga) - 1.liga | 16 |
| Węgry | HU | 1 | OTP Bank Liga (NB I) - 1.liga | 12 |
| Węgry | HU | 2 | Nemzeti Bajnokság II - 2.liga | 14 |

**Łącznie: 37 lig, ~570 drużyn seniorskich**

> ⚠️ **Uwaga dotycząca danych:** Skład drużyn podany jest dla sezonu 2024/25. Przed importem produkcyjnym wymagana weryfikacja — awanse i spadki po zakończeniu sezonu mogą zmienić przynależność drużyn do lig.

---

## 4. Zakres funkcjonalny (TO-BE)

### 4.1 Moduły do implementacji

#### M1 — Kraje
- Predefiniowana lista krajów (ISO 3166-1 alpha-2)
- Flaga/emoji kraju wyświetlana w UI
- CRUD (admin)

#### M2 — Ligi i rozgrywki
- CRUD dla lig
- Atrybuty: kraj, poziom (int), typ (Liga/Puchar/Turniej/Towarzyski), kategoria (Seniorzy/Akademia), sponsor title, nazwa wyświetlana, sezon
- **Flaga "obserwowana"** — użytkownik/admin oznacza ligi, z których chce korzystać podczas obserwacji
- Import z CSV (jednorazowy bootstrap + aktualizacje sezonowe)

#### M3 — Drużyny
- CRUD dla drużyn
- Atrybuty: nazwa, liga_id (sezonowa przynależność), kraj, logo (url — przyszłość)
- **Przynależność do ligi jest sezonowa** — drużyna może zmieniać ligę po awansie/spadku
- Powiązanie wiele-do-wielu: drużyna × liga × sezon

#### M4 — Integracja z modułem Zawodnika
- Pole `aktualny_klub_id` (FK → drużyny)
- **Aktualizacja aktualnego klubu**: wyłącznie ręcznie na karcie zawodnika LUB przez integrację zewnętrzną
- Rejestracja obserwacji **NIE aktualizuje** aktualnego klubu zawodnika
- Historia przynależności klubowej — tabela `zawodnik_klub_historia`

#### M5 — Integracja z modułem Obserwacji
- Pole `druzyna_id` (FK → drużyny) — drużyna obserwowanego zawodnika w momencie obserwacji
- Snapshot: `liga_id`, `poziom_ligi`, `sezon` — zapisywane przy obserwacji i **niezmienne**
- Obserwacja opisuje stan faktyczny z dnia jej rejestracji

#### M6 — Panel konfiguracji lig (admin)
- Zarządzanie listą obserwowanych lig
- Aktualizacja składów lig po zakończeniu sezonu (awanse/spadki)
- Import/eksport CSV

### 4.2 User Stories

```
US-01: Jako skaut, przy rejestracji obserwacji wybieram kraj → ligę → drużynę
       z list rozwijanych (filtrowanych kaskadowo), aby nie wpisywać ręcznie.

US-02: Jako skaut, po wybraniu drużyny system automatycznie uzupełnia
       ligę i jej poziom — nie muszę tego wpisywać osobno.

US-03: Jako skaut, wybierając ligę widzę jej poziom w etykiecie,
       np. "PKO BP Ekstraklasa - 1.liga", aby szybko ocenić znaczenie informacji.

US-04: Jako trener, na liście zawodników mogę filtrować po lidze
       i poziomie, aby porównać kandydatów z podobnego szczebla rozgrywek.

US-05: Jako trener, na karcie zawodnika mogę ręcznie zaktualizować
       jego aktualny klub (np. po transferze), niezależnie od obserwacji.

US-06: Jako dyrektor, w dashboardzie widzę rozkład obserwowanych
       zawodników według kraju i poziomu ligi (mapa funnel-ligowego).

US-07: Jako administrator, po zakończeniu sezonu aktualizuję
       składy lig (awanse/spadki) przez import CSV lub ręczne edycje,
       bez ingerencji w historyczne dane obserwacji.

US-08: Jako administrator, wybieram które ligi są "obserwowane"
       i dostępne skautom przy rejestracji, aby nie zaśmiecać list
       nieaktywnymi rozgrywkami.
```

---

## 5. Model danych

### 5.1 Diagram encji (ERD)

```
┌──────────┐     ┌─────────────────┐     ┌──────────────────────┐
│  KRAJE   │────<│     LIGI        │────<│  DRUZYNA_LIGA_SEZON  │
│          │     │                 │     │                      │
│ id       │     │ id              │     │ id                   │
│ nazwa    │     │ nazwa           │     │ druzyna_id (FK)      │
│ kod_iso  │     │ kraj_id (FK)    │     │ liga_id (FK)         │
│ emoji    │     │ poziom (int)    │     │ sezon                │
└──────────┘     │ typ_rozgrywek   │     │ aktywna (bool)       │
                 │ kategoria       │     └──────────────────────┘
                 │ sponsor_title   │              │
                 │ nazwa_display   │              │
                 │ obserwowana     │     ┌────────┘
                 │ sezon_aktywny   │     ▼
                 └─────────────────┘  ┌───────────────┐
                                      │   DRUZYNY     │
                                      │               │
                                      │ id            │
                                      │ nazwa         │
                                      │ kraj_id (FK)  │
                                      │ logo_url      │
                                      │ aktywna       │
                                      │ zewnetrzne_id │
                                      └───────────────┘
                                             │
                    ┌────────────────────────┤
                    │                        │
                    ▼                        ▼
           ┌──────────────┐     ┌──────────────────────────┐
           │  ZAWODNICY   │     │     OBSERWACJE           │
           │              │     │                          │
           │ id           │     │ id                       │
           │ imie         │     │ zawodnik_id (FK)         │
           │ nazwisko     │     │ druzyna_id (FK)          │◄── snapshot z dnia obs.
           │ aktualny_    │     │ liga_id_snapshot (FK)    │
           │  klub_id(FK) │     │ poziom_snapshot (int)    │
           └──────────────┘     │ sezon_snapshot           │
                    │           │ data_obserwacji          │
                    ▼           └──────────────────────────┘
           ┌────────────────────────────┐
           │  ZAWODNIK_KLUB_HISTORIA    │
           │                            │
           │ id                         │
           │ zawodnik_id (FK)           │
           │ druzyna_id (FK)            │
           │ liga_id (FK)               │
           │ poziom_ligi (int)          │
           │ sezon                      │
           │ data_od                    │
           │ data_do (NULL = aktualny)  │
           │ zrodlo (ręczny/integracja) │
           └────────────────────────────┘
```

### 5.2 Definicje tabel

#### `ligi`
| Kolumna | Typ | Opis |
|---|---|---|
| `id` | VARCHAR(20) | Klucz: np. `PL-SEN-1`, `DE-SEN-3` |
| `nazwa` | VARCHAR(200) | Oficjalna nazwa |
| `sponsor_title` | VARCHAR(200) | Nazwa z tytułem sponsora, np. "PKO BP Ekstraklasa" |
| `nazwa_display` | VARCHAR(200) | Format UI: "PKO BP Ekstraklasa - 1.liga" |
| `kraj_id` | FK → kraje | Kraj organizatora |
| `poziom` | INT | 1 = najwyższy szczebel |
| `typ_rozgrywek` | ENUM | `Liga`, `Puchar`, `Turniej`, `Towarzyski` |
| `kategoria` | ENUM | `Seniorzy`, `Akademia` |
| `obserwowana` | BOOL | Czy liga dostępna w listach UI |
| `sezon_aktywny` | VARCHAR(10) | np. `2025/2026` |
| `grupa` | VARCHAR(50) | Dla lig z grupami, np. "Norra", "Grupo 1" |
| `zewnetrzne_id` | VARCHAR | ID w zewnętrznym API (na przyszłość) |

#### `druzyny`
| Kolumna | Typ | Opis |
|---|---|---|
| `id` | INT/UUID | Klucz główny |
| `nazwa` | VARCHAR(200) | Oficjalna nazwa drużyny |
| `kraj_id` | FK → kraje | Kraj siedziby |
| `logo_url` | VARCHAR | URL do logo (null = brak) |
| `aktywna` | BOOL | Czy drużyna aktywna w systemie |
| `zewnetrzne_id` | VARCHAR | ID w zewnętrznym systemie |

#### `druzyna_liga_sezon`
| Kolumna | Typ | Opis |
|---|---|---|
| `id` | INT | Klucz główny |
| `druzyna_id` | FK → druzyny | Drużyna |
| `liga_id` | FK → ligi | Liga |
| `sezon` | VARCHAR(10) | np. `2025/2026` |
| `aktywna` | BOOL | Aktywne przypisanie |

> **Reguła:** Jedna drużyna może być przypisana do różnych lig w różnych sezonach. Zmiana ligi (awans/spadek) = nowy rekord z nowym sezonem.

#### `zawodnik_klub_historia`
| Kolumna | Typ | Opis |
|---|---|---|
| `id` | INT | Klucz główny |
| `zawodnik_id` | FK → zawodnicy | Zawodnik |
| `druzyna_id` | FK → druzyny | Drużyna (snapshot FK) |
| `liga_id` | FK → ligi | Liga w tym momencie (snapshot) |
| `poziom_ligi` | INT | Poziom ligi (snapshot — niezmienny) |
| `sezon` | VARCHAR(10) | Sezon (snapshot) |
| `data_od` | DATE | Data rozpoczęcia w tym klubie |
| `data_do` | DATE, NULL | NULL = aktualny klub |
| `zrodlo` | ENUM | `reczny`, `integracja` |

---

## 6. Logika przynależności klubowej i historyczności

### 6.1 Zasady biznesowe (ZMIANA względem v1)

> **Reguła 1 — Aktualny klub:** Pole `aktualny_klub_id` zawodnika jest aktualizowane wyłącznie:  
> a) ręcznie przez użytkownika na **karcie zawodnika**  
> b) automatycznie przez **integrację zewnętrzną** (transfer API)  
>
> ⛔ **Rejestracja obserwacji NIE aktualizuje aktualnego klubu zawodnika.**

> **Reguła 2 — Obserwacja jako snapshot:** Obserwacja rejestruje drużynę, ligę i poziom z **daty obserwacji**. Te dane są niezmienne — awans drużyny po sezonie nie zmienia historycznych obserwacji.

> **Reguła 3 — Historia niezmieniona:** Stare wpisy historyczne nie są modyfikowane. Zmiana klubu = nowy rekord z `data_od`, poprzedni otrzymuje `data_do`.

> **Reguła 4 — Liga jako kontekst obserwacji:** Obserwacja zawodnika w meczu zawiera informację o drużynie obserwowanego, a nie drużynach meczu. Mecz może łączyć dwie różne drużyny — obserwowany zawodnik jest w jednej z nich.

### 6.2 Schemat aktualizacji aktualnego klubu (ręczny)

```
AKCJA UŻYTKOWNIKA na karcie zawodnika:
  "Zmień aktualny klub" → wybór drużyny z listy

SYSTEM:
  1. Odczytaj obecny wpis w zawodnik_klub_historia (data_do IS NULL)
  2. IF druzyna_id różni się:
     a. Ustaw data_do = DZISIAJ na aktualnym wpisie
     b. Utwórz nowy wpis: druzyna_id, liga_id, poziom, sezon, data_od=DZISIAJ, data_do=NULL, zrodlo='reczny'
  3. Zaktualizuj zawodnicy.aktualny_klub_id
```

### 6.3 Rejestracja obserwacji — logika drużyny

```
AKCJA UŻYTKOWNIKA w formularzu obserwacji:
  Wybór: kraj → liga → drużyna obserwowanego

SYSTEM przy zapisie obserwacji:
  1. Zapisz druzyna_id na obserwacji
  2. Zapisz snapshot: liga_id_snapshot, poziom_snapshot, sezon_snapshot
  3. NIE modyfikuj zawodnicy.aktualny_klub_id
  4. NIE twórz wpisu w zawodnik_klub_historia
```

### 6.4 Widok historii zawodnika

| Sezon | Drużyna | Liga | Poziom | Data od | Data do | Źródło |
|---|---|---|---|---|---|---|
| 2024/25 | Lech Poznań | PKO BP Ekstraklasa | 1 | 2024-07-01 | 2025-01-31 | integracja |
| 2024/25 | Cracovia Kraków | Betclic 1 Liga | 2 | 2025-02-01 | NULL | ręczny |

---

## 7. Strategia importu danych

### 7.1 Bootstrap jednorazowy (MVP)

```
Krok 1 — Import lig (plik: import_ligi_senior.csv)
  → 37 lig dla kategorii Seniorzy
  → Weryfikacja: nazwy oficjalne, poziomy, flaga "obserwowana"

Krok 2 — Import drużyn (plik: import_druzyny_senior.csv)
  → ~570 drużyn senior z 37 lig
  → Dane bazowe: sezon 2024/25
  → WYMAGANA WERYFIKACJA przed importem na produkcję

Krok 3 — Normalizacja istniejących danych
  → Fuzzy matching: stare nazwy klubów w Excel → nowe ID drużyn
  → Skrypt generuje plik mapowania + % pewności dopasowania
  → Admin weryfikuje i zatwierdza mapowanie
  → Jednorazowe wypełnienie FK w tabelach historycznych
```

### 7.2 Cykl aktualizacji sezonowej

```
KONIEC SEZONU (czerwiec/lipiec każdego roku):
  1. Admin pobiera zaktualizowany plik CSV z awansami/spadkami
     LUB ręcznie edytuje przypisania drużyn do lig
  2. Import: nowe wpisy w druzyna_liga_sezon (nowy sezon)
  3. Stare przypisania nie są kasowane — zostają z sezonem historycznym
  4. Aktualizacja flagi liga.sezon_aktywny
```

### 7.3 Format pliku CSV (specyfikacja)

#### `import_ligi_senior.csv`
```csv
liga_id,kraj_pl,kraj_iso,kraj_en,poziom,nazwa_oficjalna,nazwa_pl,nazwa_wyswietlana,grupa,obserwowana,kategoria,uwagi
PL-SEN-1,Polska,PL,Poland,1,PKO BP Ekstraklasa,PKO BP Ekstraklasa,PKO BP Ekstraklasa - 1.liga,,TAK,Seniorzy,Dane wg sezonu 2024/25
PL-SEN-2,Polska,PL,Poland,2,Betclic 1 Liga,Betclic 1 Liga,Betclic 1 Liga - 2.liga,,TAK,Seniorzy,Dane wg sezonu 2024/25
DE-SEN-3,Niemcy,DE,Germany,3,3. Liga,Trzecia Liga Niemiec,3. Liga - 3.liga,,TAK,Seniorzy,Dane wg sezonu 2024/25
...
```

#### `import_druzyny_senior.csv`
```csv
liga_id,kraj_pl,kraj_iso,poziom,liga_nazwa_wyswietlana,nazwa_druzyny,kategoria,aktywna,uwagi
PL-SEN-1,Polska,PL,1,PKO BP Ekstraklasa - 1.liga,Legia Warszawa,Seniorzy,TAK,Dane wg sezonu 2024/25
PL-SEN-1,Polska,PL,1,PKO BP Ekstraklasa - 1.liga,Lech Poznań,Seniorzy,TAK,Dane wg sezonu 2024/25
...
```

---

## 8. Automatyzacja: awanse / spadki

### 8.1 Problem

Po każdym sezonie drużyny zmieniają ligę (awanse/spadki). System musi umożliwiać aktualizację tej informacji **bez ingerencji w dane historyczne**.

### 8.2 Podejście — 3 opcje

#### Opcja A: Ręczna aktualizacja przez admina (MVP — rekomendowana)
- Admin edytuje przypisania w panelu administracyjnym
- Lub importuje CSV z nowym sezonem
- **Koszt implementacji:** niski
- **Ryzyko:** czasochłonne raz w roku, podatne na błędy ludzkie

#### Opcja B: Import CSV przygotowanego zewnętrznie (sezonowy)
- Przed startem sezonu admin importuje plik CSV ze składami lig
- System waliduje CSV i prezentuje diff (co się zmieniło vs poprzedni sezon) do zatwierdzenia
- **Koszt implementacji:** średni
- **Rekomendacja:** target dla Fazy 3

#### Opcja C: Integracja z zewnętrznym API (pełna automatyzacja)
- Połączenie z API dostarczającym dane ligowe (football-data.org, API-Football, Transfermarkt)
- Automatyczne pobieranie składów lig na początku sezonu
- Automatyczne alerty przy wykryciu zmiany ligowej drużyny
- **Koszt implementacji:** wysoki (subskrypcja API + dev)
- **Rekomendacja:** Faza 4 / opcjonalna

### 8.3 Mechanizm sezonowych aktualizacji (Opcja B — target)

```
FLOW AKTUALIZACJI SEZONU:
  1. Admin wchodzi do Ustawienia > Ligi > Aktualizacja Sezonu
  2. Wgrywa plik CSV lub wpisuje nowy sezon ręcznie
  3. System generuje raport diff:
     ── Drużyny które awansowały (zmiana ligi na wyższy poziom)
     ── Drużyny które spadły (zmiana ligi na niższy poziom)
     ── Nowe drużyny w lidze
     ── Drużyny, które wyszły z ligi
  4. Admin zatwierdza lub koryguje zmiany
  5. System tworzy nowe wpisy druzyna_liga_sezon (nowy sezon)
  6. Stare wpisy pozostają bez zmian
  7. Zawodnicy z historyczną obserwacją w starej lidze — dane nienaruszone
```

### 8.4 Wpływ zmiany ligi na dane zawodnika

```
Scenariusz: Drużyna X awansuje z Betclic 2 Liga do Betclic 1 Liga

Dane zachowane bez zmian:
  ✓ Obserwacja zawodnika z 2024 (liga: Betclic 2 Liga, poziom: 3) — niezmieniona
  ✓ Historia przynależności klubowej (liga: Betclic 2 Liga, sezon 2024/25) — niezmieniona

Dane zaktualizowane:
  → druzyna_liga_sezon: nowy wpis (sezon 2025/26, liga: Betclic 1 Liga)
  → Aktualny klub zawodnika: aktualizowany WYŁĄCZNIE ręcznie lub przez integrację
```

---

## 9. Interfejs użytkownika — wymagania UX

### 9.1 Formularz obserwacji — pola klubowe

**Kaskadowy wybór: Kraj → Liga → Drużyna**

```
┌────────────────────────────────────────────────────────────────────┐
│ DRUŻYNA OBSERWOWANEGO ZAWODNIKA                                    │
├─────────────────┬──────────────────────────────────────────────────┤
│ 🌍 Kraj         │ [🇵🇱 Polska            ▼]  [🇩🇪 Niemcy ▼]  ...   │
├─────────────────┼──────────────────────────────────────────────────┤
│ 🏆 Liga         │ [PKO BP Ekstraklasa - 1.liga           ▼]        │
│                 │  tylko ligi z wybranego kraju, oznaczone jako    │
│                 │  "obserwowane", posortowane po poziomie          │
├─────────────────┼──────────────────────────────────────────────────┤
│ ⚽ Drużyna      │ [Legia Warszawa                         ▼]        │
│                 │  tylko drużyny z wybranej ligi (filtr)           │
│                 │  + opcja "Brak na liście" → pole tekstowe        │
└─────────────────┴──────────────────────────────────────────────────┘
```

**Zachowanie:**
- Wybór drużyny → liga uzupełnia się automatycznie (pre-fill)
- Wybór ligi → lista drużyn zawęża się do tej ligi
- Pole `Kraj` z flagami emoji dla szybkiej identyfikacji
- Pole `Liga` wyświetla poziom: "PKO BP Ekstraklasa - 1.liga"
- Domyślny kraj: ostatnio użyty przez skauta (z localStorage / profilu)

### 9.2 Etykieta kontrolki "Liga" — format wyświetlania

```
Format: {SPONSOR_TITLE} - {N}.liga
Przykłady:
  PKO BP Ekstraklasa - 1.liga
  Betclic 1 Liga - 2.liga
  Betclic 2 Liga - 3.liga
  3. Liga - 3.liga            (Niemcy)
  Fortuna liga - 1.liga       (Czechy)
  Allsvenskan - 1.liga        (Szwecja)
  Ettan Norra - 3.liga        (Szwecja, gr. Norra)
  Ettan Södra - 3.liga        (Szwecja, gr. Södra)
```

> Dla lig z grupami (np. Szwecja Ettan, Betclic 3 Liga) — nazwa grupy ujęta w nazwie wyświetlanej.

### 9.3 Karta zawodnika — sekcja "Aktualny klub"

```
┌─────────────────────────────────────────────────────┐
│ AKTUALNY KLUB                                        │
├─────────────────────────────────────────────────────┤
│ ⚽  Legia Warszawa                                   │
│ 🏆  PKO BP Ekstraklasa - 1.liga  🇵🇱 Polska          │
│ 📅  od: 01.07.2024                                   │
│                                                      │
│ [✏️ Zmień klub]    [📋 Historia klubów]              │
└─────────────────────────────────────────────────────┘
```

**Akcja "Zmień klub":**
- Otwiera modal z kaskadowym selektorem Kraj → Liga → Drużyna
- Po zapisaniu: tworzy nowy wpis historyczny, data_od = dzisiaj
- Wyświetla ostrzeżenie: "Zmiana aktualnego klubu nie wpływa na historię obserwacji"

### 9.4 Historia klubów zawodnika

```
┌───────────────────────────────────────────────────────────────────┐
│ Historia przynależności klubowej                                   │
├──────────┬──────────────────┬──────────────────┬──────┬───────────┤
│ Sezon    │ Drużyna          │ Liga             │ Poz. │ Źródło    │
├──────────┼──────────────────┼──────────────────┼──────┼───────────┤
│ 2025/26  │ Legia Warszawa   │ Ekstraklasa 1.l  │  1  ●│ integracja│
│ 2024/25  │ Lech Poznań      │ Ekstraklasa 1.l  │  1   │ ręczny    │
│ 2023/24  │ Lech Poznań      │ Ekstraklasa 1.l  │  1   │ integracja│
└──────────┴──────────────────┴──────────────────┴──────┴───────────┘
● = aktualny                                        [+ Dodaj ręcznie]
```

### 9.5 Panel konfiguracji lig (admin)

```
Ustawienia > Struktura Ligowa

[Seniorzy] [Akademia]

┌─────────────────────────────────────────────────────────────────────┐
│ Obserwowane ligi — Seniorzy                                          │
│                                         [Import CSV] [Eksport CSV]  │
├───┬───────────────────────────────┬─────┬──────┬────────────────────┤
│ ✓ │ Liga                          │ Kraj│ Poz. │ Drużyny            │
├───┼───────────────────────────────┼─────┼──────┼────────────────────┤
│ ✓ │ PKO BP Ekstraklasa - 1.liga   │ 🇵🇱  │  1   │ 18 drużyn    [▶]  │
│ ✓ │ Betclic 1 Liga - 2.liga       │ 🇵🇱  │  2   │ 18 drużyn    [▶]  │
│ ✓ │ 3. Liga - 3.liga              │ 🇩🇪  │  3   │ 20 drużyn    [▶]  │
│ ✗ │ Allsvenskan - 1.liga          │ 🇸🇪  │  1   │ 16 drużyn    [▶]  │
└───┴───────────────────────────────┴─────┴──────┴────────────────────┘
[✓/✗] toggle = włącz/wyłącz ligę z list wyboru dla skautów
[▶] = otwiera listę drużyn w tej lidze (edycja, aktualizacja sezonu)
```

### 9.6 Widok obserwacji — wyświetlanie ligi

Na liście obserwacji i karcie obserwacji liga wyświetlana z:
- Ikoną flagi kraju
- Nazwą wyświetlaną z poziomem: "PKO BP Ekstraklasa - 1.liga"
- (Przyszłość) Logo drużyny obok nazwy

---

## 10. Architektura rozwiązania i API

### 10.1 Zmiany w bazie danych

#### Nowe tabele:
```sql
CREATE TABLE kraje (
  id VARCHAR(3) PRIMARY KEY,   -- ISO alpha-2: PL, DE, ...
  nazwa_pl VARCHAR(100),
  nazwa_en VARCHAR(100),
  emoji VARCHAR(10)
);

CREATE TABLE ligi (
  id VARCHAR(20) PRIMARY KEY,  -- np. PL-SEN-1
  nazwa VARCHAR(200),
  sponsor_title VARCHAR(200),
  nazwa_display VARCHAR(200),  -- "PKO BP Ekstraklasa - 1.liga"
  kraj_id VARCHAR(3) REFERENCES kraje(id),
  poziom INT NOT NULL,
  typ_rozgrywek VARCHAR(20),   -- Liga/Puchar/Turniej/Towarzyski
  kategoria VARCHAR(20),       -- Seniorzy/Akademia
  obserwowana BOOLEAN DEFAULT FALSE,
  sezon_aktywny VARCHAR(10),
  grupa VARCHAR(50),
  zewnetrzne_id VARCHAR(100)
);

CREATE TABLE druzyny (
  id SERIAL PRIMARY KEY,
  nazwa VARCHAR(200) NOT NULL,
  kraj_id VARCHAR(3) REFERENCES kraje(id),
  logo_url VARCHAR(500),
  aktywna BOOLEAN DEFAULT TRUE,
  zewnetrzne_id VARCHAR(100)
);

CREATE TABLE druzyna_liga_sezon (
  id SERIAL PRIMARY KEY,
  druzyna_id INT REFERENCES druzyny(id),
  liga_id VARCHAR(20) REFERENCES ligi(id),
  sezon VARCHAR(10) NOT NULL,
  aktywna BOOLEAN DEFAULT TRUE,
  UNIQUE(druzyna_id, liga_id, sezon)
);

CREATE TABLE zawodnik_klub_historia (
  id SERIAL PRIMARY KEY,
  zawodnik_id INT REFERENCES zawodnicy(id),
  druzyna_id INT REFERENCES druzyny(id),
  liga_id VARCHAR(20) REFERENCES ligi(id),
  poziom_ligi INT,
  sezon VARCHAR(10),
  data_od DATE NOT NULL,
  data_do DATE,
  zrodlo VARCHAR(20) DEFAULT 'reczny'  -- reczny/integracja
);
```

#### Modyfikacje istniejących tabel:
```sql
-- Tabela zawodnicy:
ALTER TABLE zawodnicy
  ADD COLUMN aktualny_klub_id INT REFERENCES druzyny(id),
  ADD COLUMN aktualny_klub_text VARCHAR(200);  -- zachować na czas migracji

-- Tabela obserwacje:
ALTER TABLE obserwacje
  ADD COLUMN druzyna_id INT REFERENCES druzyny(id),
  ADD COLUMN liga_id_snapshot VARCHAR(20) REFERENCES ligi(id),
  ADD COLUMN poziom_snapshot INT,
  ADD COLUMN sezon_snapshot VARCHAR(10),
  ADD COLUMN druzyna_text VARCHAR(200);  -- zachować na czas migracji
```

### 10.2 API Endpoints

```
# Słowniki (publiczne / autentykowane)
GET  /api/v1/kraje                              Lista krajów z ligami obserwowanymi
GET  /api/v1/ligi?kraj=PL&kategoria=Seniorzy    Lista lig (filtr kaskadowy)
GET  /api/v1/ligi/:id/druzyny?sezon=2025/2026   Drużyny w lidze
GET  /api/v1/druzyny/search?q=Legia&kraj=PL     Autocomplete drużyn

# Zawodnik — klub
GET  /api/v1/zawodnicy/:id/aktualny-klub         Aktualny klub zawodnika
PUT  /api/v1/zawodnicy/:id/aktualny-klub         Zmiana aktualnego klubu (ręczna)
GET  /api/v1/zawodnicy/:id/historia-klubow       Historia przynależności

# Admin
POST /api/v1/admin/import/ligi                  Import CSV lig
POST /api/v1/admin/import/druzyny               Import CSV drużyn
POST /api/v1/admin/ligi/:id/aktualizuj-sezon    Aktualizacja składu ligi
PUT  /api/v1/admin/ligi/:id/obserwowana         Toggle obserwacja ligi
GET  /api/v1/admin/ligi/:id/diff?sezon=2025/26  Podgląd zmian vs poprzedni sezon
```

---

## 11. Plan wdrożenia — fazy

### Faza 1 — Dane i przygotowanie (1-2 tygodnie, bez dev)

| Zadanie | Wykonawca | Output |
|---|---|---|
| Weryfikacja CSV lig przed importem (skład sezonowy) | Przemek | `import_ligi_senior_verified.csv` |
| Weryfikacja CSV drużyn (awanse/spadki 2024/25) | Przemek | `import_druzyny_senior_verified.csv` |
| Ustalenie formatu `nazwa_display` dla Akademii | Przemek | Decyzja |
| Odpowiedzi na pytania otwarte (sekcja 15) | Przemek | Decyzja |

### Faza 2 — Backend (3-4 tygodnie)

| Zadanie | Priorytet |
|---|---|
| Migracja DB: nowe tabele | Krytyczny |
| Import CSV: ligi + drużyny | Krytyczny |
| API: kaskadowy select (kraj→liga→drużyna) | Krytyczny |
| Logika zmiany aktualnego klubu + historia | Wysoki |
| Snapshot przy zapisie obserwacji | Wysoki |
| Skrypt fuzzy-match normalizacji starych danych | Wysoki |
| API admin: import CSV, toggle obserwowana | Średni |

### Faza 3 — Frontend (2-3 tygodnie)

| Zadanie | Priorytet |
|---|---|
| Kaskadowy select w formularzu obserwacji | Krytyczny |
| Sekcja "Aktualny klub" na karcie zawodnika | Krytyczny |
| Historia klubów na karcie zawodnika | Wysoki |
| Panel admin: zarządzanie ligami i drużynami | Wysoki |
| Filtry po lidze/poziomie w widoku pipeline | Średni |

### Faza 4 — Rozszerzenia (opcjonalne, przyszłość)

| Zadanie | Uwagi |
|---|---|
| Automatyczna aktualizacja sezonu z API zewnętrznego | Integracja API-Football lub football-data.org |
| Logo drużyn | Import z zewnętrznego źródła lub ręczny upload |
| Moduł Akademia — ligi juniorskie PL | Odrębna specyfikacja |
| Rozszerzenie geograficzne (poza Europą) | Na żądanie |

---

## 12. Obserwowane ligi — zakres początkowy (Senior)

Lista 37 lig przekazana przez użytkownika jako zakres obserwacji w MVP. Wszystkie ligi mają ustawioną flagę `obserwowana = TAK`.

> Dane oparte na sezonie 2024/25. **Wymagana weryfikacja przed importem produkcyjnym.**

| ID | Kraj | Poziom | Nazwa wyświetlana | Liczba drużyn (2024/25) |
|---|---|---|---|---|
| BG-SEN-1 | 🇧🇬 Bułgaria | 1 | efbet Liga - 1.liga | 14 |
| CY-SEN-1 | 🇨🇾 Cypr | 1 | 1. Division - 1.liga | 14 |
| CZ-SEN-1 | 🇨🇿 Czechy | 1 | Fortuna liga - 1.liga | 16 |
| CZ-SEN-2 | 🇨🇿 Czechy | 2 | Fortuna:Národní liga - 2.liga | 16 |
| DK-SEN-2 | 🇩🇰 Dania | 2 | 1. Division - 2.liga | 14 |
| EE-SEN-1 | 🇪🇪 Estonia | 1 | Meistriliiga - 1.liga | 10 |
| FI-SEN-1 | 🇫🇮 Finlandia | 1 | Veikkausliiga - 1.liga | 12 |
| FR-SEN-3 | 🇫🇷 Francja | 3 | National - 3.liga | 18 |
| GE-SEN-1 | 🇬🇪 Gruzja | 1 | Erovnuli Liga - 1.liga | 10 |
| NL-SEN-2 | 🇳🇱 Holandia | 2 | Keuken Kampioen Divisie - 2.liga | 20 |
| ES-SEN-3 | 🇪🇸 Hiszpania | 3 | Primera Federación - 3.liga | 20 |
| ES-SEN-4-G1 | 🇪🇸 Hiszpania | 4 | 2ª Federación Gr.1 - 4.liga | 18 |
| LT-SEN-1 | 🇱🇹 Litwa | 1 | A Lyga - 1.liga | 10 |
| LV-SEN-1 | 🇱🇻 Łotwa | 1 | Virslīga - 1.liga | 10 |
| DE-SEN-3 | 🇩🇪 Niemcy | 3 | 3. Liga - 3.liga | 20 |
| NO-SEN-1 | 🇳🇴 Norwegia | 1 | Eliteserien - 1.liga | 16 |
| NO-SEN-2 | 🇳🇴 Norwegia | 2 | Obos-ligaen (1. divisjon) - 2.liga | 16 |
| NO-SEN-3 | 🇳🇴 Norwegia | 3 | 2. divisjon - 3.liga | 16 |
| PL-SEN-1 | 🇵🇱 Polska | 1 | PKO BP Ekstraklasa - 1.liga | 18 |
| PL-SEN-2 | 🇵🇱 Polska | 2 | Betclic 1 Liga - 2.liga | 18 |
| PL-SEN-3 | 🇵🇱 Polska | 3 | Betclic 2 Liga - 3.liga | 18 |
| PT-SEN-2 | 🇵🇹 Portugalia | 2 | Liga Portugal 2 - 2.liga | 18 |
| PT-SEN-3 | 🇵🇹 Portugalia | 3 | Liga 3 - 3.liga | 22 |
| RO-SEN-1 | 🇷🇴 Rumunia | 1 | SuperLiga - 1.liga | 16 |
| RO-SEN-2 | 🇷🇴 Rumunia | 2 | Casa Pariurilor Liga II - 2.liga | 18 |
| RS-SEN-1 | 🇷🇸 Serbia | 1 | SuperLiga Srbije - 1.liga | 16 |
| RS-SEN-2 | 🇷🇸 Serbia | 2 | Prva Liga Srbije - 2.liga | 16 |
| SK-SEN-1 | 🇸🇰 Słowacja | 1 | Niké liga - 1.liga | 12 |
| SK-SEN-2 | 🇸🇰 Słowacja | 2 | II. liga (SK) - 2.liga | 16 |
| SI-SEN-1 | 🇸🇮 Słowenia | 1 | NLB liga (Prva liga) - 1.liga | 10 |
| SE-SEN-1 | 🇸🇪 Szwecja | 1 | Allsvenskan - 1.liga | 16 |
| SE-SEN-2 | 🇸🇪 Szwecja | 2 | Superettan - 2.liga | 16 |
| SE-SEN-3-N | 🇸🇪 Szwecja | 3 | Ettan Norra - 3.liga | 14 |
| SE-SEN-3-S | 🇸🇪 Szwecja | 3 | Ettan Södra - 3.liga | 14 |
| UA-SEN-1 | 🇺🇦 Ukraina | 1 | УПЛ (Premier Liga) - 1.liga | 16 |
| HU-SEN-1 | 🇭🇺 Węgry | 1 | OTP Bank Liga (NB I) - 1.liga | 12 |
| HU-SEN-2 | 🇭🇺 Węgry | 2 | Nemzeti Bajnokság II - 2.liga | 14 |

---

## 13. Pliki importu

Do niniejszej analizy dołączone są dwa gotowe pliki CSV:

| Plik | Zawartość | Liczba rekordów |
|---|---|---|
| `import_ligi_senior.csv` | Definicje 37 lig (ID, kraj, poziom, nazwy, flagi) | 37 |
| `import_druzyny_senior.csv` | Drużyny seniorskie z 37 lig | ~570 |

> ⚠️ **Przed importem produkcyjnym:** Pliki wymagają weryfikacji składu drużyn pod kątem aktualności (awanse/spadki z sezonu 2024/25). Błędy w danych mogą skutkować niepoprawnymi podpowiedziami w formularzach skautów.

---

## 14. Ryzyka i ograniczenia

| Ryzyko | Praw. | Wpływ | Mitygacja |
|---|---|---|---|
| Skład lig w CSV nieaktualny po zakończeniu sezonu | Wysokie | Wysoki | Weryfikacja przed importem; coroczna aktualizacja |
| Skauci wybierają "złą" drużynę z listy | Średnie | Średni | Opcja "Brak na liście" + raport anomalii |
| Segunda Federación (ES) ma wiele grup regionalnych | Pewne | Średni | W MVP tylko Grupo 1; rozszerzenie na żądanie |
| Ettan (SE) ma dwie grupy: Norra i Södra | Uwzględnione | Niski | Dwie osobne ligi w systemie |
| Dania level 2 = 1. division (top liga to Superliga) | Uwzględnione | Niski | Poziom odzwierciedla miejsce w piramidzie |
| Ukraina — niestabilne rozgrywki przez sytuację wojenną | Średnie | Niski | Dane mogą być niepełne; admin weryfikuje |
| Sponsor tytuł ligi zmienia się co sezon | Pewne | Niski | Pole `sponsor_title` edytowalne; nie wpływa na ID |

---

## 15. Pytania otwarte

Wymagają odpowiedzi przed startem Fazy 2:

**P1.** Czy obserwacja powinna zapisywać drużynę **zawodnika** (w której on gra), czy drużynę **meczu** (obie grające drużyny)? → **Kluczowe dla modelu** — aktualnie zakładam: drużyna zawodnika.

**P2.** Czy system ma obsługiwać jednocześnie **wiele aktywnych sezonów** (np. 2024/25 + 2025/26), czy zawsze tylko jeden aktywny sezon?

**P3.** Dla Hiszpanii (level 4, Segunda Federación) — **ile grup regionalnych** ma być obserwowanych? W przesłanej liście jest 1 wpis na level 4, a liga ma 4-5 grup.

**P4.** Czy **logo drużyny** wchodzi w scope MVP, czy dopiero Fazy 4?

**P5.** Kto ma uprawnienia do **dodawania nowych drużyn** poza listą importu — tylko admin, czy skaut może zaproponować nową drużynę (z flagą do weryfikacji)?

**P6.** Czy moduł **Akademia** (ligi juniorskie: CLJ, ligi okręgowe) ma być objęty tym samym sprintem implementacyjnym, czy osobnym?

**P7.** Czy integracja z zewnętrznym **API ligowym** jest w roadmapie na 12 miesięcy? (Wpływa na projektowanie `zewnetrzne_id` i struktury integracyjnej.)

---

*Dokument przygotowany przez Claude (Anthropic) w roli Projektanta / Architekta / Programisty na zlecenie ScoutPro.*  
*Wersja 2.0 — uwzględnia wymagania dotyczące lig seniorskich, obserwowanych lig, kaskadowego UI, historyczności oraz automatyzacji aktualizacji sezonowych.*
