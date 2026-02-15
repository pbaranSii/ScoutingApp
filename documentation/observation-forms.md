# Formularze obserwacji

Dokument opiera sie o `Materials/observation-form-analysis.md`.

## Scenariusze
1. Nowa obserwacja z listy obserwacji (ObservationWizard).
2. Edycja obserwacji z listy (EditObservationPage).
3. Nowa obserwacja z profilu zawodnika (ObservationWizard z prefill).
4. Edycja obserwacji z profilu zawodnika (EditObservationPage).

## Grupy danych
1. Zawodnik: first_name, last_name, birth_year, club_id, primary_position
2. Mecz / kontekst: observation_date, competition
3. Ocena i notatki: overall_rating, strengths, weaknesses, notes, rank,
   potential_now, potential_future
4. Zrodlo: source
5. Media: photo_url
6. Audyt: created_by, updated_by, updated_at
7. Pipeline: pipeline_status (tylko przy edycji)

## Roznice create vs edit (obecnie)
- Create: rank i potential wymagane.
- Edit: rank i potential opcjonalne.
- pipeline_status tylko w edycji.

## Ryzyka
- Edycja moze wyzerowac pola, ktore byly wymagane przy tworzeniu.
- Offline tworzenie zawodnika ma okrojone dane (club/status).
- Brak deduplikacji zawodnikow powoduje duplikaty.

## Rekomendacje
- Wspolny model danych formularza dla create i edit.
- Te same wymagania pol w obu sciezkach.
- Ujednolicone mapowanie online i offline.
- Deduplikacja po (first_name + last_name + birth_year) + opcjonalnie club_id.
