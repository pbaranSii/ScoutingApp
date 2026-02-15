# ScoutPro - Multimedia Feature Implementation
## Checklist, Decyzje Kluczowe & Pytania Otwarte

---

## 1. CHECKLIST IMPLEMENTACJI

### FAZA 0: Pre-Development (BEFORE START)

#### 1.1 Infrastruktura & Setup
- [ ] Supabase bucket `scoutpro-media` utworzony i skonfigurowany
  - [ ] Bucket policy (public read, auth upload/delete)
  - [ ] CORS configured
  - [ ] Storage quotas set (if needed)
- [ ] Environment variables updated
  - [ ] SUPABASE_BUCKET_NAME
  - [ ] SUPABASE_STORAGE_URL
  - [ ] YOUTUBE_API_KEY (optional, for future)
- [ ] Database migrations planned
  - [ ] multimedia table created
  - [ ] observations.multimedia_count column added
  - [ ] players.total_media_count column added
  - [ ] RLS policies configured
- [ ] Backend API endpoints stubbed out
  - [ ] POST /api/multimedia/upload
  - [ ] POST /api/multimedia/youtube
  - [ ] DELETE /api/multimedia/{id}
  - [ ] GET /api/multimedia/player/{id}
  - [ ] GET /api/multimedia/observation/{id}

#### 1.2 Project & Planning
- [ ] Epic created in project management tool
- [ ] Subtasks created for each component
- [ ] Estimation completed (story points)
- [ ] Sprint planning finalized
- [ ] Design review scheduled with stakeholders
- [ ] Code review process agreed upon

#### 1.3 Development Environment
- [ ] React 18 project setup confirmed
- [ ] TypeScript strict mode enabled
- [ ] ESLint & Prettier configured
- [ ] Testing framework (Jest/Vitest) ready
- [ ] Mock server (MSW) for API testing setup
- [ ] Cursor IDE (or preferred IDE) configured

#### 1.4 Documentation Setup
- [ ] This spec saved in project wiki/docs
- [ ] Component patterns documented
- [ ] API contract documented
- [ ] Database schema documented
- [ ] Testing guidelines documented

---

### FAZA 1: MVP - Podstawowy Upload & Galeria (2 tygodnie)

#### Sprint 1.1: Database & Backend API

**Frontend Dependencies**:
- ❌ None (API driven)

**Deliverables**:
- [ ] PostgreSQL table `multimedia` created
  ```sql
  ✓ Columns: id, player_id, observation_id, file_name, file_type,
           file_size, file_format, storage_path, created_by,
           created_at, updated_at, sync_status
  ✓ Indexes on: player_id, observation_id, created_at, sync_status
  ✓ Triggers for: multimedia_count update
  ```
- [ ] RLS policies implemented
  ```sql
  ✓ SELECT: all authenticated users
  ✓ INSERT: auth.uid() = created_by
  ✓ DELETE: auth.uid() = created_by OR observation owner
  ```
- [ ] POST /api/multimedia/upload endpoint
  ```
  ✓ File validation (MIME, size)
  ✓ Supabase Storage upload
  ✓ Database INSERT
  ✓ observations.multimedia_count UPDATE
  ✓ Error handling & responses
  ```
- [ ] DELETE /api/multimedia/{id} endpoint
  ```
  ✓ Storage file deletion
  ✓ Database DELETE
  ✓ observations.multimedia_count UPDATE
  ✓ Permission check
  ```
- [ ] GET /api/multimedia/player/{id} endpoint
  ```
  ✓ Fetch all media for player
  ✓ Pagination support
  ✓ Filtering by type
  ✓ Sorting by date
  ```
- [ ] API documentation (OpenAPI/Swagger)

**Testing**:
- [ ] Unit tests for API endpoints
- [ ] Integration tests with Database
- [ ] File upload validation tests
- [ ] Permission/RLS tests

**Code Review**:
- [ ] PR created
- [ ] Backend team review
- [ ] Approval + merge

---

#### Sprint 1.2: Frontend - Media Upload Component

**Dependencies**: Sprint 1.1 (API ready)

**Deliverables**:
- [ ] `MediaUploadButton` component
  ```tsx
  ✓ Renders button "+ Dodaj multimedia"
  ✓ Opens modal on click
  ✓ Handles mobile/desktop differences
  ✓ Accessible (ARIA labels, keyboard nav)
  ```
