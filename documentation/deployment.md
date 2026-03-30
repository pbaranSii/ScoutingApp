# Deployment

## Wdrożenie DEV na PROD

Branch produkcyjny w repo: **master** (Vercel Production = deploy z master). **Przed kolejną aktualizacją:** [rekomendacje-wdrozen.md](rekomendacje-wdrozen.md).

Instrukcja krok po kroku oraz lista zmian do weryfikacji: **[runbooks/deploy-dev-to-prod.md](runbooks/deploy-dev-to-prod.md)**. Historyczna wersja runbooka (szczegółowa lista migracji do 20260210140001): [runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md).

Przed wdrożeniem w katalogu `scoutpro` uruchom: `npm run deploy:verify` (build + lista migracji).

Środowisko produkcyjne:

- Vercel (scouting-app): [Vercel (scouting-app)](https://vercel.com/pbaransiis-projects/scouting-app), Supabase: [digrvtbfonatvytwpbbn](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn)
- Azure Static Web Apps (SWA): Supabase: [oilillvaatchsyvqbyxo](https://supabase.com/dashboard/project/oilillvaatchsyvqbyxo)

Przyszłe migracje i powtarzalny proces: **[future-migrations.md](future-migrations.md)**.

> **Azure Static Web Apps (PROD):** ta sama wersja frontendu, która jest deployowana z brancha `master` na Vercel, powinna być również wdrażana na Azure Static Web Apps z tego samego commita (pipeline w Azure DevOps – zob. `docs/DEPLOYMENT-AZURE.md`).

## Środowiska

- Development: localhost (dev server)
- Staging: preview deployments (Vercel)
- Production: aplikacja na Vercel (scouting-app), baza na Supabase PROD

### DEV vs PROD – baza danych

- **DEV (lokalnie):** aplikacja uruchamiana przez `npm run dev` powinna korzystać z **oddzielnego projektu Supabase DEV**, skonfigurowanego w pliku `.env.local` (na bazie szablonu `scoutpro/.env.example`). Ten plik **nie jest commitowany** do repozytorium.
- **PROD (Vercel):** korzysta z projektu Supabase `Project REF: digrvtbfonatvytwpbbn` (ustawione w env Vercel).
- **PROD (Azure SWA):** korzysta z projektu Supabase `Project REF: oilillvaatchsyvqbyxo` (ustawione w variable group/pipeline Azure).

## Stosowanie migracji: db push vs ręczne SQL

- **Zalecane:** `npx supabase db push` w katalogu `scoutpro` – stosuje wszystkie brakujące migracje z `scoutpro/supabase/migrations/` w kolejności nazw plików. Zob. **[runbooks/apply-migrations.md](runbooks/apply-migrations.md)**.
- **Ręcznie (SQL Editor / APPLY_*.md):** gdy CLI nie jest dostępne lub gdy trzeba wykonać tylko wybrane fragmenty (np. poprawki polityk). W katalogu `scoutpro/supabase/` znajdują się pliki:
  - **README_MIGRATIONS.md** – zasady i lista migracji
  - **APPLY_ADMIN_STATS_SURVEY.md** – statystyki użytkowników i ankiety (user_sessions, user_surveys, RPC)
  - **APPLY_PLAYER_DEMANDS.md** – zapotrzebowania na zawodników
  - **APPLY_MULTIMEDIA_MIGRATIONS.md** – tabela multimedia i storage
  - **PUSH_FAVORITES_FIX.md** – poprawki list ulubionych
  - **DEPLOY_ANALYTICS.md** – moduł analityki rekrutacji
  - **PROD_AUTH_NO_EMAIL_CONFIRM.md** – wyłączenie potwierdzenia e-mail na PROD

Pełna kolejność migracji: `scoutpro/supabase/migrations/*.sql` (sortowanie leksykograficzne po nazwie pliku).

## Supabase setup (skrót)

1. Utwórz projekt Supabase.
2. Skonfiguruj Auth (email provider).
3. Skonfiguruj Storage bucket **scoutpro_media** (multimedia).
4. Uruchom migracje: `npx supabase db push` lub według [runbooks/apply-migrations.md](runbooks/apply-migrations.md).
5. Pobierz `Project URL` i `anon key` dla frontendu.

## Vercel setup (skrót)

- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`

## CI/CD

Zakładane są workflowy GitHub Actions: lint/test/build, deploy na Vercel, migracje Supabase (osobny job). Szczegóły historyczne i szablony pipeline pozostają w `Materials/09-DEPLOYMENT.md`.
