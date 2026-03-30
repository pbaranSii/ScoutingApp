# Runbook: Konfiguracja Supabase PROD dla wielu frontendów (Vercel + Azure SWA)

## Cel

Skonfigurowanie **istniejącego** projektu Supabase PROD (tego samego, z którego korzysta Vercel) tak, aby drugi frontend – **Azure Static Web Apps** – mógł korzystać z Auth (logowanie, reset hasła, zaproszenia) i API bez błędów CORS ani przekierowań.

**Nie tworzymy nowego projektu Supabase** – tylko rozszerzamy konfigurację obecnego.

## Wymagania

- Dostęp do [Supabase Dashboard](https://supabase.com/dashboard) projektu **PROD** (ten sam co dla Vercel).
- Znany adres Azure SWA, np. `https://<nazwa>.azurestaticapps.net`.

## Kroki

### 1. Redirect URLs (Auth)

1. W projekcie Supabase: **Authentication** → **URL Configuration** (lub **Settings** → **Auth**).
2. W polu **Redirect URLs** dodaj (obok istniejących URLi Vercel):
   - `https://<nazwa>.azurestaticapps.net`
   - `https://<nazwa>.azurestaticapps.net/*`
   - Ścieżki używane przez aplikację do callbacków Auth, np.:
     - `https://<nazwa>.azurestaticapps.net/set-new-password`
     - `https://<nazwa>.azurestaticapps.net/auth/callback` (jeśli używane)
3. Zapisz zmiany.

Dzięki temu linki z maili (reset hasła, ustawienie hasła po zaproszeniu) otwierane z Azure SWA będą poprawnie przekierowywać z powrotem na Azure.

### 2. Site URL (opcjonalnie)

- **Site URL** w Supabase zwykle ustawia się na jeden „główny” adres (np. Vercel).
- Logowanie i redirecty działają na podstawie **Redirect URLs**, więc dodanie SWA do Redirect URLs wystarczy.
- Jeśli chcesz, aby domyślne przekierowania po operacjach Auth szły na Azure, możesz tymczasowo ustawić Site URL na adres SWA – wtedy Vercel nadal zadziała, jeśli jego adres jest na liście Redirect URLs.

### 3. CORS

- Supabase (PostgREST, Auth) domyślnie akceptuje żądania z dowolnego origin.
- Jeśli w projekcie włączono **restrykcyjną konfigurację CORS** (np. przez dodatkowy proxy lub ustawienia projektu), upewnij się, że origin Azure SWA jest na liście dozwolonych, np.:
  - `https://<nazwa>.azurestaticapps.net`

Miejsce ustawień zależy od wersji Supabase (Dashboard → Project Settings → API lub dokumentacja Supabase).

### 4. Weryfikacja

- Otwórz aplikację na adresie Azure SWA.
- Wykonaj: logowanie, wylogowanie, „Zapomniałem hasła” (jeśli używane) – sprawdź, czy redirect po kliknięciu w link z maila prowadzi z powrotem na SWA i kończy się sukcesem.
- Sprawdź w konsoli przeglądarki brak błędów CORS przy wywołaniach do Supabase.

## Uwagi

- Te same klucze (**VITE_SUPABASE_URL**, **VITE_SUPABASE_ANON_KEY**) są używane w Vercel i w pipeline Azure – tylko **VITE_APP_URL** się różni (adres frontendu), co zapewnia poprawne linki w mailach dla każdego wdrożenia.
