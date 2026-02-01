# 02 - Wymagania Funkcjonalne

## 1. Epics Overview

| Epic ID | Nazwa | Priorytet | Sprint |
|---------|-------|-----------|--------|
| E01 | Zarządzanie Użytkownikami | P1 | 1 |
| E02 | Obserwacje Meczowe | P1 | 1-2 |
| E03 | Profile Zawodników | P1 | 2-3 |
| E04 | Pipeline Rekrutacyjny | P2 | 3-4 |
| E05 | Dashboard & KPIs | P2 | 4-5 |
| E06 | Offline Mode | P1 | 2-3 |
| E07 | Powiadomienia | P2 | 5 |
| E08 | Ustawienia Systemu | P1 | 1 |

---

## 2. Epic E01: Zarządzanie Użytkownikami

### US-001: Rejestracja przez zaproszenie
**Jako** administrator  
**Chcę** wysłać zaproszenie email do nowego użytkownika  
**Aby** kontrolować kto ma dostęp do systemu

**Acceptance Criteria:**
- [ ] Administrator może wprowadzić email nowego użytkownika
- [ ] System wysyła email z linkiem do aktywacji (ważny 7 dni)
- [ ] Użytkownik po kliknięciu linku ustawia hasło
- [ ] Konto jest automatycznie aktywowane po ustawieniu hasła
- [ ] Administrator widzi listę oczekujących zaproszeń

**Technical Notes:**
- Wykorzystać Supabase Auth z funkcją invite
- Tabela `invitations` do śledzenia statusu

---

### US-002: Logowanie użytkownika
**Jako** użytkownik  
**Chcę** zalogować się emailem i hasłem  
**Aby** uzyskać dostęp do systemu

**Acceptance Criteria:**
- [ ] Formularz logowania z walidacją
- [ ] Obsługa błędnych danych (komunikat)
- [ ] Opcja "Zapamiętaj mnie" (token refresh)
- [ ] Przekierowanie po zalogowaniu do dashboardu
- [ ] Responsywny UI (mobile-first)

---

### US-003: Reset hasła
**Jako** użytkownik  
**Chcę** zresetować zapomniane hasło  
**Aby** odzyskać dostęp do konta

**Acceptance Criteria:**
- [ ] Link "Zapomniałem hasła" na stronie logowania
- [ ] Formularz z emailem
- [ ] Email z linkiem do resetu (ważny 1h)
- [ ] Formularz ustawienia nowego hasła
- [ ] Komunikat potwierdzający zmianę

---

### US-004: Zarządzanie kontami (Admin)
**Jako** administrator  
**Chcę** widzieć listę użytkowników i zarządzać ich kontami  
**Aby** kontrolować dostęp do systemu

**Acceptance Criteria:**
- [ ] Lista użytkowników z filtrem (aktywni/zawieszeni)
- [ ] Widoczne: imię, email, rola, data ostatniego logowania
- [ ] Możliwość zawieszenia konta (soft delete)
- [ ] Możliwość reaktywacji zawieszonego konta
- [ ] Zmiana roli użytkownika (Admin/User)
- [ ] Nie można zawiesić własnego konta

---

### US-005: Profil użytkownika
**Jako** użytkownik  
**Chcę** edytować swój profil  
**Aby** aktualizować dane kontaktowe

**Acceptance Criteria:**
- [ ] Edycja: imię, nazwisko, telefon, avatar
- [ ] Zmiana hasła (wymaga starego hasła)
- [ ] Podgląd własnej aktywności (ostatnie obserwacje)

---

## 3. Epic E02: Obserwacje Meczowe

### US-010: Szybkie dodawanie obserwacji
**Jako** scout  
**Chcę** dodać obserwację zawodnika w < 1 minutę  
**Aby** nie tracić czasu podczas meczu

