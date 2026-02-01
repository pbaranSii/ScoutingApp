# 07 - Backlog & Roadmap

## 1. Release Plan

| Release | Nazwa | Termin | Zakres |
|---------|-------|--------|--------|
| v0.1 | Alpha | Q2 2025 W8 | Fundament: Auth, DB, podstawowy UI |
| v0.2 | Alpha | Q2 2025 W10 | Obserwacje: formularz, lista |
| v0.3 | Beta | Q2 2025 W12 | Profile zawodników, offline |
| v0.4 | Beta | Q3 2025 W14 | Pipeline, dashboard |
| v1.0 | MVP | Q3 2025 W16 | Polish, testy, deploy prod |

---

## 2. Sprint 1: Fundament (2 tygodnie)

### 🎯 Cel sprintu
Działająca autentykacja, baza danych i podstawowa nawigacja.

### Zadania

#### TASK-001: Setup projektu
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Inicjalizacja projektu React + Vite + TypeScript + Tailwind

Acceptance Criteria:
- [ ] `npm create vite@latest scoutpro -- --template react-ts`
- [ ] Tailwind CSS skonfigurowany
- [ ] shadcn/ui zainstalowany
- [ ] ESLint + Prettier skonfigurowany
- [ ] Struktura folderów zgodna z architekturą
- [ ] .env.example z zmiennymi Supabase
- [ ] README z instrukcją uruchomienia
```

---

#### TASK-002: Konfiguracja Supabase
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Utworzenie projektu Supabase i konfiguracja klienta

Acceptance Criteria:
- [ ] Projekt Supabase utworzony
- [ ] Supabase CLI zainstalowane lokalnie
- [ ] supabase/config.toml skonfigurowany
- [ ] src/lib/supabase.ts z typowanym klientem
- [ ] Generowanie typów: supabase gen types
```

---

#### TASK-003: Migracja - schemat bazy
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Opis:
Utworzenie wszystkich tabel zgodnie z modelem danych

Acceptance Criteria:
- [ ] 001_initial_schema.sql z tabelami:
  - users, invitations
  - players, player_contacts, player_evaluations
  - observations, matches
  - clubs, regions, leagues, categories
  - positions, evaluation_criteria
  - pipeline_history, offline_queue
- [ ] Wszystkie FK i indeksy
- [ ] Migracja działa: supabase db push
```

---

#### TASK-004: RLS Policies
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Polityki Row Level Security dla wszystkich tabel

Acceptance Criteria:
- [ ] 002_rls_policies.sql
- [ ] users: read all, write own/admin
- [ ] observations: read all, write own
- [ ] players: read/write all
- [ ] settings tables: read all, write admin
- [ ] Testy RLS działają
```

---

#### TASK-005: Seed data
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Opis:
Dane początkowe (słowniki) i import z Excel

Acceptance Criteria:
- [ ] 003_seed_data.sql z:
  - 16 regionów (województwa)
  - 12 kategorii wiekowych
  - 11 pozycji z kryteriami
  - 10 przykładowych klubów
- [ ] 004_import_excel.sql z danymi z pliku Excel
```

---

#### TASK-006: Layout i nawigacja
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Opis:
Podstawowy layout z header, sidebar, bottom nav

Acceptance Criteria:
- [ ] Layout.tsx z responsywnością
- [ ] Header.tsx (logo, notyfikacje, user menu)
- [ ] Sidebar.tsx (desktop)
- [ ] MobileNav.tsx (bottom tabs)
- [ ] React Router z routes
- [ ] Protected routes (wymaga auth)
```

---

#### TASK-007: Strona logowania
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Opis:
Formularz logowania z obsługą błędów

Acceptance Criteria:
- [ ] LoginPage.tsx
- [ ] LoginForm.tsx z React Hook Form + Zod
- [ ] Walidacja email/hasło
- [ ] Obsługa błędów (nieprawidłowe dane)
- [ ] "Zapamiętaj mnie" (persist session)
- [ ] Link "Zapomniałem hasła"
- [ ] Redirect po zalogowaniu → /dashboard
```

---

#### TASK-008: Reset hasła
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Opis:
Flow resetowania hasła

Acceptance Criteria:
- [ ] ResetPasswordPage.tsx (formularz email)
- [ ] SetNewPasswordPage.tsx (nowe hasło)
- [ ] Integracja z Supabase Auth
- [ ] Komunikaty sukcesu/błędu
```

