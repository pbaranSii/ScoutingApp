# 🚀 CURSOR PROMPT - ScoutPro Scouting System
# ═══════════════════════════════════════════════════════════════
# Wklej cały ten plik do Cursor Chat (Cmd+L / Ctrl+L)
# ═══════════════════════════════════════════════════════════════

Jesteś senior full-stack developerem. Twoim zadaniem jest zbudowanie aplikacji ScoutPro - mobilnego systemu scoutingowego dla akademii piłkarskiej.

## KONTEKST PROJEKTU

Budujesz MVP aplikacji PWA (Progressive Web App) do:
- Rejestrowania obserwacji zawodników podczas meczów (działa offline!)
- Tworzenia profili zawodników 360° 
- **Dodawania nowych zawodników do bazy (z obserwacją LUB bez obserwacji)**
- Zarządzania pipeline rekrutacyjnym (Kanban: Observed → Shortlist → Trial → Offer → Signed)
- Dashboardów z KPIs

## STOS TECHNOLOGICZNY (OBOWIĄZKOWY)

Frontend:
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router v6, Zustand, React Query (TanStack Query)
- React Hook Form + Zod (walidacja)
- Dexie.js (IndexedDB dla offline), vite-plugin-pwa

Backend:
- Supabase (PostgreSQL + Auth + Storage + Realtime)

## WYMAGANIA KRYTYCZNE

1. **MOBILE-FIRST** - Projektuj dla telefonu (360px), potem desktop
2. **OFFLINE-FIRST** - Obserwacje muszą działać bez internetu (IndexedDB + sync)
3. **PWA** - Instalowalna na telefonie
4. **POLSKI JĘZYK UI** - daty w formacie DD.MM.YYYY

## KLUCZOWE FUNKCJE DO ZAIMPLEMENTOWANIA

1. ✅ Logowanie użytkowników (email/hasło, zaproszenia przez admina)
2. ✅ **Dodawanie obserwacji (wizard 4 kroki)** - PRIORYTET!
3. ✅ **Dodawanie zawodnika (z obserwacją LUB bez obserwacji)** - WAŻNE!
4. ✅ Lista zawodników z filtrami i wyszukiwaniem
5. ✅ Profil zawodnika 360°
6. ✅ Pipeline Kanban (drag & drop)
7. ✅ Dashboard z KPIs
8. ✅ Tryb offline z automatyczną synchronizacją

## POLECENIE

Przeanalizuj poniższą dokumentację i zbuduj aplikację. Zacznij od:
1. Inicjalizacja projektu (Vite + React + TS + Tailwind + shadcn)
2. Konfiguracja Supabase (client + typy)
3. Layout responsywny (mobile bottom nav, desktop sidebar)
4. System auth (login, protected routes)
5. Moduł obserwacji (wizard)
6. **Moduł zawodników (lista + formularz dodawania + profil)**


# ═══════════════════════════════════════════════════════════════
# PEŁNA DOKUMENTACJA PROJEKTU
# ═══════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════
# DOKUMENT: 00-README.md
# ══════════════════════════════════════════════════════════

# 🏆 ScoutPro - System Scoutingowy Akademii Piłkarskiej

## Spis Dokumentacji

| Nr | Dokument | Opis |
|----|----------|------|
| 01 | [Wizja Produktu](01-PRODUCT-VISION.md) | Cel biznesowy, personas, value proposition |
| 02 | [Wymagania Funkcjonalne](02-FUNCTIONAL-REQUIREMENTS.md) | User stories, acceptance criteria |
| 03 | [Model Danych](03-DATA-MODEL.md) | ERD, opis tabel, relacje |
| 04 | [Architektura Techniczna](04-ARCHITECTURE.md) | Stos technologiczny, diagramy, PWA |
| 05 | [API Specification](05-API-SPEC.md) | Endpointy REST, Supabase RLS |
| 06 | [UI/UX Guidelines](06-UI-UX.md) | Wireframes, komponenty, flow |
| 07 | [Backlog & Roadmap](07-BACKLOG.md) | Zadania podzielone na sprinty |
| 08 | [Offline Strategy](08-OFFLINE.md) | Service Worker, sync, konflikt danych |
| 09 | [Deployment Guide](09-DEPLOYMENT.md) | CI/CD, Supabase setup, Vercel |
| 10 | [Sample Data](10-SAMPLE-DATA.md) | Dane testowe z Excel |

---

## 🎯 Quick Start dla Developerów

### Technologie (MVP)
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **PWA:** Workbox + IndexedDB
- **Hosting:** Vercel (frontend) + Supabase Cloud

### Uruchomienie lokalne
```bash
# 1. Klonowanie repo
git clone <repo-url>
cd scoutpro

# 2. Instalacja zależności
npm install

# 3. Konfiguracja Supabase
cp .env.example .env.local
# Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY

# 4. Start dev server
npm run dev
```

### Struktura projektu
```
scoutpro/
├── src/
│   ├── components/       # Komponenty UI
│   ├── features/         # Moduły funkcjonalne
│   │   ├── auth/         # Logowanie, rejestracja
│   │   ├── players/      # Profile zawodników
│   │   ├── observations/ # Obserwacje meczowe
│   │   ├── pipeline/     # Funnel rekrutacyjny
│   │   └── dashboard/    # KPIs, wykresy
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Supabase client, utils
│   ├── stores/           # Zustand state
│   └── types/            # TypeScript types
├── public/
│   └── sw.js             # Service Worker
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── seed.sql          # Dane testowe
└── docs/                 # Ta dokumentacja
```

---

## 📊 Status Projektu

| Faza | Status | Termin |
|------|--------|--------|
| Analiza biznesowa | ✅ Ukończone | Q1 2025 |
| Projektowanie UX | 🔄 W trakcie | Q1 2025 |
| MVP Development | ⏳ Planowane | Q2 2025 |
| Beta Testing | ⏳ Planowane | Q3 2025 |
| Production Release | ⏳ Planowane | Q3 2025 |

---

## 👥 Zespół

| Rola | Odpowiedzialność |
|------|------------------|
| Product Owner | Wizja, priorytety, akceptacja |
| Tech Lead | Architektura, code review |
| Frontend Dev | React, PWA, UI |
| Backend Dev | Supabase, migrations, API |
| QA | Testy, UAT |

---

## 📞 Kontakt

W razie pytań dotyczących dokumentacji, kontaktuj się z Product Ownerem.

# ══════════════════════════════════════════════════════════
# DOKUMENT: 01-PRODUCT-VISION.md
# ══════════════════════════════════════════════════════════

# 01 - Wizja Produktu ScoutPro

## 1. Executive Summary

**ScoutPro** to mobilny system scoutingowy dla akademii piłkarskich, umożliwiający profesjonalną identyfikację i rozwój młodych talentów. System standaryzuje proces obserwacji, centralizuje dane zawodników i wspiera decyzje rekrutacyjne poprzez obiektywne KPI i dashboardy.

### Kluczowe problemy do rozwiązania

| Problem | Obecny stan | Rozwiązanie ScoutPro |
|---------|-------------|---------------------|
| Rozproszone dane | Excel, notatki papierowe | Centralna baza danych |
| Subiektywne oceny | Brak standardów | Ujednolicone szablony per pozycja |
| Utrata informacji | Brak historii kontaktów | 360° profil zawodnika |
| Brak widoczności pipeline | Chaos w statusach | Funnel Observed → Signed |
| Praca offline | Niemożliwa | PWA z synchronizacją |

---

## 2. Personas

### 👤 Persona 1: Scout Mateusz (Primary User)

| Atrybut | Wartość |
|---------|---------|
| **Wiek** | 35 lat |
| **Rola** | Scout regionalny (Kujawsko-Pomorskie) |
| **Doświadczenie** | 5 lat w scoutingu juniorskim |
| **Technologia** | Smartfon Android, średnio zaawansowany |
| **Frustracje** | Pisanie raportów po meczu, brak internetu na stadionach, duplikowanie danych |
| **Cele** | Szybkie notowanie podczas meczu, łatwy dostęp do historii zawodnika |

**User Story:** "Jako scout chcę móc dodać obserwację zawodnika w 30 sekund podczas meczu, żeby nie tracić akcji na boisku."

---

### 👤 Persona 2: Trener Artur (Secondary User)

| Atrybut | Wartość |
|---------|---------|
| **Wiek** | 42 lata |
| **Rola** | Trener zespołu U15 |
| **Doświadczenie** | 10 lat pracy z młodzieżą |
| **Technologia** | iPhone, komputer stacjonarny |
| **Frustracje** | Brak informacji o nowych zawodnikach na testach, nieaktualne dane |
| **Cele** | Przeglądanie shortlisty przed testami, dostęp do ocen innych trenerów |

**User Story:** "Jako trener chcę widzieć profil zawodnika przed testem, żeby wiedzieć na co zwrócić uwagę."

---

### 👤 Persona 3: Dyrektor Grzegorz (Tertiary User)

| Atrybut | Wartość |
|---------|---------|
| **Wiek** | 50 lat |
| **Rola** | Dyrektor Sportowy Akademii |
| **Doświadczenie** | 20 lat w piłce nożnej |
| **Technologia** | Laptop, tablet iPad |
| **Frustracje** | Brak przeglądu całościowego, manualne raporty |
| **Cele** | Dashboard z KPIs, raport konwersji pipeline, porównanie regionów |

**User Story:** "Jako dyrektor chcę widzieć ile zawodników przeszło z Obserwacji do Podpisania w tym kwartale."

---

## 3. Value Proposition Canvas

### Customer Jobs
1. Identyfikacja talentów na meczach i turniejach
2. Dokumentowanie obserwacji i ocen
3. Śledzenie procesu rekrutacji
4. Raportowanie do zarządu
5. Koordynacja między scoutami i trenerami

### Pains
- 📱 Brak narzędzia mobilnego
- 🔄 Duplikowanie danych w różnych plikach
- 📊 Brak standardowych metryk oceny
- 🌐 Brak dostępu offline
- ⏱️ Czasochłonne tworzenie raportów

### Gains
- ⚡ Szybkie dodawanie obserwacji (< 1 min)
- 📈 Obiektywne porównywanie zawodników
- 🎯 Lepsze decyzje rekrutacyjne
- 💰 Oszczędność czasu i kosztów administracyjnych
- 🏆 Wyższa jakość rekrutacji do akademii

---

## 4. Scope MVP vs. Roadmap

### 🟢 MVP (Q2-Q3 2025)

| Funkcja | Priorytet | Status |
|---------|-----------|--------|
| Logowanie i zarządzanie użytkownikami | P1 | Planowane |
| Rejestracja obserwacji mobilna | P1 | Planowane |
| Profile zawodników 360° | P1 | Planowane |
| Pipeline rekrutacyjny | P2 | Planowane |
| Dashboard z podstawowymi KPI | P2 | Planowane |
| Offline mode (tekst) | P1 | Planowane |
| Powiadomienia push | P2 | Planowane |

### 🟡 Faza 2 (Q4 2025)

| Funkcja | Opis |
|---------|------|
| Benchmarking | Porównanie z historycznymi absolwentami |
| Role i regiony | Granularne uprawnienia |
| Audit log | Historia zmian |
| Import CSV | Masowy import danych |

### 🔵 Faza 3 (2026)

| Funkcja | Opis |
|---------|------|
| Integracje | Wyscout, TransferMarkt API |
| Kalendarz | Synchronizacja z Google/Outlook |
| Raport PDF | Eksport profili do PDF |
| Multi-language | EN, DE |

---

## 5. Success Metrics (KPIs)

### Metryki produktowe

| KPI | Cel MVP | Cel Rok 1 |
|-----|---------|-----------|
| Aktywni użytkownicy (MAU) | 5 | 20 |
| Obserwacje / miesiąc | 50 | 300 |
| Czas dodania obserwacji | < 2 min | < 1 min |
| Uptime | 99% | 99.5% |
| Offline sync success rate | 95% | 99% |

### Metryki biznesowe

| KPI | Cel |
|-----|-----|
| Conversion rate (Observed → Signed) | +20% vs. obecny |
| Time-to-decision | -30% vs. obecny |
| Koszty administracyjne | -50% vs. obecny |
| Jakość rekrutów (retencja 1 rok) | +15% vs. obecny |

---

## 6. Założenia i ryzyka

### Założenia

| ID | Założenie | Walidacja |
|----|-----------|-----------|
| A1 | Scouts mają smartfony z Android/iOS | Potwierdzone |
| A2 | Stadiony juniorskie często nie mają internetu | Potwierdzone |
| A3 | 5 użytkowników na start wystarczy do walidacji MVP | Do weryfikacji |
| A4 | Supabase Free Tier wystarczy na MVP | Do weryfikacji |