- [ ] `MediaUploadModal` component
  ```tsx
  ✓ Shows 3 options: camera, gallery, YouTube
  ✓ File input for device selection
  ✓ Drag & drop support
  ✓ Error messages for unsupported formats/sizes
  ✓ Responsive layout (mobile drawer, desktop modal)
  ```
- [ ] `useMediaUpload` custom hook
  ```ts
  ✓ uploadFile(file): Upload to backend
  ✓ uploadYoutubeLink(url): Save URL
  ✓ deleteMedia(id): Delete file
  ✓ Retry logic on failure
  ✓ Progress tracking
  ```
- [ ] Media service
  ```ts
  ✓ File validation (MIME, size)
  ✓ Blob to Base64 conversion
  ✓ FormData construction
  ✓ API calls with error handling
  ```

**Testing**:
- [ ] Unit tests for components
- [ ] Unit tests for hook
- [ ] Integration tests with mock API
- [ ] File upload simulation tests
- [ ] Error handling tests

**Accessibility**:
- [ ] ARIA labels added
- [ ] Keyboard navigation working
- [ ] Focus management correct
- [ ] Color contrast checked

---

#### Sprint 1.3: Frontend - Media Preview & Gallery

**Dependencies**: Sprint 1.2 (upload component)

**Deliverables**:
- [ ] `MediaPreview` component
  ```tsx
  ✓ Displays thumbnail grid
  ✓ Shows type icon (📷, 🎬)
  ✓ Delete button [X] with confirmation
  ✓ Responsive layout
  ✓ Hover effects
  ```
- [ ] `MediaGallery` component
  ```tsx
  ✓ Displays all media for player/observation
  ✓ Filter by type (all, image, video, youtube)
  ✓ Responsive grid layout
  ✓ Lazy loading on scroll
  ✓ Error state for failed loads
  ```
- [ ] Confirmation Dialog component
  ```tsx
  ✓ Used for delete confirmation
  ✓ Clear warning message
  ✓ Accessible (keyboard support)
  ```
- [ ] Loading & Error states
  ```tsx
  ✓ Loading spinner during fetch
  ✓ Error message with retry button
  ✓ Empty state message
  ```

**Testing**:
- [ ] Component rendering tests
- [ ] Filter functionality tests
- [ ] Delete with confirmation tests
- [ ] Responsive layout tests
- [ ] Error state tests

---

#### Sprint 1.4: Frontend - Lightbox & Integration

**Dependencies**: Sprint 1.3 (gallery component)

**Deliverables**:
- [ ] Lightbox library integration
  ```ts
  ✓ Use react-photoswipe or similar
  ✓ Image viewer with zoom
  ✓ Video player (HTML5)
  ✓ Navigation (prev/next)
  ✓ Fullscreen support
  ```
- [ ] `MediaLightbox` component
  ```tsx
  ✓ Modal/drawer for image/video viewing
  ✓ Image zoom support
  ✓ Video player controls
  ✓ Metadata display (date, observer, etc)
  ✓ Delete button
  ✓ Download link (optional)
  ✓ Keyboard navigation (arrows, esc)
  ```
- [ ] Integration with Observations form
  ```tsx
  ✓ Embedded media preview in observation form
  ✓ Add/remove media workflow
  ✓ Media persisted with observation
  ```
- [ ] Integration with Player profile
  ```tsx
  ✓ Multimedia tab in player profile
  ✓ Filter + gallery view
  ✓ Total media count displayed
  ```

**Testing**:
- [ ] Lightbox functionality tests
- [ ] Navigation tests
- [ ] Keyboard accessibility tests
- [ ] Integration tests with forms

---

#### Sprint 1.5: Testing & QA

**Testing Coverage**:
- [ ] Unit test coverage: > 80%
- [ ] Integration tests: All happy paths covered
- [ ] E2E tests (optional)
  - [ ] Upload file → appears in gallery
  - [ ] Delete file → confirmation → removed
  - [ ] View file in lightbox → zoom, navigate

**QA Checklist**:
- [ ] Functional testing (all features)
- [ ] Mobile testing (iOS Safari, Chrome)
- [ ] Desktop testing (Chrome, Firefox, Safari)
- [ ] Tablet testing (iPad)
- [ ] Accessibility testing (keyboard, screen reader)
- [ ] Performance testing (slow network, large files)
- [ ] Error scenarios
  - [ ] Network error
  - [ ] Invalid file format
  - [ ] File too large
  - [ ] Insufficient storage

