# ScoutPro - Dokumentacja projektu

Ten katalog zawiera aktualną dokumentację projektu ScoutPro. Dokumenty są przepisane
na podstawie materiałów w `Materials/` oraz dopasowane do obecnego stanu aplikacji
i migracji Supabase.

## Spis dokumentacji

Pełny spis znajduje się w [index.md](index.md). Ustandaryzowana struktura (numeracja 01–09, adr, runbooks):

- [01 Wizja produktu](product-vision.md)
- [02 Wymagania funkcjonalne](functional-requirements.md)
- [03 Architektura](architecture.md)
- [04 Moduły](04-modules.md)
- [05 Model danych](data-model.md)
- [06 Kontrakty API](06-api-contracts.md) · [API (skrót)](api-spec.md)
- [07 Przepływy biznesowe](07-business-flows.md)
- [08 Deployment](deployment.md)
- [09 Historia zmian](change-log.md)
- [ADR (Architecture Decision Records)](adr/README.md)
- [Runbooki](runbooks/) – [wdrożenie DEV→PROD](runbooks/deploy-dev-to-prod.md), [stosowanie migracji](runbooks/apply-migrations.md)

Pozostałe: [UI/UX](ui-ux.md), [Offline](offline.md), [Dev→Prod i operacje](operations-dev-prod.md), [Formularze obserwacji](observation-forms.md), [Zarządzanie użytkownikami](user-management.md).

## Zasady aktualizacji i Change Management

1. Zmiana w kodzie lub schemacie bazy ⇒ aktualizacja odpowiedniego dokumentu (zob. **[CHANGE-MANAGEMENT.md](CHANGE-MANAGEMENT.md)**).
2. Migracje Supabase są źródłem prawdy dla modelu danych i polityk RLS.
3. Każdy PR, który zmienia zachowanie systemu, powinien aktualizować te dokumenty (lub zawierać zadanie w backlogu z linkiem do wymagania).
4. Skrót zasad: kiedy aktualizować którą dokumentację, odpowiedzialność przy merge/release, format i konwencje – **[CHANGE-MANAGEMENT.md](CHANGE-MANAGEMENT.md)**.

## Źródła

Materiały z `Materials/` pozostają jako archiwum analityczne. Ta dokumentacja
jest wersją roboczą dla zespołu developerskiego.
