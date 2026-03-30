# Dziennik migracji ScoutApp do Azure

Dziennik decyzji, wykonanych kroków, napotkanych problemów i rozwiązań – do wykorzystania przy wnioskach i instrukcjach dla przyszłych projektów migracji.

---

## Format wpisów

- **Data** (YYYY-MM-DD)
- **Krok / temat**
- **Co zrobiono** (krótki opis)
- **Wynik** (zadziałało / nie zadziałało)
- **Uwagi / kategoria**: Auth, CORS, Build, Konfiguracja SWA, ADO, Supabase, inne

---

## Wpisy

### 2025-03-12 – Wdrożenie dokumentacji i konfiguracji SWA w repo

**Krok:** Implementacja planu migracji (Vercel + SWA, wspólny Supabase).

**Co zrobiono:**
- Dodano `scoutpro/public/staticwebapp.config.json`: `navigationFallback` na `/index.html`, `globalHeaders` (X-Content-Type-Options, X-Frame-Options). Plik w `public/` jest kopiowany przez Vite do `dist/` przy buildzie.
- Utworzono dokumentację:
  - `documentation/azure-migration-overview.md` – cel, architektura, fazy.
  - `documentation/runbooks/azure-swa-setup.md` – utworzenie SWA w RG-KSP-PROD-SCOUTING, Deployment Token.
  - `documentation/runbooks/azure-swa-ci-cd.md` – pipeline, variable group scoutapp-swadeploy.
  - `documentation/runbooks/supabase-prod-config-for-multi-frontends.md` – Redirect URLs i CORS dla Azure SWA w istniejącym Supabase PROD.
  - `documentation/runbooks/future-supabase-prod-migration.md` – scenariusz fazy 2 (nowa baza Supabase).
  - `documentation/azure-migration-log.md` – ten dziennik.

**Wynik:** Zadziałało (dokumentacja i konfig SPA w repo gotowe).

**Uwagi / kategoria:** Konfiguracja SWA, Dokumentacja. Kroki wymagające Azure Portal (utworzenie SWA), Azure DevOps (mirror repo, pipeline, variable group) i Supabase Dashboard (Redirect URLs) pozostają do wykonania ręcznie według runbooków.

---

---

## Checklista smoke testu (Azure SWA)

Po pierwszym wdrożeniu na Azure SWA wykonać:

- [ ] Wejście na URL SWA – strona ładuje się.
- [ ] Odświeżenie strony (F5) na ścieżce innej niż `/` – brak 404 (routing SPA).
- [ ] Deep-link (np. `/observations`, `/players`) – poprawny widok.
- [ ] Logowanie – przekierowanie i sesja OK.
- [ ] Wylogowanie – powrót do widoku publicznego.
- [ ] Reset hasła (jeśli używane) – link z maila prowadzi na SWA, ustawienie hasła działa.
- [ ] Zaproszenie użytkownika (jeśli używane) – link prowadzi na SWA.
- [ ] Kluczowe moduły: lista obserwacji, dodanie/edycja obserwacji, multimedia (upload/odtwarzanie).
- [ ] Brak błędów CORS w konsoli przeglądarki przy wywołaniach do Supabase.

*(Poniżej dodawać kolejne wpisy wg formatu powyżej.)*
