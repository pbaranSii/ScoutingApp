# Analiza zarządzania użytkownikami oraz uprawnień

**Data:** 2025-02-12  
**Branch:** feature/permissions  
**Cel:** Identyfikacja problemów z zapisem zmian na kontach użytkowników i nadawaniem uprawnień, oraz opracowanie rozwiązania docelowego z możliwością rozwoju (granularne uprawnienia, grupy danych).

---

## 1. Stan obecny

### 1.1 Architektura

- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Autoryzacja:** RLS (Row Level Security) + helper `public.is_admin()`
- **Źródło prawdy:** `public.users` (role, business_role, is_active) + `auth.users` (Supabase Auth)

### 1.2 Model ról

| Pole | Tabela | Znaczenie |
|------|--------|-----------|
| `role` | `public.users` | Enum: `admin` / `user` – decyduje o uprawnieniach RLS (`is_admin()`) |
| `business_role` | `public.users` | Enum: `scout`, `coach`, `director`, `suspended`, `admin` – obecnie **tylko informacyjna** |
| `is_active` | `public.users` | Dostęp do aplikacji (zawieszenie) |

**Reguła:** `role = 'admin'` ↔ `business_role = 'admin'`. `is_admin()` sprawdza `role = 'admin' AND is_active = true`.

### 1.3 Przepływy operacji

| Operacja | Endpoint / mechanizm | Uwagi |
|----------|----------------------|-------|
| Dodanie użytkownika | `createUserDirect` (client: signUp + insert) | RLS pozwala adminowi na insert do `users` |
| Edycja użytkownika | `admin-update-user` (Edge Function) → fallback `updateUserProfile` | Fallback przy braku Edge Functions |
| Zmiana hasła | `admin-set-password` (Edge Function) | Brak fallbacku |
| Zawieszenie / przywrócenie | `updateUserStatus` (direct RLS update) | Brak Edge Function |

### 1.4 Sposoby dodawania użytkowników

1. **Dodaj użytkownika** (modal w UserManagement) – `createUserDirect` (signUp + insert)
2. **Zaproszenie** – `InviteForm` + `send-invitation` – komponent **nie jest używany** w UI (brak importu w Settings/UserManagement)

---

## 2. Zidentyfikowane problemy

### 2.1 Niespójność `role` vs `business_role` przy zawieszaniu / przywracaniu

**Problem:** `updateUserStatus` aktualizuje tylko `business_role` i `is_active`, **nie** `role`.

- Przywrócenie użytkownika z `business_role: "scout"` nie zeruje `role` do `"user"`.
- Gdy wcześniej był admin, po przywróceniu nadal ma `role = "admin"`, a `business_role = "scout"` – niespójność danych i nieoczekiwane uprawnienia.

**Kod:** `users.api.ts` → `updateUserStatus` – brak `role` w `updates`.

### 2.2 Fallback edycji bez synchronizacji Auth

**Problem:** Przy braku / błędzie Edge Function `admin-update-user` używany jest `updateUserProfile`, który aktualizuje **tylko** `public.users`.

- Zmiana emaila – zapis tylko w `public.users`, **nie** w `auth.users` → logowanie nadal starym emailem.
- Brak aktualizacji `user_metadata` w Auth (imię, nazwisko, business_role).

### 2.3 Brak informacji o błędzie z Edge Functions

**Problem:** `updateUserAsAdmin` przy błędzie Edge Function cicho przełącza się na fallback. Użytkownik nie wie, że:

- Email nie został zmieniony w Auth,
- Funkcja może nie być wdrożona / zwracać błąd.

### 2.4 Business role tylko informacyjna

**Problem:** `business_role` (Scout, Trener, Dyrektor) nie ma wpływu na RLS ani na UI. Wszystkie aktywne konta mają te same uprawnienia (poza admin/user).

### 2.5 Brak granularnych uprawnień

**Problem:** Brak możliwości:

- ograniczenia dostępu do wybranych lig / rozgrywek,
- ograniczenia dostępu do wybranych funkcji (np. tylko obserwacje, bez pipeline),
- przypisania użytkownika do konkretnych grup danych (np. tylko zawodnicy z lig X, Y).

