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
