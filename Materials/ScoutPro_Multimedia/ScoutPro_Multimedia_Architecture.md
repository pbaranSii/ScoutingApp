# ScoutPro - Architektura Multimediów
## Data Flow, Storage & System Integration

---

## 1. ARCHITEKTURA OGÓLNA

### 1.1 Diagram Wysokiego Poziomu

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React 18)                       │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                   │
│  │   Formularz  │         │  Zakładka    │                   │
│  │  Obserwacji  │◄────────│  Multimedia  │                   │
│  │              │         │              │                   │
│  │  + Multimedia│         │   + Galeria  │                   │
│  │  Section     │         │   + Filtry   │                   │
│  └──────┬───────┘         └──────┬───────┘                   │
│         │                        │                           │
│         └───────────┬────────────┘                           │
│                     │                                        │
│              ┌──────▼────────┐                               │
│              │  MediaContext │                               │
│              │  (React)      │                               │
│              └──────┬────────┘                               │
│                     │                                        │
│         ┌───────────┼──────────────┐                         │
│         │           │              │                         │
│    ┌────▼─┐   ┌─────▼──┐   ┌──────▼──┐                      │
│    │Upload│   │Offline │   │Gallery  │                      │
│    │Service   │Cache   │   │Service  │                      │
│    │(API)     │(IDB)   │   │(API)    │                      │
│    └────┬─┘   └─────┬──┘   └──────┬──┘                      │
│         │           │              │                         │
└─────────┼───────────┼──────────────┼────────────────────────┘
          │           │              │
    ┌─────▼───────────┼──────────────┼──────┐
    │   NETWORK LAYER / Service Worker       │
    │                                        │
    │  ◇ Offline detection (online/offline) │
    │  ◇ Auto-retry logic                   │
    │  ◇ Queue management                   │
    └─────┬───────────┼──────────────┼──────┘
          │           │              │
    ┌─────▼───────────┼──────────────┼──────────────────┐
    │          BACKEND / CLOUD LAYER                     │
    │                                                    │
    │  ┌────────────────────┐                            │
    │  │ Supabase REST API  │                            │
    │  │  (Custom Functions)│                            │
    │  └────────────┬───────┘                            │
    │               │                                    │
    │  ┌────────────┴────────┬──────────────────┐       │
    │  │                     │                  │       │
    │  ▼                     ▼                  ▼       │
    │  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │
    │  │ PostgreSQL   │  │  Supabase   │  │ YouTube  │ │
    │  │ Database     │  │  Storage    │  │   API    │ │
    │  │              │  │  (Bucket)   │  │(optional)│ │
    │  │ ├─multimedia │  │ scoutpro-   │  └──────────┘ │
    │  │ │  table     │  │   media/    │               │
    │  │ └─           │  │ players/... │               │
    │  └──────────────┘  └─────────────┘               │
    │                                                    │
    └────────────────────────────────────────────────────┘
