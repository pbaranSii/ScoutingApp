# Rozwój aplikacji ScoutApp i dostarczanie funkcjonalności (Azure + Vercel)

---

## 1. Środowiska i bazy danych

| Środowisko | Adres | Gałąź | Supabase |
|---|---|---|---|
| **Azure SWA Production** | `scoutpro.kspolonia.pl` | `master` | `oilillvaatchsyvqbyxo` |
| **Azure SWA Preview** | URL preview SWA | `develop` | `digrvtbfonatvytwpbbn` |
| **Vercel** | `scouting-app-gamma.vercel.app` | `master` (auto) | `digrvtbfonatvytwpbbn` |
| **Lokalny dev** | `http://localhost:5173` | dowolna | `digrvtbfonatvytwpbbn` |

**Jak to działa automatycznie:**

- Push na `master` → pipeline Azure DevOps uruchamia job `DeployProduction` z variable group `scoutapp-swadeploy-prod` (Supabase `oilillvaatchsyvqbyxo`) → wdraża na Production.
- Push na `develop` → pipeline uruchamia job `DeployPreview` z variable group `scoutapp-swadeploy-preview` (Supabase `digrvtbfonatvytwpbbn`) → wdraża na Preview.
- Vite wstrzykuje zmienne w czasie builda – nie trzeba zmieniać kodu.

---

## 2. Gałęzie i flow

- **`feature/...`** – praca nad nową funkcjonalnością.
- **`develop`** – gałąź deweloperska / staging: tu trafiają zmergowane feature; push na `develop` → automatyczny deploy na Azure Preview.
- **`master`** – gałąź produkcyjna: push na `master` → automatyczny deploy na Azure Production + Vercel.

**Flow:**

1. Pracuj na gałęzi **feature** (np. `feature/nazwa-funkcji`).
2. Gdy skończysz: merge do `develop` → push `develop` → pipeline buduje Preview z `digrvtbfonatvytwpbbn`.
3. Gdy `develop` jest gotowy do produkcji: merge `develop` do `master` → push `master`.
4. Pipeline buduje Production z `oilillvaatchsyvqbyxo`; Vercel buduje automatycznie z `master`.

---

## 3. Praca codzienna (rozwój)

### Nowa funkcjonalność

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/nazwa-funkcji
# ... praca w scoutpro/ ...
```

### Lokalne uruchomienie (dev)

Plik **`scoutpro/.env.local`** (nie commitowany) zawiera dane Supabase PREVIEW (`digrvtbfonatvytwpbbn`):

```env
VITE_SUPABASE_URL=https://digrvtbfonatvytwpbbn.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_APP_URL=http://localhost:5173
```

Plik **`scoutpro/.env`** zawiera dane PROD (`oilillvaatchsyvqbyxo`) i jest używany wyłącznie jako fallback przy ręcznym budowaniu produkcji (`.env.local` ma pierwszeństwo i nadpisuje `.env`).

```powershell
cd scoutpro
npm run dev
# Aplikacja: http://localhost:5173 (łączy się z digrvtbfonatvytwpbbn)
```

### Zakończenie feature i wysłanie do develop

```powershell
git add scoutpro/   # bez .env i .env.local
git commit -m "feat: opis zmiany"
git push origin feature/nazwa-funkcji

git checkout develop
git pull origin develop
git merge feature/nazwa-funkcji -m "Merge feature/nazwa-funkcji: opis"
git push origin develop
# → Pipeline automatycznie buduje Preview (digrvtbfonatvytwpbbn)
```

---

## 4. Wdrożenie na produkcję

### 4.1 Azure SWA Production (automatycznie przez pipeline)

```powershell
git checkout master
git pull origin master
git merge develop -m "Merge develop: opis"
git push origin master
# → Pipeline automatycznie buduje Production (oilillvaatchsyvqbyxo) i wdraża na scoutpro.kspolonia.pl
```

### 4.2 Vercel (automatycznie)

Vercel deployuje z `master` automatycznie. Korzysta z `digrvtbfonatvytwpbbn` (skonfigurowane w panelu Vercel → Environment Variables).

### 4.3 Azure SWA – ręczny deploy (awaryjnie)

**Na PRODUKCJĘ:**

```powershell
cd scoutpro
# Wymuszamy env produkcyjne (nadpisuje .env.local)
$env:VITE_SUPABASE_URL = "https://oilillvaatchsyvqbyxo.supabase.co"
$env:VITE_SUPABASE_ANON_KEY = "<anon key oilillvaatchsyvqbyxo>"
$env:VITE_APP_URL = "https://scoutpro.kspolonia.pl"
npm run build

$env:SWA_CLI_DEPLOYMENT_TOKEN = "<prod deployment token>"
swa deploy .\dist --env production --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

**Na PREVIEW:**

```powershell
cd scoutpro
npm run build   # .env.local (digrvtbfonatvytwpbbn) jest używane automatycznie

$env:SWA_CLI_DEPLOYMENT_TOKEN = "<token>"
swa deploy .\dist --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

> **Uwaga:** bez flagi `--env production` SWA CLI zawsze wdraża na Preview. Używaj `--env production` wyłącznie dla produkcji.

---

## 5. Migracje bazy (Supabase)

- Migracje opisane są w `scoutpro/supabase/README_MIGRATIONS.md`.
- Uruchamiasz je osobno na każdym projekcie Supabase (PROD i PREVIEW).
- `supabase db push` stosuje migracje z `scoutpro/supabase/migrations/`.

---

## 6. Szybka ściąga

| Chcę… | Działanie |
|---|---|
| Pracować nad nową funkcją | `git checkout develop` → `git pull` → `git checkout -b feature/...` → `npm run dev` (używa `.env.local` z `digrvtbfonatvytwpbbn`). |
| Wysłać feature do develop | Merge feature → develop, `git push origin develop` → pipeline deployuje Preview. |
| Wypuścić wersję na Production | Merge develop → master, `git push origin master` → pipeline deployuje Production + Vercel. |
| Sprawdzić, do której bazy łączy się aplikacja | DevTools → Network → filtruj po `supabase.co` → sprawdź `Request URL`. |
| Zmienić dane Supabase dla lokalnego dev | Edytuj `scoutpro/.env.local` (nie commituj). |
| Zmienić dane Supabase dla produkcji | Zaktualizuj variable group `scoutapp-swadeploy-prod` w Azure DevOps. |

---

Dokumenty powiązane:

- **Połączenie z Supabase (gdzie trzymać URL i klucze):** `scoutpro/docs/SUPABASE_CONNECTION.md`
- **Azure (pipeline, variable groups):** `docs/DEPLOYMENT-AZURE.md`
- **CI/CD runbook:** `documentation/runbooks/azure-swa-ci-cd.md`
- **Commit i merge do develop:** `Materials/Instructions/Commit.md`