### 2.6 InviteForm nie zintegrowany w UI

**Problem:** `InviteForm` jest zaimplementowany, ale nie jest używany w Settings/UserManagement. Dostępny jest tylko przepływ „Dodaj użytkownika” z hasłem.

---

## 3. Ustalenia (odpowiedzi użytkownika)

| Pytanie | Odpowiedź |
|---------|-----------|
| Gdzie występują problemy? | Lokalnie i na produkcji |
| Sposób dodawania użytkowników | Admin dodaje przez email + hasło tymczasowe (nie zaproszenia) |
| Zakres business_role | Admin widzi i może wszystko. Scout, Trener, Dyrektor **nie mogą** dodawać użytkowników. Detale w `Materials/uprawnienia/` |
| Granularne uprawnienia – start | Filtrowanie po ligach |
| Organizacje | Tak – użytkownicy przypisani do organizacji |

---

## 4. Propozycja rozwiązania docelowego

### 4.1 Faza 1 – stabilizacja (bez zmian modelu)

1. **Synchronizacja `role` przy `updateUserStatus`**  
   Przy zmianie `business_role` lub `is_active` ustawiać:
   - `role = 'admin'` gdy `business_role = 'admin'`,
   - `role = 'user'` w pozostałych przypadkach.

2. **Informowanie o błędzie Edge Function**  
   Przy nieudanym wywołaniu `admin-update-user` pokazywać toast / komunikat zamiast cichego fallbacku, albo wyraźnie sygnalizować ograniczenia fallbacku (np. „Zmiana emaila wymaga wdrożonych Edge Functions”).

3. **Weryfikacja przepływu dodawania użytkownika**  
   Obecny przepływ (email + hasło) jest poprawny – bez integracji InviteForm.

### 4.2 Faza 2 – organizacje i ligi

4. **Organizacje**  
   - Tabela `organizations (id, name, ...)`  
   - Kolumna `users.organization_id` (FK → organizations)  
   - RLS: użytkownik widzi dane swojej organizacji; admin – wszystkich (lub konfigurowalnie).

5. **Model dostępu do lig**  
   - Tabela `user_league_access (user_id, league_id)` – dozwolone ligi dla użytkownika.  
   - Pusty zestaw = dostęp do wszystkich lig w ramach organizacji.  
   - RLS na `observations` / `players` filtrujący po `league_id` (via `matches.league_id`).

6. **Wzmocnienie business_role**  
   - Scout: obserwacje, zawodnicy (w zakresie lig).  
   - Trener: + pipeline (odczyt).  
   - Dyrektor: + pipeline (edycja), KPI.  
   - Admin: pełny dostęp, zarządzanie użytkownikami.

### 4.3 Faza 3 – rozszerzenia (opcjonalnie)

7. **Model funkcji (permissions)** – jeśli potrzebne dodatkowe klucze.
8. **Regiony, kluby** – jeśli wymagane jako kolejny wymiar filtrowania.

---

## 5. Schemat docelowy (faza 2)

```
public.organizations
  - id uuid PK
  - name text
  - created_at timestamptz

public.users
  - id, email, full_name, role, business_role, is_active, ...
  - organization_id uuid FK → organizations (NOWE)

public.user_league_access
  - user_id FK → users
  - league_id FK → leagues
  - (user_id, league_id) UNIQUE
  - Pusty zestaw = dostęp do wszystkich lig w org
```

Mapowanie obserwacje → liga: `observations.match_id` → `matches.league_id`.

---

## 6. Kolejność prac (zalecana)

| Krok | Opis | Szacunkowa złożoność |
|------|------|----------------------|
| 1 | Naprawa `updateUserStatus` (synchronizacja `role`) | niska |
| 2 | Obsługa błędów Edge Function + komunikaty | niska |
| 3 | Migracja `organizations` + `users.organization_id` | średnia |
| 4 | Migracja `user_league_access` + RLS na observations/players | średnia |
| 5 | UI do zarządzania organizacjami i dostępem do lig | średnia |
| 6 | Wzmocnienie business_role (Scout vs Trener vs Dyrektor) | średnia |
