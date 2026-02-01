# 08 - Offline Strategy

## 1. Przegląd

ScoutPro jest aplikacją **offline-first** dla scenariuszy, gdzie scouts pracują na stadionach bez zasięgu internetu. Strategia opiera się na:

- **PWA** (Progressive Web App) - instalacja na telefonie
- **Service Worker** - cache zasobów i API
- **IndexedDB** - lokalna baza danych
- **Background Sync** - synchronizacja po powrocie online

---

## 2. Architektura Offline

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLIKACJA (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Zustand    │     │  React      │     │  Offline    │       │
│  │  Store      │◄────│  Query      │◄────│  Hook       │       │
│  └─────────────┘     └──────┬──────┘     └──────┬──────┘       │
│                             │                   │               │
│                             ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                            │   │
│  │  ┌─────────────┐              ┌─────────────┐            │   │
│  │  │  Supabase   │◄── online ──►│  IndexedDB  │            │   │
│  │  │  Client     │              │  (Dexie)    │            │   │
│  │  └─────────────┘              └─────────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE WORKER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Static     │  │  API        │  │  Background │             │
│  │  Cache      │  │  Cache      │  │  Sync       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Worker Configuration

### Workbox Strategies

```typescript
// vite.config.ts
VitePWA({
  workbox: {
    // Cache static assets (JS, CSS, images)
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    
    runtimeCaching: [
      // API calls - Network First with fallback
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24h
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      
      // Images - Cache First
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      
      // Auth endpoints - Network Only (never cache)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
        handler: 'NetworkOnly',
      },
    ],
  },
})
```

---

## 4. IndexedDB Schema

```typescript
// src/features/offline/db/offlineDb.ts
import Dexie, { Table } from 'dexie';

// Types
export interface OfflineObservation {
  localId: string;           // UUID generated locally
  remoteId?: string;         // UUID from server after sync
  data: {
    player_id?: string;
    first_name: string;
    last_name: string;
    birth_year: number;
    club_name?: string;
    position?: string;
    dominant_foot?: string;
    source: string;
    rank?: string;
    notes?: string;
    potential_now?: number;
    potential_future?: number;
    observation_date: string;
  };
  photos: Blob[];            // Local photos (not synced)
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncAttempts: number;
  syncError?: string;
  lastSyncAttempt?: Date;
}

export interface CachedPlayer {
  id: string;
  data: object;
  cachedAt: Date;
}

export interface CachedObservation {
  id: string;
  data: object;
  cachedAt: Date;
}

// Database
export class OfflineDatabase extends Dexie {
  offlineObservations!: Table<OfflineObservation>;
  cachedPlayers!: Table<CachedPlayer>;
  cachedObservations!: Table<CachedObservation>;

  constructor() {
    super('ScoutProOffline');
    
    this.version(1).stores({
      offlineObservations: 'localId, syncStatus, createdAt',
      cachedPlayers: 'id, cachedAt',
      cachedObservations: 'id, cachedAt',
    });
  }
}

export const offlineDb = new OfflineDatabase();
```

---

## 5. Online Status Detection

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check with a real request (navigator.onLine can be unreliable)
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-store',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
```

---

## 6. Offline Observation Flow

### Saving Observation Offline

```typescript
// src/features/observations/hooks/useCreateObservation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb } from '@/features/offline/db/offlineDb';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function useCreateObservation() {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (observationData: ObservationInput) => {
      if (isOnline) {
        // Online: save directly to Supabase
        const { data, error } = await supabase
          .from('observations')
          .insert(observationData)
          .select()
          .single();
        
        if (error) throw error;
        return { source: 'remote', data };
      } else {
        // Offline: save to IndexedDB
        const localId = uuidv4();
        const offlineObs: OfflineObservation = {
          localId,
          data: observationData,
          photos: [],
          createdAt: new Date(),
          syncStatus: 'pending',
          syncAttempts: 0,
        };
        
        await offlineDb.offlineObservations.add(offlineObs);
        return { source: 'local', data: offlineObs };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      
      // Show appropriate toast
      if (result.source === 'local') {
        toast.info('Obserwacja zapisana lokalnie. Zostanie zsynchronizowana po połączeniu.');
      } else {
        toast.success('Obserwacja zapisana!');
      }
    },
  });
}
```

---

## 7. Synchronization Logic

```typescript
// src/features/offline/hooks/useSync.ts
import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb, OfflineObservation } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