**Bug Fixes**:
- [ ] Critical bugs fixed immediately
- [ ] Non-critical bugs logged for Etap 2

---

### FAZA 2: YouTube + Offline (1.5 tygodnia)

#### Sprint 2.1: YouTube Integration

**Deliverables**:
- [ ] YouTube URL validation & extraction
  ```ts
  ✓ Regex for YouTube URL patterns
  ✓ Extract video ID
  ✓ Error handling for invalid URLs
  ```
- [ ] YouTube metadata fetching (optional)
  ```ts
  ✓ Fetch metadata (title, thumbnail, duration)
  ✓ Fallback if API unavailable
  ✓ Cache metadata in DB
  ```
- [ ] `YouTubeInput` component
  ```tsx
  ✓ Input field for URL
  ✓ Add button
  ✓ Validation feedback
  ```
- [ ] YouTube link display
  ```tsx
  ✓ Thumbnail + title in gallery
  ✓ YouTube embed in lightbox
  ✓ Open in YouTube button
  ```
- [ ] API endpoint
  ```ts
  POST /api/multimedia/youtube
  ✓ URL validation
  ✓ Metadata fetch (optional)
  ✓ Database INSERT
  ✓ Response with metadata
  ```

**Testing**:
- [ ] Valid YouTube URLs recognized
- [ ] Invalid URLs rejected
- [ ] Metadata fetched correctly
- [ ] YouTube embed renders properly
- [ ] Lightbox display correct

---

#### Sprint 2.2: IndexedDB & Offline Sync

**Deliverables**:
- [ ] IndexedDB schema created
  ```js
  ✓ pending_uploads store
  ✓ offline_observations store
  ✓ sync_queue store
  ✓ Proper indexes
  ```
- [ ] Offline detection
  ```ts
  ✓ window.online event listener
  ✓ Service Worker registration
  ✓ Online/offline state management
  ```
- [ ] Local media storage
  ```ts
  ✓ When offline: save to IndexedDB
  ✓ Blob storage in local cache
  ✓ Status tracking (pending/synced)
  ```
- [ ] `useOfflineSync` hook
  ```ts
  ✓ Detect online/offline
  ✓ Get pending uploads
  ✓ Trigger sync on online
  ✓ Track progress
  ✓ Handle errors
  ```
- [ ] Sync Manager
  ```ts
  ✓ Batch upload (max 5 concurrent)
  ✓ Exponential backoff retry
  ✓ Error tracking
  ✓ Update IndexedDB status
  ✓ Notify UI on completion
  ```

**Testing**:
- [ ] IndexedDB operations
- [ ] Offline upload queueing
- [ ] Sync on online event
- [ ] Batch upload logic
- [ ] Retry with backoff
- [ ] Error recovery

---

#### Sprint 2.3: Offline UI & UX

**Deliverables**:
- [ ] Offline indicator component
  ```tsx
  ✓ Shows when offline
  ✓ Message: "Brak internetu, będzie wysłane..."
  ```
- [ ] Pending media visual indicator
  ```tsx
  ✓ Overlay on thumbnail: "Oczekujące"
  ✓ Grayed out or reduced opacity
  ```
- [ ] Sync progress UI
  ```tsx
  ✓ Progress bar: "Synchronizacja 45%"
  ✓ Show when syncing in background
  ✓ Success message when done
  ```
- [ ] Retry UI
  ```tsx
  ✓ Show failed uploads list
  ✓ [Retry] button
  ✓ [Clear] button to remove from queue
  ```

**Testing**:
- [ ] Offline mode simulation
- [ ] UI updates correctly
- [ ] Sync progress tracking
- [ ] Error states displayed

---

### FAZA 3: Zaawansowane Funkcje (1 tydzień)

#### Sprint 3.1: Drag & Drop + Filters

**Deliverables**:
- [ ] Drag & drop reordering (etap 2 - SKIP dla MVP)
- [ ] Advanced filters
  ```tsx
  ✓ Filter by type (image, video, youtube)
  ✓ Filter by date range
  ✓ Sort options (recent, oldest, largest)
  ```
- [ ] Multimedia management view (optional)
  ```tsx
  ✓ Multi-select checkbox
  ✓ Batch delete
  ✓ Bulk export (optional)
  ```

**Testing**: TBD

---

## 2. KLUCZE DECYZJE PODJĘTE

