# Połączenie aplikacji z bazą Supabase

## Jakie dane są potrzebne

Aplikacja łączy się z Supabase przez **dwie zmienne** wstrzykiwane w czasie budowania (Vite):

| Zmienna | Opis | Gdzie wzięć |
|--------|------|-------------|
| `VITE_SUPABASE_URL` | URL projektu Supabase | Supabase Dashboard → Project Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Klucz anonimowy (publiczny) | Supabase Dashboard → Project Settings → API → **anon public** |

Opcjonalnie (dla linków w mailach, redirectów po logowaniu):

| Zmienna | Opis |
|--------|------|
| `VITE_APP_URL` | Adres frontu (np. `https://twoja-app.azurestaticapps.net` lub `http://localhost:5173`) |

**Uwaga:** Klucz **anon** jest przeznaczony do używania w przeglądarce. Dostęp do danych ogranicza **Row Level Security (RLS)** w Supabase, więc nie trzymasz tam „sekretu serwera”.  
**Nigdy** nie umieszczaj w frontendzie ani w plikach `.env` commitowanych do repo: `SUPABASE_SERVICE_ROLE_KEY` – ten klucz omija RLS i służy tylko do skryptów/backendu.

---

## Gdzie aplikacja z nich korzysta

- **`src/lib/supabase.ts`** – tworzy klienta Supabase (`createClient(URL, anonKey)`). Wszystkie zapytania do bazy i auth idą przez ten klient.
- **Edge Functions** (zaproszenia, admin-create-user, reset hasła) – wywołania używają tego samego URL + anon key (np. w `users.api.ts`, `InviteForm.tsx`).

Wartości są wstawiane w **momencie builda** (`npm run build`). W zbudowanym pliku JS będą więc „na sztywno” – dlatego dla różnych środowisk (dev / staging / prod) budujesz z innymi zmiennymi.

---

## Gdzie umieścić dane – bezpiecznie

### 1. Rozwój lokalny

- W katalogu **`scoutpro/`** utwórz plik **`.env`** (nie commituj go – jest w `.gitignore`).
- Skopiuj zawartość z **`.env.example`** i wklej prawdziwe wartości:

```env
VITE_SUPABASE_URL=https://TWOJ_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173
```

- Opcjonalnie: `.env.local` lub `.env.development.local` – Vite je ładuje i **nadpisują** `.env`. Te pliki też są w `.gitignore`.
- **Build produkcyjny:** przy `npm run build` Vite ładuje najpierw `.env`, potem **`.env.local`** (który ma pierwszeństwo). Jeśli w `.env` masz poprawne dane Supabase, a w `.env.local` stare/placeholder – w bundle trafią wartości z `.env.local`. Przed buildem upewnij się, że w `.env.local` są te same poprawne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`, albo tymczasowo przemianuj `.env.local` (np. na `.env.local.bak`).
- **Nie** dodawaj do repo: `.env`, `.env.local`, ani plików z prawdziwym `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Deploy na Azure Static Web Apps (Azure DevOps)

- W Azure DevOps: **Pipelines → Library → Variable group** (np. `scoutapp-swadeploy`).
- Dodaj zmienne (wartości z Supabase PROD):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_URL` (URL Twojej SWA, np. `https://calm-hill-00bb9b203.azurestaticapps.net`)
  - `DEPLOYMENT_TOKEN` – ustaw jako **secret** (klucz), żeby nie było w logach.
- W pipeline (`azure-static-web-app.yml`) build już korzysta z tej grupy; zmienne są przekazywane do `npm run build` w bloku `env:`.
- Dzięki temu **hasła i tokeny nie trafiają do kodu ani do repo** – tylko do zmiennych pipeline’u (secret = zamaskowane w logach).

### 3. Deploy ręczny (CLI) z własnej maszyny

- **Nie** wpisuj tokenu ani kluczy w pliki w repo.
- Przed buildem ustaw zmienne w powłoce, np. w PowerShellu:

```powershell
$env:VITE_SUPABASE_URL = "https://TWOJ_REF.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "twoj-anon-key"
$env:VITE_APP_URL = "https://twoja-app.azurestaticapps.net"
cd scoutpro
npm run build
```

- Potem deploy, np. token przekaż przez zmienną:

```powershell
$env:SWA_CLI_DEPLOYMENT_TOKEN = "token-z-portalu"
npx -y @azure/static-web-apps-cli deploy ./dist --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

- Po deployu warto wyczyścić zmienne w terminalu lub zamknąć okno.

---

## Podsumowanie – gdzie co trzymać

| Środowisko | Gdzie trzymać | Uwagi |
|------------|----------------|-------|
| **Lokalnie** | `scoutpro/.env` (lub `.env.local`) | Plik w `.gitignore`, nie commitować. |
| **Azure DevOps (CI/CD)** | Variable group (np. `scoutapp-swadeploy`), `DEPLOYMENT_TOKEN` jako secret | Zmienne ustawiane w Library, pipeline przekazuje je do builda. |
| **Ręczny deploy** | Zmienne w powłoce (`$env:...`) tylko na czas builda/deployu | Nie zapisywać tokenu w plikach. |

Dane potrzebne do **połączenia aplikacji z bazą** to w praktyce **URL projektu** i **anon key** z Supabase. Trzymane w `.env` lokalnie i w zmiennych pipeline’u (z tokenem jako secret) – tak jest bezpiecznie i bez wpisywania ich do repozytorium.
