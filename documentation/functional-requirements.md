# Wymagania funkcjonalne

Dokument opisuje kluczowe funkcje oraz oczekiwane zachowania systemu. Szczegóły implementacyjne i pełne user stories pozostają w `Materials/02-FUNCTIONAL-REQUIREMENTS.md`.

## Epiki (zakres funkcjonalny)

| Epic ID | Nazwa | Priorytet |
|---------|-------|-----------|
| E01 | Zarządzanie użytkownikami | P1 |
| E02 | Obserwacje meczowe | P1 |
| E03 | Profile zawodników 360 | P1 |
| E04 | Pipeline rekrutacyjny | P2 |
| E05 | Dashboard i KPI | P2 |
| E06 | Offline mode | P1 |
| E07 | Powiadomienia | P2 |
| E08 | Ustawienia systemu (słowniki) | P1 |
| E09 | Zapotrzebowania na zawodników | P2 |
| E10 | Statystyki użytkowników (admin) | P2 |
| E11 | Ankieta satysfakcji | P2 |
| E12 | Listy ulubionych | P2 |
| E13 | Zadania (tasks) | P2 |
| E14 | Analityka rekrutacji (lejek, metryki) | P2 |

## Kluczowe wymagania

### Zarządzanie użytkownikami
- Zaproszenia przez e-mail (admin).
- Logowanie i reset hasła.
- Profil użytkownika (edycja danych, avatar).
- Administracja kontami (rola, aktywność).

### Obserwacje
- Szybkie dodanie obserwacji w formie kreatora.
- Pola wymagane: dane zawodnika, data obserwacji, pozycja, rating.
- Oceny pozycyjne per kryteria.
- Edycja i soft delete obserwacji.
- Obserwacje powiązane z meczem (opcjonalnie).

### Profile zawodników 360
- Widok profilu z danymi, historia obserwacji, pipeline.
- Edycja danych zawodnika i kontaktów opiekunów.
- Powiązanie ze słownikami (klub, region, pozycja).

### Pipeline rekrutacyjny
- Kanban / lista statusów.
- Historia zmian statusów (pipeline_history).
- Wymagane uprawnienia dla zmian statusu.

### Dashboard i KPI
- Podstawowe statystyki obserwacji.
- Widok konwersji pipeline.
- Ostatnie obserwacje i top zawodnicy.

### Offline mode
- Zapisywanie obserwacji lokalnie (IndexedDB).
- Kolejka synchronizacji.
- Retry i statusy sync.

### Ustawienia (słowniki)
- CRUD słowników: regions, leagues, categories, clubs, positions, evaluation_criteria oraz tabele dict_* (preferred_foot, player_sources, recruitment_decisions, strengths, weaknesses, team_roles).
- Dostęp tylko dla admina.

### Zapotrzebowania na zawodników (E09)
- Tworzenie, edycja, usuwanie zapotrzebowań (pozycja, sezon, priorytet itd.).
- Przypisywanie kandydatów (zawodników) do zapotrzebowań.
- Lista zapotrzebowań z filtrami; sugestie kandydatów.

### Statystyki użytkowników – admin (E10)
- Przegląd użycia: sesje, logowania, trendy.
- Rozliczenia miesięczne (obserwacje / zawodnicy wg okresu).
- Historia logowań i szczegóły per użytkownik.

### Ankieta satysfakcji (E11)
- Użytkownik może wypełnić ankietę (CSAT, CES, NPS, najlepsza funkcja, komentarz) z zachowaniem limitu czasowego (np. raz na X dni).
- Admin: podgląd wyników i odpowiedzi.

### Listy ulubionych (E12)
- Tworzenie list ulubionych zawodników.
- Dodawanie/usuwanie zawodników z listy; współpracownicy (jeśli zaimplementowane).

### Zadania (E13)
- Zadania powiązane z zawodnikami; lista, tworzenie, edycja.

### Analityka rekrutacji (E14)
- Metryki lejka (pipeline metrics), lista zawodników per status, trendy, porównania (scouts/regions/positions/sources/ages), heatmapa, diagram Sankey.
- Ustawienia modułu analityki (admin).

## Wymagania niefunkcjonalne (skrót)

- **Wydajność:** szybkie ładowanie i responsywny UI; ograniczenie ciężkich zapytań po stronie serwera (RPC, indeksy).
- **Bezpieczeństwo:** RLS na tabelach, autoryzacja po stronie bazy; role admin/user oraz business_role; wrażliwe operacje tylko dla uprawnionych.
- **Dostępność:** czytelność w terenie, mobile-first; możliwa rozszerzenie o wymagania a11y.
- **Dane osobowe i RODO:** przechowywanie danych użytkowników i zawodników zgodnie z polityką; możliwość eksportu/usunięcia na żądanie – do doprecyzowania w polityce prywatności i SLA.
- **Dostępność usługi (SLA):** brak formalnego SLA w dokumencie; przy wdrożeniu PROD warto zdefiniować oczekiwaną dostępność i procedury awaryjne.