### Ryzyka

| ID | Ryzyko | Prawdop. | Impact | Mitygacja |
|----|--------|----------|--------|-----------|
| R1 | Niska adopcja przez użytkowników | Średnie | Wysoki | Onboarding, szkolenia |
| R2 | Problemy z sync offline | Średnie | Średni | Dokładne testy, retry logic |
| R3 | Przekroczenie limitów Supabase Free | Niskie | Średni | Monitoring, upgrade plan |
| R4 | Utrata danych | Niskie | Krytyczny | Backup, audit log |

---

## 7. Stakeholders

| Stakeholder | Rola | Zaangażowanie |
|-------------|------|---------------|
| Dyrektor Sportowy | Sponsor projektu | Akceptacja, budżet |
| Koordynator Scoutingu | Product Owner | Wymagania, testy |
| Scouts (5 osób) | Primary Users | Feedback, UAT |
| Trenerzy | Secondary Users | Feedback |
| Zespół IT | Developers | Implementacja |

---

## 8. Glossary

| Termin | Definicja |
|--------|-----------|
| **Obserwacja** | Pojedynczy raport z oglądania zawodnika na meczu/treningu |
| **Pipeline** | Sekwencja statusów: Observed → Shortlist → Trial → Offer → Signed |
| **360° Profil** | Kompletny profil zawodnika ze wszystkimi danymi i historią |
| **KPI** | Key Performance Indicator - kluczowy wskaźnik efektywności |
| **PWA** | Progressive Web App - aplikacja webowa z funkcjami offline |
| **Ranga** | Ocena potencjału: A (TOP), B (dobry), C (szeroka kadra), D (słaby) |

# ══════════════════════════════════════════════════════════
# DOKUMENT: 02-FUNCTIONAL-REQUIREMENTS.md
# ══════════════════════════════════════════════════════════

# 02 - Wymagania Funkcjonalne

## 1. Epics Overview

| Epic ID | Nazwa | Priorytet | Sprint |
|---------|-------|-----------|--------|
| E01 | Zarządzanie Użytkownikami | P1 | 1 |
| E02 | Obserwacje Meczowe | P1 | 1-2 |
| E03 | Profile Zawodników | P1 | 2-3 |
| E04 | Pipeline Rekrutacyjny | P2 | 3-4 |
| E05 | Dashboard & KPIs | P2 | 4-5 |
| E06 | Offline Mode | P1 | 2-3 |
| E07 | Powiadomienia | P2 | 5 |
| E08 | Ustawienia Systemu | P1 | 1 |

---

## 2. Epic E01: Zarządzanie Użytkownikami

### US-001: Rejestracja przez zaproszenie
**Jako** administrator  
**Chcę** wysłać zaproszenie email do nowego użytkownika  
**Aby** kontrolować kto ma dostęp do systemu

**Acceptance Criteria:**
- [ ] Administrator może wprowadzić email nowego użytkownika
- [ ] System wysyła email z linkiem do aktywacji (ważny 7 dni)
- [ ] Użytkownik po kliknięciu linku ustawia hasło
- [ ] Konto jest automatycznie aktywowane po ustawieniu hasła
- [ ] Administrator widzi listę oczekujących zaproszeń

**Technical Notes:**
- Wykorzystać Supabase Auth z funkcją invite
- Tabela `invitations` do śledzenia statusu

---

### US-002: Logowanie użytkownika
**Jako** użytkownik  
**Chcę** zalogować się emailem i hasłem  
**Aby** uzyskać dostęp do systemu

**Acceptance Criteria:**
- [ ] Formularz logowania z walidacją
- [ ] Obsługa błędnych danych (komunikat)
- [ ] Opcja "Zapamiętaj mnie" (token refresh)
- [ ] Przekierowanie po zalogowaniu do dashboardu
- [ ] Responsywny UI (mobile-first)

---

### US-003: Reset hasła
**Jako** użytkownik  
**Chcę** zresetować zapomniane hasło  
**Aby** odzyskać dostęp do konta

**Acceptance Criteria:**
- [ ] Link "Zapomniałem hasła" na stronie logowania
- [ ] Formularz z emailem
- [ ] Email z linkiem do resetu (ważny 1h)
- [ ] Formularz ustawienia nowego hasła
- [ ] Komunikat potwierdzający zmianę

---

### US-004: Zarządzanie kontami (Admin)
**Jako** administrator  
**Chcę** widzieć listę użytkowników i zarządzać ich kontami  
**Aby** kontrolować dostęp do systemu

**Acceptance Criteria:**
- [ ] Lista użytkowników z filtrem (aktywni/zawieszeni)
- [ ] Widoczne: imię, email, rola, data ostatniego logowania
- [ ] Możliwość zawieszenia konta (soft delete)
- [ ] Możliwość reaktywacji zawieszonego konta
- [ ] Zmiana roli użytkownika (Admin/User)
- [ ] Nie można zawiesić własnego konta

---

### US-005: Profil użytkownika
**Jako** użytkownik  
**Chcę** edytować swój profil  
**Aby** aktualizować dane kontaktowe

**Acceptance Criteria:**
- [ ] Edycja: imię, nazwisko, telefon, avatar
- [ ] Zmiana hasła (wymaga starego hasła)
- [ ] Podgląd własnej aktywności (ostatnie obserwacje)

---

## 3. Epic E02: Obserwacje Meczowe

### US-010: Szybkie dodawanie obserwacji
**Jako** scout  
**Chcę** dodać obserwację zawodnika w < 1 minutę  
**Aby** nie tracić czasu podczas meczu

**Acceptance Criteria:**
- [ ] Floating Action Button (FAB) "+" na głównym ekranie
- [ ] Formularz krok po kroku (wizard):
  1. Dane podstawowe (nazwisko, imię, rocznik, klub)
  2. Pozycja i noga
  3. Ocena (ranga A/B/C/D + komentarz)
  4. Źródło (skauting/polecenie/zgłoszenie)
- [ ] Autouzupełnianie klubu z historii
- [ ] Zapisanie jako draft możliwe na każdym etapie
- [ ] Działa offline (zapis do IndexedDB)

**UI Notes:**
- Duże przyciski (tap-friendly)
- Minimalna liczba pól obowiązkowych
- Klawiatura numeryczna dla rocznika

---

### US-011: Dodawanie zdjęcia zawodnika
**Jako** scout  
**Chcę** zrobić zdjęcie zawodnikowi  
**Aby** łatwiej go rozpoznać

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zdjęcie" w formularzu obserwacji
- [ ] Wybór: aparat lub galeria
- [ ] Automatyczna kompresja do max 500KB
- [ ] Podgląd miniaturki przed zapisaniem
- [ ] Max 3 zdjęcia na obserwację

---

### US-012: Ocena pozycyjna zawodnika
**Jako** scout  
**Chcę** ocenić zawodnika według szablonu dla jego pozycji  
**Aby** zachować spójność ocen

**Acceptance Criteria:**
- [ ] Dynamiczny formularz zależny od pozycji
- [ ] Skala 1-5 dla każdego kryterium
- [ ] Kryteria per pozycja (patrz tabela poniżej)
- [ ] Pole tekstowe na dodatkowe uwagi
- [ ] Podgląd średniej oceny

**Kryteria oceny per pozycja:**

| Pozycja | Kryteria |
|---------|----------|
| GK (1) | Refleks, Gra nogami, Wyjścia, Komunikacja, Pozycjonowanie |
| CB (4/5) | Główkowanie, Pojedynki 1v1, Wyprowadzenie piłki, Czytanie gry, Szybkość |
| FB/WB (2/3) | Dośrodkowania, Defensywa, Ofensywa, Szybkość, Wytrzymałość |
| CM (6/8) | Podania, Wizja gry, Pressing, Strzały z dystansu, Mobilność |
| Winger (7/11) | Drybling, Szybkość, Dośrodkowania, Strzały, Pressing |
| ST (9/10) | Wykończenie, Główkowanie, Gra tyłem, Ruch bez piłki, Pressing |

---

### US-013: Wyszukiwanie obserwacji
**Jako** scout  
**Chcę** wyszukać wcześniejsze obserwacje  
**Aby** sprawdzić historię zawodnika

**Acceptance Criteria:**
- [ ] Wyszukiwarka tekstowa (nazwisko, klub)
- [ ] Filtry: rocznik, pozycja, ranga, data, autor
- [ ] Sortowanie: data (domyślnie), ranga, nazwisko
- [ ] Widok listy z kluczowymi informacjami
- [ ] Kliknięcie → szczegóły obserwacji

---

### US-014: Edycja i usuwanie obserwacji
**Jako** scout  
**Chcę** edytować lub usunąć własną obserwację  
**Aby** poprawić błędy

**Acceptance Criteria:**
- [ ] Edycja możliwa dla własnych obserwacji
- [ ] Soft delete (status "usunięta")
- [ ] Potwierdzenie przed usunięciem
- [ ] Admin może edytować/usuwać wszystkie

---

### US-015: Obserwacja meczu (batch)
**Jako** scout  
**Chcę** dodać obserwację całego meczu z wieloma zawodnikami  
**Aby** efektywnie dokumentować turnieje

**Acceptance Criteria:**
- [ ] Formularz meczu: drużyny, data, liga, wynik
- [ ] Lista obserwacji powiązanych z meczem
- [ ] Przycisk "Dodaj zawodnika do meczu"
- [ ] Widok podsumowania meczu

---

## 4. Epic E03: Profile Zawodników 360°

### US-020: Profil zawodnika
**Jako** użytkownik  
**Chcę** widzieć kompletny profil zawodnika  
**Aby** podjąć decyzję rekrutacyjną

**Acceptance Criteria:**
- [ ] Sekcje profilu:
  - Dane podstawowe (imię, nazwisko, rocznik, DOB, klub)
  - Dane fizyczne (wzrost, waga, noga dominująca)
  - Pozycje (główna + alternatywne)
  - Dane kontaktowe (rodzic, telefon, email)
  - Galeria zdjęć
  - Historia obserwacji (timeline)
  - Aktualny status w pipeline
- [ ] Edycja danych przez każdego użytkownika
- [ ] Historia zmian statusu

---

### US-021: Linkowanie zawodnika
**Jako** scout  
**Chcę** połączyć nową obserwację z istniejącym zawodnikiem  
**Aby** uniknąć duplikatów

**Acceptance Criteria:**
- [ ] Podczas dodawania obserwacji - sugestie duplikatów
- [ ] Matching: nazwisko + rocznik + klub
- [ ] Opcja: "To ten sam zawodnik" → połącz
- [ ] Opcja: "Nowy zawodnik" → utwórz
- [ ] Możliwość merge'a duplikatów przez admina

---

### US-021b: Dodawanie zawodnika bez obserwacji
**Jako** użytkownik  
**Chcę** dodać nowego zawodnika do bazy bez tworzenia obserwacji  
**Aby** przygotować profil przed meczem lub na podstawie informacji z zewnątrz

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zawodnika" w widoku listy zawodników
- [ ] Formularz z polami: imię, nazwisko, rocznik, klub, pozycja, noga
- [ ] Opcjonalne pola: data urodzenia, wzrost, region
- [ ] Walidacja duplikatów (nazwisko + rocznik + klub)
- [ ] Zawodnik tworzony ze statusem "observed" w pipeline
- [ ] Możliwość dodania kontaktu do rodzica od razu

---

### US-021B: Dodawanie nowego zawodnika (bez obserwacji)
**Jako** użytkownik  
**Chcę** dodać nowego zawodnika do bazy bez konieczności tworzenia obserwacji  
**Aby** przygotować profil przed meczem/testem

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zawodnika" na liście zawodników
- [ ] Formularz z polami: imię*, nazwisko*, rocznik*, klub, pozycja, noga, region
- [ ] Walidacja duplikatów przed zapisem
- [ ] Domyślny status pipeline: "observed"
- [ ] Możliwość dodania zdjęcia i kontaktu do rodzica
- [ ] Redirect do profilu po zapisie

**UI Notes:**
- Formularz podobny do kroku 1-2 wizarda obserwacji
- Można użyć tego samego komponentu PlayerForm

---

### US-022: Dane rodzica/opiekuna
**Jako** użytkownik  
**Chcę** zapisać dane kontaktowe do rodzica  
**Aby** móc się z nim skontaktować

**Acceptance Criteria:**
- [ ] Pola: imię rodzica, telefon, email
- [ ] Możliwość wielu kontaktów (np. oboje rodzice)
- [ ] Oznaczenie głównego kontaktu
- [ ] Historia kontaktów (notatki)

---

