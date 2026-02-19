Instrukcja na przyszłość (dla Ciebie i dla mnie)
Gdy chcesz zacommitować zmiany w jedną wersję i wysłać je do głównego brancha deweloperskiego, możesz napisać np.:
„Zacommituj wszystkie zmiany w jeden commit i wypchnij na branch deweloperski (develop)”
albo krócej:
„Commit + push na develop w jednej wersji”
Wtedy zrobię po kolei:
git add – dodam do stage’a tylko pliki projektu (np. scoutpro/), bez katalogów typu Materials/, chyba że wskażesz inaczej.
git commit -m "..." – jeden commit z czytelnym opisem (po polu lub po angielsku, zależnie od Twojego zwyczaju).
git checkout develop – przełączenie na branch deweloperski.
git merge <aktualna-gałąź> – zmergowanie gałęzi z pracą (np. feature/...) do develop.
git push origin develop – wypchnięcie zaktualizowanego develop na origin.
Dodatkowo mogę (jeśli chcesz to mieć zawsze):
git push origin <gałąź-feature> – żeby Twoja gałąź feature też była na origin.
Ważne:
Główny branch deweloperski w tym repo to develop.
W PowerShell używam ; zamiast && między poleceniami.
Jeśli w przyszłości główny branch się zmieni (np. na main), napisz: „Od teraz branch deweloperski to main” – wtedy będę używać tego brancha w powyższym procesie.

---

Merge gałęzi feature do develop
Gdy masz zmiany na gałęzi feature (np. feature/metrics-recruitment-funnel) i chcesz włączyć je do develop:
1. git checkout feature/metrics-recruitment-funnel – upewnij się, że masz najnowsze zmiany
2. git checkout develop – przełącz na develop (uwaga: może być zablokowane, jeśli develop jest w innym worktree)
3. git pull origin develop – pobierz ewentualne zmiany z origin
4. git merge feature/metrics-recruitment-funnel -m "Merge: opis zmian" – zmerguj gałąź
5. git push origin develop – wypchnij develop na origin
Alternatywa (gdy develop jest w innym worktree): wykonaj kroki 2–5 w katalogu worktree, gdzie jest sprawdzony develop.

---

Produkcja (master + Vercel)
Gdy chcesz: „Commit + push na branch main w jednej wersji i zaaktualizuj projekt na produkcji (Vercel)” – w tym repo branch produkcyjny to master (nie main). Zrobię:
1. git checkout master ; git pull origin master
2. git merge develop -m "Merge develop: ..."
3. git push origin master
4. Vercel automatycznie zbuduje i wdroży produkcję po pushu na master.
5. Baza: w produkcyjnym Supabase uruchomić te same migracje co w dev (scoutpro/supabase/README_MIGRATIONS.md). Użytkownicy z dostępem = ci zdefiniowani w produkcji (nie zmieniamy ich przy deployu).