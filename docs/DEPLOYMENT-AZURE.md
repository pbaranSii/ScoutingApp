# Wdrożenie ScoutApp na Azure

Produkcja frontendu hostowana jest na **Azure Static Web Apps**. Baza danych, autentykacja, Storage i Edge Functions pozostają w **Supabase** bez zmian.

## Repozytorium

- **Azure DevOps:** [scoutapp - Polonia](https://dev.azure.com/sii-ads-integration/Polonia/_git/scoutapp%20-%20Polonia) (projekt Polonia, organizacja sii-ads-integration)

---

## Środowiska i bazy danych

| Gałąź | Środowisko Azure SWA | Supabase Project REF | URL |
|---|---|---|---|
| `master` | **Production** (`scoutpro.kspolonia.pl`) | `oilillvaatchsyvqbyxo` | `https://oilillvaatchsyvqbyxo.supabase.co` |
| `develop` | **Preview** (URL preview SWA) | `digrvtbfonatvytwpbbn` | `https://digrvtbfonatvytwpbbn.supabase.co` |

> Vercel (scouting-app) korzysta z projektu `digrvtbfonatvytwpbbn` (ustawione w panelu Vercel). Azure SWA ma własną konfigurację przez pipeline.

---

## Konfiguracja pipeline

- **Plik pipeline:** `azure-static-web-app.yml` w głównym katalogu repo.
- **Trigger:** push na branch:
  - **`master`** – buduje z `scoutapp-swadeploy-prod` → wdraża na środowisko **Production**.
  - **`develop`** – buduje z `scoutapp-swadeploy-preview` → wdraża na środowisko **Preview**.
- **Zmienne i sekrety** są w Azure DevOps, **nie** w repozytorium.

### Variable group: `scoutapp-swadeploy-prod` (dla `master` / Production)

W Azure DevOps: **Pipelines → Library → + Variable group**. Nazwa: `scoutapp-swadeploy-prod`.

| Zmienna | Wartość | Sekret |
|---|---|---|
| `DEPLOYMENT_TOKEN` | Token z Azure Portal → Static Web App → Manage deployment token | **Tak** |
| `VITE_SUPABASE_URL` | `https://oilillvaatchsyvqbyxo.supabase.co` | Nie |
| `VITE_SUPABASE_ANON_KEY` | Klucz anon projektu `oilillvaatchsyvqbyxo` (Settings → API) | Nie |
| `VITE_APP_URL` | `https://scoutpro.kspolonia.pl` | Nie |

### Variable group: `scoutapp-swadeploy-preview` (dla `develop` / Preview)

W Azure DevOps: **Pipelines → Library → + Variable group**. Nazwa: `scoutapp-swadeploy-preview`.

| Zmienna | Wartość | Sekret |
|---|---|---|
| `DEPLOYMENT_TOKEN` | Ten sam token co prod (lub osobny, jeśli masz dwa zasoby SWA) | **Tak** |
| `VITE_SUPABASE_URL` | `https://digrvtbfonatvytwpbbn.supabase.co` | Nie |
| `VITE_SUPABASE_ANON_KEY` | Klucz anon projektu `digrvtbfonatvytwpbbn` (Settings → API) | Nie |
| `VITE_APP_URL` | URL środowiska preview SWA, np. `https://calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net` | Nie |

> Nie commituj tych wartości do repo. Są używane wyłącznie przez pipeline.

---

## Supabase – konfiguracja per środowisko

### Production (`oilillvaatchsyvqbyxo`)

W projekcie Supabase `oilillvaatchsyvqbyxo`, w **Authentication → URL Configuration**:

- **Site URL:** `https://scoutpro.kspolonia.pl`
- **Redirect URLs:** `https://scoutpro.kspolonia.pl/**` i `https://scoutpro.kspolonia.pl/set-new-password`

### Preview (`digrvtbfonatvytwpbbn`)

W projekcie Supabase `digrvtbfonatvytwpbbn`, w **Authentication → URL Configuration**:

- **Site URL:** URL preview SWA (np. `https://calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net`)
- **Redirect URLs:** `https://calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net/**` oraz `http://localhost:5173/**`

---

## Ręczny deploy (bez pipeline)

### Deploy na PRODUKCJĘ

```powershell
# Buduj z wymuszonym env produkcyjnym (nadpisuje .env.local)
cd scoutpro
$env:VITE_SUPABASE_URL = "https://oilillvaatchsyvqbyxo.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "<anon key oilillvaatchsyvqbyxo>"
$env:VITE_APP_URL = "https://scoutpro.kspolonia.pl"
npm run build

$env:SWA_CLI_DEPLOYMENT_TOKEN = "<prod deployment token>"
swa deploy .\dist --env production --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

### Deploy na PREVIEW

```powershell
# .env.local (digrvtbfonatvytwpbbn) jest ładowane automatycznie
cd scoutpro
npm run build

$env:SWA_CLI_DEPLOYMENT_TOKEN = "<token>"
swa deploy .\dist --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

> **Ważne:** bez flagi `--env production` SWA CLI wdraża na środowisko Preview. Zawsze używaj `--env production` dla produkcji.

---

## Weryfikacja po deployu

1. Otwórz aplikację na docelowym adresie.
2. DevTools → **Network** → filtruj po `supabase.co`.
3. Sprawdź `Request URL`:
   - **Production:** powinna zawierać `oilillvaatchsyvqbyxo.supabase.co`
   - **Preview:** powinna zawierać `digrvtbfonatvytwpbbn.supabase.co`
