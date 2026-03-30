# PROD: wyłączenie potwierdzenia e-mail (bez linku weryfikacyjnego)

Aplikacja zakłada, że **nie ma potrzeby potwierdzania konta linkiem weryfikacyjnym**:
- Administrator tworzy użytkowników (Edge Function `admin-create-user`) z `email_confirm: true` – konto jest od razu aktywne.
- Użytkownik loguje się emailem i hasłem bez konieczności klikania w link z maila.

Aby to działało na **projekcie Supabase PROD**, w ustawieniach Auth trzeba **wyłączyć** wymaganie potwierdzenia e-mail.

## Kroki w Supabase Dashboard (PROD)

1. Otwórz projekt PROD: [Supabase Dashboard](https://supabase.com/dashboard/project/digrvtbfonatvytwpbbn).
2. W menu bocznym: **Authentication** → **Providers**.
3. Wybierz **Email**.
4. Znajdź opcję **"Confirm email"** (lub **"Enable email confirmations"**) i **wyłącz** ją (toggle OFF).
5. Zapisz zmiany.

Po wyłączeniu:
- Nowi użytkownicy utworzeni przez admina (z `email_confirm: true`) mogą od razu się logować.
- Nie jest wysyłany mail z linkiem weryfikacyjnym; logowanie działa od razu po ustawieniu hasła.

**Uwaga:** Wyłączenie potwierdzenia e-mail zmniejsza weryfikację adresu. Nadaje się do aplikacji wewnętrznych / zaufanych użytkowników. Dla publicznych rejestracji często zostawia się włączone potwierdzenie.