```

---

## 2. FLOW DODAWANIA MULTIMEDIÓW

### 2.1 Sceario: Online

```
┌─ Scout tworzy obserwację ──────────────────────────────┐
│                                                        │
│  1. Scout kliknie "+ Dodaj multimedia"                │
│     ↓                                                  │
│  2. MediaUploadModal otwiera się                      │
│     ├─ Opcja 1: Zrób zdjęcie (aparat)                │
│     ├─ Opcja 2: Wybierz z galerii                    │
│     └─ Opcja 3: Wklej YouTube link                   │
│     ↓                                                  │
│  3. Scout wybiera zdjęcie                            │
│     ↓                                                  │
│  4. Frontend waliduje plik                            │
│     ├─ Check MIME type: image/jpeg, image/png        │
│     ├─ Check rozmiar: < 50 MB                        │
│     └─ Pokaż error jeśli niespełnione               │
│     ↓ [OK]                                           │
│  5. Show upload progress (0-100%)                    │
│     ↓                                                  │
│  6. POST /api/multimedia/upload                       │
│     ├─ Body:                                          │
│     │  ├─ file: blob                                 │
│     │  ├─ player_id: uuid                            │
│     │  ├─ observation_id: uuid (optional)            │
│     │  └─ created_by: uuid (from auth)              │
│     ↓                                                  │
│  7. Backend przetwarza                               │
│     ├─ Utwórz UUID: {uuid}_{timestamp}               │
│     ├─ Wgranie do Supabase Storage:                 │
│     │  scoutpro-media/players/{id}/obs/{id}/.jpg    │
│     ├─ INSERT INTO multimedia table                 │
│     ├─ UPDATE observations SET multimedia_count+1   │
│     └─ Response 201 + media object                  │
│     ↓ [Success]                                      │
│  8. Frontend updates UI                              │
│     ├─ Miniatura pojawia się w galerii              │
│     ├─ Licznik multimediów zaktualiza               │
│     └─ Toast: "✓ Zdjęcie dodane"                    │
│     ↓                                                  │
│  9. Scout zapisuje obserwację [Zapisz obserwację]   │
│     ↓                                                  │
│  10. Obserwacja + multimedia zapisana w DB           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 2.2 Sceario: Offline

```
┌─ Scout bez internetu ──────────────────────────────────┐
│                                                        │
│  1. Scout dodaje obserwację ze zdjęciami             │
│     (Network status: offline)                         │
│     ↓                                                  │
│  2. Frontend detektuje offline (online event)        │
│     ↓                                                  │
│  3. Zamiast POST, dane zapisywane lokalnie           │
│     ├─ IndexedDB:                                    │
│     │  ├─ pending_uploads: [{                        │
│     │  │    observation_id, file, status: pending   │
│     │  │  }]                                         │
│     │  └─ observations: [{...with local ref}]       │
│     ↓                                                  │
│  4. UI pokazuje status:                              │
│     ├─ "⚠️  Brak internetu"                         │
│     ├─ "Multimedia będzie wysłane po połączeniu"    │
│     └─ Miniatura z overlay: "Oczekujące"            │
│     ↓                                                  │
│  5. Service Worker monitoruje sieć                   │
│     ↓                                                  │
│  6. Scout wraca do biura, WiFi connects             │
│     ↓ (online event triggered)                       │
│     ├─ Service Worker detektuje: window.online=true │
│     └─ Trigger: syncOfflineMedia()                   │
│     ↓                                                  │
│  7. Batch upload (max 5 concurrent)                 │
│     ├─ GET pending_uploads from IndexedDB           │
│     ├─ For each file:                                │
│     │  ├─ POST /api/multimedia/upload               │
│     │  ├─ On success: UPDATE IndexedDB (synced)     │
│     │  └─ On error: Retry (exp backoff)             │
│     ↓                                                  │
│  8. UI update - Sync progress                       │
│     ├─ Pokazuje: "↻ Synchronizacja 45%..."          │
│     └─ Miniatura: opacity zmienia się               │
│     ↓                                                  │
│  9. Po sukcesie:                                     │
│     ├─ IndexedDB: Delete z pending                  │
│     ├─ UI: "✓ Wszystko zsynchronizowane"           │
│     └─ Miniatura: status synced                     │
│     ↓                                                  │
│  10. Obserwacja kompletna w DB                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 2.3 YouTube Link Flow

```
┌─ Scout dodaje YouTube link ────────────────────────────┐
│                                                        │
│  1. Scout kliknie "+ Dodaj multimedia"               │
│     ↓                                                  │
│  2. Modal wyświetla opcje                            │
│     ↓                                                  │
│  3. Scout wybiera "Wklej link YouTube"              │
│     ↓                                                  │
│  4. Input field pojawia się                          │
│     └─ Scout wkleja: https://youtube.com/...        │
│     ↓                                                  │
│  5. Frontend waliduje URL                            │
│     ├─ Regex: match youtube URL pattern              │
│     ├─ Extract video_id                              │
│     └─ Error jeśli invalid                           │
│     ↓ [Valid]                                        │
│  6. POST /api/multimedia/youtube                     │
│     ├─ Body:                                          │
│     │  ├─ youtube_url: string                        │
│     │  ├─ player_id: uuid                            │
│     │  ├─ observation_id: uuid (optional)            │
│     │  └─ created_by: uuid                           │
│     ↓                                                  │
│  7. Backend fetches metadata (optional YouTube API)  │
│     ├─ video_id extracted                            │
│     ├─ title, thumbnail, duration fetched           │
│     ├─ INSERT INTO multimedia table                 │
│     └─ Response 201 + youtube metadata              │
│     ↓                                                  │
│  8. Frontend updates                                 │
│     ├─ Link pojawia się w galerii                   │
│     ├─ Thumbnail shown                               │
│     └─ Toast: "✓ Link YouTube dodany"              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. FLOW USUWANIA MULTIMEDIÓW

