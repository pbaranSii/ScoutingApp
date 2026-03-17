# Runbook: CI/CD Azure Static Web Apps (pipeline i variable group)

## Cel

Skonfigurowanie pipeline w Azure DevOps oraz grupy zmiennych **scoutapp-swadeploy** tak, aby build z katalogu `scoutpro` był wdrażany do Azure Static Web App.

## Wymagania

- Repozytorium ScoutApp w Azure DevOps (mirror z GitHub lub bezpośrednio w ADO).
- Utworzony zasób **Static Web App** w Azure i pobrany **Deployment Token**. Zob. [azure-swa-setup.md](azure-swa-setup.md).
- Dostęp do projektu Supabase PROD (ten sam co dla Vercel): **Project URL** i **anon key**.

## Plik pipeline

W katalogu głównym repo znajduje się plik **[azure-static-web-app.yml](../../azure-static-web-app.yml)** (w razie mirroru – upewnij się, że jest w repo w ADO).

- **Trigger**: gałęzie `master` i `develop` (u nas produkcja frontu jest z `master`).
- **Zmienne**: grupa **scoutapp-swadeploy** oraz `app_location=scoutpro`, `output_location=dist`.
- **Kroki**: Node 20.x → `npm ci` + `npm run build` w `scoutpro/` (ze zmiennymi VITE_*) → task **AzureStaticWebApp@0** (deploy z `scoutpro/dist`).

## Variable group „scoutapp-swadeploy”

Utwórz w Azure DevOps: **Pipelines** → **Library** → **+ Variable group**.

| Nazwa zmiennej | Opis | Sekret |
|----------------|------|--------|
| **DEPLOYMENT_TOKEN** | Token z zasobu Static Web App (Zarządzaj wdrożeniami) | Tak |
| **VITE_SUPABASE_URL** | URL projektu Supabase **PROD (Azure)**: `https://oilillvaatchsyvqbyxo.supabase.co` | Nie |
| **VITE_SUPABASE_ANON_KEY** | Klucz anon (public) projektu Supabase **PROD (Azure)** | Nie |
| **VITE_APP_URL** | Adres frontendu SWA, np. `https://<nazwa>.azurestaticapps.net` | Nie |

- **VITE_APP_URL** musi być docelowym adresem SWA – od niego zależą linki w mailach (reset hasła, zaproszenia).

## Mapowanie branch → środowisko

- **master** → Production (główny adres SWA).
- **develop** → Staging (jeśli SWA obsługuje wiele środowisk przez branch, lub osobny SWA dla staging).

Po pierwszym uruchomieniu pipeline sprawdź w Azure Portal w zasobie SWA zakładkę **Środowiska**, czy pojawiły się środowiska (np. Production dla `main`).

## Dodawanie nowych zmiennych

Jeśli w przyszłości zmienisz projekt Supabase (faza 2 migracji):

1. Zaktualizuj **VITE_SUPABASE_URL** i **VITE_SUPABASE_ANON_KEY** w grupie **scoutapp-swadeploy**.
2. Uruchom ponownie pipeline (nowy build z nowymi zmiennymi).

## Jak sprawdzić, czy Azure używa właściwej bazy Supabase

1. Otwórz aplikację na Azure SWA.
2. DevTools → **Network** → wyszukaj `supabase.co`.
3. Sprawdź `Request URL`:
   - dla Azure ma zawierać `oilillvaatchsyvqbyxo.supabase.co`.
4. (Opcjonalnie) Potwierdź w Supabase Dashboard projektu `oilillvaatchsyvqbyxo` po logach Auth/Database po zalogowaniu w aplikacji.

## Uwagi

- Build musi mieć dostęp do zmiennych z grupy; uprawnienia do grupy ustaw w **Pipeline permissions** / **Library**.
- Plik **scoutpro/public/staticwebapp.config.json** jest kopiowany przez Vite do `dist/` i zapewnia routing SPA na SWA.
