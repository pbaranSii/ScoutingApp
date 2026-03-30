# Wizja produktu

## Executive summary
ScoutPro to mobilny system scoutingowy dla akademii pilkarskich. System standaryzuje
proces obserwacji, centralizuje dane zawodników i wspiera decyzje rekrutacyjne
przez obiektywne KPI oraz dashboardy.

## Kluczowe problemy i odpowiedzi produktu
| Problem | Obecny stan | Rozwiązanie ScoutPro |
|---------|-------------|---------------------|
| Rozproszone dane | Excel, notatki papierowe | Centralna baza danych |
| Subiektywne oceny | Brak standardów | Ujednolicone szablony per pozycja |
| Utrata informacji | Brak historii kontaktów | Profil zawodnika 360 |
| Brak widoczności pipeline | Chaos w statusach | Funnel Observed -> Signed |
| Praca offline | Brak narzędzi | PWA z synchronizacją |

## Personas
### Persona 1: Scout (primary user)
- Mobile-first, praca w terenie, często bez internetu.
- Potrzeba: szybkie dodanie obserwacji i dostęp do historii zawodnika.

### Persona 2: Trener (secondary user)
- Potrzeba: szybki wgląd w profil i shortlisty.

### Persona 3: Dyrektor sportowy (tertiary user)
- Potrzeba: KPI, raporty pipeline i przekrojowe widoki.

## Value proposition
- Szybkie dodawanie obserwacji w trakcie meczu.
- Jednolity model oceny zawodnika (pozycje i kryteria).
- Praca offline z bezpieczną synchronizacją.
- Widoczność pipeline i historii decyzji.

## Metryki sukcesu (przykład)
| KPI | Cel MVP | Cel roczny |
|-----|---------|------------|
| Aktywni użytkownicy (MAU) | 5 | 20 |
| Obserwacje / miesiąc | 50 | 300 |
| Czas dodania obserwacji | < 2 min | < 1 min |
| Offline sync success rate | 95% | 99% |

## Założenia i ryzyka
### Założenia
- Użytkownicy pracują w terenie na smartfonach.
- Brak internetu jest częsty, offline-first jest krytyczne.

### Ryzyka
- Niska adopcja bez szybkiego UX.
- Problemy z synchronizacją offline.
- Błędy w danych (duplikaty, niespójne słowniki).

## Słownik pojęć (skrót)
- Obserwacja: raport z oglądania zawodnika.
- Pipeline: sekwencja statusów Observed -> Shortlist -> Trial -> Offer -> Signed -> Rejected.
- Profil 360: kompletny profil zawodnika z historią obserwacji.