### ✅ Decyzja 1: Storage Solution
**Wybór**: Supabase Storage (Cloud-based)  
**Uzasadnienie**:
- Zintegrowany z Supabase (już używany)
- Bezpieczny (RLS policies)
- Skalowalne (nie ma limitów storage na dev)
- CDN dla szybkiego dostępu
- Easy cleanup (automatic delete on observation/player delete)

**Alternatywy rozpatrzone**:
- ❌ AWS S3 - bardziej złożony setup
- ❌ Local filesystem - nie skaluje się, requires backup
- ❌ Cloudinary - additional cost, overkill features

---

### ✅ Decyzja 2: Offline Sync Strategy
**Wybór**: IndexedDB + Service Worker (Network-first, offline queue)  
**Uzasadnienie**:
- Scout pracuje na stadionie bez internetu (requirement!)
- IndexedDB built-in, nie wymaga bibliotek
- Service Worker standard do offline sync
- Automatic retry when online

**Alternatywy rozpatrzone**:
- ❌ PouchDB - dodatkowa biblioteka, overkill
- ❌ No offline - nie spełnia requirement

---

### ✅ Decyzja 3: Formaty Mediów
**Wybór**: JPG, PNG (images) + MP4, MOV (video) + YouTube links  
**Uzasadnienie**:
- Najpopularniejsze formaty
- Natywnie wspierane przez przeglądarki
- Mniej konwersji = szybciej

**Nie wliczone**:
- ❌ HEIC - nie wspierane przez wszystkie przeglądarki
- ❌ WebP - możliwe dla przyszłości
- ❌ 3GP, AVI - rare, outdated

---

### ✅ Decyzja 4: Limity Techniczne
**Wybór**: 
- Max 50MB na zdjęcie
- Max 200MB na video
- Max 20 plików na obserwację
- Max 1GB na zawodnika

**Uzasadnienie**:
- 50MB wystarczy dla high-quality foto
- 200MB wystarczy dla short video (3-5 min)
- 1GB total = ~20 obserwacji × 50MB = reasonable
- Limity chronią przed abuse i koszami storage

---

### ✅ Decyzja 5: Uprawnienia Dostępu
**Wybór**: Wszyscy zalogowani użytkownicy widają wszystkie multimedia  
**Uzasadnienie**:
- Akademia to mała grupa (5+ scautów)
- Multimedia są o zawodnikach akademii, nie są wrażliwe
- Łatwiej (future: można zmienić na team-based)

**Przyszłość (Etap 3+)**:
- Możliwe ograniczenie do zespołów (regional, age groups)
- Możliwe ograniczenie do scautów (private observations)

---

### ✅ Decyzja 6: Video Processing
**Wybór**: NO video transcoding (store original)  
**Uzasadnienie**:
- Ciężko i kosztownie (transcoding)
- Nie potrzebne dla internal scouting
- Streaming from Supabase Storage wystarczy
- Bandwidth will scale naturally (HTTP caching)

**Generowanie thumbnails**: YES
- Auto-generate z first frame video
- PNG format, small size (< 50KB)
- Cache in database

---

### ✅ Decyzja 7: YouTube Integration
**Wybór**: Metadata fetch OPTIONAL (nice-to-have)  
**Uzasadnienie**:
- YouTube API rate-limited
- Można działać bez metadanych
- Just store URL + video_id wystarczy
- Metadata later (Etap 2+)

---

## 3. PYTANIA OTWARTE & DECYZJE WISZĄCE

### ❓ Pytanie 1: YouTube API Key
**Status**: 🔴 DO USTAWIENIA  
**Opcje**:
1. Use YouTube Data API v3 (requires API key)
2. Skip metadata (just store URL)
3. Use oembed (lightweight alternative)

**Rekomendacja**: OPTION 2 (skip metadata for MVP)  
**Action**: Jeśli będzie YouTube API key, dodaj w Etap 2

**Pytanie**: Czy YouTube API key jest dostępny w projekcie?

---

### ❓ Pytanie 2: Image Compression/Optimization
**Status**: 🟡 OPCJONALNE  
**Opcje**:
1. Store original size only (simple, no processing)
2. Auto-compress to max 2MB (using sharp library)
3. Multiple sizes (thumbnail + medium + original)

**Rekomendacja**: OPTION 1 dla MVP  
**Action**: Jeśli potrzeba opt., dodaj w Etap 3

**Pytanie**: Czy potrzebna kompresja zdjęć dla szybszych transferów?