### US-023: Linki do wideo
**Jako** scout  
**Chcę** dodać link do nagrania wideo zawodnika  
**Aby** inni mogli obejrzeć jego grę

**Acceptance Criteria:**
- [ ] Pole URL w profilu zawodnika
- [ ] Walidacja formatu URL
- [ ] Wsparcie: YouTube, Vimeo, Veo, Google Drive
- [ ] Osadzanie podglądu (embed player) jeśli możliwe
- [ ] Wiele linków na zawodnika

---

## 5. Epic E04: Pipeline Rekrutacyjny

### US-030: Widok Pipeline (Kanban)
**Jako** użytkownik  
**Chcę** widzieć wszystkich zawodników w formie Kanban  
**Aby** śledzić postęp rekrutacji

**Acceptance Criteria:**
- [ ] Kolumny: Observed → Shortlist → Trial → Offer → Signed / Rejected
- [ ] Karty zawodników z podstawowymi danymi
- [ ] Drag & drop do zmiany statusu
- [ ] Filtry: rocznik, pozycja, region
- [ ] Kliknięcie karty → profil zawodnika

---

### US-031: Zmiana statusu zawodnika
**Jako** użytkownik  
**Chcę** zmienić status zawodnika w pipeline  
**Aby** odzwierciedlić postęp rekrutacji

**Acceptance Criteria:**
- [ ] Zmiana przez drag & drop lub menu kontekstowe
- [ ] Wymagane pole: powód zmiany statusu
- [ ] Historia zmian statusu w profilu
- [ ] Automatyczna data zmiany
- [ ] Powiadomienie dla innych użytkowników (opcjonalne)

---

### US-032: Statusy decyzji
**Jako** użytkownik  
**Chcę** oznaczać końcowe decyzje o zawodniku  
**Aby** dokumentować proces

**Acceptance Criteria:**
- [ ] Statusy końcowe:
  - ZOSTAŁ NASZYM ZAWODNIKIEM
  - ODRZUCIŁ PROPOZYCJĘ
  - ZŁOŻONA PROPOZYCJA
  - ZAPROSIĆ PO RAZ KOLEJNY
  - OBSERWOWAĆ DALEJ W MACIERZYSTYM KLUBIE
  - REZYGNACJA
- [ ] Pole na komentarz przy każdej decyzji
- [ ] Archiwizacja zawodników ze statusem końcowym

---

## 6. Epic E05: Dashboard & KPIs

### US-040: Dashboard główny
**Jako** użytkownik  
**Chcę** widzieć podsumowanie działań  
**Aby** mieć szybki przegląd sytuacji

**Acceptance Criteria:**
- [ ] Widgety:
  - Liczba obserwacji (tydzień/miesiąc/razem)
  - Zawodnicy per status pipeline
  - Ostatnie obserwacje (5)
  - Top zawodnicy (ranga A)
- [ ] Responsywny layout (mobile: stack, desktop: grid)
- [ ] Odświeżanie w czasie rzeczywistym

---

### US-041: KPIs rekrutacji
**Jako** dyrektor  
**Chcę** widzieć metryki konwersji  
**Aby** ocenić efektywność scoutingu

**Acceptance Criteria:**
- [ ] Metryki:
  - Conversion rate per etap pipeline
  - Time-to-decision (średni czas na etap)
  - Obserwacje per scout
  - Zawodnicy per region/rocznik
- [ ] Wykresy: bar chart, pie chart
- [ ] Filtr czasowy (miesiąc, kwartał, rok)
- [ ] Eksport do CSV (opcjonalnie)

---

### US-042: Produktywność scoutów
**Jako** administrator  
**Chcę** widzieć aktywność scoutów  
**Aby** monitorować pracę

**Acceptance Criteria:**
- [ ] Lista scoutów z liczbą obserwacji
- [ ] Liczba meczów obserwowanych
- [ ] Koszty (jeśli wprowadzone)
- [ ] Ranking "top scoutów"

---

## 7. Epic E06: Offline Mode

### US-050: Praca offline
**Jako** scout  
**Chcę** dodawać obserwacje bez internetu  
**Aby** pracować na stadionach bez zasięgu

**Acceptance Criteria:**
- [ ] Aplikacja ładuje się offline (Service Worker)
- [ ] Dodawanie obserwacji zapisuje do IndexedDB
- [ ] Wizualny wskaźnik "Offline" w UI
- [ ] Lista oczekujących na synchronizację
- [ ] Automatyczna synchronizacja po powrocie online

---

### US-051: Synchronizacja danych
**Jako** scout  
**Chcę** aby dane zsynchronizowały się automatycznie  
**Aby** nie musieć o tym pamiętać

**Acceptance Criteria:**
- [ ] Sync uruchamia się automatycznie gdy online
- [ ] Progress bar podczas synchronizacji
- [ ] Obsługa błędów (retry 3x, potem manual)
- [ ] Powiadomienie o zakończeniu sync
- [ ] Conflict resolution: last-write-wins (niski priorytet)

---

### US-052: Cache offline
**Jako** scout  
**Chcę** widzieć ostatnio przeglądane profile offline  
**Aby** mieć dostęp do historii

**Acceptance Criteria:**
- [ ] Cache ostatnich 50 profili
- [ ] Cache ostatnich 100 obserwacji
- [ ] Oznaczenie danych jako "może być nieaktualne"
- [ ] Ręczne odświeżenie cache

---

## 8. Epic E07: Powiadomienia

### US-060: Powiadomienia push
**Jako** użytkownik  
**Chcę** otrzymywać powiadomienia o ważnych wydarzeniach  
**Aby** być na bieżąco

**Acceptance Criteria:**
- [ ] Typy powiadomień:
  - Nowa obserwacja zawodnika, którego obserwowałem
  - Zmiana statusu w pipeline
  - Nowy zawodnik na shortliście (Admin)
- [ ] Zgoda użytkownika na powiadomienia
- [ ] Zarządzanie preferencjami w ustawieniach
- [ ] PWA push notifications (Web Push API)

---

## 9. Epic E08: Ustawienia Systemu

### US-070: Definiowanie regionów
**Jako** administrator  
**Chcę** zdefiniować regiony scoutingowe  
**Aby** przypisywać zawodników geograficznie

**Acceptance Criteria:**
- [ ] CRUD dla regionów
- [ ] Nazwa regionu (np. "Kujawsko-Pomorskie")
- [ ] Regiony dostępne w dropdown'ach w całej aplikacji
- [ ] Możliwość dezaktywacji (zachowanie historii)

---

### US-071: Definiowanie lig/rozgrywek
**Jako** administrator  
**Chcę** zdefiniować ligi i kategorie wiekowe  
**Aby** standaryzować dane meczowe

**Acceptance Criteria:**
- [ ] CRUD dla lig (np. CLJ U17, Ekstraliga U15)
- [ ] CRUD dla kategorii wiekowych (U8-U19)
- [ ] Powiązanie liga + kategoria
- [ ] Możliwość dodawania własnych lig

---

### US-072: Definiowanie klubów
**Jako** użytkownik  
**Chcę** wybierać klub z predefiniowanej listy  
**Aby** uniknąć literówek i duplikatów

**Acceptance Criteria:**
- [ ] Lista klubów z autouzupełnianiem
- [ ] Możliwość dodania nowego klubu ad-hoc
- [ ] Admin może edytować/mergować kluby
- [ ] Import początkowej listy z danych Excel

---

### US-073: Konfiguracja szablonów ocen
**Jako** administrator  
**Chcę** definiować kryteria oceny per pozycja  
**Aby** dostosować do potrzeb akademii

**Acceptance Criteria:**
- [ ] Lista pozycji z przypisanymi kryteriami
- [ ] Dodawanie/usuwanie kryteriów
- [ ] Zmiana nazwy kryterium
- [ ] Zmiana wagi kryterium (opcjonalne, faza 2)

---

## 10. Wymagania niefunkcjonalne

### Wydajność
| Metryka | Wymaganie |
|---------|-----------|
| Czas ładowania strony | < 3s (3G) |
| Czas odpowiedzi API | < 500ms (p95) |
| Rozmiar bundle JS | < 500KB (gzipped) |

### Dostępność
- WCAG 2.1 Level AA (minimum)
- Kontrast kolorów > 4.5:1
- Nawigacja klawiaturą

### Bezpieczeństwo
- HTTPS everywhere
- Szyfrowanie danych w spoczynku (Supabase)
- Rate limiting na API
- Input sanitization

### Kompatybilność
- Chrome 90+, Safari 14+, Firefox 90+, Edge 90+
- iOS 14+, Android 10+
- PWA installable

# ══════════════════════════════════════════════════════════
# DOKUMENT: 03-DATA-MODEL.md
# ══════════════════════════════════════════════════════════

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

# ══════════════════════════════════════════════════════════
# DOKUMENT: 04-ARCHITECTURE.md
# ══════════════════════════════════════════════════════════

# 04 - Architektura Techniczna

## 1. Przegląd Architektury

```
┌─────────────────────────────────────────────────────────────────────┐
│                           KLIENT (PWA)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   React 18  │  │  Zustand    │  │  IndexedDB  │  │  Service   │  │
│  │ + TypeScript│  │   State     │  │  (Dexie.js) │  │   Worker   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                 │
│                          Supabase Client SDK                        │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │  │  Realtime  │  │
│  │   + RLS     │  │  (GoTrue)   │  │   (S3)      │  │ (Websocket)│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  Edge       │  │  Database   │                                   │
│  │  Functions  │  │  Webhooks   │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HOSTING (Vercel)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Static Files (React build) + Edge Network (CDN)            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stos Technologiczny

### Frontend

| Technologia | Wersja | Uzasadnienie |
|-------------|--------|--------------|
| **React** | 18.x | Standardowa biblioteka UI, duży ekosystem |
| **TypeScript** | 5.x | Typowanie statyczne, mniej błędów |
| **Vite** | 5.x | Szybki bundler, HMR, optymalizacje |
| **Tailwind CSS** | 3.x | Utility-first CSS, szybkie prototypowanie |
| **shadcn/ui** | latest | Komponenty Radix UI + Tailwind |
| **React Router** | 6.x | Routing SPA |
| **Zustand** | 4.x | Lekki state management |
| **React Query** | 5.x | Server state, cache, synchronizacja |
| **React Hook Form** | 7.x | Formularze z walidacją |
| **Zod** | 3.x | Schema validation |
| **Dexie.js** | 4.x | IndexedDB wrapper dla offline |
| **Workbox** | 7.x | Service Worker tooling |

### Backend (Supabase)

| Komponent | Opis |
|-----------|------|
| **PostgreSQL 15** | Baza danych z RLS |
| **GoTrue** | Autentykacja (email/password) |
| **PostgREST** | Auto-generated REST API |
| **Realtime** | Websocket subscriptions |
| **Storage** | S3-compatible file storage |
| **Edge Functions** | Serverless Deno functions |

### Hosting & DevOps

| Narzędzie | Opis |
|-----------|------|
| **Vercel** | Frontend hosting, CI/CD |
| **Supabase Cloud** | Backend managed service |
| **GitHub** | Repo, CI/CD triggers |
| **GitHub Actions** | Migrations, deploys |

---

## 3. Struktura Projektu

```
scoutpro/
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Vercel deploy
│       └── migrations.yml       # Supabase migrations
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker (generated)
│   └── icons/                   # PWA icons
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Layout.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── OfflineIndicator.tsx
│   │       └── DataTable.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── ResetPasswordForm.tsx
│   │   │   │   └── InviteForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts
│   │   │   └── types.ts
│   │   ├── players/
│   │   │   ├── components/
│   │   │   │   ├── PlayerCard.tsx
│   │   │   │   ├── PlayerProfile.tsx
│   │   │   │   ├── PlayerForm.tsx
│   │   │   │   └── PlayerList.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePlayer.ts
│   │   │   │   └── usePlayers.ts
│   │   │   ├── api/
│   │   │   │   └── players.api.ts
│   │   │   └── types.ts
│   │   ├── observations/
│   │   │   ├── components/
│   │   │   │   ├── ObservationWizard.tsx
│   │   │   │   ├── ObservationCard.tsx
│   │   │   │   ├── ObservationList.tsx
│   │   │   │   └── EvaluationForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useObservation.ts
│   │   │   │   └── useObservations.ts
│   │   │   ├── api/
│   │   │   │   └── observations.api.ts
│   │   │   └── types.ts
│   │   ├── pipeline/
│   │   │   ├── components/
│   │   │   │   ├── PipelineBoard.tsx
│   │   │   │   ├── PipelineColumn.tsx
│   │   │   │   └── PlayerPipelineCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePipeline.ts
│   │   │   └── types.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatsWidget.tsx
│   │   │   │   ├── RecentObservations.tsx
│   │   │   │   └── PipelineChart.tsx
│   │   │   └── hooks/
│   │   │       └── useStats.ts
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   │   ├── RegionsSettings.tsx
│   │   │   │   ├── LeaguesSettings.tsx
│   │   │   │   ├── ClubsSettings.tsx
│   │   │   │   └── UsersSettings.tsx
│   │   │   └── hooks/
│   │   │       └── useSettings.ts
│   │   └── offline/
│   │       ├── components/
│   │       │   ├── SyncStatus.tsx
│   │       │   └── OfflineQueue.tsx
│   │       ├── hooks/
│   │       │   ├── useOffline.ts
│   │       │   └── useSync.ts
│   │       └── db/
│   │           └── offlineDb.ts
│   ├── hooks/
│   │   ├── useOnlineStatus.ts
│   │   └── useNotifications.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── utils.ts             # Utility functions
│   │   └── constants.ts         # App constants
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── offlineStore.ts
│   ├── types/
│   │   ├── database.types.ts    # Generated from Supabase
│   │   └── index.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PlayersPage.tsx
│   │   ├── PlayerDetailPage.tsx
│   │   ├── ObservationsPage.tsx
│   │   ├── NewObservationPage.tsx
│   │   ├── PipelinePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_seed_data.sql
│   │   └── 004_import_excel.sql
│   ├── functions/
│   │   └── send-invitation/
│   │       └── index.ts
│   └── config.toml
├── tests/
│   ├── e2e/
│   └── unit/
├── .env.example
├── .env.local                   # (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## 4. PWA Configuration

