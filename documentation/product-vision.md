# Wizja produktu

## Executive summary
ScoutPro to mobilny system scoutingowy dla akademii pilkarskich. System standaryzuje
proces obserwacji, centralizuje dane zawodnikow i wspiera decyzje rekrutacyjne
przez obiektywne KPI oraz dashboardy.

## Kluczowe problemy i odpowiedzi produktu
| Problem | Obecny stan | Rozwiazanie ScoutPro |
|---------|-------------|---------------------|
| Rozproszone dane | Excel, notatki papierowe | Centralna baza danych |
| Subiektywne oceny | Brak standardow | Ujednolicone szablony per pozycja |
| Utrata informacji | Brak historii kontaktow | Profil zawodnika 360 |
| Brak widocznosci pipeline | Chaos w statusach | Funnel Observed -> Signed |
| Praca offline | Brak narzedzi | PWA z synchronizacja |

## Personas
### Persona 1: Scout (primary user)
- Mobile-first, praca w terenie, czesto bez internetu.
- Potrzeba: szybkie dodanie obserwacji i dostep do historii zawodnika.

### Persona 2: Trener (secondary user)
- Potrzeba: szybki wglad w profil i shortlisty.

### Persona 3: Dyrektor sportowy (tertiary user)
- Potrzeba: KPI, raporty pipeline i przekrojowe widoki.

## Value proposition
- Szybkie dodawanie obserwacji w trakcie meczu.
- Jednolity model oceny zawodnika (pozycje i kryteria).
- Praca offline z bezpieczna synchronizacja.
- Widocznosc pipeline i historii decyzji.

## Metryki sukcesu (przyklad)
| KPI | Cel MVP | Cel roczny |
|-----|---------|------------|
| Aktywni uzytkownicy (MAU) | 5 | 20 |
| Obserwacje / miesiac | 50 | 300 |
| Czas dodania obserwacji | < 2 min | < 1 min |
| Offline sync success rate | 95% | 99% |

## Zalozenia i ryzyka
### Zalozenia
- Uzytkownicy pracuja w terenie na smartfonach.
- Brak internetu jest czesty, offline-first jest krytyczne.

### Ryzyka
- Niska adopcja bez szybkiego UX.
- Problemy z synchronizacja offline.
- Bledy w danych (duplikaty, niespojne slowniki).

## Slownik pojec (skrot)
- Obserwacja: raport z ogladania zawodnika.
- Pipeline: sekwencja statusow Observed -> Shortlist -> Trial -> Offer -> Signed -> Rejected.
- Profil 360: kompletny profil zawodnika z historia obserwacji.
