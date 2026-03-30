# Architecture Decision Records (ADR)

## Czym jest ADR

Architecture Decision Record to krótki dokument opisujący podjętą decyzję architektoniczną wraz z kontekstem i konsekwencjami. Służy do utrwalenia przyczyn wyboru danej opcji oraz ułatwia nowym członkom zespołu zrozumienie historii decyzji.

## Kiedy pisać ADR

- Wybór technologii, frameworka lub biblioteki (np. Supabase zamiast własnego backendu).
- Zmiana wzorca architektonicznego (np. wprowadzenie RPC zamiast tylko REST).
- Decyzje wpływające na bezpieczeństwo, wydajność lub utrzymywalność (np. RLS, polityki dostępu).
- Decyzje dotyczące struktury kodu lub organizacji modułów.

## Format ADR

Każdy ADR powinien zawierać:

1. **Tytuł** – krótka nazwa decyzji.
2. **Status** – np. Proposed, Accepted, Deprecated, Superseded.
3. **Kontekst** – problem lub sytuacja wymagająca decyzji.
4. **Decyzja** – co zostało postanowione.
5. **Konsekwencje** – skutki pozytywne i negatywne.

Szablon: [0001-template.md](0001-template.md).

## Numeracja

- ADR numerujemy kolejno: `0001`, `0002`, …
- W nazwie pliku: `NNNN-krotki-tytul.md` (np. `0002-use-supabase-rpc-for-admin-stats.md`).

## Indeks ADR

| Nr   | Tytuł        | Status   | Data       |
|------|--------------|----------|------------|
| 0001 | Szablon ADR  | Template | (wzór)    |

Nowe ADR dopisuj do tabeli powyżej po zaakceptowaniu.