### manifest.json
```json
{
  "name": "ScoutPro - System Scoutingowy",
  "short_name": "ScoutPro",
  "description": "Mobilny system scoutingowy dla akademii piłkarskich",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1d4ed8",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### vite.config.ts (PWA Plugin)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false, // Use public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## 5. Konfiguracja Supabase

### .env.local
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

### src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 6. Offline Architecture

### IndexedDB Schema (Dexie.js)

```typescript
// src/features/offline/db/offlineDb.ts
import Dexie, { Table } from 'dexie';

export interface OfflineObservation {
  id: string;
  localId: string;
  data: object;
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
}

export interface CachedPlayer {
  id: string;
  data: object;
  cachedAt: Date;
}

export class OfflineDatabase extends Dexie {
  observations!: Table<OfflineObservation>;
  players!: Table<CachedPlayer>;

  constructor() {
    super('ScoutProOffline');
    this.version(1).stores({
      observations: 'localId, syncStatus, createdAt',
      players: 'id, cachedAt',
    });
  }
}

export const offlineDb = new OfflineDatabase();
```

### Sync Strategy

```typescript
// src/features/offline/hooks/useSync.ts
import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

export function useSync() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      syncPendingObservations();
    }
  }, [isOnline]);

  async function syncPendingObservations() {
    const pending = await offlineDb.observations
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const obs of pending) {
      try {
        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'syncing',
        });

        const { error } = await supabase
          .from('observations')
          .insert(obs.data);

        if (error) throw error;

        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'synced',
        });
      } catch (error) {
        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'failed',
          syncError: error.message,
        });
      }
    }
  }

  return { syncPendingObservations };
}
```

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLOW: Zaproszenie                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Admin → [Wprowadza email] → API: /invite                    │
│                                                                 │
│  2. Supabase Edge Function:                                     │
│     - Tworzy rekord w invitations                               │
│     - Generuje token (UUID)                                     │
│     - Wysyła email przez Resend/SendGrid                        │
│                                                                 │
│  3. Użytkownik → [Klika link w emailu]                          │
│     → /accept-invite?token=xxx                                  │
│                                                                 │
│  4. Frontend:                                                   │
│     - Waliduje token (nie wygasł, nie użyty)                    │
│     - Wyświetla formularz hasła                                 │
│                                                                 │
│  5. Użytkownik → [Ustawia hasło] → API: /auth/signup            │
│     - Supabase Auth tworzy konto                                │
│     - Aktualizuje invitations.used_at                           │
│     - Tworzy rekord w users                                     │
│                                                                 │
│  6. Redirect → /dashboard                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. API Patterns

### React Query + Supabase

```typescript
// src/features/players/hooks/usePlayers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Player } from '../types';

