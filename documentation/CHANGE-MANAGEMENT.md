# Zasady zarządzania zmianą (Change Management) i utrzymania dokumentacji

Dokument definiuje, kiedy i jak aktualizować dokumentację ScoutPro oraz procedury przy merge i release.

## 1. Źródło prawdy

- **Model danych:** migracje w `scoutpro/supabase/migrations/` w kolejności nazw plików. Pełna lista tabel, kolumn, relacji i polityk RLS wynika z zastosowanych migracji.
- **Typy frontendu:** `scoutpro/src/types/database.types.ts`. Rekomendacja: generowanie z `supabase gen types` po każdej zmianie schematu bazy.

## 2. Kiedy aktualizować dokumentację

| Zmiana | Dokumenty do aktualizacji |
|--------|----------------------------|
| Zmiana schematu bazy lub polityk RLS | `data-model.md` (docelowo `05-data-model.md`), ewentualnie `api-spec.md` / `06-api-contracts.md` |
| Nowy lub zmieniony moduł / trasa | `architecture.md`, `04-modules.md`; nowe RPC lub Edge → `api-spec.md` / `06-api-contracts.md` |
| Nowy przepływ biznesowy | `07-business-flows.md` |
| Zmiana procesu wdrożenia lub migracji | `deployment.md`, odpowiedni runbook w `runbooks/` |
| Release lub merge do develop/master z istotnymi zmianami | `change-log.md` (docelowo `09-change-log.md`) |
| Ważna decyzja architektoniczna | Nowy ADR w `documentation/adr/` |

## 3. Odpowiedzialność

- **PR/merge:** Wprowadzenie zmiany funkcjonalnej lub architektonicznej musi zawierać aktualizację odpowiednich dokumentów albo zadanie w backlogu z linkiem do tego wymagania.
- **Przegląd dokumentacji:** Przynajmniej przy planowaniu release’u – checklist w runbooku deploy (np. czy change-log i lista migracji są aktualne).

## 4. Format i konwencje

- **Język:** Polski w dokumentacji użytkowej i procesowej; angielski dopuszczalny w ADR oraz technicznych opisach API.
- **Terminologia:** Jedna konwencja polskich znaków (pełna polszczyzna w treści). Słownik pojęć w `product-vision.md` lub `functional-requirements.md` (01/02).
- **Diagramy:** Mermaid w plikach `.md` (architektura, przepływy). Diagram należy zaktualizować przy zmianie zakresu modułów lub przepływów.
- **Wersjonowanie:** Change-log z datą i krótkim opisem; przy większych release’ach – tag w repozytorium.

## 5. Procedura przy merge / release

**Przed merge do develop**

- Sprawdź, czy zmiany w kodzie lub schemacie są odzwierciedlone w dokumentacji (lista w Commit.md lub w opisie PR).

**Przed deploy na PROD**

- Wykonaj runbook deploy (`runbooks/deploy-dev-to-prod.md`).
- Zweryfikuj aktualną listę migracji i zmienne środowiskowe.
- Wykonaj backup bazy (lub potwierdź backup automatyczny).

---

Zob. też: [README dokumentacji](README.md), [runbooks/deploy-dev-to-prod.md](runbooks/deploy-dev-to-prod.md), [runbooks/apply-migrations.md](runbooks/apply-migrations.md).
