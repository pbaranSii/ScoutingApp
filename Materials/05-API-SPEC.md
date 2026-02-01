# 05 - API Specification

## 1. Przegląd

ScoutPro wykorzystuje **Supabase PostgREST** do automatycznego generowania REST API z bazy PostgreSQL. Dodatkowo używamy **Edge Functions** dla logiki niestandardowej.

### Base URLs
- **REST API:** `https://{project}.supabase.co/rest/v1`
- **Auth API:** `https://{project}.supabase.co/auth/v1`
- **Storage API:** `https://{project}.supabase.co/storage/v1`
- **Edge Functions:** `https://{project}.supabase.co/functions/v1`

### Autoryzacja
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
```

---

## 2. Authentication

### POST /auth/v1/token?grant_type=password
**Logowanie użytkownika**

```json
// Request
{ "email": "scout@example.com", "password": "password123" }

// Response 200
{
  "access_token": "eyJhbG...",
  "refresh_token": "abc123",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "scout@example.com" }
}
```

### POST /auth/v1/recover
**Reset hasła**
```json
{ "email": "scout@example.com" }
```

---

## 3. Players API

### GET /rest/v1/players
**Lista zawodników**

| Query Param | Example | Description |
|-------------|---------|-------------|
| select | `*,club:clubs(name)` | Pola do zwrócenia |
| birth_year | `eq.2011` | Filtr rocznik |
| pipeline_status | `eq.observed` | Filtr status |
| order | `created_at.desc` | Sortowanie |
| limit | `20` | Limit |

**Response:**
```json
[
  {
    "id": "uuid-1",
    "first_name": "Ryszard",
    "last_name": "Ziętek",
    "birth_year": 2011,
    "primary_position": "9",
    "dominant_foot": "right",
    "pipeline_status": "observed",
    "club": { "name": "Chemik Bydgoszcz" }
  }
]
```

### POST /rest/v1/players
**Dodaj zawodnika**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski",
  "birth_year": 2012,
  "club_id": "uuid",
  "primary_position": "9"
}
```

### PATCH /rest/v1/players?id=eq.{uuid}
**Aktualizuj zawodnika**
```json
{ "pipeline_status": "shortlist" }
```

### GET /rest/v1/players?id=eq.{uuid}
**Szczegóły zawodnika**
```
?select=*,club:clubs(*),region:regions(*),observations(*),contacts:player_contacts(*)
```

---

## 4. Observations API

### GET /rest/v1/observations
**Lista obserwacji**
```
?select=*,player:players(first_name,last_name),scout:users(full_name)
&order=created_at.desc
```

### POST /rest/v1/observations
**Dodaj obserwację**
```json
{
  "player_id": "uuid",
  "scout_id": "uuid",
  "source": "scouting",
  "rank": "B",
  "notes": "Dobry zawodnik...",
  "potential_now": 4,
  "potential_future": 5,
  "observation_date": "2025-01-15"
}
```

### POST /rest/v1/player_evaluations
**Dodaj oceny szczegółowe**
```json
[
  { "observation_id": "uuid", "criteria_id": "uuid-1", "score": 4 },
  { "observation_id": "uuid", "criteria_id": "uuid-2", "score": 5 }
]
```

---

## 5. Matches API

### GET /rest/v1/matches
```
?select=*,league:leagues(name),category:categories(name)
&order=match_date.desc
```

### POST /rest/v1/matches
```json
{
  "team_home": "Polonia Warszawa",
  "team_away": "Legia Warszawa",
  "match_date": "2025-01-20",
  "location": "Warszawa",
  "league_id": "uuid",
  "category_id": "uuid",
  "type": "live"
}
```

---

## 6. Settings API (Słowniki)

### GET /rest/v1/regions
### GET /rest/v1/leagues  
### GET /rest/v1/categories
### GET /rest/v1/clubs
### GET /rest/v1/positions
### GET /rest/v1/evaluation_criteria?position_id=eq.{uuid}

### POST /rest/v1/regions (Admin only)
```json
{ "name": "mazowieckie" }
```

---

## 7. Users API

### GET /rest/v1/users
**Lista użytkowników (Admin)**
```
?select=id,email,full_name,role,is_active,last_login_at
&order=full_name.asc
```

### PATCH /rest/v1/users?id=eq.{uuid}
**Aktualizuj użytkownika (Admin)**
```json
{ "is_active": false }
```

---

## 8. Edge Functions

### POST /functions/v1/send-invitation
**Wyślij zaproszenie**
```json
// Request
{ "email": "newscout@example.com" }

// Response 200
{ "success": true, "invitation_id": "uuid" }
```

### POST /functions/v1/accept-invitation
**Akceptuj zaproszenie**
```json
{
  "token": "invitation-token",
  "password": "newpassword123",
  "full_name": "Jan Nowak"
}
```

---

## 9. Storage API

### Upload zdjęcia
```
POST /storage/v1/object/player-photos/{player_id}/{filename}
Content-Type: image/jpeg
Authorization: Bearer {token}

[binary data]
```

### Pobierz URL zdjęcia
```
GET /storage/v1/object/public/player-photos/{player_id}/{filename}
```

---

## 10. Realtime Subscriptions

```typescript
// Subskrypcja nowych obserwacji
supabase
  .channel('observations')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'observations' },
    (payload) => console.log('New observation:', payload)
  )
  .subscribe();

// Subskrypcja zmian statusu pipeline
supabase
  .channel('pipeline')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'players', filter: 'pipeline_status=neq.observed' },
    (payload) => console.log('Pipeline change:', payload)
  )
  .subscribe();
```

---

## 11. Error Responses

| Code | Description |
|------|-------------|
| 400 | Bad Request - nieprawidłowe dane |
| 401 | Unauthorized - brak/nieprawidłowy token |
| 403 | Forbidden - brak uprawnień (RLS) |
| 404 | Not Found |
| 409 | Conflict - duplikat |
| 422 | Validation Error |
| 500 | Server Error |

```json
{
  "code": "PGRST301",
  "message": "Row not found",
  "details": null,
  "hint": null
}
```