---

#### TASK-009: Auth store i hook
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Opis:
Zustand store dla stanu autentykacji

Acceptance Criteria:
- [ ] stores/authStore.ts
- [ ] State: user, session, isLoading
- [ ] Actions: login, logout, refreshSession
- [ ] hooks/useAuth.ts
- [ ] Auto-refresh tokena
- [ ] Obsługa wygasłej sesji
```

---

#### TASK-010: Dashboard placeholder
**Estymacja:** 2h | **Priorytet:** P1

```markdown
Opis:
Podstawowa strona dashboard (placeholder)

Acceptance Criteria:
- [ ] DashboardPage.tsx
- [ ] Wyświetla imię zalogowanego użytkownika
- [ ] Placeholdery dla widgetów
```

---

### Sprint 1 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-001 | 4h | P0 |
| TASK-002 | 4h | P0 |
| TASK-003 | 8h | P0 |
| TASK-004 | 4h | P0 |
| TASK-005 | 4h | P1 |
| TASK-006 | 8h | P0 |
| TASK-007 | 6h | P0 |
| TASK-008 | 4h | P1 |
| TASK-009 | 4h | P0 |
| TASK-010 | 2h | P1 |
| **RAZEM** | **48h** | |

---

## 3. Sprint 2: Obserwacje (2 tygodnie)

### 🎯 Cel sprintu
Dodawanie i przeglądanie obserwacji (główna funkcja MVP).

### Zadania

#### TASK-011: Lista obserwacji
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] ObservationsPage.tsx
- [ ] ObservationList.tsx z kartami
- [ ] Filtry: rocznik, pozycja, ranga, data
- [ ] Sortowanie: data, ranga
- [ ] Paginacja (infinite scroll)
- [ ] useObservations.ts hook
```

---

#### TASK-012: Karta obserwacji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] ObservationCard.tsx
- [ ] Wyświetla: nazwisko, imię, klub, rocznik, ranga, data, autor
- [ ] Badge rangi z kolorami
- [ ] Kliknięcie → profil zawodnika
- [ ] Responsywna
```

---

#### TASK-013: Wizard nowej obserwacji
**Estymacja:** 12h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] NewObservationPage.tsx
- [ ] ObservationWizard.tsx (4 kroki)
- [ ] Krok 1: Dane zawodnika (nazwisko, imię, rocznik, klub)
- [ ] Krok 2: Pozycja i noga
- [ ] Krok 3: Ocena (ranga, potencjał, komentarz)
- [ ] Krok 4: Zdjęcie (opcjonalne)
- [ ] Progress indicator
- [ ] Walidacja per krok
- [ ] Zapisz jako draft na każdym etapie
```

---

#### TASK-014: Autouzupełnianie klubu
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] ClubAutocomplete.tsx (Combobox)
- [ ] Wyszukiwanie w tabeli clubs
- [ ] Sugestie z historii użytkownika
- [ ] Możliwość dodania nowego klubu ad-hoc
```

---

#### TASK-015: Selektor pozycji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PositionSelector.tsx
- [ ] Grid przycisków (układ boiska)
- [ ] Wizualne zaznaczenie wybranej
- [ ] Obsługa wielu pozycji (np. "4/5")
```

---

#### TASK-016: Formularz oceny
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] EvaluationForm.tsx
- [ ] Wybór rangi (A/B/C/D) - duże przyciski
- [ ] Slider lub przyciski 1-5 dla potencjału
- [ ] Dropdown źródła
- [ ] Textarea na komentarz
```

---

#### TASK-017: Upload zdjęcia
**Estymacja:** 6h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] PhotoUpload.tsx
- [ ] Wybór: aparat lub galeria
- [ ] Kompresja do max 500KB
- [ ] Podgląd miniaturki
- [ ] Upload do Supabase Storage
- [ ] Max 3 zdjęcia
```

---

