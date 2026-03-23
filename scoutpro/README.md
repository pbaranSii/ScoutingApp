# ScoutPro

ScoutPro to system scoutingowy dla akademii pilkarskich (PWA).

## Dokumentacja
Aktualna dokumentacja znajduje sie w katalogu:
- `documentation/README.md`

## Szybki start (dev)
```
npm install
npm run dev
```

## Zmienne srodowiskowe
Wymagane:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

## Cache invalidation po deployu
- Aplikacja korzysta z Vite + PWA (Workbox), wiec nowe buildy maja hashowane pliki JS/CSS.
- Dla hostingu trzeba ustawic brak cache dla dokumentu i service workera:
  - `index.html` oraz `/` -> `Cache-Control: no-store, no-cache, must-revalidate`
  - `/sw.js` (i opcjonalnie `/dev-sw.js`) -> `Cache-Control: no-store, no-cache, must-revalidate`
- Na Azure Static Web Apps jest to realizowane w `public/staticwebapp.config.json`.
- Dla innych hostow (np. Vercel/Netlify) ustaw te same naglowki w ich konfiguracji (`vercel.json`, `netlify.toml` lub `_headers`).