export function usePlayers(filters?: { birthYear?: number; status?: string }) {
  return useQuery({
    queryKey: ['players', filters],
    queryFn: async () => {
      let query = supabase
        .from('players')
        .select(`
          *,
          club:clubs(name),
          region:regions(name),
          observations(count)
        `)
        .order('created_at', { ascending: false });

      if (filters?.birthYear) {
        query = query.eq('birth_year', filters.birthYear);
      }
      if (filters?.status) {
        query = query.eq('pipeline_status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Player[];
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: Partial<Player>) => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
```

---

## 9. Deployment Pipeline

### GitHub Actions: Deploy to Vercel

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: ${{ github.ref == 'refs/heads/main' }}
```

### GitHub Actions: Supabase Migrations

```yaml
# .github/workflows/migrations.yml
name: Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Push migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

---

## 10. Środowiska

| Środowisko | URL | Baza danych | Deploy |
|------------|-----|-------------|--------|
| Development | localhost:5173 | Supabase local | Manual |
| Staging | staging.scoutpro.app | Supabase staging project | PR merge |
| Production | app.scoutpro.app | Supabase prod project | Main branch |

---

## 11. Monitoring & Logging

### Supabase Dashboard
- Database metrics
- Auth logs
- Storage usage
- Realtime connections

### Vercel Analytics
- Web Vitals
- Page views
- Error rates

### Sentry (opcjonalnie - Faza 2)
- Error tracking
- Performance monitoring
- Session replay

# ══════════════════════════════════════════════════════════
# DOKUMENT: 05-API-SPEC.md
# ══════════════════════════════════════════════════════════

# 05 - API Specification

## 1. Przegląd

ScoutPro wykorzystuje **Supabase PostgREST** do automatycznego generowania REST API z bazy PostgreSQL. Dodatkowo używamy **Edge Functions** dla logiki niestandardowej.

### Base URLs
- **REST API:** `https://{project}.supabase.co/rest/v1`
- **Auth API:** `https://{project}.supabase.co/auth/v1`
- **Storage API:** `https://{project}.supabase.co/storage/v1`
- **Edge Functions:** `https://{project}.supabase.co/functions/v1`

### Autoryzacja
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
```

---

## 2. Authentication

### POST /auth/v1/token?grant_type=password
**Logowanie użytkownika**

```json
// Request
{ "email": "scout@example.com", "password": "password123" }

// Response 200
{
  "access_token": "eyJhbG...",
  "refresh_token": "abc123",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "scout@example.com" }
}
```

### POST /auth/v1/recover
**Reset hasła**
```json
{ "email": "scout@example.com" }
```

---

## 3. Players API

### GET /rest/v1/players
**Lista zawodników**

| Query Param | Example | Description |
|-------------|---------|-------------|
| select | `*,club:clubs(name)` | Pola do zwrócenia |
| birth_year | `eq.2011` | Filtr rocznik |
| pipeline_status | `eq.observed` | Filtr status |
| order | `created_at.desc` | Sortowanie |
| limit | `20` | Limit |

**Response:**
```json
[
  {
    "id": "uuid-1",
    "first_name": "Ryszard",
    "last_name": "Ziętek",
    "birth_year": 2011,
    "primary_position": "9",
    "dominant_foot": "right",
    "pipeline_status": "observed",
    "club": { "name": "Chemik Bydgoszcz" }
  }
]
```

### POST /rest/v1/players
**Dodaj zawodnika**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski",
  "birth_year": 2012,
  "club_id": "uuid",
  "primary_position": "9"
}
```

### PATCH /rest/v1/players?id=eq.{uuid}
**Aktualizuj zawodnika**
```json
{ "pipeline_status": "shortlist" }
```

### GET /rest/v1/players?id=eq.{uuid}
**Szczegóły zawodnika**
```
?select=*,club:clubs(*),region:regions(*),observations(*),contacts:player_contacts(*)
```

---

## 4. Observations API

### GET /rest/v1/observations
**Lista obserwacji**
```
?select=*,player:players(first_name,last_name),scout:users(full_name)
&order=created_at.desc
```

### POST /rest/v1/observations
**Dodaj obserwację**
```json
{
  "player_id": "uuid",
  "scout_id": "uuid",
  "source": "scouting",
  "rank": "B",
  "notes": "Dobry zawodnik...",
  "potential_now": 4,
  "potential_future": 5,
  "observation_date": "2025-01-15"
}
```

### POST /rest/v1/player_evaluations
**Dodaj oceny szczegółowe**
```json
[
  { "observation_id": "uuid", "criteria_id": "uuid-1", "score": 4 },
  { "observation_id": "uuid", "criteria_id": "uuid-2", "score": 5 }
]
```

---

## 5. Matches API

### GET /rest/v1/matches
```
?select=*,league:leagues(name),category:categories(name)
&order=match_date.desc
```

### POST /rest/v1/matches
```json
{
  "team_home": "Polonia Warszawa",
  "team_away": "Legia Warszawa",
  "match_date": "2025-01-20",
  "location": "Warszawa",
  "league_id": "uuid",
  "category_id": "uuid",
  "type": "live"
}
```

---

## 6. Settings API (Słowniki)

### GET /rest/v1/regions
### GET /rest/v1/leagues  
### GET /rest/v1/categories
### GET /rest/v1/clubs
### GET /rest/v1/positions
### GET /rest/v1/evaluation_criteria?position_id=eq.{uuid}

### POST /rest/v1/regions (Admin only)
```json
{ "name": "mazowieckie" }
```

---

## 7. Users API

### GET /rest/v1/users
**Lista użytkowników (Admin)**
```
?select=id,email,full_name,role,is_active,last_login_at
&order=full_name.asc
```

### PATCH /rest/v1/users?id=eq.{uuid}
**Aktualizuj użytkownika (Admin)**
```json
{ "is_active": false }
```

---

## 8. Edge Functions

### POST /functions/v1/send-invitation
**Wyślij zaproszenie**
```json
// Request
{ "email": "newscout@example.com" }

// Response 200
{ "success": true, "invitation_id": "uuid" }
```

### POST /functions/v1/accept-invitation
**Akceptuj zaproszenie**
```json
{
  "token": "invitation-token",
  "password": "newpassword123",
  "full_name": "Jan Nowak"
}
```

---

## 9. Storage API

### Upload zdjęcia
```
POST /storage/v1/object/player-photos/{player_id}/{filename}
Content-Type: image/jpeg
Authorization: Bearer {token}

[binary data]
```

### Pobierz URL zdjęcia
```
GET /storage/v1/object/public/player-photos/{player_id}/{filename}
```

---

## 10. Realtime Subscriptions

```typescript
// Subskrypcja nowych obserwacji
supabase
  .channel('observations')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'observations' },
    (payload) => console.log('New observation:', payload)
  )
  .subscribe();

// Subskrypcja zmian statusu pipeline
supabase
  .channel('pipeline')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'players', filter: 'pipeline_status=neq.observed' },
    (payload) => console.log('Pipeline change:', payload)
  )
  .subscribe();
```

---

## 11. Error Responses

| Code | Description |
|------|-------------|
| 400 | Bad Request - nieprawidłowe dane |
| 401 | Unauthorized - brak/nieprawidłowy token |
| 403 | Forbidden - brak uprawnień (RLS) |
| 404 | Not Found |
| 409 | Conflict - duplikat |
| 422 | Validation Error |
| 500 | Server Error |

```json
{
  "code": "PGRST301",
  "message": "Row not found",
  "details": null,
  "hint": null
}
```

# ══════════════════════════════════════════════════════════
# DOKUMENT: 06-UI-UX.md
# ══════════════════════════════════════════════════════════

# 06 - UI/UX Guidelines

## 1. Design Principles

### Mobile-First
- Projektujemy najpierw dla telefonu (360px), potem skalujemy do desktop
- Touch-friendly: minimalna wielkość przycisków 44x44px
- Jedna ręka: FAB i kluczowe akcje w zasięgu kciuka

### Szybkość
- Maksymalnie 3 kliknięcia do wykonania głównej akcji
- Autouzupełnianie i sugestie wszędzie gdzie możliwe
- Wizualne potwierdzenie akcji (toast, animacja)

### Prostota
- Jeden główny CTA na ekran
- Minimalna liczba pól w formularzach
- Progresywne ujawnianie szczegółów

---

## 2. Color Palette

```css
/* Primary - niebieski (profesjonalizm, zaufanie) */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Success - zielony */
--success-500: #22c55e;
--success-600: #16a34a;

/* Warning - żółty */
--warning-500: #eab308;
--warning-600: #ca8a04;

/* Danger - czerwony */
--danger-500: #ef4444;
--danger-600: #dc2626;

/* Neutral - szarości */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;

/* Rangi zawodników */
--rank-a: #22c55e;  /* Zielony - TOP */
--rank-b: #3b82f6;  /* Niebieski - Dobry */
--rank-c: #eab308;  /* Żółty - Szeroka kadra */
--rank-d: #ef4444;  /* Czerwony - Słaby */

/* Pipeline statusy */
--status-observed: #6b7280;
--status-shortlist: #8b5cf6;
--status-trial: #f59e0b;
--status-offer: #3b82f6;
--status-signed: #22c55e;
--status-rejected: #ef4444;
```

---

## 3. Typography

```css
/* Font: Inter (Google Fonts) */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Sizes */
--text-xs: 0.75rem;   /* 12px - labels, meta */
--text-sm: 0.875rem;  /* 14px - body small */
--text-base: 1rem;    /* 16px - body */
--text-lg: 1.125rem;  /* 18px - body large */
--text-xl: 1.25rem;   /* 20px - h4 */
--text-2xl: 1.5rem;   /* 24px - h3 */
--text-3xl: 1.875rem; /* 30px - h2 */
--text-4xl: 2.25rem;  /* 36px - h1 */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 4. Component Library (shadcn/ui)

### Buttons
```
Primary:    bg-primary-600 text-white (główne akcje)
Secondary:  bg-gray-100 text-gray-700 (drugorzędne)
Ghost:      bg-transparent (ikony, subtle)
Danger:     bg-danger-600 text-white (usuwanie)

Sizes: sm (32px), md (40px), lg (48px)
```

### Cards
```
Zawsze: rounded-lg shadow-sm border border-gray-200
Hover: shadow-md (jeśli klikalne)
Padding: p-4 (mobile), p-6 (desktop)
```

### Forms
```
Input: h-10 (40px), rounded-md, border-gray-300
       focus:ring-2 focus:ring-primary-500
Label: text-sm font-medium text-gray-700, mb-1
Error: text-sm text-danger-500, mt-1
```

### Badges (Rangi)
```
Rank A: bg-green-100 text-green-800
Rank B: bg-blue-100 text-blue-800
Rank C: bg-yellow-100 text-yellow-800
Rank D: bg-red-100 text-red-800
```

---

## 5. Layout & Navigation

### Mobile Layout
```
┌─────────────────────────────┐
│  Header (56px)              │
│  [☰] ScoutPro      [🔔][👤] │
├─────────────────────────────┤
│                             │
│                             │
│       Content Area          │
│                             │
│                             │
│                        [+]  │  ← FAB (Floating Action Button)
├─────────────────────────────┤
│  Bottom Nav (64px)          │
│  [🏠][👥][📋][⚽][⚙️]       │
└─────────────────────────────┘
```

### Desktop Layout
```
┌────────────────────────────────────────────────────────┐
│  Header (64px)                                         │
│  ScoutPro              [🔍 Search...]    [🔔] [👤 Jan] │
├──────────┬─────────────────────────────────────────────┤
│ Sidebar  │                                             │
│ (240px)  │          Content Area                       │
│          │                                             │
│ 🏠 Dashboard                                           │
│ 👥 Zawodnicy                                           │
│ 📋 Pipeline                                            │
│ ⚽ Mecze                                               │
│ ────────                                               │
│ ⚙️ Ustawienia                                          │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

---

## 6. Screen Wireframes

### 6.1 Login Screen (Mobile)
```
┌─────────────────────────────┐
│                             │
│         ⚽                  │
│      ScoutPro               │
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Hasło            [👁]  │  │
│  └───────────────────────┘  │
│                             │
│  [ ] Zapamiętaj mnie        │
│                             │
│  ┌───────────────────────┐  │
│  │      ZALOGUJ SIĘ      │  │
│  └───────────────────────┘  │
│                             │
│     Zapomniałem hasła       │
│                             │
└─────────────────────────────┘
```

### 6.2 Dashboard (Mobile)
```
┌─────────────────────────────┐
│ [☰] Dashboard        [🔔]   │
├─────────────────────────────┤
│                             │
│  ┌─────────┐ ┌─────────┐    │
│  │   12    │ │   47    │    │
│  │Obserwacje│ │Zawodnicy│    │
│  │ten miesiąc│ │ogółem  │    │
│  └─────────┘ └─────────┘    │
│                             │
│  Pipeline                   │
│  ┌─────────────────────┐    │
│  │ ████████░░░░░░░░░░░ │    │
│  │ 32  │ 8 │ 4 │ 2 │ 1 │    │
│  │ Obs │Sho│Tri│Off│Sig│    │
│  └─────────────────────┘    │
│                             │
│  Ostatnie obserwacje        │
│  ┌─────────────────────┐    │
│  │ 👤 Ziętek Ryszard   │    │
│  │    2011 • Chemik    │ A  │
│  │    dziś, 14:30      │    │
│  ├─────────────────────┤    │
│  │ 👤 Mik Błażej       │    │
│  │    2011 • Olimpia   │ C  │
│  │    wczoraj          │    │
│  └─────────────────────┘    │
│                        [+]  │
├─────────────────────────────┤
│  [🏠][👥][📋][⚽][⚙️]       │
└─────────────────────────────┘
```

### 6.3 New Observation Wizard (Mobile)
```
KROK 1/4: Zawodnik
┌─────────────────────────────┐
│ [✕] Nowa obserwacja    1/4  │
├─────────────────────────────┤
│                             │
│  Nazwisko *                 │
│  ┌───────────────────────┐  │
│  │ Kowalski              │  │
│  └───────────────────────┘  │
│                             │
│  Imię *                     │
│  ┌───────────────────────┐  │
│  │ Jan                   │  │
│  └───────────────────────┘  │
│                             │
│  Rocznik *                  │
│  ┌───────────────────────┐  │
│  │ 2011                  │  │
│  └───────────────────────┘  │
│                             │
│  Klub                       │
│  ┌───────────────────────┐  │
│  │ 🔍 Wpisz nazwę klubu  │  │
│  └───────────────────────┘  │
│    💡 Sugestie:             │
│    • Chemik Bydgoszcz       │
│    • Chełmianka Chełm       │
│                             │
│  ┌───────────────────────┐  │
│  │        DALEJ →        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘

KROK 2/4: Pozycja
┌─────────────────────────────┐
│ [←] Nowa obserwacja    2/4  │
├─────────────────────────────┤
│                             │
│  Pozycja główna             │
│  ┌─────┬─────┬─────┐        │
│  │  1  │  2  │  3  │        │
│  │ GK  │ RB  │ LB  │        │
│  ├─────┼─────┼─────┤        │
│  │  4  │  5  │  6  │        │
│  │ CB  │ CB  │ CDM │        │
│  ├─────┼─────┼─────┤        │
│  │  8  │ 10  │  7  │        │
│  │ CM  │ CAM │ RW  │        │
│  ├─────┼─────┼─────┤        │
│  │ 11  │  9  │     │        │
│  │ LW  │ ST  │     │        │
│  └─────┴─────┴─────┘        │
│                             │
│  Noga dominująca            │
│  ( ) Prawa  (•) Lewa  ( ) Obie│
│                             │
│  ┌───────────────────────┐  │
│  │        DALEJ →        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘

KROK 3/4: Ocena
┌─────────────────────────────┐
│ [←] Nowa obserwacja    3/4  │
├─────────────────────────────┤
│                             │
│  Ranga potencjału           │
│  ┌───────────────────────┐  │
│  │  A   │  B   │  C   │ D │  │
│  │ TOP  │Dobry │Kadra │Sła│  │
│  └───────────────────────┘  │
│                             │
│  Potencjał teraz (1-5)      │
│  [1] [2] [3] [●4] [5]       │
│                             │
│  Potencjał przyszłość (1-5) │
│  [1] [2] [3] [4] [●5]       │
│                             │
│  Źródło obserwacji          │
│  (•) Skauting               │
│  ( ) Polecenie              │
│  ( ) Zgłoszenie             │
│                             │
│  Komentarz                  │
│  ┌───────────────────────┐  │
│  │ Średni wzrost, bdb    │  │
│  │ motoryka, prowadzenie │  │
│  │ piłki na dobrym...    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │        DALEJ →        │  │
│  └───────────────────────┘  │
└─────────────────────────────┘

KROK 4/4: Zdjęcie (opcjonalne)
┌─────────────────────────────┐
│ [←] Nowa obserwacja    4/4  │
├─────────────────────────────┤
│                             │
│  Dodaj zdjęcie (opcjonalne) │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │     📷               │  │
│  │                       │  │
│  │   Zrób zdjęcie       │  │
│  │   lub wybierz z      │  │
│  │   galerii            │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  [Pomiń]                    │
│                             │
│  ┌───────────────────────┐  │
│  │   ✓ ZAPISZ OBSERWACJĘ │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 6.4 Player Profile (Mobile)
```
┌─────────────────────────────┐
│ [←] Profil zawodnika   [✏️] │
├─────────────────────────────┤
│  ┌─────┐                    │
│  │ 👤  │  Ryszard Ziętek    │
│  │     │  2011 • Napastnik  │
│  └─────┘  Chemik Bydgoszcz  │
│                             │
│  ┌───────────────────────┐  │
│  │  Status: SHORTLIST    │  │
│  │  [Zmień status ▼]     │  │
│  └───────────────────────┘  │
│                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│  📊 Oceny                   │
│  ┌─────────────────────┐    │
│  │ Ranga: A (TOP)      │    │
│  │ Potencjał: ★★★★☆    │    │
│  │ Przyszłość: ★★★★★   │    │
│  └─────────────────────┘    │
│                             │
│  📝 Dane podstawowe         │
│  • Pozycja: 9 (ST)          │
│  • Noga: prawa              │
│  • Wzrost: 168 cm           │
│  • Region: kujawsko-pomor.  │
│                             │
│  👨‍👩‍👦 Kontakt               │
│  • Radosław Ziętek (ojciec) │
│  • 📞 792 235 604           │
│                             │
│  📹 Wideo                   │
│  • YouTube - gole 2024      │
│                             │
│  📜 Historia obserwacji (3) │
│  ┌─────────────────────┐    │
│  │ 04.07.2025 • wideo  │ A  │
│  │ Mateusz Sokołowski  │    │
│  │ "średni wzrost, bdb │    │
│  │  motoryka..."       │    │
│  └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

### 6.5 Pipeline Kanban (Desktop)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Pipeline rekrutacyjny                    [Filtr: 2011 ▼] [Pozycja: Wszystkie ▼]  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   OBSERVED (32)    SHORTLIST (8)     TRIAL (4)      OFFER (2)    SIGNED (1) │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐  ┌──────────┐  ┌────────┐ │
│  │            │   │            │   │            │  │          │  │        │ │
│  │ ┌────────┐ │   │ ┌────────┐ │   │ ┌────────┐ │  │┌────────┐│  │┌──────┐│ │
│  │ │Ziętek  │ │   │ │Galasiń.│ │   │ │Izbicki │ │  ││Chorom. ││  ││Wójcig││ │
│  │ │2011 •ST│ │   │ │2011•CAM│ │   │ │2008•CB │ │  ││2010•CAM││  ││2008 ││ │
│  │ │ A      │ │   │ │ B      │ │   │ │ B      │ │  ││ B      ││  ││RB   ││ │
│  │ └────────┘ │   │ └────────┘ │   │ └────────┘ │  │└────────┘│  │└──────┘│ │
│  │ ┌────────┐ │   │ ┌────────┐ │   │ ┌────────┐ │  │┌────────┐│  │        │ │
│  │ │Karpa   │ │   │ │Kowalow.│ │   │ │Fedko   │ │  ││Berliń. ││  │        │ │
│  │ │2011•CDM│ │   │ │2011•CB │ │   │ │2009•CDM│ │  ││2013•LW ││  │        │ │
│  │ │ B      │ │   │ │ B      │ │   │ │ B      │ │  │└────────┘│  │        │ │
│  │ └────────┘ │   │ └────────┘ │   │ └────────┘ │  │          │  │        │ │
│  │ ┌────────┐ │   │            │   │            │  │          │  │        │ │
│  │ │Wandow. │ │   │            │   │            │  │          │  │        │ │
│  │ │2011•LW │ │   │            │   │            │  │          │  │        │ │
│  │ │ B      │ │   │            │   │            │  │          │  │        │ │
│  │ └────────┘ │   │            │   │            │  │          │  │        │ │
│  │    ...     │   │            │   │            │  │          │  │        │ │
│  └────────────┘   └────────────┘   └────────────┘  └──────────┘  └────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

Instrukcja: Przeciągnij kartę zawodnika między kolumnami aby zmienić status
```

---

## 7. Offline Indicators

```
┌─────────────────────────────┐
│ ⚠️ TRYB OFFLINE             │
│ [☰] Dashboard        [🔔]   │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 📴 Brak połączenia    │  │
│  │ Dane zostaną          │  │
│  │ zsynchronizowane po   │  │
│  │ przywróceniu internetu│  │
│  └───────────────────────┘  │
│                             │
│  Oczekujące na sync: 3      │
│                             │
```

```
┌─────────────────────────────┐
│ 🔄 Synchronizacja...        │
│ [████████░░░░] 3/5          │
├─────────────────────────────┤
```

---

## 8. Empty States

### Brak obserwacji
```
┌─────────────────────────────┐
│                             │
│         📋                  │
│                             │
│   Brak obserwacji           │
│                             │
│   Dodaj pierwszą            │
│   obserwację klikając       │
│   przycisk [+] poniżej      │
│                             │
└─────────────────────────────┘
```

### Brak wyników wyszukiwania
```
┌─────────────────────────────┐
│                             │
│         🔍                  │
│                             │
│   Nie znaleziono            │
│   zawodników                │
│                             │
│   Spróbuj zmienić           │
│   kryteria wyszukiwania     │
│                             │
└─────────────────────────────┘
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640px - 1024px | 2 columns, sidebar |
| Desktop | > 1024px | 3+ columns, full sidebar |

```css
/* Tailwind config */
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
}
```

---

## 10. Accessibility (a11y)

- Kontrast minimum 4.5:1 dla tekstu
- Focus visible na wszystkich interaktywnych elementach
- ARIA labels dla ikon i przycisków
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader friendly (semantic HTML)
- Animacje respektują `prefers-reduced-motion`

# ══════════════════════════════════════════════════════════
# DOKUMENT: 07-BACKLOG.md
# ══════════════════════════════════════════════════════════

# 07 - Backlog & Roadmap

## 1. Release Plan

| Release | Nazwa | Termin | Zakres |
|---------|-------|--------|--------|
| v0.1 | Alpha | Q2 2025 W8 | Fundament: Auth, DB, podstawowy UI |
| v0.2 | Alpha | Q2 2025 W10 | Obserwacje: formularz, lista |
| v0.3 | Beta | Q2 2025 W12 | Profile zawodników, offline |
| v0.4 | Beta | Q3 2025 W14 | Pipeline, dashboard |
| v1.0 | MVP | Q3 2025 W16 | Polish, testy, deploy prod |

---

## 2. Sprint 1: Fundament (2 tygodnie)

### 🎯 Cel sprintu
Działająca autentykacja, baza danych i podstawowa nawigacja.

### Zadania

#### TASK-001: Setup projektu
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Inicjalizacja projektu React + Vite + TypeScript + Tailwind

Acceptance Criteria:
- [ ] `npm create vite@latest scoutpro -- --template react-ts`
- [ ] Tailwind CSS skonfigurowany
- [ ] shadcn/ui zainstalowany
- [ ] ESLint + Prettier skonfigurowany
- [ ] Struktura folderów zgodna z architekturą
- [ ] .env.example z zmiennymi Supabase
- [ ] README z instrukcją uruchomienia
```

---

#### TASK-002: Konfiguracja Supabase
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Utworzenie projektu Supabase i konfiguracja klienta

Acceptance Criteria:
- [ ] Projekt Supabase utworzony
- [ ] Supabase CLI zainstalowane lokalnie
- [ ] supabase/config.toml skonfigurowany
- [ ] src/lib/supabase.ts z typowanym klientem
- [ ] Generowanie typów: supabase gen types
```

---

#### TASK-003: Migracja - schemat bazy
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Opis:
Utworzenie wszystkich tabel zgodnie z modelem danych

Acceptance Criteria:
- [ ] 001_initial_schema.sql z tabelami:
  - users, invitations
  - players, player_contacts, player_evaluations
  - observations, matches
  - clubs, regions, leagues, categories
  - positions, evaluation_criteria
  - pipeline_history, offline_queue
- [ ] Wszystkie FK i indeksy
- [ ] Migracja działa: supabase db push
```

---

#### TASK-004: RLS Policies
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Polityki Row Level Security dla wszystkich tabel

Acceptance Criteria:
- [ ] 002_rls_policies.sql
- [ ] users: read all, write own/admin
- [ ] observations: read all, write own
- [ ] players: read/write all
- [ ] settings tables: read all, write admin
- [ ] Testy RLS działają
```

---

#### TASK-005: Seed data
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Opis:
Dane początkowe (słowniki) i import z Excel

Acceptance Criteria:
- [ ] 003_seed_data.sql z:
  - 16 regionów (województwa)
  - 12 kategorii wiekowych
  - 11 pozycji z kryteriami
  - 10 przykładowych klubów
- [ ] 004_import_excel.sql z danymi z pliku Excel
```

---

#### TASK-006: Layout i nawigacja
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Opis:
Podstawowy layout z header, sidebar, bottom nav

Acceptance Criteria:
- [ ] Layout.tsx z responsywnością
- [ ] Header.tsx (logo, notyfikacje, user menu)
- [ ] Sidebar.tsx (desktop)
- [ ] MobileNav.tsx (bottom tabs)
- [ ] React Router z routes
- [ ] Protected routes (wymaga auth)
```

---

#### TASK-007: Strona logowania
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Opis:
Formularz logowania z obsługą błędów

Acceptance Criteria:
- [ ] LoginPage.tsx
- [ ] LoginForm.tsx z React Hook Form + Zod
- [ ] Walidacja email/hasło
- [ ] Obsługa błędów (nieprawidłowe dane)
- [ ] "Zapamiętaj mnie" (persist session)
- [ ] Link "Zapomniałem hasła"
- [ ] Redirect po zalogowaniu → /dashboard
```

---

#### TASK-008: Reset hasła
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Opis:
Flow resetowania hasła

Acceptance Criteria:
- [ ] ResetPasswordPage.tsx (formularz email)
- [ ] SetNewPasswordPage.tsx (nowe hasło)
- [ ] Integracja z Supabase Auth
- [ ] Komunikaty sukcesu/błędu
```

---

#### TASK-009: Auth store i hook
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Zustand store dla stanu autentykacji

Acceptance Criteria:
- [ ] stores/authStore.ts
- [ ] State: user, session, isLoading
- [ ] Actions: login, logout, refreshSession
- [ ] hooks/useAuth.ts
- [ ] Auto-refresh tokena
- [ ] Obsługa wygasłej sesji
```

---

#### TASK-010: Dashboard placeholder
**Estymacja:** 2h | **Priorytet:** P1

```markdown
Opis:
Podstawowa strona dashboard (placeholder)

Acceptance Criteria:
- [ ] DashboardPage.tsx
- [ ] Wyświetla imię zalogowanego użytkownika
- [ ] Placeholdery dla widgetów
```

---

### Sprint 1 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-001 | 4h | P0 |
| TASK-002 | 4h | P0 |
| TASK-003 | 8h | P0 |
| TASK-004 | 4h | P0 |
| TASK-005 | 4h | P1 |
| TASK-006 | 8h | P0 |
| TASK-007 | 6h | P0 |
| TASK-008 | 4h | P1 |
| TASK-009 | 4h | P0 |
| TASK-010 | 2h | P1 |
| **RAZEM** | **48h** | |

---

## 3. Sprint 2: Obserwacje (2 tygodnie)

### 🎯 Cel sprintu
Dodawanie i przeglądanie obserwacji (główna funkcja MVP).

### Zadania

#### TASK-011: Lista obserwacji
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] ObservationsPage.tsx
- [ ] ObservationList.tsx z kartami
- [ ] Filtry: rocznik, pozycja, ranga, data
- [ ] Sortowanie: data, ranga
- [ ] Paginacja (infinite scroll)
- [ ] useObservations.ts hook
```

---

#### TASK-012: Karta obserwacji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] ObservationCard.tsx
- [ ] Wyświetla: nazwisko, imię, klub, rocznik, ranga, data, autor
- [ ] Badge rangi z kolorami
- [ ] Kliknięcie → profil zawodnika
- [ ] Responsywna
```

---

#### TASK-013: Wizard nowej obserwacji
**Estymacja:** 12h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] NewObservationPage.tsx
- [ ] ObservationWizard.tsx (4 kroki)
- [ ] Krok 1: Dane zawodnika (nazwisko, imię, rocznik, klub)
- [ ] Krok 2: Pozycja i noga
- [ ] Krok 3: Ocena (ranga, potencjał, komentarz)
- [ ] Krok 4: Zdjęcie (opcjonalne)
- [ ] Progress indicator
- [ ] Walidacja per krok
- [ ] Zapisz jako draft na każdym etapie
```

---

#### TASK-014: Autouzupełnianie klubu
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] ClubAutocomplete.tsx (Combobox)
- [ ] Wyszukiwanie w tabeli clubs
- [ ] Sugestie z historii użytkownika
- [ ] Możliwość dodania nowego klubu ad-hoc
```

---

#### TASK-015: Selektor pozycji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PositionSelector.tsx
- [ ] Grid przycisków (układ boiska)
- [ ] Wizualne zaznaczenie wybranej
- [ ] Obsługa wielu pozycji (np. "4/5")
```

---

#### TASK-016: Formularz oceny
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] EvaluationForm.tsx
- [ ] Wybór rangi (A/B/C/D) - duże przyciski
- [ ] Slider lub przyciski 1-5 dla potencjału
- [ ] Dropdown źródła
- [ ] Textarea na komentarz
```

---

#### TASK-017: Upload zdjęcia
**Estymacja:** 6h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] PhotoUpload.tsx
- [ ] Wybór: aparat lub galeria
- [ ] Kompresja do max 500KB
- [ ] Podgląd miniaturki
- [ ] Upload do Supabase Storage
- [ ] Max 3 zdjęcia
```

---

#### TASK-018: API obserwacji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] observations.api.ts
- [ ] getObservations(filters)
- [ ] getObservation(id)
- [ ] createObservation(data)
- [ ] updateObservation(id, data)
- [ ] deleteObservation(id) - soft delete
```

---

#### TASK-019: Linkowanie zawodnika
**Estymacja:** 6h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] PlayerLinkDialog.tsx
- [ ] Wyszukiwanie potencjalnych duplikatów
- [ ] Matching: nazwisko + rocznik + klub
- [ ] Opcje: "To ten sam" / "Nowy zawodnik"
- [ ] Automatyczne linkowanie obserwacji
```

---

#### TASK-020: FAB (Floating Action Button)
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] FAB.tsx
- [ ] Pozycja: prawy dolny róg (mobile)
- [ ] Ikona "+"
- [ ] Kliknięcie → /observations/new
- [ ] Animacja hover/press
```

---

### Sprint 2 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-011 | 6h | P0 |
| TASK-012 | 4h | P0 |
| TASK-013 | 12h | P0 |
| TASK-014 | 4h | P1 |
| TASK-015 | 4h | P0 |
| TASK-016 | 6h | P0 |
| TASK-017 | 6h | P1 |
| TASK-018 | 4h | P0 |
| TASK-019 | 6h | P1 |
| TASK-020 | 2h | P0 |
| **RAZEM** | **54h** | |

---

## 4. Sprint 3: Profile i Offline (2 tygodnie)

### 🎯 Cel sprintu
Kompletne profile zawodników i działanie offline.

### Zadania

#### TASK-021: Profil zawodnika
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayerDetailPage.tsx
- [ ] PlayerProfile.tsx z sekcjami
- [ ] Dane podstawowe
- [ ] Dane fizyczne
- [ ] Kontakty
- [ ] Historia obserwacji (timeline)
- [ ] Status pipeline
```

---

#### TASK-022: Edycja profilu
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayerForm.tsx (modal lub osobna strona)
- [ ] Edycja wszystkich pól
- [ ] Walidacja
- [ ] Zapisywanie zmian
```

---

#### TASK-023: Lista zawodników
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayersPage.tsx
- [ ] PlayerList.tsx z kartami
- [ ] PlayerCard.tsx
- [ ] Filtry: rocznik, pozycja, status, region
- [ ] Wyszukiwarka tekstowa
- [ ] Sortowanie
```

---

#### TASK-024: Kontakty rodzica
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] ContactsSection.tsx
- [ ] Lista kontaktów z możliwością edycji
- [ ] Dodawanie nowego kontaktu
- [ ] Oznaczenie głównego kontaktu
- [ ] Ikony: telefon, email (clickable)
```

---

#### TASK-025: Linki wideo
**Estymacja:** 4h | **Priorytet:** P2

```markdown
Acceptance Criteria:
- [ ] VideoLinks.tsx
- [ ] Lista linków URL
- [ ] Walidacja URL
- [ ] Embed player (YouTube, Vimeo) jeśli możliwe
```

---

#### TASK-026: PWA manifest i ikony
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] public/manifest.json
- [ ] Ikony 192x192 i 512x512
- [ ] Theme color
- [ ] Start URL
- [ ] Display: standalone
```