export function useSync() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);

  // Count pending items
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await offlineDb.offlineObservations
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .count();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync when online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingObservations();
    }
  }, [isOnline, pendingCount]);

  const syncPendingObservations = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);

    try {
      const pending = await offlineDb.offlineObservations
        .where('syncStatus')
        .anyOf(['pending', 'failed'])
        .filter(obs => obs.syncAttempts < MAX_RETRY_ATTEMPTS)
        .toArray();

      setSyncProgress({ current: 0, total: pending.length });

      for (let i = 0; i < pending.length; i++) {
        const obs = pending[i];
        setSyncProgress({ current: i + 1, total: pending.length });

        try {
          // Update status to syncing
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: 'syncing',
            lastSyncAttempt: new Date(),
          });

          // First, find or create player
          let playerId = obs.data.player_id;
          
          if (!playerId) {
            // Create player if not linked
            const { data: player, error: playerError } = await supabase
              .from('players')
              .insert({
                first_name: obs.data.first_name,
                last_name: obs.data.last_name,
                birth_year: obs.data.birth_year,
                primary_position: obs.data.position,
                dominant_foot: obs.data.dominant_foot,
              })
              .select()
              .single();

            if (playerError) throw playerError;
            playerId = player.id;
          }

          // Create observation
          const { data: observation, error: obsError } = await supabase
            .from('observations')
            .insert({
              player_id: playerId,
              source: obs.data.source,
              rank: obs.data.rank,
              notes: obs.data.notes,
              potential_now: obs.data.potential_now,
              potential_future: obs.data.potential_future,
              observation_date: obs.data.observation_date,
              is_offline_created: true,
            })
            .select()
            .single();

          if (obsError) throw obsError;

          // Mark as synced
          await offlineDb.offlineObservations.update(obs.localId, {
            remoteId: observation.id,
            syncStatus: 'synced',
          });

        } catch (error) {
          console.error('Sync error for observation:', obs.localId, error);
          
          await offlineDb.offlineObservations.update(obs.localId, {
            syncStatus: 'failed',
            syncAttempts: obs.syncAttempts + 1,
            syncError: error.message,
          });

          // Wait before next attempt
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }

    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isSyncing]);

  const retryFailedSync = useCallback(async () => {
    // Reset failed items to pending
    await offlineDb.offlineObservations
      .where('syncStatus')
      .equals('failed')
      .modify({ syncStatus: 'pending', syncAttempts: 0 });
    
    // Trigger sync
    await syncPendingObservations();
  }, [syncPendingObservations]);

  return {
    isSyncing,
    syncProgress,
    pendingCount,
    syncPendingObservations,
    retryFailedSync,
  };
}
```

---

## 8. UI Components

### Offline Indicator

```typescript
// src/components/common/OfflineIndicator.tsx
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSync } from '@/features/offline/hooks/useSync';
import { WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { isSyncing, syncProgress, pendingCount, retryFailedSync } = useSync();

  if (isOnline && pendingCount === 0) {
    return null; // Everything synced, don't show anything
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium
      ${isOnline ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-yellow-900'}
    `}>
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Tryb offline</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                Synchronizacja... {syncProgress.current}/{syncProgress.total}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>{pendingCount} oczekujących na synchronizację</span>
            </>
          )}
        </div>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={retryFailedSync}
            className="text-xs underline hover:no-underline"
          >
            Synchronizuj teraz
          </button>
        )}
      </div>
    </div>
  );
}
```

### Sync Status Component

```typescript
// src/features/offline/components/SyncStatus.tsx
import { useSync } from '../hooks/useSync';
import { offlineDb } from '../db/offlineDb';
import { useLiveQuery } from 'dexie-react-hooks';

export function SyncStatus() {
  const { pendingCount } = useSync();
  
  const pendingItems = useLiveQuery(
    () => offlineDb.offlineObservations
      .where('syncStatus')
      .anyOf(['pending', 'failed'])
      .toArray()
  );

  if (!pendingItems?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
        <p>Wszystkie dane zsynchronizowane</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        Oczekujące na synchronizację ({pendingCount})
      </h3>
      
      <ul className="space-y-2">
        {pendingItems.map((item) => (
          <li
            key={item.localId}
            className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
          >
            <div>
              <p className="font-medium">
                {item.data.last_name} {item.data.first_name}
              </p>
              <p className="text-sm text-gray-500">
                {item.data.birth_year} • {item.data.observation_date}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {item.syncStatus === 'failed' && (
                <span className="text-xs text-red-500">
                  Błąd ({item.syncAttempts}/3)
                </span>
              )}
              <StatusBadge status={item.syncStatus} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9. Data Caching Strategy

### Cache Recent Data on Login

```typescript
// src/features/offline/hooks/useCacheData.ts
import { useEffect } from 'react';
import { offlineDb } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

export function useCacheData() {
  useEffect(() => {
    cacheRecentData();
  }, []);

  async function cacheRecentData() {
    try {
      // Cache last 50 players
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (players) {
        const now = new Date();
        await offlineDb.cachedPlayers.bulkPut(
          players.map(p => ({ id: p.id, data: p, cachedAt: now }))
        );
      }

      // Cache last 100 observations
      const { data: observations } = await supabase
        .from('observations')
        .select('*, player:players(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (observations) {
        const now = new Date();
        await offlineDb.cachedObservations.bulkPut(
          observations.map(o => ({ id: o.id, data: o, cachedAt: now }))
        );
      }

      console.log('Data cached for offline use');
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  return { cacheRecentData };
}
```

---

## 10. Conflict Resolution

Dla MVP używamy strategii **Last Write Wins** (LWW), ponieważ:
- Ryzyko konfliktów jest niskie (5 użytkowników)
- Jeden scout rzadko edytuje obserwację innego
- Prostota implementacji

### Przyszłe rozszerzenia (Faza 2):
- Merge strategy dla tekstów
- Manual conflict resolution UI
- Optimistic locking z wersjonowaniem

---

## 11. Limity i ograniczenia

| Limit | Wartość | Uzasadnienie |
|-------|---------|--------------|
| Max offline observations | 100 | Storage limit |
| Max cached players | 50 | Memory |
| Max cached observations | 100 | Memory |
| Photo storage offline | Nie | Storage, complexity |
| Offline edycja istniejących | Nie (MVP) | Conflict avoidance |
| Max sync retry | 3 | Prevent infinite loops |

---

## 12. Testowanie Offline

### Manual Testing Checklist:
- [ ] Zainstaluj PWA na telefonie
- [ ] Włącz tryb samolotowy
- [ ] Dodaj obserwację
- [ ] Sprawdź zapis w IndexedDB (DevTools)
- [ ] Wyłącz tryb samolotowy
- [ ] Zweryfikuj automatyczną synchronizację
- [ ] Sprawdź dane w Supabase

### Chrome DevTools:
1. Application → Service Workers → Offline
2. Application → IndexedDB → ScoutProOffline
3. Network → Throttling → Offline