```
┌─ Scout usuwa zdjęcie ──────────────────────────────────┐
│                                                        │
│  1. Scout kliknie [X] na miniatuze                   │
│     ↓                                                  │
│  2. Confirmation dialog:                             │
│     "Czy na pewno chcesz usunąć ten plik?"          │
│     ↓                                                  │
│  3. Scout potwierdza [Tak, usuń]                    │
│     ↓                                                  │
│  4. DELETE /api/multimedia/{multimedia_id}           │
│     ├─ Backend:                                       │
│     │  ├─ DELETE FROM multimedia WHERE id=...       │
│     │  ├─ DELETE FROM Supabase Storage path/to/file │
│     │  ├─ UPDATE observations SET multimedia_count-1│
│     │  └─ Response 204 No Content                    │
│     ↓ [Success]                                      │
│  5. Frontend updates:                                │
│     ├─ Miniatura znika z galerii                    │
│     ├─ Licznik multimedia zmniejszy się             │
│     └─ Toast: "✓ Plik usunięty"                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 4. BAZA DANYCH - RELACJE

### 4.1 Extended ERD

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  players                          observations            │
│  ─────────────────────────────    ──────────────────────  │
│  PK  id (uuid)                   PK  id (uuid)            │
│      first_name                      observation_date      │
│      last_name                       position              │
│      birth_date                      player_id (FK)       │
│      position                        scout_id (FK)        │
│      club                            technique_score      │
│      ...                             ...                  │
│      total_media_count (int)     NEW multimedia_count (int)
│      last_media_date (DATE)      NEW last_media_date     │
│                                                            │
│      ▲                                ▲                   │
│      │ 1 : N                          │ 1 : N            │
│      └────────────────────┬───────────┘                  │
│                           │                              │
│                    ┌──────▼──────────┐                   │
│                    │   multimedia    │                   │
│                    ├─────────────────┤                   │
│                    │ PK id (uuid)    │                   │
│              NEW   │ player_id (FK)  │ ──────┐          │
│                    │ observation_id  │       │          │
│                    │ (FK, nullable)  │       │          │
│                    │                 │       │          │
│                    │ file_type       │       │          │
│                    │ (enum)          │       │          │
│                    │ ├─ image        │       │          │
│                    │ ├─ video        │       │          │
│                    │ └─ youtube_link │       │          │
│                    │                 │       │          │
│                    │ file_name       │       │          │
│                    │ file_size       │       │          │
│                    │ file_format     │       │          │
│                    │ storage_path    │       │          │
│                    │                 │       │          │
│                    │ (YouTube)       │       │          │
│                    │ youtube_url     │       │          │
│                    │ youtube_id      │       │          │
│                    │ youtube_title   │       │          │
│                    │ youtube_thumb   │       │          │
│                    │ youtube_duration│       │          │
│                    │                 │       │          │
│                    │ created_by (FK) │       │          │
│                    │ created_at      │       │          │
│                    │ updated_at      │       │          │
│                    │ sync_status     │ ◄─────┘          │
│                    │ sync_error_msg  │                   │
│                    └─────────────────┘                   │
│                                                            │
│  scout_users (auth)                                       │
│  ─────────────────                                        │
│  PK  id (uuid)                                            │
│      email                                                │
│      ...                                                  │
│      ▲ (1:N) to multimedia.created_by                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Triggers & Constraints

```sql
-- Trigger 1: Update observation.multimedia_count
CREATE TRIGGER tr_multimedia_count_insert
AFTER INSERT ON multimedia
FOR EACH ROW
EXECUTE FUNCTION increment_observation_media_count();

