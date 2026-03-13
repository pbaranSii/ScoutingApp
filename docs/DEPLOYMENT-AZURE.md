# Wdrożenie ScoutApp na Azure

Produkcja frontendu hostowana jest na **Azure Static Web Apps**. Baza danych, autentykacja, Storage i Edge Functions pozostają w **Supabase** bez zmian.

## Repozytorium

- **Azure DevOps:** [scoutapp - Polonia](https://dev.azure.com/sii-ads-integration/Polonia/_git/scoutapp%20-%20Polonia) (projekt Polonia, organizacja sii-ads-integration)

## Konfiguracja pipeline

- **Plik pipeline:** `azure-static-web-app.yml` w głównym katalogu repo.
- **Trigger:** push na branch:
  - `develop` – środowisko testowe / preview (jeśli skonfigurowane),
  - **`master` – środowisko produkcyjne (PROD)**, spójnie z Vercel Production.
- **Zmienne i sekrety** są w Azure DevOps, **nie** w repozytorium:
  - **Pipelines** → **Library** → variable group `scoutapp-swadeploy`:
    - `DEPLOYMENT_TOKEN` – token z Azure Portal (Static Web App → Manage deployment token), wartość oznaczona jako secret.
    - `VITE_SUPABASE_URL` – URL **PROD** projektu z Supabase (Settings → API, Project REF `digrvtbfonatvytwpbbn`).
    - `VITE_SUPABASE_ANON_KEY` – klucz anon **PROD** z Supabase (Settings → API).
    - `VITE_APP_URL` – URL aplikacji po wdrożeniu (np. `https://scoutapp-polonia.azurestaticapps.net`).

Nie commituj tych wartości do repo; używane są wyłącznie w pipeline.

## Supabase (produkcja)

Ten sam projekt Supabase co dotychczas. W **Authentication → URL Configuration** muszą być ustawione:

- **Site URL:** ten sam co `VITE_APP_URL` (adres Static Web App).
- **Redirect URLs:** m.in. `https://<twoja-app>.azurestaticapps.net/**` oraz `https://<twoja-app>.azurestaticapps.net/set-new-password`.

> Uwaga: lokalny development (`npm run dev` na gałęzi `stabilization/app-2026-03-11`) powinien używać **osobnego projektu Supabase DEV** skonfigurowanego w `.env.local`. Projekt PROD (REF `digrvtbfonatvytwpbbn`) jest używany wyłącznie przez Vercel/Azure i pipeline.

Szczegółowy plan migracji i instrukcję krok po kroku znajdziesz w plikach runbooków wdrożeniowych w katalogu `documentation/` (deploy DEV → PROD).
