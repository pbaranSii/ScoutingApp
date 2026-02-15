# Wymagania funkcjonalne

Dokument opisuje kluczowe funkcje oraz oczekiwane zachowania systemu.
Szczegoly implementacyjne i pelne user stories pozostaja w `Materials/02-FUNCTIONAL-REQUIREMENTS.md`.

## Epics (zakres funkcjonalny)
| Epic ID | Nazwa | Priorytet |
|---------|-------|-----------|
| E01 | Zarzadzanie uzytkownikami | P1 |
| E02 | Obserwacje meczowe | P1 |
| E03 | Profile zawodnikow 360 | P1 |
| E04 | Pipeline rekrutacyjny | P2 |
| E05 | Dashboard i KPI | P2 |
| E06 | Offline mode | P1 |
| E07 | Powiadomienia | P2 |
| E08 | Ustawienia systemu (slowniki) | P1 |

## Kluczowe wymagania
### Zarzadzanie uzytkownikami
- Zaproszenia przez email (admin).
- Logowanie i reset hasla.
- Profil uzytkownika (edycja danych, avatar).
- Administracja kontami (rola, aktywnosc).

### Obserwacje
- Szybkie dodanie obserwacji w formie kreatora.
- Pola wymagane: dane zawodnika, data obserwacji, pozycja, rating.
- Oceny pozycyjne per kryteria.
- Edycja i soft delete obserwacji.
- Obserwacje powiazane z meczem (opcjonalnie).

### Profile zawodnikow 360
- Widok profilu z danymi, historia obserwacji, pipeline.
- Edycja danych zawodnika i kontaktow opiekunow.
- Powiazanie ze slownikami (klub, region, pozycja).

### Pipeline rekrutacyjny
- Kanban / lista statusow.
- Historia zmian statusow (pipeline_history).
- Wymagane uprawnienia dla zmian statusu.

### Dashboard i KPI
- Podstawowe statystyki obserwacji.
- Widok konwersji pipeline.
- Ostatnie obserwacje i top zawodnicy.

### Offline mode
- Zapisywanie obserwacji lokalnie (IndexedDB).
- Kolejka synchronizacji.
- Retry i statusy sync.

### Ustawienia (slowniki)
- CRUD slownikow: regions, leagues, categories, clubs, positions, evaluation_criteria.
- Dostep tylko dla admina.

## Wymagania niefunkcjonalne (skrot)
- Wydajnosc: szybkie ladowanie i responsywny UI.
- Bezpieczenstwo: RLS, autoryzacja po stronie bazy.
- Dostepnosc: czytelnosc w terenie, mobile-first.