**Acceptance Criteria:**
- [ ] Floating Action Button (FAB) "+" na głównym ekranie
- [ ] Formularz krok po kroku (wizard):
  1. Dane podstawowe (nazwisko, imię, rocznik, klub)
  2. Pozycja i noga
  3. Ocena (ranga A/B/C/D + komentarz)
  4. Źródło (skauting/polecenie/zgłoszenie)
- [ ] Autouzupełnianie klubu z historii
- [ ] Zapisanie jako draft możliwe na każdym etapie
- [ ] Działa offline (zapis do IndexedDB)

**UI Notes:**
- Duże przyciski (tap-friendly)
- Minimalna liczba pól obowiązkowych
- Klawiatura numeryczna dla rocznika

---

### US-011: Dodawanie zdjęcia zawodnika
**Jako** scout  
**Chcę** zrobić zdjęcie zawodnikowi  
**Aby** łatwiej go rozpoznać

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zdjęcie" w formularzu obserwacji
- [ ] Wybór: aparat lub galeria
- [ ] Automatyczna kompresja do max 500KB
- [ ] Podgląd miniaturki przed zapisaniem
- [ ] Max 3 zdjęcia na obserwację

---

### US-012: Ocena pozycyjna zawodnika
**Jako** scout  
**Chcę** ocenić zawodnika według szablonu dla jego pozycji  
**Aby** zachować spójność ocen

**Acceptance Criteria:**
- [ ] Dynamiczny formularz zależny od pozycji
- [ ] Skala 1-5 dla każdego kryterium
- [ ] Kryteria per pozycja (patrz tabela poniżej)
- [ ] Pole tekstowe na dodatkowe uwagi
- [ ] Podgląd średniej oceny

**Kryteria oceny per pozycja:**

| Pozycja | Kryteria |
|---------|----------|
| GK (1) | Refleks, Gra nogami, Wyjścia, Komunikacja, Pozycjonowanie |
| CB (4/5) | Główkowanie, Pojedynki 1v1, Wyprowadzenie piłki, Czytanie gry, Szybkość |
| FB/WB (2/3) | Dośrodkowania, Defensywa, Ofensywa, Szybkość, Wytrzymałość |
| CM (6/8) | Podania, Wizja gry, Pressing, Strzały z dystansu, Mobilność |
| Winger (7/11) | Drybling, Szybkość, Dośrodkowania, Strzały, Pressing |
| ST (9/10) | Wykończenie, Główkowanie, Gra tyłem, Ruch bez piłki, Pressing |

---

### US-013: Wyszukiwanie obserwacji
**Jako** scout  
**Chcę** wyszukać wcześniejsze obserwacje  
**Aby** sprawdzić historię zawodnika

**Acceptance Criteria:**
- [ ] Wyszukiwarka tekstowa (nazwisko, klub)
- [ ] Filtry: rocznik, pozycja, ranga, data, autor
- [ ] Sortowanie: data (domyślnie), ranga, nazwisko
- [ ] Widok listy z kluczowymi informacjami
- [ ] Kliknięcie → szczegóły obserwacji

---

### US-014: Edycja i usuwanie obserwacji
**Jako** scout  
**Chcę** edytować lub usunąć własną obserwację  
**Aby** poprawić błędy

**Acceptance Criteria:**
- [ ] Edycja możliwa dla własnych obserwacji
- [ ] Soft delete (status "usunięta")
- [ ] Potwierdzenie przed usunięciem
- [ ] Admin może edytować/usuwać wszystkie

---

### US-015: Obserwacja meczu (batch)
**Jako** scout  
**Chcę** dodać obserwację całego meczu z wieloma zawodnikami  
**Aby** efektywnie dokumentować turnieje

**Acceptance Criteria:**
- [ ] Formularz meczu: drużyny, data, liga, wynik
- [ ] Lista obserwacji powiązanych z meczem
- [ ] Przycisk "Dodaj zawodnika do meczu"
- [ ] Widok podsumowania meczu

---

## 4. Epic E03: Profile Zawodników 360°

### US-020: Profil zawodnika
**Jako** użytkownik  
**Chcę** widzieć kompletny profil zawodnika  
**Aby** podjąć decyzję rekrutacyjną

