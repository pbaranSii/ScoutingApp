# 09 - Deployment Guide

## 1. Przegląd Środowisk

| Środowisko | URL | Branch | Auto-deploy |
|------------|-----|--------|-------------|
| Development | localhost:5173 | - | Manual |
| Staging | staging.scoutpro.app | develop | ✅ |
| Production | app.scoutpro.app | main | ✅ |

---

## 2. Supabase Setup

### 2.1 Utworzenie projektu

1. Zaloguj się na [supabase.com](https://supabase.com)
2. Kliknij "New Project"
3. Wypełnij:
   - **Name:** scoutpro-prod (lub scoutpro-staging)
   - **Database Password:** (zapisz bezpiecznie!)
   - **Region:** Frankfurt (eu-central-1)
4. Poczekaj na provisioning (~2 min)

### 2.2 Konfiguracja Auth

1. Dashboard → Authentication → Providers
2. Włącz **Email** provider
3. Settings → Email Templates:
   - Confirm signup
   - Reset password
   - Magic link (opcjonalnie)
4. Settings → URL Configuration:
   ```
   Site URL: https://app.scoutpro.app
   Redirect URLs:
   - https://app.scoutpro.app/*
   - https://staging.scoutpro.app/*
   - http://localhost:5173/*
   ```

### 2.3 Konfiguracja Storage

1. Dashboard → Storage
2. Create bucket: `player-photos`
3. Policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'player-photos');
   
   -- Allow public read
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'player-photos');
   ```

### 2.4 Uruchomienie migracji

```bash
# Instalacja Supabase CLI
npm install -g supabase

# Login
supabase login

# Link projektu
supabase link --project-ref YOUR_PROJECT_REF

# Uruchom migracje
supabase db push

# Wgraj seed data
supabase db seed
```

### 2.5 Pobranie kluczy API

Dashboard → Settings → API:
- **Project URL:** `https://xxxxx.supabase.co`
- **anon (public) key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
- **service_role key:** (tylko backend, nigdy w frontend!)

---

## 3. Vercel Setup

### 3.1 Import projektu

1. Zaloguj się na [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Import z GitHub
4. Wybierz repo `scoutpro`

### 3.2 Konfiguracja build

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3.3 Environment Variables

Dodaj w Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| VITE_SUPABASE_URL | https://xxx.supabase.co | All |
| VITE_SUPABASE_ANON_KEY | eyJhbG... | All |
| VITE_APP_URL | https://app.scoutpro.app | Production |
| VITE_APP_URL | https://staging.scoutpro.app | Preview |

### 3.4 Domains

1. Settings → Domains
2. Dodaj custom domain: `app.scoutpro.app`
3. Skonfiguruj DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### 3.5 Preview Deployments

Automatycznie dla każdego PR:
- URL: `scoutpro-xxx-team.vercel.app`
- Używa tych samych env vars (chyba że override)

---

## 4. GitHub Actions

### 4.1 Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

jobs:
  lint-and-test:
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
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Unit tests
        run: npm run test:unit

  build:
    needs: lint-and-test
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
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel (Staging)
        uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Vercel (Production)
        uses: vercel/actions@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

### 4.2 Database Migrations

```yaml
# .github/workflows/migrations.yml
name: Database Migrations

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
        with:
          version: latest
      
      - name: Run migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 5. GitHub Secrets

Dodaj w repo Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| VERCEL_TOKEN | Vercel API token |
| VERCEL_ORG_ID | Vercel organization ID |
| VERCEL_PROJECT_ID | Vercel project ID |
| SUPABASE_ACCESS_TOKEN | Supabase CLI access token |
| SUPABASE_PROJECT_ID | Supabase project ref |

---

## 6. Local Development

### 6.1 Setup

```bash
# Klonuj repo
git clone git@github.com:your-org/scoutpro.git
cd scoutpro

# Zainstaluj zależności
npm install

# Skopiuj env
cp .env.example .env.local

# Uzupełnij zmienne w .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# Uruchom
npm run dev
```

### 6.2 Local Supabase (opcjonalnie)

```bash
# Start local Supabase
supabase start

# Użyj lokalnych credentials
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>

# Stop
supabase stop
```

---

## 7. Monitoring & Debugging

### 7.1 Vercel Analytics

1. Dashboard → Analytics
2. Web Vitals: LCP, FID, CLS
3. Page views, unique visitors

### 7.2 Supabase Logs

1. Dashboard → Logs
2. Filtruj po:
   - API requests
   - Auth events
   - Database queries
   - Edge functions

### 7.3 Error Tracking (Faza 2)

```typescript
// Sentry setup (opcjonalnie)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
});
```

---

## 8. Backup Strategy

### 8.1 Supabase Backups

- **Automatic:** Daily backups (7 days retention on Pro)
- **Point-in-time recovery:** Pro plan
- **Manual:** Dashboard → Database → Backups

### 8.2 Export Data

```bash
# Export via CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

---

## 9. Rollback Procedures

### 9.1 Frontend Rollback

```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Or via Dashboard:
# Deployments → Find previous → "..." → Promote to Production
```

### 9.2 Database Rollback

```bash
# Restore from backup
supabase db reset

# Or revert specific migration
supabase migration revert
```

---

## 10. Performance Checklist

### Pre-deployment:
- [ ] `npm run build` bez błędów
- [ ] Bundle size < 500KB (gzipped)
- [ ] Lighthouse score > 80
- [ ] Wszystkie testy przechodzą

### Post-deployment:
- [ ] Strona ładuje się < 3s
- [ ] Login działa
- [ ] API calls zwracają dane
- [ ] PWA instaluje się
- [ ] Offline mode działa

---

## 11. Troubleshooting

### Build fails
```
Error: Cannot find module 'xyz'
→ npm ci (nie npm install)
→ Sprawdź node_modules w .gitignore
```

### Supabase connection error
```
Error: Invalid API key
→ Sprawdź VITE_SUPABASE_ANON_KEY
→ Sprawdź czy project URL jest poprawny
```

### CORS error
```
Error: CORS policy
→ Supabase Dashboard → Settings → API → Additional Config
→ Dodaj domenę do allowed origins
```

### PWA not installing
```
→ Sprawdź manifest.json
→ Sprawdź HTTPS (wymagane)
→ Sprawdź Service Worker registration
```