-- Trigger 2: Update observation.multimedia_count
CREATE TRIGGER tr_multimedia_count_delete
AFTER DELETE ON multimedia
FOR EACH ROW
EXECUTE FUNCTION decrement_observation_media_count();

-- Trigger 3: Update player.last_media_date
CREATE TRIGGER tr_player_media_date
AFTER INSERT ON multimedia
FOR EACH ROW
EXECUTE FUNCTION update_player_last_media_date();

-- Constraint: Cascade delete when observation is deleted
ALTER TABLE multimedia
ADD CONSTRAINT fk_observation_delete
FOREIGN KEY (observation_id) 
REFERENCES observations(id) 
ON DELETE CASCADE;

-- Constraint: Cascade delete when player is deleted
ALTER TABLE multimedia
ADD CONSTRAINT fk_player_delete
FOREIGN KEY (player_id) 
REFERENCES players(id) 
ON DELETE CASCADE;
```

---

## 5. SUPABASE STORAGE STRUKTURA

### 5.1 Bucket Organization

```
scoutpro-media (Public Bucket)
│
├─ players/
│  ├─ {player_id}/
│  │  │
│  │  ├─ observations/
│  │  │  ├─ {observation_id}/
│  │  │  │  ├─ 550e8400-e29b-41d4-a716-446655440000_20250915_144530.jpg
│  │  │  │  ├─ 550e8400-e29b-41d4-a716-446655440001_20250915_152015.mp4
│  │  │  │  └─ ...
│  │  │  ├─ {observation_id}/
│  │  │  │  └─ ...
│  │  │  └─ ...
│  │  │
│  │  └─ profile/
│  │     ├─ {uuid}_{timestamp}.jpg
│  │     ├─ {uuid}_{timestamp}.jpg
│  │     └─ ...
│  │
│  ├─ {player_id}/
│  │  └─ ...
│  │
│  └─ ...
│
└─ temp/
   ├─ {session_id}/
   │  ├─ {uuid}_draft.jpg
   │  └─ ...
   └─ ...
```

### 5.2 Storage Polityka Dostępu

```sql
-- RLS Policy: Public read (all authenticated users)
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'scoutpro-media');

-- RLS Policy: Insert own media (logged-in user)
CREATE POLICY "User can insert own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'scoutpro-media' 
  AND auth.uid() = (
    SELECT created_by FROM multimedia 
    WHERE storage_path = name
  )
);

-- RLS Policy: Delete own media
CREATE POLICY "User can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'scoutpro-media' 
  AND auth.uid() = (
    SELECT created_by FROM multimedia 
    WHERE storage_path = name
  )
);
```

---

## 6. API KONTRAKTY

### 6.1 POST /api/multimedia/upload

```json
REQUEST:
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation_id": "550e8400-e29b-41d4-a716-446655440001",
  "file": <File object>,
  "created_by": "550e8400-e29b-41d4-a716-446655440002"
}

RESPONSE 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation_id": "550e8400-e29b-41d4-a716-446655440001",
  "file_name": "IMG_20250915_144530.jpg",
  "file_type": "image",
  "file_size": 2457600,
  "file_format": "jpg",
  "storage_path": "players/550e8400-e29b-41d4-a716-446655440000/observations/550e8400-e29b-41d4-a716-446655440001/550e8400-e29b-41d4-a716-446655440003_20250915_144530.jpg",
  "storage_url": "https://supabase.co/storage/v1/object/public/scoutpro-media/players/.../img.jpg",
  "thumbnail_url": "https://supabase.co/storage/v1/object/public/scoutpro-media/players/.../img_thumb.jpg",
  "created_by": "550e8400-e29b-41d4-a716-446655440002",
  "created_at": "2025-09-15T14:45:30Z",
  "updated_at": "2025-09-15T14:45:30Z",
  "sync_status": "synced"
}

