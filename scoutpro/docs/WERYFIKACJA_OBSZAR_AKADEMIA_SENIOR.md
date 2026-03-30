# Weryfikacja funkcjonalności podziału danych (Obszar: Akademia / Senior)

Instrukcja sprawdzenia poprawności działania podziału dostępu do danych według obszaru (Akademia vs Senior).

---

## 1. Wymagania wstępne

- Migracja `20260319000003_area_access_academy_senior.sql` wykonana na bazie.
- W tabeli `public.categories` kolumna `area` uzupełniona (AKADEMIA / SENIOR).
- W tabeli `public.users` kolumna `area_access` istnieje i jest uzupełniona.
- W tabeli `public.players` kolumna `age_category_id` może być ustawiona (opcjonalnie, backfill z migracji).

---

## 2. Zapis pola „Obszar dostępu” przy edycji użytkownika

**Cel:** Upewnić się, że zmiana „Obszar dostępu” w formularzu edycji użytkownika jest zapisywana.

### Kroki

1. Zaloguj się jako **administrator**.
2. Przejdź do **Ustawienia** → **Zarządzanie użytkownikami**.
3. Kliknij **Edytuj** przy wybranym użytkowniku (np. skaut lub menedżer).
4. W polu **Obszar dostępu** zmień wartość (np. z „Akademia” na „Senior” lub „Wszystkie obszary”).
5. Kliknij **Zapisz zmiany**.
6. Sprawdź:
   - Pojawia się toast **„Zaktualizowano użytkownika”**.
   - Lista użytkowników odświeża się; w wierszu tego użytkownika w kolumnie z obszarem (jeśli jest wyświetlana) widać nową wartość.
7. Otwórz ponownie **Edytuj** tego samego użytkownika i sprawdź, czy pole **Obszar dostępu** pokazuje **zapisaną** wartość (np. „Senior”), a nie poprzednią.

**Opcjonalnie (baza):** W Supabase → Table Editor → `public.users` znajdź wiersz użytkownika i sprawdź, czy kolumna `area_access` ma wartość zgodną z wyborem (AKADEMIA / SENIOR / ALL).

---

## 3. Widoczność kategorii wiekowych według obszaru

**Cel:** Użytkownik z obszarem „Akademia” widzi tylko kategorie Akademii, z „Senior” tylko Senior, z „Wszystkie” — wszystkie.

### Kroki

1. W **Słownikach** upewnij się, że kategorie wiekowe mają ustawione **Obszar** (Akademia / Senior), np.:
   - „U15”, „U17” → Akademia  
   - „Senior” → Senior  
2. Zaloguj się jako użytkownik z **Obszar dostępu: Akademia**.
3. Otwórz formularz **nowej obserwacji** (indywidualnej lub meczowej) i w polu **Rozgrywki / Kategoria** sprawdź listę kategorii — powinny być **tylko kategorie z obszaru Akademia**.
4. Wyloguj się i zaloguj jako użytkownik z **Obszar dostępu: Senior** (lub zmień obszar w edycji użytkownika i zaloguj się tym użytkownikiem).
5. W tym samym miejscu (Rozgrywki / Kategoria) sprawdź listę — powinny być **tylko kategorie z obszaru Senior**.
6. Zaloguj się jako administrator (z **Wszystkie obszary**) i sprawdź, czy w tym samym polu widać **wszystkie** kategorie (Akademia + Senior).

---

## 4. Widoczność zawodników według obszaru (RLS)

**Cel:** RLS ogranicza listę zawodników do tych z kategorii w obszarze użytkownika.

### Kroki

1. Przygotuj dane:
   - Kilku zawodników z **Kategoria wiekowa** ustawioną na kategorię **Akademia** (np. U17).
   - Kilku zawodników z kategorią **Senior**.