---

#### TASK-027: Service Worker (Workbox)
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] vite-plugin-pwa skonfigurowany
- [ ] Cache static assets
- [ ] Cache API responses (NetworkFirst)
- [ ] Cache images (CacheFirst)
- [ ] Offline fallback page
```

---

#### TASK-028: IndexedDB setup (Dexie)
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] offlineDb.ts z Dexie
- [ ] Tabele: observations, players
- [ ] Schema versioning
```

---

#### TASK-029: Offline observation save
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] Zapisywanie obserwacji do IndexedDB gdy offline
- [ ] LocalId generowany (UUID)
- [ ] Status: pending
- [ ] Wizualny wskaźnik "zapisano lokalnie"
```

---

#### TASK-030: Sync mechanism
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] useSync.ts hook
- [ ] useOnlineStatus.ts hook
- [ ] Automatyczna synchronizacja po powrocie online
- [ ] Progress indicator
- [ ] Retry logic (3x)
- [ ] Error handling
```

---

#### TASK-031: Offline indicator
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] OfflineIndicator.tsx (banner)
- [ ] Wyświetla gdy navigator.onLine = false
- [ ] Licznik oczekujących na sync
```

---

### Sprint 3 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-021 | 8h | P0 |
| TASK-022 | 6h | P0 |
| TASK-023 | 6h | P0 |
| TASK-024 | 4h | P1 |
| TASK-025 | 4h | P2 |
| TASK-026 | 2h | P0 |
| TASK-027 | 8h | P0 |
| TASK-028 | 4h | P0 |
| TASK-029 | 6h | P0 |
| TASK-030 | 8h | P0 |
| TASK-031 | 2h | P0 |
| **RAZEM** | **58h** | |

---

## 5. Sprint 4: Pipeline i Dashboard (2 tygodnie)

### Zadania

#### TASK-032: Pipeline Kanban board
**Estymacja:** 12h | **Priorytet:** P0

#### TASK-033: Drag & drop status change
**Estymacja:** 6h | **Priorytet:** P0

#### TASK-034: Pipeline history
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-035: Dashboard widgets
**Estymacja:** 8h | **Priorytet:** P0

#### TASK-036: Pipeline chart
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-037: Recent observations widget
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-038: Stats API
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-039: Realtime subscriptions
**Estymacja:** 4h | **Priorytet:** P2

---

## 6. Sprint 5: Admin i Polish (2 tygodnie)

### Zadania

#### TASK-040: Users management (Admin)
**Estymacja:** 6h | **Priorytet:** P0

#### TASK-041: Invite user flow
**Estymacja:** 8h | **Priorytet:** P0

#### TASK-042: Settings - Regions
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-043: Settings - Leagues
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-044: Settings - Clubs
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-045: Push notifications
**Estymacja:** 6h | **Priorytet:** P2

#### TASK-046: Error boundaries
**Estymacja:** 2h | **Priorytet:** P0

#### TASK-047: Loading states
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-048: E2E tests setup
**Estymacja:** 6h | **Priorytet:** P1

#### TASK-049: Production deploy
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-050: Documentation
**Estymacja:** 4h | **Priorytet:** P1

---

## 7. Backlog Faza 2 (Post-MVP)

| ID | Funkcja | Estymacja | Priorytet |
|----|---------|-----------|-----------|
| F2-001 | Benchmarking (porównanie z absolwentami) | 20h | P2 |
| F2-002 | Role i regiony (granularne uprawnienia) | 16h | P2 |
| F2-003 | Audit log (historia zmian) | 12h | P2 |
| F2-004 | Import CSV | 8h | P3 |
| F2-005 | Eksport do PDF | 12h | P3 |
| F2-006 | Kalendarz integracja | 16h | P3 |
| F2-007 | Raport produktywności scoutów | 8h | P2 |
| F2-008 | Multi-language (EN) | 20h | P3 |
| F2-009 | Integracja Wyscout | 24h | P3 |
| F2-010 | Oceny pozycyjne szczegółowe | 12h | P2 |

---

## 8. Definition of Done (DoD)

### Dla każdego zadania:
- [ ] Kod napisany zgodnie ze standardami
- [ ] Testy jednostkowe (jeśli dotyczy)
- [ ] Code review zatwierdzony
- [ ] Brak błędów TypeScript
- [ ] Brak ostrzeżeń ESLint
- [ ] Dokumentacja zaktualizowana
- [ ] Przetestowane na mobile i desktop
- [ ] Działa offline (jeśli dotyczy)

### Dla każdego sprintu:
- [ ] Wszystkie zadania P0 ukończone
- [ ] Demo dla Product Ownera
- [ ] Retrospektywa przeprowadzona
- [ ] Deployment na staging

### Dla MVP Release:
- [ ] Wszystkie user stories P1 i P2 ukończone
- [ ] Testy E2E passing
- [ ] Performance audit (Lighthouse > 80)
- [ ] Security audit
- [ ] Dokumentacja użytkownika
- [ ] Deployment na produkcję

# ══════════════════════════════════════════════════════════
# DOKUMENT: 08-OFFLINE.md
# ══════════════════════════════════════════════════════════

# 08 - Offline Strategy

## 1. Przegląd

ScoutPro jest aplikacją **offline-first** dla scenariuszy, gdzie scouts pracują na stadionach bez zasięgu internetu. Strategia opiera się na:

- **PWA** (Progressive Web App) - instalacja na telefonie
- **Service Worker** - cache zasobów i API
- **IndexedDB** - lokalna baza danych
- **Background Sync** - synchronizacja po powrocie online

---

## 2. Architektura Offline

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLIKACJA (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Zustand    │     │  React      │     │  Offline    │       │
│  │  Store      │◄────│  Query      │◄────│  Hook       │       │
│  └─────────────┘     └──────┬──────┘     └──────┬──────┘       │
│                             │                   │               │
│                             ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                            │   │
│  │  ┌─────────────┐              ┌─────────────┐            │   │
│  │  │  Supabase   │◄── online ──►│  IndexedDB  │            │   │
│  │  │  Client     │              │  (Dexie)    │            │   │
│  │  └─────────────┘              └─────────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE WORKER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Static     │  │  API        │  │  Background │             │
│  │  Cache      │  │  Cache      │  │  Sync       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Worker Configuration

### Workbox Strategies

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    // Cache static assets (JS, CSS, images)
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    
    runtimeCaching: [
      // API calls - Network First with fallback
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24h
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      
      // Images - Cache First
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      
      // Auth endpoints - Network Only (never cache)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
})
```