#### TASK-018: API obserwacji
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] observations.api.ts
- [ ] getObservations(filters)
- [ ] getObservation(id)
- [ ] createObservation(data)
- [ ] updateObservation(id, data)
- [ ] deleteObservation(id) - soft delete
```

---

#### TASK-019: Linkowanie zawodnika
**Estymacja:** 6h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] PlayerLinkDialog.tsx
- [ ] Wyszukiwanie potencjalnych duplikatów
- [ ] Matching: nazwisko + rocznik + klub
- [ ] Opcje: "To ten sam" / "Nowy zawodnik"
- [ ] Automatyczne linkowanie obserwacji
```

---

#### TASK-020: FAB (Floating Action Button)
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] FAB.tsx
- [ ] Pozycja: prawy dolny róg (mobile)
- [ ] Ikona "+"
- [ ] Kliknięcie → /observations/new
- [ ] Animacja hover/press
```

---

### Sprint 2 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-011 | 6h | P0 |
| TASK-012 | 4h | P0 |
| TASK-013 | 12h | P0 |
| TASK-014 | 4h | P1 |
| TASK-015 | 4h | P0 |
| TASK-016 | 6h | P0 |
| TASK-017 | 6h | P1 |
| TASK-018 | 4h | P0 |
| TASK-019 | 6h | P1 |
| TASK-020 | 2h | P0 |
| **RAZEM** | **54h** | |

---

## 4. Sprint 3: Profile i Offline (2 tygodnie)

### 🎯 Cel sprintu
Kompletne profile zawodników i działanie offline.

### Zadania

#### TASK-021: Profil zawodnika
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayerDetailPage.tsx
- [ ] PlayerProfile.tsx z sekcjami
- [ ] Dane podstawowe
- [ ] Dane fizyczne
- [ ] Kontakty
- [ ] Historia obserwacji (timeline)
- [ ] Status pipeline
```

---

#### TASK-022: Edycja profilu
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayerForm.tsx (modal lub osobna strona)
- [ ] Edycja wszystkich pól
- [ ] Walidacja
- [ ] Zapisywanie zmian
```

---

#### TASK-023: Lista zawodników
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] PlayersPage.tsx
- [ ] PlayerList.tsx z kartami
- [ ] PlayerCard.tsx
- [ ] Filtry: rocznik, pozycja, status, region
- [ ] Wyszukiwarka tekstowa
- [ ] Sortowanie
```

---

#### TASK-024: Kontakty rodzica
**Estymacja:** 4h | **Priorytet:** P1

```markdown
Acceptance Criteria:
- [ ] ContactsSection.tsx
- [ ] Lista kontaktów z możliwością edycji
- [ ] Dodawanie nowego kontaktu
- [ ] Oznaczenie głównego kontaktu
- [ ] Ikony: telefon, email (clickable)
```

---

#### TASK-025: Linki wideo
**Estymacja:** 4h | **Priorytet:** P2

```markdown
Acceptance Criteria:
- [ ] VideoLinks.tsx
- [ ] Lista linków URL
- [ ] Walidacja URL
- [ ] Embed player (YouTube, Vimeo) jeśli możliwe
```

---

#### TASK-026: PWA manifest i ikony
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] public/manifest.json
- [ ] Ikony 192x192 i 512x512
- [ ] Theme color
- [ ] Start URL
- [ ] Display: standalone
```

---

#### TASK-027: Service Worker (Workbox)
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] vite-plugin-pwa skonfigurowany
- [ ] Cache static assets
- [ ] Cache API responses (NetworkFirst)
- [ ] Cache images (CacheFirst)
- [ ] Offline fallback page
```

---

#### TASK-028: IndexedDB setup (Dexie)
**Estymacja:** 4h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] offlineDb.ts z Dexie
- [ ] Tabele: observations, players
- [ ] Schema versioning
```

---

#### TASK-029: Offline observation save
**Estymacja:** 6h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] Zapisywanie obserwacji do IndexedDB gdy offline
- [ ] LocalId generowany (UUID)
- [ ] Status: pending
- [ ] Wizualny wskaźnik "zapisano lokalnie"
```

---

