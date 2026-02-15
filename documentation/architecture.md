# Architektura techniczna

## Przeglad
Architektura opiera sie o PWA (React) i backend Supabase. Hosting frontendu jest na Vercel.

```
Client (PWA React) -> Supabase (Postgres + Auth + Storage + Realtime) -> Hosting (Vercel)
```

## Stos technologiczny
### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router, React Query, React Hook Form, Zod
- Zustand (state), Dexie (IndexedDB)
- Workbox (Service Worker)

### Backend
- Supabase: PostgreSQL, Auth (GoTrue), PostgREST, Storage, Realtime
- Edge Functions dla logiki niestandardowej

### Hosting i CI
- Vercel (deploy frontend)
- GitHub (repo i workflowy)

## Struktura projektu (skrot)
```
scoutpro/
  src/
    components/
    features/
    hooks/
    lib/
    pages/
    stores/
    types/
  public/
  supabase/
    migrations/
```

## Modulowy podzial funkcji
- auth: logowanie, zaproszenia, reset hasla
- observations: wizard, lista, edycja
- players: profile, edycja
- pipeline: statusy, historia
- dashboard: KPI i widoki podsumowan
- settings: slowniki i uzytkownicy
- offline: kolejka i sync

## Bezpieczenstwo
- RLS na tabelach publicznych.
- Polityki admina oparte o `public.is_admin()`.
- Operacje slownikowe ograniczone do admina.

## Integracje i dane
API generowane automatycznie przez Supabase PostgREST (REST).
Kluczowe obszary danych opisane w `data-model.md`.