---

### ❓ Pytanie 3: Video Transcoding
**Status**: 🟡 PRZYSZŁOŚĆ  
**Opcje**:
1. NO transcoding (store original format)
2. Transcode to MP4 (universal format)
3. Multiple bitrates (adaptive streaming)

**Rekomendacja**: OPTION 1 dla MVP  
**Action**: Może być dodane w Etap 4

**Pytanie**: Czy video powinny być transkodowane do MP4?

---

### ❓ Pytanie 4: Data Retention Policy
**Status**: 🔴 DO USTAWIENIA  
**Opcje**:
1. Keep all media forever
2. Auto-delete old media (1 year)
3. Archive to cold storage
4. Manual cleanup

**Rekomendacja**: OPTION 1 (keep forever) dla MVP  
**Backup strategy**:
- Daily snapshots (Supabase)
- Monthly archive (cheaper storage)

**Pytanie**: Jakie jest minimum data retention requirement?

---

### ❓ Pytanie 5: Multimedia Privacy/Sharing
**Status**: 🟡 FUTURA  
**Opcje**:
1. All authenticated users can view all media
2. Team-based access (regional scouts only)
3. Private observations (scout-only)
4. Share links (public links to specific media)

**Rekomendacja**: OPTION 1 dla MVP  
**Action**: Może być zmienione w Etap 3+ based on feedback

**Pytanie**: Czy multimedia powinno mieć poziomy dostępu (private/shared)?

---

### ❓ Pytanie 6: Mobile Camera Integration
**Status**: 🟢 POTWIERDZONO (web camera API)  
**Implementacja**:
```html
<!-- Desktop camera -->
<input type="file" accept="image/*" capture="environment" />

<!-- Mobile camera -->
<input type="file" accept="video/*" capture="user" />
```

**Status**: Webowy aparat powinien pracować na iOS + Android

**Pytanie**: Czy potrzebujesz native app (React Native) czy wystarczy web?

---

### ❓ Pytanie 7: Watermarking / Branding
**Status**: 🟡 OPCJONALNE  
**Opcje**:
1. NO watermark (clean images)
2. Academy logo watermark (automatic)
3. Scout name watermark (metadata only)

**Rekomendacja**: OPTION 1 (no watermark) dla MVP  
**Action**: Może być dodane w Etap 4

**Pytanie**: Czy zdjęcia powinny mieć watermark akademii?

---

### ❓ Pytanie 8: Batch Export / Reports
**Status**: 🟡 FUTURA  
**Opcje**:
1. NO export (view only)
2. Export individual media (PDF/DOCX)
3. Batch export (ZIP all media for player)
4. Report generation (with photos)

**Rekomendacja**: OPTION 3 dla Etap 3+

**Pytanie**: Czy potrzebny export multimediów?

---

### ❓ Pytanie 9: Mobile App (Native)
**Status**: 🟡 PRZYSZŁOŚĆ  
**Opcje**:
1. Web only (PWA responsive)
2. React Native app (iOS + Android)
3. Native apps (Swift + Kotlin)

**Rekomendacja**: WEB ONLY dla MVP  
**Uzasadnienie**:
- PWA wystarczy dla offline
- Camera API works on mobile
- Szybszy development

**Pytanie**: Czy potrzebna natywna aplikacja mobilna?

---

### ❓ Pytanie 10: Analytics / Metrics
**Status**: 🟡 OPCJONALNE  
**Opcje**:
1. NO analytics (skip)
2. Basic metrics (upload count, file sizes)
3. Detailed analytics (user behavior, retention)
4. Sentry for error tracking

**Rekomendacja**: OPTION 2 (basic metrics) dla MVP  
**Action**: Setup error tracking (Sentry) w Etap 1

**Pytanie**: Jakie metryki są ważne dla stakeholders?

---

## 4. BLOCKING ISSUES & DEPENDENCIES

### 🔴 Critical Blocking Issues

| Issue | Impact | Solution | ETA |
|-------|--------|----------|-----|
| Supabase bucket NOT created | Can't upload | Create bucket + configure | ASAP |
| Database not migrated | Can't store metadata | Run migration script | ASAP |
| Backend API not stubbed | Can't test upload | Create API endpoints | Day 1 |

### 🟡 High Priority (but not blocking)