#### TASK-030: Sync mechanism
**Estymacja:** 8h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] useSync.ts hook
- [ ] useOnlineStatus.ts hook
- [ ] Automatyczna synchronizacja po powrocie online
- [ ] Progress indicator
- [ ] Retry logic (3x)
- [ ] Error handling
```

---

#### TASK-031: Offline indicator
**Estymacja:** 2h | **Priorytet:** P0

```markdown
Acceptance Criteria:
- [ ] OfflineIndicator.tsx (banner)
- [ ] Wyświetla gdy navigator.onLine = false
- [ ] Licznik oczekujących na sync
```

---

### Sprint 3 Summary
| Zadanie | Estymacja | Priorytet |
|---------|-----------|-----------|
| TASK-021 | 8h | P0 |
| TASK-022 | 6h | P0 |
| TASK-023 | 6h | P0 |
| TASK-024 | 4h | P1 |
| TASK-025 | 4h | P2 |
| TASK-026 | 2h | P0 |
| TASK-027 | 8h | P0 |
| TASK-028 | 4h | P0 |
| TASK-029 | 6h | P0 |
| TASK-030 | 8h | P0 |
| TASK-031 | 2h | P0 |
| **RAZEM** | **58h** | |

---

## 5. Sprint 4: Pipeline i Dashboard (2 tygodnie)

### Zadania

#### TASK-032: Pipeline Kanban board
**Estymacja:** 12h | **Priorytet:** P0

#### TASK-033: Drag & drop status change
**Estymacja:** 6h | **Priorytet:** P0

#### TASK-034: Pipeline history
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-035: Dashboard widgets
**Estymacja:** 8h | **Priorytet:** P0

#### TASK-036: Pipeline chart
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-037: Recent observations widget
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-038: Stats API
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-039: Realtime subscriptions
**Estymacja:** 4h | **Priorytet:** P2

---

## 6. Sprint 5: Admin i Polish (2 tygodnie)

### Zadania

#### TASK-040: Users management (Admin)
**Estymacja:** 6h | **Priorytet:** P0

#### TASK-041: Invite user flow
**Estymacja:** 8h | **Priorytet:** P0

#### TASK-042: Settings - Regions
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-043: Settings - Leagues
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-044: Settings - Clubs
**Estymacja:** 4h | **Priorytet:** P1

#### TASK-045: Push notifications
**Estymacja:** 6h | **Priorytet:** P2

#### TASK-046: Error boundaries
**Estymacja:** 2h | **Priorytet:** P0

#### TASK-047: Loading states
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-048: E2E tests setup
**Estymacja:** 6h | **Priorytet:** P1

#### TASK-049: Production deploy
**Estymacja:** 4h | **Priorytet:** P0

#### TASK-050: Documentation
**Estymacja:** 4h | **Priorytet:** P1

---

## 7. Backlog Faza 2 (Post-MVP)

| ID | Funkcja | Estymacja | Priorytet |
|----|---------|-----------|-----------|
| F2-001 | Benchmarking (porównanie z absolwentami) | 20h | P2 |
| F2-002 | Role i regiony (granularne uprawnienia) | 16h | P2 |
| F2-003 | Audit log (historia zmian) | 12h | P2 |
| F2-004 | Import CSV | 8h | P3 |
| F2-005 | Eksport do PDF | 12h | P3 |
| F2-006 | Kalendarz integracja | 16h | P3 |
| F2-007 | Raport produktywności scoutów | 8h | P2 |
| F2-008 | Multi-language (EN) | 20h | P3 |
| F2-009 | Integracja Wyscout | 24h | P3 |
| F2-010 | Oceny pozycyjne szczegółowe | 12h | P2 |

---

## 8. Definition of Done (DoD)

### Dla każdego zadania:
- [ ] Kod napisany zgodnie ze standardami
- [ ] Testy jednostkowe (jeśli dotyczy)
- [ ] Code review zatwierdzony
- [ ] Brak błędów TypeScript
- [ ] Brak ostrzeżeń ESLint
- [ ] Dokumentacja zaktualizowana
- [ ] Przetestowane na mobile i desktop
- [ ] Działa offline (jeśli dotyczy)

### Dla każdego sprintu:
- [ ] Wszystkie zadania P0 ukończone
- [ ] Demo dla Product Ownera
- [ ] Retrospektywa przeprowadzona
- [ ] Deployment na staging

### Dla MVP Release:
- [ ] Wszystkie user stories P1 i P2 ukończone
- [ ] Testy E2E passing
- [ ] Performance audit (Lighthouse > 80)
- [ ] Security audit
- [ ] Dokumentacja użytkownika
- [ ] Deployment na produkcję