ERROR 400:
{
  "error": "FILE_TOO_LARGE",
  "message": "Plik jest zbyt duży. Maksymalny rozmiar: 50MB"
}

ERROR 415:
{
  "error": "UNSUPPORTED_FORMAT",
  "message": "Format pliku nie jest wspierany. Obsługiwane: JPG, PNG, MP4, MOV"
}
```

### 6.2 POST /api/multimedia/youtube

```json
REQUEST:
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation_id": "550e8400-e29b-41d4-a716-446655440001",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "created_by": "550e8400-e29b-41d4-a716-446655440002"
}

RESPONSE 201:
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "observation_id": "550e8400-e29b-41d4-a716-446655440001",
  "file_type": "youtube_link",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "youtube_video_id": "dQw4w9WgXcQ",
  "youtube_title": "Polska U17 vs Niemcy - Pełny Mecz",
  "youtube_thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
  "youtube_duration_seconds": 5245,
  "created_by": "550e8400-e29b-41d4-a716-446655440002",
  "created_at": "2025-09-15T16:00:00Z",
  "sync_status": "synced"
}

ERROR 400:
{
  "error": "INVALID_URL",
  "message": "Niepoprawny link YouTube"
}
```

### 6.3 DELETE /api/multimedia/{id}

```json
REQUEST:
DELETE /api/multimedia/550e8400-e29b-41d4-a716-446655440003

RESPONSE 204: (No Content)

ERROR 404:
{
  "error": "NOT_FOUND",
  "message": "Multimedia nie znalezione"
}

ERROR 403:
{
  "error": "FORBIDDEN",
  "message": "Nie masz uprawnień do usunięcia tego pliku"
}
```

### 6.4 GET /api/multimedia/player/{player_id}

```json
REQUEST:
GET /api/multimedia/player/550e8400-e29b-41d4-a716-446655440000?type=all&limit=20&offset=0

RESPONSE 200:
{
  "player_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_count": 12,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "file_type": "image",
      "file_name": "IMG_20250915_144530.jpg",
      "storage_url": "...",
      "thumbnail_url": "...",
      "created_at": "2025-09-15T14:45:30Z",
      "observation_id": "550e8400-e29b-41d4-a716-446655440001",
      "observation_date": "2025-09-15",
      "observation_note": "Mecz Ekstraklasa"
    },
    ...
  ]
}
```

---

## 7. OFFLINE SYNC LOGIKA

### 7.1 IndexedDB Schema

```javascript
// Database: scoutpro_offline
// Version: 1

const dbSchema = {
  stores: {
    // Store 1: Pending uploads
    pending_uploads: {
      keyPath: 'id',
      indexes: [
        { name: 'player_id', unique: false },
        { name: 'observation_id', unique: false },
        { name: 'status', unique: false },
        { name: 'created_at', unique: false }
      ]
    },
    
    // Store 2: Offline observations
    offline_observations: {
      keyPath: 'id',
      indexes: [
        { name: 'player_id', unique: false },
        { name: 'sync_status', unique: false }
      ]
    },
    
    // Store 3: Sync queue
    sync_queue: {
      keyPath: 'id',
      indexes: [
        { name: 'timestamp', unique: false },
        { name: 'status', unique: false }
      ]
    }
  }
};

// Record structure: pending_uploads
{
  id: UUID,
  player_id: UUID,
  observation_id: UUID,
  file: Blob,
  file_name: string,
  file_size: number,
  file_type: 'image' | 'video',
  status: 'pending' | 'uploading' | 'synced' | 'error',
  error_message: string | null,
  retry_count: number,
  created_at: ISO timestamp,
  last_retry_at: ISO timestamp | null
}

