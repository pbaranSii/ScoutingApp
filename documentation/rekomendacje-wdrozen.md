# Rekomendacje wdrożeń – przeczytaj przed kolejną aktualizacją

Dokument zbiera wnioski z przebiegu wdrożeń (m.in. luty 2026). Przeczytaj go **przed** zgłoszeniem kolejnej aktualizacji aplikacji na PROD.

## Branch produkcyjny

W repozytorium branchem produkcyjnym jest **master** (nie ma brancha `main`). Vercel Production powinien być połączony z `master`. Deploy = push do `master`.

## Zalecana kolejność kroków

1. **Migracje na bazę PROD** – Supabase CLI: `npx supabase link --project-ref digrvtbfonatvytwpbbn`, potem `npx supabase db push` (w katalogu `scoutpro`).
2. **Backup bazy PROD** – przed migracjami w Supabase Dashboard (Database → Backups).
3. **Weryfikacja builda** – w katalogu `scoutpro`: `npm run deploy:verify`. Nie merguj do master, dopóki build nie przejdzie.
4. **Commit na branchu feature** – wszystkie zmiany zapisane na branchu z funkcjami (np. `fix/...`): `git add ...`, `git commit -m "..."`.
5. **Merge i deploy** – `git checkout master` → `git pull origin master` → `git merge <branch-feature>` → `git push origin master`.

## Typowe problemy z ostatniego wdrożenia

### npm ci EPERM (np. esbuild.exe)

Plik zablokowany przez IDE, antywirus lub inny proces.

- Zamknij Cursor i wszystkie terminale.
- Uruchom PowerShell **jako Administrator**.
- W katalogu `scoutpro`: `Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue`; potem `npm ci`.
- Alternatywa: `npm install` (mniej restrykcyjne niż `npm ci`).

### npm audit – xlsx „No fix available”

Jedna podatność high (xlsx) nie ma poprawki w npm. **Nie blokuje wdrożenia** – można kontynuować. Na później rozważyć wymianę biblioteki (np. sheetjs-ce, exceljs).

### Błędy TypeScript (unused variable / import)

TS6133, TS6196 – zadeklarowane, ale nieużywane zmienne lub importy.

- Przed merge uruchom `npm run deploy:verify` i usuń nieużywane zmienne/importy w zgłoszonym pliku.

### git checkout master odrzucone („local changes would be overwritten”)

Git nie przełącza brancha, gdy są niezapisane zmiany.

- Nie przełączaj bez zapisania. Najpierw na bieżącym branchu: `git add <pliki>` (lub `git add scoutpro/`), `git commit -m "..."`. Potem `git checkout master` i merge.

## Odnośniki

- [future-migrations.md](future-migrations.md) – proces na każdą aktualizację, rejestr wdrożeń
- [runbook-deploy-dev-to-prod.md](runbook-deploy-dev-to-prod.md) – pełna instrukcja krok po kroku
- [deployment.md](deployment.md) – deployment i środowiska
