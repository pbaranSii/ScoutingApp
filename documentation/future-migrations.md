# Przyszłe migracje i aktualizacje DEV → PROD

Dokument opisuje standardowy proces wdrożenia **każdej kolejnej** wersji aplikacji i bazy na PROD oraz rejestr wdrożeń. Użyj go przy każdej planowanej aktualizacji, aby zachować powtarzalność i zapamiętać kolejne wydania.

## Środowiska PROD (stałe)

- **Aplikacja PROD:** Vercel – [scouting-app](https://vercel.com/pbaransiis-projects/scouting-app) (aplikacja już na PROD).
- **Baza PROD:** Supabase – [Dashboard](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn) (Project REF: `digrvtbfonatvytwpbbn`).

**Przed każdą planowaną aktualizacją** przeczytaj: [rekomendacje-wdrozen.md](rekomendacje-wdrozen.md).

## Standardowy proces na każdą aktualizację

1. **Weryfikacja stanu PROD** – które migracje są już na bazie PROD; z którego brancha/commita ostatni deploy na Vercel.
2. **Backup bazy PROD** – Supabase Dashboard (Database → Backups) lub PITR.
3. **Wykonanie tylko brakujących migracji** na bazie PROD:
   - CLI: `npx supabase link --project-ref digrvtbfonatvytwpbbn` i `npx supabase db push`,
   - lub ręcznie w SQL Editor w Supabase PROD (kolejność plików z `scoutpro/supabase/migrations/`).
4. **Lokalnie:** `npm run deploy:verify` (build + lista migracji) – nie wdrażaj, jeśli build się nie powiedzie.
5. **Deploy aplikacji** – zmiany zmergowane do brancha **master**, następnie `git push origin master` (Vercel buduje z master). Alternatywnie: Redeploy w panelu Vercel z wybranego commita.
6. **Smoke test** – logowanie, lista zawodników, Pipeline, kluczowe ścieżki (szczegóły w runbooku).
7. **Rollback** – w razie problemów: cofnij deploy na Vercel; baza – ręcznie według runbooka.

Szczegółowa instrukcja (backup, zapytania weryfikacyjne, rollback): **[runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md)**.

## Checklist na pojedyncze wdrożenie (szablon)

Przy każdej aktualizacji uzupełnij i odhacz:

- [ ] Branch do wdrożenia: **master** (po merge z brancha feature). Commit: `_________`
- [ ] Nowe migracje w tym wydaniu: `_________` (np. numery plików lub „brak”)
- [ ] Backup PROD wykonany
- [ ] Migracje na PROD wykonane (jeśli były)
- [ ] `npm run deploy:verify` OK
- [ ] Deploy na Vercel wykonany
- [ ] Smoke test wykonany
- [ ] Data wdrożenia: `_________`

## Rejestr wdrożeń

| Data       | Branch / commit                    | Opis (krótki)                          | Nowe migracje | Uwagi |
| ---------- | ----------------------------------- | -------------------------------------- | ------------- | ----- |
| np. 2026-02 | master (merge z fix/players-observations-pipeline) | Status Nieprzypisany, przycisk + Pipeline | 20260210140000, 20260210140001 | |

Uzupełniaj wiersze po każdym wdrożeniu, aby zachować historię aktualizacji.

## Odnośniki

- [rekomendacje-wdrozen.md](rekomendacje-wdrozen.md) – przeczytaj przed kolejną aktualizacją
- [runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md) – pełna instrukcja krok po kroku
- [deployment.md](deployment.md) – deployment i środowiska
- [operations-dev-prod.md](operations-dev-prod.md) – flow pracy i migracje danych