// Record structure: sync_queue
{
  id: UUID,
  type: 'upload_media' | 'create_observation',
  data: object,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  timestamp: ISO timestamp
}
```

### 7.2 Service Worker Sync Strategy

```javascript
// Service Worker: offline-sync.js

// Event 1: Online detection
window.addEventListener('online', async () => {
  if (shouldSync) {
    await syncOfflineMedia();
  }
});

// Event 2: Periodic background sync (future)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-media') {
    event.waitUntil(syncOfflineMedia());
  }
});

// Function: Sync all pending media
async function syncOfflineMedia() {
  const pendingMedia = await getAllPendingMedia();
  
  // Batch: Process max 5 concurrent uploads
  const batchSize = 5;
  for (let i = 0; i < pendingMedia.length; i += batchSize) {
    const batch = pendingMedia.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(media => uploadSingleMedia(media))
    );
  }
  
  // Cleanup: Remove synced items
  await cleanupSyncedMedia();
  
  // Broadcast: Update UI
  notifyUISync('complete');
}

// Function: Upload single media with retry
async function uploadSingleMedia(media, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    // Update status
    await updateMediaStatus(media.id, 'uploading');
    
    // Upload to backend
    const response = await fetch(
      '/api/multimedia/upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...media,
          file: await blobToBase64(media.file)
        })
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    // Success: Update IndexedDB
    await updateMediaStatus(media.id, 'synced');
    
  } catch (error) {
    if (retryCount < maxRetries) {
      // Retry with exponential backoff
      const delay = 1000 * Math.pow(2, retryCount);
      await sleep(delay);
      return uploadSingleMedia(media, retryCount + 1);
    } else {
      // Final error
      await updateMediaStatus(
        media.id, 
        'error', 
        error.message
      );
    }
  }
}

// Function: Retry failed uploads on demand
async function retryFailedUploads() {
  const failedMedia = await getFailedMedia();
  
  for (const media of failedMedia) {
    await uploadSingleMedia(media, 0);
  }
}
```

---

## 8. CACHE STRATEGY

### 8.1 Browser Cache

```
Static assets (JS, CSS):
├─ Cache-Control: public, max-age=31536000 (1 year)
└─ Fingerprint: /js/app.v123.js

Media files (images, video):
├─ Cache-Control: public, max-age=31536000
├─ ETag: <hash>
└─ Serve from CDN + browser cache

API responses:
├─ GET /api/multimedia/player/{id}
│  └─ Cache-Control: max-age=3600 (1 hour)
├─ GET /api/multimedia/{id}
│  └─ Cache-Control: max-age=86400 (1 day)
└─ POST/DELETE
   └─ Cache-Control: no-cache
```

### 8.2 IndexedDB Cache (Offline)

```
Strategy: Network-first, fallback to IndexedDB

1. Network request (online)
   ├─ Fetch from API
   ├─ Store in IndexedDB (cache)
   └─ Return to UI

2. Offline
   ├─ Check IndexedDB
   └─ Return cached data

3. Cache invalidation
   ├─ Manual refresh button
   ├─ On successful POST/DELETE
   └─ Periodic cleanup (1 week old data)
```

---

## 9. BŁĘDY & RECOVERY

### 9.1 Error Handling Tree

```
Upload Error
├─ Network Error
│  ├─ Offline → Queue for later
│  ├─ Timeout → Retry with backoff
│  └─ Server error → User action (retry/cancel)
│
├─ File Error
│  ├─ Too large → User action (choose smaller)
│  ├─ Invalid format → User action (choose valid)
│  └─ Corrupt → User action (choose another)
│
├─ Validation Error
│  ├─ Invalid player_id → System error (report)
│  ├─ No observation found → User action (create)
│  └─ Permission denied → System error (contact admin)
│
└─ Storage Error
   ├─ Bucket full → System error (admin action)
   ├─ No write permission → System error (admin action)
   └─ Path invalid → System error (report)