**Acceptance Criteria:**
- [ ] Sekcje profilu:
  - Dane podstawowe (imię, nazwisko, rocznik, DOB, klub)
  - Dane fizyczne (wzrost, waga, noga dominująca)
  - Pozycje (główna + alternatywne)
  - Dane kontaktowe (rodzic, telefon, email)
  - Galeria zdjęć
  - Historia obserwacji (timeline)
  - Aktualny status w pipeline
- [ ] Edycja danych przez każdego użytkownika
- [ ] Historia zmian statusu

---

### US-021: Linkowanie zawodnika
**Jako** scout  
**Chcę** połączyć nową obserwację z istniejącym zawodnikiem  
**Aby** uniknąć duplikatów

**Acceptance Criteria:**
- [ ] Podczas dodawania obserwacji - sugestie duplikatów
- [ ] Matching: nazwisko + rocznik + klub
- [ ] Opcja: "To ten sam zawodnik" → połącz
- [ ] Opcja: "Nowy zawodnik" → utwórz
- [ ] Możliwość merge'a duplikatów przez admina

---

### US-021b: Dodawanie zawodnika bez obserwacji
**Jako** użytkownik  
**Chcę** dodać nowego zawodnika do bazy bez tworzenia obserwacji  
**Aby** przygotować profil przed meczem lub na podstawie informacji z zewnątrz

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zawodnika" w widoku listy zawodników
- [ ] Formularz z polami: imię, nazwisko, rocznik, klub, pozycja, noga
- [ ] Opcjonalne pola: data urodzenia, wzrost, region
- [ ] Walidacja duplikatów (nazwisko + rocznik + klub)
- [ ] Zawodnik tworzony ze statusem "observed" w pipeline
- [ ] Możliwość dodania kontaktu do rodzica od razu

---

### US-021B: Dodawanie nowego zawodnika (bez obserwacji)
**Jako** użytkownik  
**Chcę** dodać nowego zawodnika do bazy bez konieczności tworzenia obserwacji  
**Aby** przygotować profil przed meczem/testem

**Acceptance Criteria:**
- [ ] Przycisk "Dodaj zawodnika" na liście zawodników
- [ ] Formularz z polami: imię*, nazwisko*, rocznik*, klub, pozycja, noga, region
- [ ] Walidacja duplikatów przed zapisem
- [ ] Domyślny status pipeline: "observed"
- [ ] Możliwość dodania zdjęcia i kontaktu do rodzica
- [ ] Redirect do profilu po zapisie

**UI Notes:**
- Formularz podobny do kroku 1-2 wizarda obserwacji
- Można użyć tego samego komponentu PlayerForm

---

### US-022: Dane rodzica/opiekuna
**Jako** użytkownik  
**Chcę** zapisać dane kontaktowe do rodzica  
**Aby** móc się z nim skontaktować

**Acceptance Criteria:**
- [ ] Pola: imię rodzica, telefon, email
- [ ] Możliwość wielu kontaktów (np. oboje rodzice)
- [ ] Oznaczenie głównego kontaktu
- [ ] Historia kontaktów (notatki)

---

### US-023: Linki do wideo
**Jako** scout  
**Chcę** dodać link do nagrania wideo zawodnika  
**Aby** inni mogli obejrzeć jego grę

**Acceptance Criteria:**
- [ ] Pole URL w profilu zawodnika
- [ ] Walidacja formatu URL
- [ ] Wsparcie: YouTube, Vimeo, Veo, Google Drive
- [ ] Osadzanie podglądu (embed player) jeśli możliwe
- [ ] Wiele linków na zawodnika

---

## 5. Epic E04: Pipeline Rekrutacyjny

### US-030: Widok Pipeline (Kanban)
**Jako** użytkownik  
**Chcę** widzieć wszystkich zawodników w formie Kanban  
**Aby** śledzić postęp rekrutacji

