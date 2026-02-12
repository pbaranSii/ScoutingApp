# ScoutPro - Dokumentacja projektu

Ten katalog zawiera aktualna dokumentacje projektu ScoutPro. Dokumenty sa przepisane
na podstawie materialow w `Materials/` oraz dopasowane do obecnego stanu aplikacji
i migracji Supabase.

## Spis dokumentacji

Pelny spis znajduje sie w [index.md](index.md).

- [Wizja produktu](product-vision.md)
- [Wymagania funkcjonalne](functional-requirements.md)
- [Model danych](data-model.md)
- [Architektura](architecture.md)
- [API](api-spec.md)
- [UI/UX](ui-ux.md)
- [Offline](offline.md)
- [Deployment](deployment.md)
- [Dev -> Prod i operacje](operations-dev-prod.md)
- [Formularze obserwacji](observation-forms.md)
- [Zarzadzanie uzytkownikami](user-management.md)
- [Historia zmian](change-log.md)

## Zasady aktualizacji

1. Zmiana w kodzie lub schemacie bazy => aktualizacja odpowiedniego dokumentu.
2. Migracje Supabase sa zrodlem prawdy dla modelu danych i polityk RLS.
3. Każdy PR, ktory zmienia zachowanie systemu, powinien aktualizowac te dokumenty.

## Zrodla

Materialy z `Materials/` pozostaja jako archiwum analityczne. Ta dokumentacja
jest wersja robocza dla zespolu developerskiego.
