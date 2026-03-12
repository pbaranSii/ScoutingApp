# Rozwój aplikacji ScoutApp i dostarczanie funkcjonalności (Azure + Vercel)

Instrukcja w aktualnym stanie: **dwa fronty** (Azure Static Web Apps + Vercel), **jedna baza** (Supabase). Jak rozwijać aplikację i wdrażać zmiany.

---

## 1. Obecny stan

| Środowisko | Adres | Trigger / jak wdrażać |
|------------|--------|------------------------|
| **Vercel** | np. `scouting-app-gamma.vercel.app` | Automatyczny deploy po **push na `master`** (Vercel łączy się z repo i buduje z `master`). |
| **Azure SWA** | `calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net` | Ręczny deploy (build + SWA CLI z tokenem) **lub** pipeline Azure DevOps (trigger: `main` / `develop` – zależnie od konfiguracji). |

Oba fronty mogą korzystać z **tego samego projektu Supabase**. W Supabase (Authentication → URL Configuration) w **Redirect URLs** muszą być oba adresy (Vercel i Azure), żeby logowanie działało z obu.

---

## 2. Gałęzie i flow

- **`develop`** – główna gałąź deweloperska: tu trafiają zmergowane feature.
- **`master`** – gałąź „produkcyjna”: po pushu na `master` Vercel buduje i wdraża.
- **`feature/...`** – praca nad nową funkcjonalnością.

Flow:

1. Pracuj na gałęzi **feature** (np. `feature/nazwa-funkcji`).
2. Gdy skończysz: **merge do `develop`** → push `develop` → testy (lokalnie lub na preview).
3. Gdy `develop` jest gotowy do „produkcji”: **merge `develop` do `master`** → push `master`.
4. **Vercel** sam zbuduje i wdroży z `master`.
5. **Azure** – w zależności od wyboru: ręczny deploy z `master` (lub z `develop`) albo pipeline w Azure DevOps.

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

- W **`scoutpro/`** musisz mieć plik **`.env`** z:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - opcjonalnie `VITE_APP_URL` (np. `http://localhost:5173`).
- **Uwaga:** jeśli istnieje **`.env.local`**, nadpisuje `.env`. Przy buildzie produkcyjnym albo ustaw w `.env.local` te same wartości co w `.env`, albo przemianuj `.env.local` (np. na `.env.local.bak`).  
  Więcej: `scoutpro/docs/SUPABASE_CONNECTION.md`.

```powershell
cd scoutpro
npm run dev
```

Aplikacja: `http://localhost:5173`.

### Zakończenie feature i wysłanie do develop

```powershell
git add scoutpro/   # (i ewentualnie docs/, azure-static-web-app.yml – bez Materials/ i bez .env)
git commit -m "feat: opis zmiany"
git push origin feature/nazwa-funkcji
git checkout develop
git pull origin develop
git merge feature/nazwa-funkcji -m "Merge feature/nazwa-funkcji: opis"
git push origin develop
```

Szczegóły i konwencje: `Materials/Instructions/Commit.md`.

---

## 4. Wdrożenie na „produkcję”

### 4.1 Vercel (automatycznie)

- Wypchnij zmiany na **`master`**:
  - `git checkout master`
  - `git pull origin master`
  - `git merge develop -m "Merge develop: opis"`
  - `git push origin master`
- Vercel zbuduje i wdroży aplikację z brancha `master`. Nie musisz ręcznie budować ani wgrywać plików.

### 4.2 Azure Static Web Apps

Masz dwie opcje.

#### A) Ręczny deploy (z własnego komputera)

1. **Build** musi być z **poprawnymi danymi Supabase** (dla tej samej bazy, z której korzysta produkcja):
   - W `scoutpro/.env`: poprawne `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, ewentualnie `VITE_APP_URL` = adres Azure SWA.
   - Brak nadpisania przez `.env.local` (albo te same wartości w `.env.local`).

2. Build i deploy:

```powershell
cd scoutpro
npm run build
$env:SWA_CLI_DEPLOYMENT_TOKEN = "token_z_Azure_Portal_Static_Web_App_Manage_deployment_token"
npx -y @azure/static-web-apps-cli deploy ./dist
```

- Token **nie** commituj i **nie** wklejaj do repo. Po deployu warto wyczyścić zmienną w terminalu.

3. Po wdrożeniu: w Supabase (Authentication → URL Configuration) upewnij się, że w **Redirect URLs** jest adres Twojej aplikacji Azure (np. `https://calm-hill-00bb9b203-preview.westeurope.2.azurestaticapps.net/**`).

#### B) Pipeline Azure DevOps

- Repo w Azure DevOps (np. mirror) + pipeline z pliku **`azure-static-web-app.yml`**.
- W **Library** → variable group (np. `scoutapp-swadeploy`) ustaw:
  - `DEPLOYMENT_TOKEN` (secret),
  - `VITE_SUPABASE_URL`,
  - `VITE_SUPABASE_ANON_KEY`,
  - `VITE_APP_URL` (adres Azure SWA).
- Przy pushu na gałąź obsługiwaną przez pipeline (np. `main` lub `develop`) pipeline zbuduje aplikację z tymi zmiennymi i wdroży na Azure SWA.  
  Szczegóły: `docs/DEPLOYMENT-AZURE.md`.

---

## 5. Migracje bazy (Supabase)

- Niezależnie od tego, czy wdrażasz na Vercel, czy na Azure, **baza** to Supabase.
- Migracje opisane są w `scoutpro/supabase/README_MIGRATIONS.md`.
- W **produkcyjnym** projekcie Supabase uruchamiasz te same migracje co w dev (zgodnie z przyjętą procedurą), żeby schemat był aktualny dla wersji wdrożonej na frontach.

---

## 6. Szybka ściąga

| Chcę… | Działanie |
|--------|-----------|
| Pracować nad nową funkcją | `git checkout develop` → `git pull` → `git checkout -b feature/...` → kod w `scoutpro/` → `npm run dev` z poprawnym `.env`. |
| Wysłać feature do develop | Merge feature → develop, `git push origin develop`. |
| Wypuścić wersję na Vercel | Merge develop → master, `git push origin master`. Vercel zbuduje z `master`. |
| Wgrać tę samą wersję na Azure | U siebie: poprawny `.env` w `scoutpro/`, `npm run build`, ustawić `SWA_CLI_DEPLOYMENT_TOKEN`, `npx @azure/static-web-apps-cli deploy ./dist`. Albo użyć pipeline Azure DevOps. |
| Zmienić dane Supabase dla builda | Edytuj `scoutpro/.env` (i ewentualnie `.env.local`). Przy ręcznym buildzie Vite wczyta je przy `npm run build`. |

---

Dokumenty powiązane:

- **Połączenie z Supabase (gdzie trzymać URL i klucze):** `scoutpro/docs/SUPABASE_CONNECTION.md`
- **Azure (pipeline, zmienne):** `docs/DEPLOYMENT-AZURE.md`
- **Commit i merge do develop:** `Materials/Instructions/Commit.md`
