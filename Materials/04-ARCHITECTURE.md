# 04 - Architektura Techniczna

## 1. Przegląd Architektury

```
┌─────────────────────────────────────────────────────────────────────┐
│                           KLIENT (PWA)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   React 18  │  │  Zustand    │  │  IndexedDB  │  │  Service   │  │
│  │ + TypeScript│  │   State     │  │  (Dexie.js) │  │   Worker   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                 │
│                          Supabase Client SDK                        │
└─────────────────────────────────────┬───────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │  │  Realtime  │  │
│  │   + RLS     │  │  (GoTrue)   │  │   (S3)      │  │ (Websocket)│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  Edge       │  │  Database   │                                   │
│  │  Functions  │  │  Webhooks   │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HOSTING (Vercel)                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Static Files (React build) + Edge Network (CDN)            │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stos Technologiczny

### Frontend

| Technologia | Wersja | Uzasadnienie |
|-------------|--------|--------------|
| **React** | 18.x | Standardowa biblioteka UI, duży ekosystem |
| **TypeScript** | 5.x | Typowanie statyczne, mniej błędów |
| **Vite** | 5.x | Szybki bundler, HMR, optymalizacje |
| **Tailwind CSS** | 3.x | Utility-first CSS, szybkie prototypowanie |
| **shadcn/ui** | latest | Komponenty Radix UI + Tailwind |
| **React Router** | 6.x | Routing SPA |
| **Zustand** | 4.x | Lekki state management |
| **React Query** | 5.x | Server state, cache, synchronizacja |
| **React Hook Form** | 7.x | Formularze z walidacją |
| **Zod** | 3.x | Schema validation |
| **Dexie.js** | 4.x | IndexedDB wrapper dla offline |
| **Workbox** | 7.x | Service Worker tooling |

### Backend (Supabase)

| Komponent | Opis |
|-----------|------|
| **PostgreSQL 15** | Baza danych z RLS |
| **GoTrue** | Autentykacja (email/password) |
| **PostgREST** | Auto-generated REST API |
| **Realtime** | Websocket subscriptions |
| **Storage** | S3-compatible file storage |
| **Edge Functions** | Serverless Deno functions |

### Hosting & DevOps

| Narzędzie | Opis |
|-----------|------|
| **Vercel** | Frontend hosting, CI/CD |
| **Supabase Cloud** | Backend managed service |
| **GitHub** | Repo, CI/CD triggers |
| **GitHub Actions** | Migrations, deploys |

---

## 3. Struktura Projektu

```
scoutpro/
├── .github/
│   └── workflows/
│       ├── deploy.yml           # Vercel deploy
│       └── migrations.yml       # Supabase migrations
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker (generated)
│   └── icons/                   # PWA icons
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Layout.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── OfflineIndicator.tsx
│   │       └── DataTable.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── ResetPasswordForm.tsx
│   │   │   │   └── InviteForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts
│   │   │   └── types.ts
│   │   ├── players/
│   │   │   ├── components/
│   │   │   │   ├── PlayerCard.tsx
│   │   │   │   ├── PlayerProfile.tsx
│   │   │   │   ├── PlayerForm.tsx
│   │   │   │   └── PlayerList.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePlayer.ts
│   │   │   │   └── usePlayers.ts
│   │   │   ├── api/
│   │   │   │   └── players.api.ts
│   │   │   └── types.ts
│   │   ├── observations/
│   │   │   ├── components/
│   │   │   │   ├── ObservationWizard.tsx
│   │   │   │   ├── ObservationCard.tsx
│   │   │   │   ├── ObservationList.tsx
│   │   │   │   └── EvaluationForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useObservation.ts
│   │   │   │   └── useObservations.ts
│   │   │   ├── api/
│   │   │   │   └── observations.api.ts
│   │   │   └── types.ts
│   │   ├── pipeline/
│   │   │   ├── components/
│   │   │   │   ├── PipelineBoard.tsx
│   │   │   │   ├── PipelineColumn.tsx
│   │   │   │   └── PlayerPipelineCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePipeline.ts
│   │   │   └── types.ts
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatsWidget.tsx
│   │   │   │   ├── RecentObservations.tsx
│   │   │   │   └── PipelineChart.tsx
│   │   │   └── hooks/
│   │   │       └── useStats.ts
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   │   ├── RegionsSettings.tsx
│   │   │   │   ├── LeaguesSettings.tsx
│   │   │   │   ├── ClubsSettings.tsx
│   │   │   │   └── UsersSettings.tsx
│   │   │   └── hooks/
│   │   │       └── useSettings.ts
│   │   └── offline/
│   │       ├── components/
│   │       │   ├── SyncStatus.tsx
│   │       │   └── OfflineQueue.tsx
│   │       ├── hooks/
│   │       │   ├── useOffline.ts
│   │       │   └── useSync.ts
│   │       └── db/
│   │           └── offlineDb.ts
│   ├── hooks/
│   │   ├── useOnlineStatus.ts
│   │   └── useNotifications.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── utils.ts             # Utility functions
│   │   └── constants.ts         # App constants
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── offlineStore.ts
│   ├── types/
│   │   ├── database.types.ts    # Generated from Supabase
│   │   └── index.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PlayersPage.tsx
│   │   ├── PlayerDetailPage.tsx
│   │   ├── ObservationsPage.tsx
│   │   ├── NewObservationPage.tsx
│   │   ├── PipelinePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_seed_data.sql
│   │   └── 004_import_excel.sql
│   ├── functions/
│   │   └── send-invitation/
│   │       └── index.ts
│   └── config.toml
├── tests/
│   ├── e2e/
│   └── unit/
├── .env.example
├── .env.local                   # (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## 4. PWA Configuration

