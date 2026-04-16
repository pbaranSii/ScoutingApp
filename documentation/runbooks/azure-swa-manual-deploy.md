# Runbook: Ręczny deploy ScoutPro na Azure Static Web Apps (Preview + Production)

Ten dokument opisuje **powtarzalny** proces aktualizacji i deploya frontendu (`scoutpro`) na **Azure Static Web Apps** przy użyciu `swa deploy`.

## Założenia i mapowanie środowisk

- **Preview (local)**: build z `.env.local` → Supabase `digrvtbfonatvytwpbbn` (`https://digrvtbfonatvytwpbbn.supabase.co`)
- **Production (prod)**: build z `.env` (bez `.env.local`) → Supabase `oilillvaatchsyvqbyxo` (`https://oilillvaatchsyvqbyxo.supabase.co`)

> `.env.local` **zawsze nadpisuje** `.env` podczas `npm run build`. Dlatego na czas buildu produkcyjnego trzeba ją wyłączyć.

## Wymagania

- Node.js + npm
- Azure Static Web Apps CLI:

```powershell
npm i -g @azure/static-web-apps-cli
swa --version
```

- Deployment token do SWA (trzymaj jako sekret).

## Zasady bezpieczeństwa (ważne)

- **Nie commituj** `.env.local` ani żadnych tokenów/kluczy (anon/service-role/deployment token).
- Token ustawiaj w sesji terminala, np. w `$env:SWA_CLI_DEPLOYMENT_TOKEN`.

## 0) Start: przygotowanie repo i katalogu

W katalogu repo (nie w `scoutpro`):

```powershell
cd C:\Projekty\CursorAplications\ScoutApp
git status
```

- Jeśli masz zmiany lokalne, które nie powinny wejść do buildu/deploya → schowaj je (`git stash`) albo cofaj.

## 1) Wybór wersji do wdrożenia (commit)

Najczęściej:

- **Preview**: branch `develop`
- **Production**: branch `master`

Przykład pobrania najnowszego `master` z Azure:

```powershell
git checkout master
git pull --ff-only azure master
```

Analogicznie dla `develop`:

```powershell
git checkout develop
git pull --ff-only azure develop
```

> Jeśli pipeline jest niestabilny, warto wdrażać ręcznie **konkretny commit** (zapamiętaj hash).

## 2) Wspólne kroki przed buildem (zalecane)

W katalogu `scoutpro`:

```powershell
cd .\scoutpro
taskkill /F /IM node.exe 2>$null
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
```

Jeśli `npm ci` sypie się na Windows `EPERM`:

```powershell
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
npm cache clean --force
npm install
```

## 3) Deploy Preview (local) — Supabase `digr...`

### 3.1 Upewnij się, że `.env.local` jest aktywny

```powershell
if (Test-Path .\.env.local.off) {
  if (Test-Path .\.env.local) { Remove-Item -Force .\.env.local }
  Rename-Item .\.env.local.off .\.env.local -Force
}
```

### 3.2 Czysty build

```powershell
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
npm ci
npm run build
```

### 3.3 Twarda weryfikacja: URL Supabase w bundlu

```powershell
Select-String -Path .\dist\assets\index-*.js -Pattern "https://digrvtbfonatvytwpbbn.supabase.co" -SimpleMatch
```

Jeśli to nic nie zwróci → **nie deployuj** (build nie ma zaszytego właściwego URL).

### 3.4 Deploy na Preview

```powershell
$env:SWA_CLI_DEPLOYMENT_TOKEN = "<WSTAW_TOKEN>"
swa deploy .\dist --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

Po deployu CLI poda URL środowiska preview (np. `https://<name>-preview...azurestaticapps.net`).

## 4) Deploy Production — Supabase `oil...`

### 4.1 Wyłącz `.env.local` (żeby build brał `.env`)

```powershell
if (Test-Path .\.env.local) {
  if (Test-Path .\.env.local.off) { Remove-Item -Force .\.env.local.off }
  Rename-Item .\.env.local .\.env.local.off -Force
}
```

### 4.2 Czysty build

```powershell
taskkill /F /IM node.exe 2>$null
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
npm ci
npm run build
```

### 4.3 Twarda weryfikacja: URL Supabase w bundlu

```powershell
Select-String -Path .\dist\assets\index-*.js -Pattern "https://oilillvaatchsyvqbyxo.supabase.co" -SimpleMatch
```

Jeśli to nic nie zwróci → **nie deployuj**.

### 4.4 Deploy na Production

```powershell
$env:SWA_CLI_DEPLOYMENT_TOKEN = "<WSTAW_TOKEN>"
swa deploy .\dist --env production --deployment-token $env:SWA_CLI_DEPLOYMENT_TOKEN
```

CLI poda URL production w formie `https://<app>.2.azurestaticapps.net` (domena docelowa może być podpięta osobno, np. `https://scoutpro.kspolonia.pl`).

## 5) Weryfikacja po deployu (obowiązkowo)

### 5.1 Czy aplikacja gada z właściwym Supabase?

W przeglądarce:

- DevTools → **Network** → filtr `supabase.co`
- Sprawdź `Request URL`:
  - Preview: `digrvtbfonatvytwpbbn.supabase.co`
  - Prod: `oilillvaatchsyvqbyxo.supabase.co`

### 5.2 PWA / Service Worker (częsty powód “nie widzę zmian”)

Jeśli po deployu nadal widzisz starą wersję:

- Hard refresh: **Ctrl+F5**
- DevTools → **Application**:
  - **Service Workers** → *Unregister*
  - **Storage** → *Clear site data*
  - Odśwież stronę

## 6) Najczęstsze problemy i szybkie rozwiązania

- **`Rename-Item: Nie można utworzyć pliku, który już istnieje`**:
  - Usuń plik docelowy zanim robisz rename (patrz sekcje 3.1 i 4.1 – mają już bezpieczne komendy).

- **Build OK, ale zły Supabase na środowisku**:
  - To prawie zawsze aktywne `.env.local` podczas buildu produkcyjnego lub cache w przeglądarce.
  - Zawsze rób `Select-String` na `dist/assets/index-*.js` przed deployem.

- **`npm ci` / `node_modules` EPERM**:
  - Ubicie `node.exe`, usunięcie `node_modules`, `npm cache clean --force`, potem `npm install`.

## 7) Minimalna checklista “przed kliknięciem deploy”

- [ ] Jestem na właściwym branchu (`develop` dla preview, `master` dla prod) i mam świeży `git pull`.
- [ ] `dist/` jest zbudowane od zera.
- [ ] `Select-String` potwierdza właściwy URL Supabase w bundlu.
- [ ] Deploy poszedł na właściwe środowisko (`preview` bez flagi, `production` z `--env production`).
- [ ] Po deployu w Network widzę właściwe `*.supabase.co`.