**Acceptance Criteria:**
- [ ] Kolumny: Observed → Shortlist → Trial → Offer → Signed / Rejected
- [ ] Karty zawodników z podstawowymi danymi
- [ ] Drag & drop do zmiany statusu
- [ ] Filtry: rocznik, pozycja, region
- [ ] Kliknięcie karty → profil zawodnika

---

### US-031: Zmiana statusu zawodnika
**Jako** użytkownik  
**Chcę** zmienić status zawodnika w pipeline  
**Aby** odzwierciedlić postęp rekrutacji

**Acceptance Criteria:**
- [ ] Zmiana przez drag & drop lub menu kontekstowe
- [ ] Wymagane pole: powód zmiany statusu
- [ ] Historia zmian statusu w profilu
- [ ] Automatyczna data zmiany
- [ ] Powiadomienie dla innych użytkowników (opcjonalne)

---

### US-032: Statusy decyzji
**Jako** użytkownik  
**Chcę** oznaczać końcowe decyzje o zawodniku  
**Aby** dokumentować proces

**Acceptance Criteria:**
- [ ] Statusy końcowe:
  - ZOSTAŁ NASZYM ZAWODNIKIEM
  - ODRZUCIŁ PROPOZYCJĘ
  - ZŁOŻONA PROPOZYCJA
  - ZAPROSIĆ PO RAZ KOLEJNY
  - OBSERWOWAĆ DALEJ W MACIERZYSTYM KLUBIE
  - REZYGNACJA
- [ ] Pole na komentarz przy każdej decyzji
- [ ] Archiwizacja zawodników ze statusem końcowym

---

## 6. Epic E05: Dashboard & KPIs

### US-040: Dashboard główny
**Jako** użytkownik  
**Chcę** widzieć podsumowanie działań  
**Aby** mieć szybki przegląd sytuacji

**Acceptance Criteria:**
- [ ] Widgety:
  - Liczba obserwacji (tydzień/miesiąc/razem)
  - Zawodnicy per status pipeline
  - Ostatnie obserwacje (5)
  - Top zawodnicy (ranga A)
- [ ] Responsywny layout (mobile: stack, desktop: grid)
- [ ] Odświeżanie w czasie rzeczywistym

---

### US-041: KPIs rekrutacji
**Jako** dyrektor  
**Chcę** widzieć metryki konwersji  
**Aby** ocenić efektywność scoutingu

**Acceptance Criteria:**
- [ ] Metryki:
  - Conversion rate per etap pipeline
  - Time-to-decision (średni czas na etap)
  - Obserwacje per scout
  - Zawodnicy per region/rocznik
- [ ] Wykresy: bar chart, pie chart
- [ ] Filtr czasowy (miesiąc, kwartał, rok)
- [ ] Eksport do CSV (opcjonalnie)

---

### US-042: Produktywność scoutów
**Jako** administrator  
**Chcę** widzieć aktywność scoutów  
**Aby** monitorować pracę

**Acceptance Criteria:**
- [ ] Lista scoutów z liczbą obserwacji
- [ ] Liczba meczów obserwowanych
- [ ] Koszty (jeśli wprowadzone)
- [ ] Ranking "top scoutów"

---

## 7. Epic E06: Offline Mode

### US-050: Praca offline
**Jako** scout  
**Chcę** dodawać obserwacje bez internetu  
**Aby** pracować na stadionach bez zasięgu

**Acceptance Criteria:**
- [ ] Aplikacja ładuje się offline (Service Worker)
- [ ] Dodawanie obserwacji zapisuje do IndexedDB
- [ ] Wizualny wskaźnik "Offline" w UI
- [ ] Lista oczekujących na synchronizację
- [ ] Automatyczna synchronizacja po powrocie online

---

### US-051: Synchronizacja danych
**Jako** scout  
**Chcę** aby dane zsynchronizowały się automatycznie  
**Aby** nie musieć o tym pamiętać