---

## 4. IndexedDB Schema

```typescript
// src/features/offline/db/offlineDb.ts
import Dexie, { Table } from 'dexie';

// Types
export interface OfflineObservation {
  localId: string;           // UUID generated locally
  remoteId?: string;         // UUID from server after sync
  data: {
    player_id?: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    club_name?: string;
    position?: string;
    dominant_foot?: string;
    source: string;
    rank?: string;
    notes?: string;
    potential_now?: number;
    potential_future?: number;
    observation_date: string;
  };
  photos: Blob[];            // Local photos (not synced)
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  syncError?: string;
  lastSyncAttempt?: Date;
}

export interface CachedPlayer {
  id: string;
  data: object;
  cachedAt: Date;
}

export interface CachedObservation {
  id: string;
  data: object;
  cachedAt: Date;
}

// Database
export class OfflineDatabase extends Dexie {
  offlineObservations!: Table<OfflineObservation>;
  cachedPlayers!: Table<CachedPlayer>;
  cachedObservations!: Table<CachedObservation>;

  constructor() {
    super('ScoutProOffline');
    
    this.version(1).stores({
      offlineObservations: 'localId, syncStatus, createdAt',
      cachedPlayers: 'id, cachedAt',
      cachedObservations: 'id, cachedAt',
    });
  }
}

export const offlineDb = new OfflineDatabase();
```

---

## 5. Online Status Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check with a real request (navigator.onLine can be unreliable)
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
```

---

## 6. Offline Observation Flow

### Saving Observation Offline

```typescript
// src/features/observations/hooks/useCreateObservation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb } from '@/features/offline/db/offlineDb';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useCreateObservation() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (observationData: ObservationInput) => {
      if (isOnline) {
        // Online: save directly to Supabase
        const { data, error } = await supabase
          .from('observations')
          .insert(observationData)
          .select()
          .single();
        
        if (error) throw error;
        return { source: 'remote', data };
      } else {
        // Offline: save to IndexedDB
        const localId = uuidv4();
        const offlineObs: OfflineObservation = {
          localId,
          data: observationData,
          photos: [],
          createdAt: new Date(),
          syncStatus: 'pending',
          syncAttempts: 0,
        };
        
        await offlineDb.offlineObservations.add(offlineObs);
        return { source: 'local', data: offlineObs };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      
      // Show appropriate toast
      if (result.source === 'local') {
        toast.info('Obserwacja zapisana lokalnie. Zostanie zsynchronizowana po połączeniu.');
      } else {
        toast.success('Obserwacja zapisana!');
      }
    },
  });
}
```

---

## 7. Synchronization Logic

```typescript
// src/features/offline/hooks/useSync.ts
import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb, OfflineObservation } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

