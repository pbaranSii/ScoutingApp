# Deployment

## Wdrożenie DEV na PROD

Branch produkcyjny w repo: **master** (Vercel Production = deploy z master). **Przed kolejną aktualizacją:** [rekomendacje-wdrozen.md](rekomendacje-wdrozen.md).

Instrukcja krok po kroku oraz lista zmian do weryfikacji: **[runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md)**.

Przed wdrożeniem w katalogu `scoutpro` uruchom: `npm run deploy:verify` (build + lista migracji).

Środowisko produkcyjne: aplikacja na [Vercel (scouting-app)](https://vercel.com/pbaransiis-projects/scouting-app), baza na [Supabase PROD](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn). Przyszłe migracje i powtarzalny proces: **[future-migrations.md](future-migrations.md)**.

## Srodowiska
- Development: localhost (dev server)
- Staging: preview deployments (Vercel)
- Production: aplikacja na Vercel (scouting-app), baza na Supabase PROD

## Supabase setup (skrot)
1. Utworz projekt Supabase.
2. Skonfiguruj Auth (email provider).
3. Skonfiguruj Storage bucket `player-photos`.
4. Uruchom migracje (Supabase CLI).
5. Pobierz `Project URL` i `anon key` dla frontendu.

## Vercel setup (skrot)
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`

## CI/CD
Zakladane sa workflowy GitHub Actions:
- lint/test/build
- deploy na Vercel
- migracje Supabase (osobny job)

Szczegoly historyczne i szablony pipeline pozostaja w `Materials/09-DEPLOYMENT.md`.
