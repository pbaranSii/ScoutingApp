# Offline strategy

## Cel
ScoutPro dziala w trybie offline-first, poniewaz praca scoutow czesto odbywa sie bez
stabilnego internetu. Aplikacja musi pozwalac na dodawanie obserwacji offline
i synchronizacje po powrocie online.

## Architektura offline (skrot)
- PWA instalowalne na urzadzeniu.
- Service Worker: cache zasobow i wybranych zapytan.
- IndexedDB (Dexie): lokalna baza danych.
- Background sync: automatyczna synchronizacja.

## Strategie cache (Workbox)
- Static assets: Cache First.
- REST API (Supabase): Network First z fallback do cache.
- Storage (images): Cache First.
- Auth: Network Only.

## IndexedDB (przyklad danych)
Przechowywane sa:
- offlineObservations (payloady obserwacji),
- cachedPlayers,
- cachedObservations.

## Online status
- Monitorowanie `navigator.onLine`.
- Dodatkowo ping/HEAD do endpointu zdrowia aplikacji.

## Sync
- Kolejka operacji offline.
- Retry z oznaczeniem statusu (pending/syncing/synced/failed).
- Konflikty: LWW (last write wins) w MVP.