| Issue | Impact | Solution | ETA |
|-------|--------|----------|-----|
| YouTube API key missing | Can't fetch metadata | Skip for MVP | Etap 2 |
| Design review pending | May need rework | Schedule review meeting | This week |
| Accessibility requirements unclear | May rework later | Confirm WCAG level needed | This week |

---

## 5. STAKEHOLDER COMMUNICATION PLAN

### Meeting Schedule

**Kickoff Meeting** (Before Sprint 1 starts):
- [ ] Team introduction
- [ ] Requirements review
- [ ] Architecture overview
- [ ] Timeline confirmation
- [ ] Q&A

**Sprint Reviews** (End of each sprint):
- [ ] Demo of completed work
- [ ] Feedback collection
- [ ] Adjust priorities if needed

**Final Demo** (End of Etap 1):
- [ ] Full MVP demonstration
- [ ] Live testing on mobile
- [ ] Q&A + feedback
- [ ] Decision on Etap 2 (YouTube + Offline)

---

## 6. CHECKLIST PRZED IMPLEMENTACJĄ

**Deweloper powinien potwierdzić**:

- [ ] Przeczytałem/am całą specyfikację
  - [ ] ScoutPro_Multimedia_Requirements.md
  - [ ] ScoutPro_Multimedia_UX_Details.md
  - [ ] ScoutPro_Multimedia_Architecture.md

- [ ] Rozumiem architekturę
  - [ ] Frontend stack (React, TypeScript)
  - [ ] Backend (Supabase, PostgreSQL)
  - [ ] Storage (Supabase Storage, S3-compatible)
  - [ ] Offline sync (IndexedDB, Service Worker)

- [ ] Setup jest gotowy
  - [ ] Repository cloned & branches created
  - [ ] Node/npm/yarn working
  - [ ] Environment variables configured
  - [ ] Database migrations ready
  - [ ] API endpoints stubbed

- [ ] Mam pytania czy clarifications
  - [ ] Zapytaj o blocking questions
  - [ ] Clarify requirements jeśli niejasne
  - [ ] Zaproponuj optimizations

- [ ] Ready to start
  - [ ] Day 1: Sprint 1.1 kickoff

---

## 7. RESOURCE ALLOCATION

### Estimated Team Size

**Etap 1 (MVP)**: 2-3 engineers
- 1 Backend engineer (API + Database)
- 1-2 Frontend engineers (UI components)

**Etap 2 (YouTube + Offline)**: 2 engineers
- 1 Backend engineer (YouTube integration)
- 1 Frontend engineer (offline sync, PWA)

**Etap 3+ (Advanced)**: 1-2 engineers
- Part-time for optimizations

### Estimated Effort

```
Etap 1: 
├─ Backend: 5 days (40h)
├─ Frontend: 7 days (56h)
├─ QA: 2 days (16h)
└─ Total: ~112 hours (2-3 weeks)

Etap 2:
├─ Backend: 2 days (16h)
├─ Frontend: 5 days (40h)
└─ Total: ~56 hours (1-1.5 weeks)

Etap 3: 3-5 days (flexible)
```

---

## 8. POST-LAUNCH SUPPORT

### First Week Monitoring
- [ ] Monitor error rates (< 1%)
- [ ] Check upload success rates (> 99%)
- [ ] Monitor storage usage
- [ ] Collect user feedback
- [ ] Watch for network/timeout issues

### Bug Fix SLA
- Critical (features broken): 2h
- High (features degraded): 1 day
- Medium (edge cases): 3 days
- Low (cosmetic): next sprint

---

**Koniec dokumentu**

---

## SUMMARY & NEXT STEPS

✅ **Specyfikacja kompletna** - wszystkie wymagania zdokumentowane  
✅ **Architektura jasna** - tech stack, data flow, API contracts  
✅ **Implementation plan** - checklist, timeline, resource allocation  
✅ **Open items identified** - 10 pytań do rozwiązania  

### Następne kroki:

1. **Stakeholder review** (Przywski/Kierownik)
   - Przeczytaj cały materiał
   - Validate requirements
   - Approve timeline
   - Answer open questions

2. **Team kickoff** (Wszyscy inżynierowie)
   - Zrozumieć architekturę
   - Zacząć setup (bucket, migrations)
   - Confirm timeline

3. **Sprint 1.1 start**
   - Backend engineers: Database + API
   - Frontend engineers: UI components

---

**Dla pytań lub zmian**: Skontaktuj się z Przemkiem (analityk)

**Status**: ✅ **GOTOWE DO IMPLEMENTACJI**