export function useSync() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  // Count pending items
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await offlineDb.offlineObservations
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .count();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync when online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingObservations();
    }
  }, [isOnline, pendingCount]);

  const syncPendingObservations = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);

    try {
      const pending = await offlineDb.offlineObservations
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .filter(obs => obs.syncAttempts < MAX_RETRY_ATTEMPTS)
        .toArray();

      setSyncProgress({ current: 0, total: pending.length });

      for (let i = 0; i < pending.length; i++) {
        const obs = pending[i];
        setSyncProgress({ current: i + 1, total: pending.length });

        try {
          // Update status to syncing
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: 'syncing',
            lastSyncAttempt: new Date(),
          });

          // First, find or create player
          let playerId = obs.data.player_id;
          
          if (!playerId) {
            // Create player if not linked
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert({
                first_name: obs.data.first_name,
                last_name: obs.data.last_name,
                birth_year: obs.data.birth_year,
                primary_position: obs.data.position,
                dominant_foot: obs.data.dominant_foot,
              })
              .select()
              .single();

            if (playerError) throw playerError;
            playerId = player.id;
          }

          // Create observation
          const { data: observation, error: obsError } = await supabase
            .from('observations')
            .insert({
              player_id: playerId,
              source: obs.data.source,
              rank: obs.data.rank,
              notes: obs.data.notes,
              potential_now: obs.data.potential_now,
              potential_future: obs.data.potential_future,
              observation_date: obs.data.observation_date,
              is_offline_created: true,
            })
            .select()
            .single();

          if (obsError) throw obsError;

          // Mark as synced
          await offlineDb.offlineObservations.update(obs.localId, {
            remoteId: observation.id,
            syncStatus: 'synced',
          });

        } catch (error) {
          console.error('Sync error for observation:', obs.localId, error);
          
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: 'failed',
            syncAttempts: obs.syncAttempts + 1,
            syncError: error.message,
          });

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }

    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isSyncing]);

  const retryFailedSync = useCallback(async () => {
    // Reset failed items to pending
    await offlineDb.offlineObservations
      .where('syncStatus')
      .equals('failed')
      .modify({ syncStatus: 'pending', syncAttempts: 0 });
    
    // Trigger sync
    await syncPendingObservations();
  }, [syncPendingObservations]);

  return {
    isSyncing,
    syncProgress,
    pendingCount,
    syncPendingObservations,
    retryFailedSync,
  };
}
```

---

## 8. UI Components

### Offline Indicator

```typescript
// src/components/common/OfflineIndicator.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSync } from '@/features/offline/hooks/useSync';
import { WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { isSyncing, syncProgress, pendingCount, retryFailedSync } = useSync();

  if (isOnline && pendingCount === 0) {
    return null; // Everything synced, don't show anything
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium
      ${isOnline ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-yellow-900'}
    `}>
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Tryb offline</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                Synchronizacja... {syncProgress.current}/{syncProgress.total}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>{pendingCount} oczekujących na synchronizację</span>
            </>
          )}
        </div>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={retryFailedSync}
            className="text-xs underline hover:no-underline"
          >
            Synchronizuj teraz
          </button>
        )}
      </div>
    </div>
  );
}
```

### Sync Status Component

```typescript
// src/features/offline/components/SyncStatus.tsx
import { useSync } from '../hooks/useSync';
import { offlineDb } from '../db/offlineDb';
import { useLiveQuery } from 'dexie-react-hooks';

export function SyncStatus() {
  const { pendingCount } = useSync();
  
  const pendingItems = useLiveQuery(
    () => offlineDb.offlineObservations
      .where('syncStatus')
      .anyOf(['pending', 'failed'])
      .toArray()
  );

  if (!pendingItems?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
        <p>Wszystkie dane zsynchronizowane</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        Oczekujące na synchronizację ({pendingCount})
      </h3>
      
      <ul className="space-y-2">
        {pendingItems.map((item) => (
          <li
            key={item.localId}
            className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
          >
            <div>
              <p className="font-medium">
                {item.data.last_name} {item.data.first_name}
              </p>
              <p className="text-sm text-gray-500">
                {item.data.birth_year} • {item.data.observation_date}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {item.syncStatus === 'failed' && (
                <span className="text-xs text-red-500">
                  Błąd ({item.syncAttempts}/3)
                </span>
              )}
              <StatusBadge status={item.syncStatus} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9. Data Caching Strategy

### Cache Recent Data on Login

```typescript
// src/features/offline/hooks/useCacheData.ts
import { useEffect } from 'react';
import { offlineDb } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

export function useCacheData() {
  useEffect(() => {
    cacheRecentData();
  }, []);

  async function cacheRecentData() {
    try {
      // Cache last 50 players
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (players) {
        const now = new Date();
        await offlineDb.cachedPlayers.bulkPut(
          players.map(p => ({ id: p.id, data: p, cachedAt: now }))
        );
      }

      // Cache last 100 observations
      const { data: observations } = await supabase
        .from('observations')
        .select('*, player:players(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (observations) {
        const now = new Date();
        await offlineDb.cachedObservations.bulkPut(
          observations.map(o => ({ id: o.id, data: o, cachedAt: now }))
        );
      }

      console.log('Data cached for offline use');
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  return { cacheRecentData };
}
```

---

## 10. Conflict Resolution

Dla MVP używamy strategii **Last Write Wins** (LWW), ponieważ:
- Ryzyko konfliktów jest niskie (5 użytkowników)
- Jeden scout rzadko edytuje obserwację innego
- Prostota implementacji

### Przyszłe rozszerzenia (Faza 2):
- Merge strategy dla tekstów
- Manual conflict resolution UI
- Optimistic locking z wersjonowaniem

---

## 11. Limity i ograniczenia

| Limit | Wartość | Uzasadnienie |
|-------|---------|--------------|
| Max offline observations | 100 | Storage limit |
| Max cached players | 50 | Memory |
| Max cached observations | 100 | Memory |
| Photo storage offline | Nie | Storage, complexity |
| Offline edycja istniejących | Nie (MVP) | Conflict avoidance |
| Max sync retry | 3 | Prevent infinite loops |

---

## 12. Testowanie Offline

### Manual Testing Checklist:
- [ ] Zainstaluj PWA na telefonie
- [ ] Włącz tryb samolotowy
- [ ] Dodaj obserwację
- [ ] Sprawdź zapis w IndexedDB (DevTools)
- [ ] Wyłącz tryb samolotowy
- [ ] Zweryfikuj automatyczną synchronizację
- [ ] Sprawdź dane w Supabase

### Chrome DevTools:
1. Application → Service Workers → Offline
2. Application → IndexedDB → ScoutProOffline
3. Network → Throttling → Offline

# ══════════════════════════════════════════════════════════
# DOKUMENT: 09-DEPLOYMENT.md
# ══════════════════════════════════════════════════════════

# 09 - Deployment Guide

## 1. Przegląd Środowisk

| Środowisko | URL | Branch | Auto-deploy |
|------------|-----|--------|-------------|
| Development | localhost:5173 | - | Manual |
| Staging | staging.scoutpro.app | develop | ✅ |
| Production | app.scoutpro.app | main | ✅ |

---

## 2. Supabase Setup

### 2.1 Utworzenie projektu

1. Zaloguj się na [supabase.com](https://supabase.com)
2. Kliknij "New Project"
3. Wypełnij:
   - **Name:** scoutpro-prod (lub scoutpro-staging)
   - **Database Password:** (zapisz bezpiecznie!)
   - **Region:** Frankfurt (eu-central-1)
4. Poczekaj na provisioning (~2 min)

### 2.2 Konfiguracja Auth

1. Dashboard → Authentication → Providers
2. Włącz **Email** provider
3. Settings → Email Templates:
   - Confirm signup
   - Reset password
   - Magic link (opcjonalnie)
4. Settings → URL Configuration:
   ```
   Site URL: https://app.scoutpro.app
   Redirect URLs:
   - https://app.scoutpro.app/*
   - https://staging.scoutpro.app/*
   - http://localhost:5173/*
   ```

### 2.3 Konfiguracja Storage

1. Dashboard → Storage
2. Create bucket: `player-photos`
3. Policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'player-photos');
   
   -- Allow public read
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'player-photos');
   ```

### 2.4 Uruchomienie migracji

```bash
# Instalacja Supabase CLI
npm install -g supabase

# Login
supabase login

# Link projektu
supabase link --project-ref YOUR_PROJECT_REF

# Uruchom migracje
supabase db push

# Wgraj seed data
supabase db seed
```

### 2.5 Pobranie kluczy API

Dashboard → Settings → API:
- **Project URL:** `https://xxxxx.supabase.co`
- **anon (public) key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
- **service_role key:** (tylko backend, nigdy w frontend!)

---

## 3. Vercel Setup

### 3.1 Import projektu

1. Zaloguj się na [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Import z GitHub
4. Wybierz repo `scoutpro`

### 3.2 Konfiguracja build

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3.3 Environment Variables

Dodaj w Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| VITE_SUPABASE_URL | https://xxx.supabase.co | All |
| VITE_SUPABASE_ANON_KEY | eyJhbG... | All |
| VITE_APP_URL | https://app.scoutpro.app | Production |
| VITE_APP_URL | https://staging.scoutpro.app | Preview |

### 3.4 Domains

1. Settings → Domains
2. Dodaj custom domain: `app.scoutpro.app`
3. Skonfiguruj DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### 3.5 Preview Deployments

Automatycznie dla każdego PR:
- URL: `scoutpro-xxx-team.vercel.app`
- Używa tych samych env vars (chyba że override)

---

## 4. GitHub Actions

### 4.1 Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Unit tests
        run: npm run test:unit

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel (Staging)
        uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel (Production)
        uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 4.2 Database Migrations

```yaml
# .github/workflows/migrations.yml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 5. GitHub Secrets

Dodaj w repo Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| VERCEL_TOKEN | Vercel API token |
| VERCEL_ORG_ID | Vercel organization ID |
| VERCEL_PROJECT_ID | Vercel project ID |
| SUPABASE_ACCESS_TOKEN | Supabase CLI access token |
| SUPABASE_PROJECT_ID | Supabase project ref |

---

## 6. Local Development

### 6.1 Setup

```bash
# Klonuj repo
git clone git@github.com:your-org/scoutpro.git
cd scoutpro

# Zainstaluj zależności
npm install

# Skopiuj env
cp .env.example .env.local

# Uzupełnij zmienne w .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Uruchom
npm run dev
```

### 6.2 Local Supabase (opcjonalnie)

```bash
# Start local Supabase
supabase start

# Użyj lokalnych credentials
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>

# Stop
supabase stop
```

---

## 7. Monitoring & Debugging

### 7.1 Vercel Analytics

1. Dashboard → Analytics
2. Web Vitals: LCP, FID, CLS
3. Page views, unique visitors

### 7.2 Supabase Logs

1. Dashboard → Logs
2. Filtruj po:
   - API requests
   - Auth events
   - Database queries
   - Edge functions

### 7.3 Error Tracking (Faza 2)

```typescript
// Sentry setup (opcjonalnie)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
});
```

---

## 8. Backup Strategy

### 8.1 Supabase Backups

- **Automatic:** Daily backups (7 days retention on Pro)
- **Point-in-time recovery:** Pro plan
- **Manual:** Dashboard → Database → Backups

### 8.2 Export Data

```bash
# Export via CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

---

## 9. Rollback Procedures

### 9.1 Frontend Rollback

```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Or via Dashboard:
# Deployments → Find previous → "..." → Promote to Production
```

### 9.2 Database Rollback

```bash
# Restore from backup
supabase db reset

# Or revert specific migration
supabase migration revert
```

---

## 10. Performance Checklist

### Pre-deployment:
- [ ] `npm run build` bez błędów
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 80
- [ ] Wszystkie testy przechodzą

### Post-deployment:
- [ ] Strona ładuje się < 3s
- [ ] Login działa
- [ ] API calls zwracają dane
- [ ] PWA instaluje się
- [ ] Offline mode działa

---

## 11. Troubleshooting

### Build fails
```
Error: Cannot find module 'xyz'
→ npm ci (nie npm install)
→ Sprawdź node_modules w .gitignore
```

### Supabase connection error
```
Error: Invalid API key
→ Sprawdź VITE_SUPABASE_ANON_KEY
→ Sprawdź czy project URL jest poprawny
```

### CORS error
```
Error: CORS policy
→ Supabase Dashboard → Settings → API → Additional Config
→ Dodaj domenę do allowed origins
```

### PWA not installing
```
→ Sprawdź manifest.json
→ Sprawdź HTTPS (wymagane)
→ Sprawdź Service Worker registration
```

# ══════════════════════════════════════════════════════════
# DOKUMENT: 10-SAMPLE-DATA.md
# ══════════════════════════════════════════════════════════

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

# ══════════════════════════════════════════════════════════════
# KOŃCOWE INSTRUKCJE DLA CURSOR
# ══════════════════════════════════════════════════════════════

Po przeczytaniu dokumentacji:

1. **Potwierdź zrozumienie projektu** i wypisz kluczowe funkcje
2. **Zaproponuj plan implementacji** (które pliki najpierw)
3. **Rozpocznij od TASK-001** z backlogu (Sprint 1)

## WAŻNE ZASADY

- TypeScript strict mode
- Polski UI, angielski kod (nazwy zmiennych, funkcji)
- Komentarze w kodzie po polsku (dla klienta)
- Każdy komponent w osobnym pliku
- Mobile-first CSS (Tailwind)
- Używaj shadcn/ui dla wszystkich komponentów UI

## KOMENDY NA START

```bash
# 1. Inicjalizacja projektu
npm create vite@latest scoutpro -- --template react-ts
cd scoutpro

# 2. Instalacja zależności
npm install @supabase/supabase-js @tanstack/react-query zustand react-router-dom react-hook-form zod @hookform/resolvers dexie dexie-react-hooks lucide-react date-fns
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa @types/node

# 3. Tailwind
npx tailwindcss init -p

# 4. shadcn/ui
npx shadcn-ui@latest init
# Wybierz: TypeScript, style: default, base color: slate, CSS variables: yes

# 5. Dodaj komponenty shadcn
npx shadcn-ui@latest add button card input label select textarea badge dialog dropdown-menu tabs toast form

# 6. Start
npm run dev
```

## STRUKTURA PLIKÓW DO UTWORZENIA

```
src/
├── components/
│   ├── ui/           # shadcn components (auto-generated)
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   └── common/
│       ├── FAB.tsx
│       ├── OfflineIndicator.tsx
│       └── LoadingSpinner.tsx
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── LoginForm.tsx
│   │   └── useAuth.ts
│   ├── players/
│   │   ├── PlayersPage.tsx
│   │   ├── PlayerList.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerProfile.tsx
│   │   ├── PlayerForm.tsx        # ← Formularz dodawania zawodnika!
│   │   └── usePlayers.ts
│   ├── observations/
│   │   ├── ObservationsPage.tsx
│   │   ├── ObservationWizard.tsx
│   │   ├── ObservationCard.tsx
│   │   └── useObservations.ts
│   ├── pipeline/
│   │   ├── PipelinePage.tsx
│   │   └── PipelineBoard.tsx
│   └── dashboard/
│       ├── DashboardPage.tsx
│       └── StatsWidget.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── stores/
│   └── authStore.ts
├── types/
│   └── database.types.ts
├── App.tsx
└── main.tsx
```

Rozpocznij implementację! Najpierw pokaż mi plan, potem kod.