```

### 9.2 Recovery Strategies

```
Strategy 1: Auto-retry
├─ Applicable: Network timeout, server 5xx
├─ Mechanism: Exponential backoff (1s, 2s, 4s)
├─ Max retries: 3
└─ After 3 retries: Move to failed queue

Strategy 2: Graceful degradation
├─ Applicable: YouTube metadata fetch fails
├─ Fallback: Store URL without metadata
└─ UI: Show placeholder thumbnail

Strategy 3: User action required
├─ Applicable: Invalid format, too large
├─ UI: Error message + action buttons
└─ Buttons: [Retry] [Choose another] [Cancel]

Strategy 4: Manual sync
├─ Applicable: Multiple failures in queue
├─ UI: "You have X failed uploads" + [Sync now]
└─ Action: Batch retry on click
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Image Optimization

```
Strategy: Lazy loading + responsive images

<img 
  src="placeholder.jpg"
  data-src="full-image.jpg"
  srcset="img-small.jpg 480w, img-medium.jpg 768w, img-large.jpg 1200w"
  loading="lazy"
  width="300"
  height="300"
  alt="..."
/>

Libraries:
├─ Intersection Observer API (native)
├─ sharp (Node.js image processing)
└─ imagemin (optimization)

Formats:
├─ Original: JPG/PNG uploaded by user
├─ Thumbnail: 100x100px WebP (for gallery)
├─ Medium: 500x500px JPG (for lightbox)
└─ Original stored (for download)
```

### 10.2 Video Optimization

```
Handling:
├─ No transcoding (store original format)
├─ Generate thumbnail from first frame
├─ Lazy load video player on click
└─ Stream video directly (not download)

Streaming:
├─ Use Supabase Storage CDN
├─ Range requests (partial downloads)
└─ HTTP caching headers

Performance:
├─ Don't autoplay on gallery
├─ Load on demand in lightbox
└─ Show loading spinner during buffering
```

### 10.3 Bundle Size

```
Impact analysis:
├─ MediaUpload components: ~50KB (gzipped)
├─ Lightbox library: ~30KB
├─ YouTube parser: ~5KB
└─ Total: ~85KB

Mitigation:
├─ Code splitting: Lazy load media components
├─ Tree shaking: Remove unused lightbox features
├─ Compression: Gzip + brotli
└─ Polyfills: Only for older browsers
```

---

## 11. MONITORING & ANALYTICS

### 11.1 Metrics to Track

```
Upload metrics:
├─ Total uploads per day
├─ Average file size
├─ Upload success rate (%)
├─ Average upload time (s)
└─ Failed uploads (top error types)

Offline sync:
├─ % of offline uploads
├─ Average sync time (when online)
├─ Retry rate
└─ Data lost (0-1%)

User behavior:
├─ Feature adoption (% users using media)
├─ Avg files per observation
├─ Avg files per player
├─ YouTube link usage rate
└─ Delete rate (%)

Performance:
├─ Gallery load time
├─ Lightbox open time
├─ Search/filter latency
└─ Memory usage
```

### 11.2 Error Tracking

```
Tool: Sentry / Rollbar

Capture:
├─ Upload failures (with context)
├─ Sync failures (with queue state)
├─ API errors (with payload)
├─ Storage errors (with path)
└─ Offline edge cases

Alerting:
├─ High error rate (> 5%)
├─ Storage quota exceeded
├─ Multiple failed syncs
└─ YouTube API failures
```

---

## KONKLUZJA

Architektura multimediów jest zaprojektowana z uwzględnieniem:
- ✅ **Offline-first**: Dane synchronizowane lokalnie, upload przy internecie
- ✅ **Skalowalne**: Struktura Storage gotowa na 1000+ zawodników
- ✅ **Performant**: Lazy loading, image optimization, caching
- ✅ **Resilient**: Retry logic, error recovery, graceful degradation
- ✅ **Secure**: RLS policies, auth validation, storage access control

---

**Przygotował**: Przemek - Analityk UX/UI & Business Analyst  
**Data**: 10.02.2026  
**Status**: ✅ Gotowe do implementacji
