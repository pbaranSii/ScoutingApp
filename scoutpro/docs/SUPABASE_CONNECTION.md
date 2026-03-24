# Połączenie aplikacji z bazą Supabase

## Jakie dane są potrzebne

Aplikacja łączy się z Supabase przez **dwie zmienne** wstrzykiwane w czasie budowania (Vite):

| Zmienna | Opis | Gdzie wziąć |
|---|---|---|
| `VITE_SUPABASE_URL` | URL projektu Supabase | Supabase Dashboard → Project Settings → API → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Klucz anonimowy (publiczny) | Supabase Dashboard → Project Settings → API → **anon public** |

Opcjonalnie (dla linków w mailach, redirectów po logowaniu):

| Zmienna | Opis |
|---|---|
| `VITE_APP_URL` | Adres frontu (np. `https://scoutpro.kspolonia.pl` lub `http://localhost:5173`) |

> **Klucz anon** jest przeznaczony do używania w przeglądarce. Dostęp do danych ogranicza **Row Level Security (RLS)**. Nigdy nie umieszczaj `SUPABASE_SERVICE_ROLE_KEY` w frontendzie ani w plikach commitowanych do repo.

---

## Środowiska i projekty Supabase

| Środowisko | Supabase Project REF | Gdzie konfigurowane |
|---|---|---|
| **Lokalny dev** (`npm run dev`) | `digrvtbfonatvytwpbbn` | `scoutpro/.env.local` (nie commitowany) |
| **Azure Preview** (branch `develop`) | `digrvtbfonatvytwpbbn` | Variable group `scoutapp-swadeploy-preview` w Azure DevOps |
| **Azure Production** (branch `master`) | `oilillvaatchsyvqbyxo` | Variable group `scoutapp-swadeploy-prod` w Azure DevOps |
| **Vercel** (branch `master`) | `digrvtbfonatvytwpbbn` | Panel Vercel → Environment Variables |

---

## Gdzie aplikacja z nich korzysta

- **`src/lib/supabase.ts`** – tworzy klienta Supabase (`createClient(URL, anonKey)`). Wszystkie zapytania do bazy i auth idą przez ten klient.
- **Edge Functions** (zaproszenia, admin-create-user, reset hasła) – używają tego samego URL + anon key.

Wartości są wstawiane w **momencie builda** (`npm run build`). W zbudowanym pliku JS będą „na sztywno" – dlatego dla różnych środowisk budujesz z innymi zmiennymi.

---

## Pliki `.env` – priorytety Vite

Vite ładuje pliki w następującej kolejności (wyższy priorytet nadpisuje niższy):

1. `.env.local` ← **najwyższy priorytet** – używany do lokalnego dev, **nie commitowany**
2. `.env` ← dane produkcyjne (`oilillvaatchsyvqbyxo`), fallback przy ręcznym budowaniu PROD

**Lokalny development** zawsze korzysta z `.env.local` (Supabase PREVIEW `digrvtbfonatvytwpbbn`).

**Ręczny build dla produkcji** – ustaw zmienne w terminalu (nadpisują oba pliki):

```powershell
$env:VITE_SUPABASE_URL = "https://oilillvaatchsyvqbyxo.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "<anon key>"
$env:VITE_APP_URL = "https://scoutpro.kspolonia.pl"
npm run build
```

---

## Gdzie umieścić dane – bezpiecznie

### 1. Rozwój lokalny

Plik **`scoutpro/.env.local`** (nie commituj – jest w `.gitignore`). Skopiuj z **`.env.example`** i wklej wartości dla projektu `digrvtbfonatvytwpbbn`:

```env
VITE_SUPABASE_URL=https://digrvtbfonatvytwpbbn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_URL=http://localhost:5173
SUPABASE_URL=https://digrvtbfonatvytwpbbn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key – tylko do skryptów>
```

### 2. Azure SWA Production (pipeline)

Variable group **`scoutapp-swadeploy-prod`** w Azure DevOps (Pipelines → Library):

- `VITE_SUPABASE_URL` = `https://oilillvaatchsyvqbyxo.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = klucz anon `oilillvaatchsyvqbyxo`
- `VITE_APP_URL` = `https://scoutpro.kspolonia.pl`
- `DEPLOYMENT_TOKEN` = token produkcyjny (secret)

### 3. Azure SWA Preview (pipeline)

Variable group **`scoutapp-swadeploy-preview`** w Azure DevOps (Pipelines → Library):

- `VITE_SUPABASE_URL` = `https://digrvtbfonatvytwpbbn.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = klucz anon `digrvtbfonatvytwpbbn`
- `VITE_APP_URL` = URL preview SWA
- `DEPLOYMENT_TOKEN` = token (secret)

### 4. Ręczny deploy (CLI) z własnej maszyny

Zmienne ustaw w terminalu przed buildem; nie zapisuj ich do plików.

```powershell
# Produkcja:
$env:VITE_SUPABASE_URL = "https://oilillvaatchsyvqbyxo.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "twoj-anon-key-prod"
$env:VITE_APP_URL = "https://scoutpro.kspolonia.pl"
cd scoutpro
npm run build
$env:SWA_CLI_DEPLOYMENT_TOKEN = "token-z-portalu"
swa deploy .\dist --env production --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

```powershell
# Preview (używa .env.local automatycznie):
cd scoutpro
npm run build
$env:SWA_CLI_DEPLOYMENT_TOKEN = "token-z-portalu"
swa deploy .\dist --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

---

## Podsumowanie – gdzie co trzymać

| Środowisko | Gdzie trzymać | Uwagi |
|---|---|---|
| **Lokalny dev** | `scoutpro/.env.local` | Nie commitować. Zawiera dane PREVIEW. |
| **Azure DevOps PROD** | Variable group `scoutapp-swadeploy-prod` | `DEPLOYMENT_TOKEN` jako secret. |
| **Azure DevOps PREVIEW** | Variable group `scoutapp-swadeploy-preview` | `DEPLOYMENT_TOKEN` jako secret. |
| **Ręczny deploy** | Zmienne w terminalu (`$env:...`) | Nie zapisywać do plików. |