### manifest.json
```json
{
  "name": "ScoutPro - System Scoutingowy",
  "short_name": "ScoutPro",
  "description": "Mobilny system scoutingowy dla akademii piłkarskich",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1d4ed8",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### vite.config.ts (PWA Plugin)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: false, // Use public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
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
        ],
      },
    }),
  ],
});
```

---

## 5. Konfiguracja Supabase

### .env.local
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

### src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

---

## 6. Offline Architecture

### IndexedDB Schema (Dexie.js)

```typescript
// src/features/offline/db/offlineDb.ts
import Dexie, { Table } from 'dexie';

export interface OfflineObservation {
  id: string;
  localId: string;
  data: object;
  createdAt: Date;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
}

export interface CachedPlayer {
  id: string;
  data: object;
  cachedAt: Date;
}

export class OfflineDatabase extends Dexie {
  observations!: Table<OfflineObservation>;
  players!: Table<CachedPlayer>;

  constructor() {
    super('ScoutProOffline');
    this.version(1).stores({
      observations: 'localId, syncStatus, createdAt',
      players: 'id, cachedAt',
    });
  }
}

export const offlineDb = new OfflineDatabase();
```

### Sync Strategy

```typescript
// src/features/offline/hooks/useSync.ts
import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineDb } from '../db/offlineDb';
import { supabase } from '@/lib/supabase';

export function useSync() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      syncPendingObservations();
    }
  }, [isOnline]);

  async function syncPendingObservations() {
    const pending = await offlineDb.observations
      .where('syncStatus')
      .equals('pending')
      .toArray();

    for (const obs of pending) {
      try {
        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'syncing',
        });

        const { error } = await supabase
          .from('observations')
          .insert(obs.data);

        if (error) throw error;

        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'synced',
        });
      } catch (error) {
        await offlineDb.observations.update(obs.localId, {
          syncStatus: 'failed',
          syncError: error.message,
        });
      }
    }
  }

  return { syncPendingObservations };
}
```

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLOW: Zaproszenie                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Admin → [Wprowadza email] → API: /invite                    │
│                                                                 │
│  2. Supabase Edge Function:                                     │
│     - Tworzy rekord w invitations                               │
│     - Generuje token (UUID)                                     │
│     - Wysyła email przez Resend/SendGrid                        │
│                                                                 │
│  3. Użytkownik → [Klika link w emailu]                          │
│     → /accept-invite?token=xxx                                  │
│                                                                 │
│  4. Frontend:                                                   │
│     - Waliduje token (nie wygasł, nie użyty)                    │
│     - Wyświetla formularz hasła                                 │
│                                                                 │
│  5. Użytkownik → [Ustawia hasło] → API: /auth/signup            │
│     - Supabase Auth tworzy konto                                │
│     - Aktualizuje invitations.used_at                           │
│     - Tworzy rekord w users                                     │
│                                                                 │
│  6. Redirect → /dashboard                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. API Patterns

### React Query + Supabase

```typescript
// src/features/players/hooks/usePlayers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Player } from '../types';

export function usePlayers(filters?: { birthYear?: number; status?: string }) {
  return useQuery({
    queryKey: ['players', filters],
    queryFn: async () => {
      let query = supabase
        .from('players')
        .select(`
          *,
          club:clubs(name),
          region:regions(name),
          observations(count)
        `)
        .order('created_at', { ascending: false });

      if (filters?.birthYear) {
        query = query.eq('birth_year', filters.birthYear);
      }
      if (filters?.status) {
        query = query.eq('pipeline_status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Player[];
    },
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (player: Partial<Player>) => {
      const { data, error } = await supabase
        .from('players')
        .insert(player)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
}
```

---

## 9. Deployment Pipeline

### GitHub Actions: Deploy to Vercel

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: ${{ github.ref == 'refs/heads/main' }}
```

### GitHub Actions: Supabase Migrations

```yaml
# .github/workflows/migrations.yml
name: Supabase Migrations

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Push migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

---

## 10. Środowiska

| Środowisko | URL | Baza danych | Deploy |
|------------|-----|-------------|--------|
| Development | localhost:5173 | Supabase local | Manual |
| Staging | staging.scoutpro.app | Supabase staging project | PR merge |
| Production | app.scoutpro.app | Supabase prod project | Main branch |

---

## 11. Monitoring & Logging

### Supabase Dashboard
- Database metrics
- Auth logs
- Storage usage
- Realtime connections

### Vercel Analytics
- Web Vitals
- Page views
- Error rates

### Sentry (opcjonalnie - Faza 2)
- Error tracking
- Performance monitoring
- Session replay
