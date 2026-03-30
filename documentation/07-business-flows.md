# Przepływy biznesowe

Krótkie opisy przepływów: kroki użytkownika oraz powiązane strony i API.

## 1. Tworzenie i edycja obserwacji

1. Użytkownik wybiera **Nowa obserwacja** (lub edycja istniejącej).
2. **Wizard / formularz:** wybór lub utworzenie zawodnika, mecz (opcjonalnie), data, źródło, pozycja, ocena ogólna, oceny kryteriów, mocne/słabe strony, notatki.
3. Zapis: **POST** lub **PATCH** `/rest/v1/observations`; oceny kryterialne: **POST** `/rest/v1/player_evaluations`.
4. Po zapisie: przekierowanie do szczegółów obserwacji lub listy. W trybie offline: operacja trafia do kolejki i synchronizacja później.

## 2. Zapotrzebowanie na zawodnika

1. **Utworzenie zapotrzebowania:** strona /demands/new – formularz (pozycja, sezon, priorytet, preferowana noga itd.). **POST** `/rest/v1/player_demands`.
2. **Lista zapotrzebowań:** /demands – filtrowanie po sezonie, pozycji, statusie. Odczyt z tabel `player_demands`, `player_demand_candidates`.
3. **Sugestie kandydatów:** na stronie szczegółów zapotrzebowania – system proponuje zawodników (np. na podstawie pozycji/obserwacji). Odczyt przez zapytania do `player_demands` i `player_demand_candidates` oraz listy zawodników.
4. **Przypisanie kandydata:** dodanie zawodnika do zapotrzebowania – **POST** `player_demand_candidates`; ewentualna zmiana statusu zapotrzebowania na „in_progress” – **PATCH** `player_demands`.
5. **Usunięcie kandydata:** **DELETE** `player_demand_candidates`.

## 3. Ankieta satysfakcji

1. Użytkownik wchodzi na **/survey/satisfaction**.
2. Aplikacja wywołuje **RPC survey_can_submit** – sprawdzenie, czy można wysłać ankietę (np. limit czasowy). Wyświetlenie formularza lub komunikatu „już wypełniono / możesz wypełnić za X dni”.
3. Wypełnienie pól: CSAT, CES, NPS, najlepsza funkcja, opcjonalnie komentarz.
4. **RPC survey_submit** z parametrami (p_csat_rating, p_ces_rating, p_nps_score, p_best_feature, p_feedback_text).
5. Przekierowanie na **/survey/thank-you**. Admin wyniki: **/settings/admin/user-satisfaction** – RPC `admin_survey_results`, `admin_survey_responses`.

## 4. Start i zakończenie sesji użytkownika

1. **Start sesji:** przy logowaniu lub wejściu do aplikacji wywołanie **RPC user_session_start** (p_device_type, p_browser, p_user_agent). Zwracany `session_id` zapisywany w sessionStorage.
2. **Koniec sesji:** przy wylogowaniu lub zamknięciu karty wywołanie **RPC user_session_end** (p_session_id). SessionStorage czyszczony.

Sesje wykorzystywane w module statystyk admina (czas w aplikacji, liczba sesji, historia logowań).

## 5. Rozliczenia miesięczne (admin)

1. Admin wchodzi w **Statystyki użytkowników** (/settings/admin/usage-statistics).
2. Wybór zakresu dat (np. rok) i przejście do widoku „Rozliczenia” (monthly breakdown).
3. Aplikacja wywołuje **RPC admin_usage_monthly_breakdown** (p_date_from, p_date_to).
4. Wyświetlenie tabeli/ wykresu: podział miesięczny (np. liczba obserwacji, zawodników per użytkownik lub per miesiąc – zgodnie z implementacją RPC).

## 6. Rejestracja i logowanie

1. **Zaproszenie:** admin wysyła zaproszenie – Edge Function **send-invitation**; użytkownik otrzymuje link.
2. **Akceptacja:** wejście w link → **/accept-invite** → Edge Function **accept-invitation**; ustawienie hasła.
3. **Logowanie:** POST `/auth/v1/token?grant_type=password`; po sukcesie ewentualnie **user_session_start** i przekierowanie na dashboard.