**Acceptance Criteria:**
- [ ] Sync uruchamia się automatycznie gdy online
- [ ] Progress bar podczas synchronizacji
- [ ] Obsługa błędów (retry 3x, potem manual)
- [ ] Powiadomienie o zakończeniu sync
- [ ] Conflict resolution: last-write-wins (niski priorytet)

---

### US-052: Cache offline
**Jako** scout  
**Chcę** widzieć ostatnio przeglądane profile offline  
**Aby** mieć dostęp do historii

**Acceptance Criteria:**
- [ ] Cache ostatnich 50 profili
- [ ] Cache ostatnich 100 obserwacji
- [ ] Oznaczenie danych jako "może być nieaktualne"
- [ ] Ręczne odświeżenie cache

---

## 8. Epic E07: Powiadomienia

### US-060: Powiadomienia push
**Jako** użytkownik  
**Chcę** otrzymywać powiadomienia o ważnych wydarzeniach  
**Aby** być na bieżąco

**Acceptance Criteria:**
- [ ] Typy powiadomień:
  - Nowa obserwacja zawodnika, którego obserwowałem
  - Zmiana statusu w pipeline
  - Nowy zawodnik na shortliście (Admin)
- [ ] Zgoda użytkownika na powiadomienia
- [ ] Zarządzanie preferencjami w ustawieniach
- [ ] PWA push notifications (Web Push API)

---

## 9. Epic E08: Ustawienia Systemu

### US-070: Definiowanie regionów
**Jako** administrator  
**Chcę** zdefiniować regiony scoutingowe  
**Aby** przypisywać zawodników geograficznie

**Acceptance Criteria:**
- [ ] CRUD dla regionów
- [ ] Nazwa regionu (np. "Kujawsko-Pomorskie")
- [ ] Regiony dostępne w dropdown'ach w całej aplikacji
- [ ] Możliwość dezaktywacji (zachowanie historii)

---

### US-071: Definiowanie lig/rozgrywek
**Jako** administrator  
**Chcę** zdefiniować ligi i kategorie wiekowe  
**Aby** standaryzować dane meczowe

**Acceptance Criteria:**
- [ ] CRUD dla lig (np. CLJ U17, Ekstraliga U15)
- [ ] CRUD dla kategorii wiekowych (U8-U19)
- [ ] Powiązanie liga + kategoria
- [ ] Możliwość dodawania własnych lig

---

### US-072: Definiowanie klubów
**Jako** użytkownik  
**Chcę** wybierać klub z predefiniowanej listy  
**Aby** uniknąć literówek i duplikatów

**Acceptance Criteria:**
- [ ] Lista klubów z autouzupełnianiem
- [ ] Możliwość dodania nowego klubu ad-hoc
- [ ] Admin może edytować/mergować kluby
- [ ] Import początkowej listy z danych Excel

---

### US-073: Konfiguracja szablonów ocen
**Jako** administrator  
**Chcę** definiować kryteria oceny per pozycja  
**Aby** dostosować do potrzeb akademii

**Acceptance Criteria:**
- [ ] Lista pozycji z przypisanymi kryteriami
- [ ] Dodawanie/usuwanie kryteriów
- [ ] Zmiana nazwy kryterium
- [ ] Zmiana wagi kryterium (opcjonalne, faza 2)

---

## 10. Wymagania niefunkcjonalne

### Wydajność
| Metryka | Wymaganie |
|---------|-----------|
| Czas ładowania strony | < 3s (3G) |
| Czas odpowiedzi API | < 500ms (p95) |
| Rozmiar bundle JS | < 500KB (gzipped) |

### Dostępność
- WCAG 2.1 Level AA (minimum)
- Kontrast kolorów > 4.5:1
- Nawigacja klawiaturą

### Bezpieczeństwo
- HTTPS everywhere
- Szyfrowanie danych w spoczynku (Supabase)
- Rate limiting na API
- Input sanitization

### Kompatybilność
- Chrome 90+, Safari 14+, Firefox 90+, Edge 90+
- iOS 14+, Android 10+
- PWA installable
