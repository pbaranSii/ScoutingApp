# Runbook: Utworzenie Azure Static Web App (SWA) dla ScoutApp

## Cel

Utworzenie zasobu **Azure Static Web App** w grupie zasobów `RG-KSP-PROD-SCOUTING` oraz pobranie **Deployment Token** potrzebnego do pipeline w Azure DevOps.

## Wymagania

- Dostęp do Azure Portal z uprawnieniami min. **Contributor** w subskrypcji i w RG `RG-KSP-PROD-SCOUTING`.
- Grupa zasobów: `RG-KSP-PROD-SCOUTING` (np. [Azure Portal – RG](https://portal.azure.com/#@kspolonia.pl/resource/subscriptions/c2aa4666-8ac8-4d79-acb4-debb9edb51d5/resourceGroups/RG-KSP-PROD-SCOUTING/overview)).

## Kroki

### 1. Utworzenie Static Web App

1. W Azure Portal przejdź do grupy zasobów **RG-KSP-PROD-SCOUTING**.
2. Kliknij **+ Utwórz** → wyszukaj **Static Web App**.
3. Wybierz **Static Web App** (Microsoft) i **Utwórz**.
4. Uzupełnij:
   - **Subskrypcja**: wybierz subskrypcję z RG.
   - **Grupa zasobów**: `RG-KSP-PROD-SCOUTING`.
   - **Nazwa**: np. `scoutapp-prod` (unikalna w obrębie regionu).
   - **Region**: wybierz preferowany region (np. West Europe).
   - **Plan typu**: Free lub Standard – w zależności od wymagań.
   - **Źródło**: na potrzeby CI/CD z Azure DevOps wybierz **Inne** (nie łączysz jeszcze repo w tym kroku) lub po utworzeniu skonfigurujesz po stronie Azure DevOps.
5. **Przejrzyj i utwórz** → **Utwórz**.

### 2. Pobranie Deployment Token

1. Po wdrożeniu przejdź do zasobu **Static Web App**.
2. W menu po lewej wybierz **Zarządzaj wdrożeniami** (lub **Deployment tokens** / **Manage deployment token**).
3. Skopiuj **Deployment token** (wartość sekretna).
4. Zapisz go w **Azure DevOps** w grupie zmiennych **scoutapp-swadeploy** jako zmienna **DEPLOYMENT_TOKEN** (oznacz jako secret). Zob. [azure-swa-ci-cd.md](azure-swa-ci-cd.md).

### 3. Adres aplikacji

- Adres domyślny: `https://<nazwa>.azurestaticapps.net` (np. `https://scoutapp-prod.azurestaticapps.net`).
- Ten adres ustaw jako **VITE_APP_URL** w variable group oraz dodaj do Redirect URLs w Supabase. Zob. [supabase-prod-config-for-multi-frontends.md](supabase-prod-config-for-multi-frontends.md).

### 4. (Opcjonalnie) Środowiska SWA

- Dla **Production** zwykle używa się brancha `main` w pipeline.
- Dla **Staging** – branch `develop` (jeśli pipeline jest skonfigurowany na oba triggery).
- Środowiska można skonfigurować w zasobie SWA po pierwszym wdrożeniu z pipeline.

## Uwagi

- Nie udostępniaj Deployment Token w repo ani w logach.
- W razie utraty tokenu można wygenerować nowy w portalu i zaktualizować variable group w Azure DevOps.