2. Zaloguj się jako użytkownik z **Obszar dostępu: Akademia**.
3. Wejdź na **Zawodnicy** i sprawdź listę — powinni być widoczni **tylko zawodnicy z kategorii w obszarze Akademia** (oraz ewentualnie bez kategorii, jeśli polityki tak dopuszczają).
4. Zaloguj się jako użytkownik z **Obszar dostępu: Senior**.
5. Na **Zawodnicy** sprawdź listę — powinni być widoczni **tylko zawodnicy z kategorii w obszarze Senior**.
6. Jako administrator (Wszystkie obszary) sprawdź, czy lista zawiera **wszystkich** zawodników.

---

## 5. Widoczność obserwacji według obszaru (RLS)

**Cel:** Obserwacje są filtrowane po obszarze kategorii wiekowej zawodnika.

### Kroki

1. Zaloguj się jako użytkownik **Akademia**.
2. Wejdź na **Obserwacje** i zapamiętaj liczbę / zestaw obserwacji.
3. Zaloguj się jako użytkownik **Senior**.
4. Na **Obserwacje** lista powinna być **inna** — tylko obserwacje zawodników z kategorii Senior (lub pusta, jeśli takich nie ma).
5. Jako administrator upewnij się, że widać **wszystkie** obserwacje.

---

## 6. Kategoria wiekowa w formularzu zawodnika

**Cel:** W formularzu zawodnika można ustawić **Kategoria wiekowa**, a lista kategorii jest filtrowana według obszaru użytkownika.

### Kroki

1. Zaloguj się jako użytkownik z obszarem **Akademia**.
2. Otwórz **Zawodnicy** → **Dodaj zawodnika** lub edycja istniejącego.
3. Sprawdź pole **Kategoria wiekowa** — lista powinna zawierać **tylko kategorie z obszaru Akademia**.
4. Wybierz kategorię, zapisz i sprawdź, czy po odświeżeniu wartość się pokazuje.
5. Jako użytkownik **Senior** (lub admin) sprawdź ten sam formularz — lista kategorii powinna być odpowiednio ograniczona (Senior) lub pełna (admin).

---

## 7. Szybki checklist

| # | Scenariusz | Oczekiwany wynik |
|---|------------|------------------|
| 1 | Edycja użytkownika: zmiana „Obszar dostępu” | Wartość zapisuje się i po ponownym otwarciu formularza jest poprawna. |
| 2 | Użytkownik Akademia: kategorie w formularzu obserwacji | Tylko kategorie z obszaru Akademia. |
| 3 | Użytkownik Senior: kategorie w formularzu obserwacji | Tylko kategorie z obszaru Senior. |
| 4 | Admin: kategorie w formularzu | Wszystkie kategorie. |
| 5 | Użytkownik Akademia: lista zawodników | Tylko zawodnicy z kategorii Akademia (lub bez kategorii, jeśli RLS tak pozwala). |
| 6 | Użytkownik Senior: lista zawodników | Tylko zawodnicy z kategorii Senior. |
| 7 | Użytkownik Akademia: lista obserwacji | Tylko obserwacje powiązane z obszarem Akademia. |
| 8 | Użytkownik Senior: lista obserwacji | Tylko obserwacje powiązane z obszarem Senior. |

---

## 8. Gdy coś nie działa

- **Obszar dostępu się nie zapisuje:** Sprawdź, czy Edge Function `admin-update-user` jest zdeployowana i czy w logach funkcji nie ma błędu. Upewnij się, że w `public.users` kolumna `area_access` istnieje i ma typ enum `area_access_type`.
- **Brak podziału kategorii:** Sprawdź, czy w `public.categories` kolumna `area` jest uzupełniona i czy w UI słownika „Obszar” jest zapisywany.
- **Widać wszystkich zawodników / wszystkie obserwacje:** Sprawdź, czy migracja z politykami RLS na `players` i `observations` została zastosowana oraz czy funkcja `current_area_access()` zwraca oczekiwaną wartość dla danego użytkownika (np. w SQL: `SELECT public.current_area_access();` po ustawieniu odpowiedniego `auth.uid()` w sesji).
