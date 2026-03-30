# Runbook: CI/CD Azure Static Web Apps (pipeline i variable groups)

## Cel

Skonfigurowanie pipeline w Azure DevOps z **automatyczną separacją środowisk**:

- push na `master` → build z danymi PROD (`oilillvaatchsyvqbyxo`) → Azure SWA **Production** (`scoutpro.kspolonia.pl`)
- push na `develop` → build z danymi PREVIEW (`digrvtbfonatvytwpbbn`) → Azure SWA **Preview**

## Wymagania

- Repozytorium ScoutApp w Azure DevOps (mirror z GitHub lub bezpośrednio w ADO).
- Utworzony zasób **Static Web App** w Azure i pobrany **Deployment Token**. Zob. [azure-swa-setup.md](azure-swa-setup.md).
- Dostęp do obu projektów Supabase: PROD (`oilillvaatchsyvqbyxo`) i PREVIEW (`digrvtbfonatvytwpbbn`).

---

## Plik pipeline

W katalogu głównym repo: **[azure-static-web-app.yml](../../azure-static-web-app.yml)**.

- **Trigger**: gałęzie `master` i `develop`.
- **Jobs**: dwa warunkowe joby – `DeployProduction` (dla `master`) i `DeployPreview` (dla `develop`).
- Każdy job korzysta z własnej variable group z odpowiednimi kluczami Supabase.

---

## Variable groups w Azure DevOps

Utwórz w Azure DevOps: **Pipelines → Library → + Variable group**.

### `scoutapp-swadeploy-prod` (dla `master` / Production)

| Nazwa zmiennej | Opis | Sekret |
|---|---|---|
| `DEPLOYMENT_TOKEN` | Token z zasobu Static Web App → Manage deployment token | **Tak** |
| `VITE_SUPABASE_URL` | `https://oilillvaatchsyvqbyxo.supabase.co` | Nie |
| `VITE_SUPABASE_ANON_KEY` | Klucz anon projektu `oilillvaatchsyvqbyxo` | Nie |
| `VITE_APP_URL` | `https://scoutpro.kspolonia.pl` | Nie |

### `scoutapp-swadeploy-preview` (dla `develop` / Preview)

| Nazwa zmiennej | Opis | Sekret |
|---|---|---|
| `DEPLOYMENT_TOKEN` | Token z zasobu Static Web App (ten sam lub osobny) | **Tak** |
| `VITE_SUPABASE_URL` | `https://digrvtbfonatvytwpbbn.supabase.co` | Nie |
| `VITE_SUPABASE_ANON_KEY` | Klucz anon projektu `digrvtbfonatvytwpbbn` | Nie |
| `VITE_APP_URL` | URL preview SWA, np. `https://calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net` | Nie |

> **Stara grupa `scoutapp-swadeploy`:** jeśli istnieje, zmień jej nazwę na `scoutapp-swadeploy-prod` lub utwórz nową. Pipeline nie korzysta już z nazwy `scoutapp-swadeploy`.

---

## Mapowanie branch → środowisko → Supabase

| Gałąź | Job w pipeline | Variable group | Supabase | Środowisko SWA |
|---|---|---|---|---|
| `master` | `DeployProduction` | `scoutapp-swadeploy-prod` | `oilillvaatchsyvqbyxo` | Production |
| `develop` | `DeployPreview` | `scoutapp-swadeploy-preview` | `digrvtbfonatvytwpbbn` | Preview |

---

## Dodawanie Pipeline permissions dla variable groups

Po utworzeniu grup wykonaj jeden z kroków poniżej:

1. **Opcja A (zalecana):** przy pierwszym uruchomieniu pipeline Azure DevOps zapyta o uprawnienia – kliknij **Permit** dla obu grup.
2. **Opcja B (ręcznie):** w Library → Variable group → **Pipeline permissions** → dodaj pipeline `azure-static-web-app.yml`.

---

## Jak sprawdzić, czy Azure używa właściwej bazy Supabase

1. Otwórz aplikację na docelowym URL (Production lub Preview).
2. DevTools → **Network** → filtruj po `supabase.co`.
3. Sprawdź `Request URL`:
   - **Production** (`scoutpro.kspolonia.pl`): musi zawierać `oilillvaatchsyvqbyxo.supabase.co`.
   - **Preview**: musi zawierać `digrvtbfonatvytwpbbn.supabase.co`.
4. (Opcjonalnie) Supabase Dashboard projektu `oilillvaatchsyvqbyxo` → **Logs → Auth** – po zalogowaniu w aplikacji produkcyjnej powinny pojawić się wpisy.

---

## Uwagi

- Build musi mieć dostęp do zmiennych z grupy; uprawnienia do grupy ustaw w **Pipeline permissions / Library**.
- Vite wstrzykuje zmienne VITE_* **w czasie builda** – zmiany w variable group wymagają nowego runu pipeline.
- Plik **scoutpro/public/staticwebapp.config.json** jest kopiowany przez Vite do `dist/` i zapewnia routing SPA na SWA.
- Zmiennych `SUPABASE_SERVICE_ROLE_KEY` **nie dodawaj** do variable group dla frontendu – klucz ten omija RLS i jest używany wyłącznie w skryptach backendowych.
