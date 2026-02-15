# Uprawnienia – specyfikacja i struktura

**Aktualizacja:** 2025-02-12

---

## Zasady ogólne

| Rola | Może dodawać użytkowników | Widoczność danych | Zakres uprawnień |
|------|---------------------------|-------------------|------------------|
| **Admin** | Tak | Wszystko | Pełna kontrola (użytkownicy, słowniki, ustawienia) |
| **Scout** | Nie | Organizacja + przypisane ligi | Obserwacje, zawodnicy (w zakresie lig) |
| **Trener** | Nie | Organizacja + przypisane ligi | Obserwacje, zawodnicy, pipeline (odczyt) |
| **Dyrektor** | Nie | Organizacja + przypisane ligi | Pipeline, KPI, pełny odczyt |

**Admin** – widzi wszystko i może wszystko. Zarządza użytkownikami, słownikami, ustawieniami.

**Scout, Trener, Dyrektor** – nie mogą dodawać użytkowników. Dostęp do danych ograniczony do organizacji i przypisanych lig.

---

## Sposób dodawania użytkowników

- **Admin** dodaje użytkownika przez formularz: email + hasło tymczasowe.
- Zaproszenia e-mailem nie są priorytetem – użytkownik tworzony jest od razu z hasłem.

---

## Poziomy uprawnień

### 1. Role (`role` / `business_role`)

- `role`: `admin` | `user` – użycie techniczne (RLS, `is_admin()`)
- `business_role`: `scout` | `coach` | `director` | `admin` | `suspended`

### 2. Przypisanie do organizacji

- Każdy użytkownik należy do **organizacji** (`organization_id`).
- Admin widzi dane wszystkich organizacji (lub swoją – do ustalenia w modelu multi-tenant).

### 3. Filtrowanie po ligach (start)

- Użytkownik (Scout, Trener, Dyrektor) ma przypisane **ligi** (`user_league_access`).
- Pusty zestaw = dostęp do wszystkich lig w ramach organizacji.
- Dostęp do zawodników i obserwacji ograniczony do meczów z przypisanych lig.

---

## Struktura danych (docelowa)

```
organizations
  - id, name, ...

users
  - id, email, full_name, role, business_role, is_active
  - organization_id (FK → organizations)  [NOWE]

user_league_access
  - user_id (FK → users)
  - league_id (FK → leagues)
  - UNIQUE(user_id, league_id)
  - Pusty zestaw dla usera = dostęp do wszystkich lig w org
```

---

## Mapowanie obserwacje → liga

- `observations` → `match_id` → `matches.league_id`
- Obserwacje bez meczu: traktować jako „bez ligi” (dostęp dla wszystkich w org lub osobna reguła)

---

## Kolejność wdrożenia

1. **Stabilizacja** – naprawa zapisu zmian (role, fallback Edge Function)
2. **Organizacje** – tabela `organizations`, `users.organization_id`
3. **Ligi** – tabela `user_league_access`, RLS na observations/players
4. **Business role** – różnicowanie dostępu Scout vs Trener vs Dyrektor
