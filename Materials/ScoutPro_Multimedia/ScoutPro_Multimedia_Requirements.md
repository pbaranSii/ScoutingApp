# ScoutPro - Funkcja Dodawania Multimediów
## Analiza Wymagań i Plan Implementacji

**Data**: 10 lutego 2026  
**Przygotował**: Analityk UX/UI & Business Analyst  
**Status**: Etap 1 - Projekt Szczegółowy  
**Priorytet**: HIGH - Wsparcie głównego workflow scouting

---

## 1. KONTEKST BIZNESOWY

### 1.1 Problem
Skauting w akademii wymaga dokumentacji wizualnej obserwacji zawodników. Obecnie:
- Skauti i trenerzy nie mają scentralizowanego miejsca do przechowywania zdjęć i video z meczów
- Brakuje możliwości dołączania linków do materiałów video (YouTube, platformy streamingowe)
- Multimedia są rozproszone, trudne do odnalezienia w kontekście konkretnej obserwacji

### 1.2 Cel Funkcji
Umożliwić skautom i trenerom **szybkie wgranie multimediów podczas lub po obserwacji zawodnika** poprzez:
- Dołączanie zdjęć i video do obserwacji (mobilne + desktop)
- Dodawanie linków do materiałów video (YouTube itp.)
- Centralne przeglądanie wszystkich multimediów zawodnika na dedykowanej zakładce
- Dodawanie multimediów do profilu zawodnika niezależnie od obserwacji
- Usuwanie niepotrzebnych materiałów

### 1.3 Użytkownicy Docelowi
- **Skauti polowi** - dodawanie zdjęć/video ze stadionu (mobile-first)
- **Trenerzy** - przeglądanie i analiza materiałów
- **Kierownicy akademii** - zarządzanie zasobami multimediów

---

## 2. WYMAGANIA FUNKCJONALNE

### 2.1 Przepływ: Dodawanie Multimediów do Obserwacji

#### 2.1.1 Formularz Obserwacji - Sekcja Multimediów
**Lokalizacja**: W formularzu dodawania/edycji obserwacji zawodnika  
**Komponenty**:
- Przycisk "Dodaj multimedia" (ikona: kamera/galeria)
- Lista podglądów dodanych plików (miniatury)
- Dla każdego pliku: miniatura, typ (foto/video), nazwa, ikona usunięcia

**Funkcjonalność**:
```
[Przycisk: + Dodaj multimedia]

├─ Opcja 1: Aparat/Kamera (tylko mobile)
├─ Opcja 2: Galeria/Pliki urządzenia (mobile + desktop)
└─ Opcja 3: Wklej link do YouTube

[Podgląd dodanych plików]
├─ [Miniatura zdjęcia 1] [X]
├─ [Miniatura zdjęcia 2] [X]
├─ [Miniatura video 1] [X]
└─ [YouTube link] [X]
```

#### 2.1.2 Modal/Drawer Dodawania Plików (Mobile)
**Trigger**: Klik na "Dodaj multimedia"  
**Zawartość**:
```
═══════════════════════════════════════
   Dodaj multimedia do obserwacji
───────────────────────────────────────
□ Zrób zdjęcie (otwiera aparat)
□ Nagraj video (otwiera aparat w trybie video)
□ Wybierz z galerii (wybór wielokrotny)
│  (obsługuje JPG, PNG, MP4, MOV)
□ Wklej link YouTube
───────────────────────────────────────
[Cofnij] [Dodaj]
═══════════════════════════════════════
```

#### 2.1.3 Obsługa Plików Lokalnych
**Wspierane formaty**:
- Zdjęcia: `JPG`, `JPEG`, `PNG`
- Video: `MP4`, `MOV`

**Limity techniczne (rekomendowane)**:
- Maksymalny rozmiar pliku: **50 MB** (zdjęcie), **200 MB** (video)
- Maksymalna liczba multimediów na obserwację: **20**
- Maksymalna całkowita pojemność na zawodnika: **1 GB**
- Format przechowywania: Oryginalne formaty bez konwersji (oszczędność zasobów)

**Walidacja wgrania**:
- Sprawdzenie rozszerzenia pliku
- Sprawdzenie rozmiaru przed wgraniem
- Komunikat błędu jeśli format nieobsługiwany: "Format pliku nie jest wspierany. Obsługiwane: JPG, PNG, MP4, MOV"
- Komunikat błędu jeśli zbyt duży: "Plik jest zbyt duży (limit: 50 MB dla zdjęć, 200 MB dla video). Zmniejsz rozmiar i spróbuj ponownie."

**Przechowywanie w Supabase Storage**:
```
Struktura folderów:
┌─ scoutpro-media/
│  ├─ players/{player_id}/observations/{observation_id}/
│  │  ├─ {uuid}_{timestamp}.jpg
│  │  ├─ {uuid}_{timestamp}.mp4
│  │  └─ ...
│  └─ players/{player_id}/profile/
│     ├─ {uuid}_{timestamp}.jpg
│     └─ ...
```

#### 2.1.4 Obsługa Linków YouTube
**Formularz do wklejenia linku**:
```
[Input: Wklej link YouTube]
[Przycisk: Dodaj]
```

**Obsługiwane formaty URL**:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

**Walidacja**:
- Regex: `/^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.*/`
- Ekstrakcja VIDEO_ID
- Pobranie metadanych: miniatura, tytuł, długość (opcjonalnie z YouTube API)
- Błąd: "Niepoprawny link YouTube. Spróbuj ponownie."

**Przechowywanie metadanych**:
```json
{
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=...",
  "video_id": "...",
  "title": "...",
  "thumbnail_url": "...",
  "duration_seconds": 245
}
```

#### 2.1.5 Edycja Obserwacji - Zarządzanie Multimediami
**Funkcjonalność**:
- Przeglądanie dodanych multimediów (miniatury)
- Dodawanie nowych multimediów do istniejącej obserwacji
- Usuwanie poszczególnych plików (klik na [X])
- Potwierdzeń przed usunięciem: "Czy na pewno usunąć ten plik?"

---

### 2.2 Przepływ: Zakładka Multimedia w Profilu Zawodnika

#### 2.2.1 Struktura Interfejsu
**Lokalizacja**: Profil zawodnika → Zakładka "Multimedia"  
**Pozycja w nawigacji**: Po zakładce "Obserwacje"

```
┌─────────────────────────────────────┐
│ PROFIL ZAWODNIKA: Mateusz Izbicki   │
├─────────────────────────────────────┤
│ [Dane podstawowe] [Obserwacje] [MULTIMEDIA] [Porównanie]
├─────────────────────────────────────┤
│ Multimedia zawodnika (7 plików)      │
│                                      │
│ FILTROWANIE:                         │
│ [Wszystkie] [Zdjęcia] [Video] [Linki] │
│                                      │
│ GALERIA:                             │
│ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│ │ Zdjęcie 1│ │ Zdjęcie 2│ │ Video 1│ │
│ │(2025-09) │ │(2025-09) │ │(2025-08)│ │
│ └──────────┘ └──────────┘ └────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Link YouTube: "Mecz..." (2025-09)│ │
│ │ Długość: 3:45 min                │ │
│ └──────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 2.2.2 Komponenty Zakładki Multimedia

**A. Sekcja Filtrów**
```
Opcje filtrowania:
- Wszystkie (domyślnie)
- Zdjęcia
- Video (pliki)
- Linki (YouTube)
- Data: Od/Do (calendarz)
```

**B. Sekcja Galerii Zdjęć/Video**
- Układ: Grid responsywny (3 kolumny desktop, 2 mobile, 1 tablet)
- Każda pozycja zawiera:
  - Miniatura (aspect ratio 16:9 dla video, oryginalny dla zdjęć)
  - Typ ikony (📷 dla zdjęcia, 🎬 dla video)
  - Data obserwacji (formatowana: DD.MM.YYYY)
  - Nazwa obserwacji (źródło: np. "Mecz Ekstraklasa - Warszawa")
  - Akcje na hover: 
    - Przycisk "Podgląd" (ikona: powiększające się oko)
    - Przycisk "Usuń" (ikona: kosz, wymaga potwierdzenia)

**C. Sekcja Linków YouTube**
- Układ: Lista tekstowa (każdy link jako osobna pozycja)
- Każda pozycja zawiera:
  - Miniatura YouTube (pobrana z YouTube)
  - Tytuł video
  - Długość video (formatowanie: M:SS)
  - Data obserwacji
  - Przycisk "Otwórz" (otwiera w nowej karcie)
  - Przycisk "Usuń" (wymaga potwierdzenia)

#### 2.2.3 Modal Podglądu Multimediów
**Trigger**: Klik na miniaturę zdjęcia/video  
**Zawartość**:

**Dla zdjęć**:
```
┌─────────────────────────────────────┐
│ [<] Podgląd (2/5) [>]        [X]    │
├─────────────────────────────────────┤
│                                      │
│          [PEŁNE ZDJĘCIE]             │
│          (zoom możliwy)              │
│                                      │
├─────────────────────────────────────┤
│ Data: 15.09.2025                     │
│ Obserwacja: Mecz Ekstraklasa         │
│ Scout: Wojciech Majewski             │
│ [Pobierz] [Usuń] [Zamknij]           │
└─────────────────────────────────────┘
```

**Dla video (pliki)**:
```
┌─────────────────────────────────────┐
│ [<] Podgląd (1/3) [>]        [X]    │
├─────────────────────────────────────┤
│                                      │
│      [ODTWARZACZ VIDEO]              │
│      ▶ ────────●──────── :45/:30     │
│                                      │
│      [Kontrolki: play, volume, etc]  │
│                                      │
├─────────────────────────────────────┤
│ Data: 12.08.2025 | Rozmiar: 125 MB  │
│ Obserwacja: Turniej U14              │
│ Scout: Krystian Ambroziak            │
│ [Pobierz] [Usuń] [Zamknij]           │
└─────────────────────────────────────┘
```

**Dla linków YouTube**:
```
┌─────────────────────────────────────┐
│ [<] Podgląd (3/7) [>]        [X]    │
├─────────────────────────────────────┤
│  [EMBED YOUTUBE VIDEO]               │
│  ▶  Mecz Polska U17 - Niemcy (3:45)  │
├─────────────────────────────────────┤
│ Data: 20.09.2025                     │
│ Źródło: YouTube                      │
│ [Otwórz w YouTube] [Usuń] [Zamknij]  │
└─────────────────────────────────────┘
```

**Navigacja między plikami**:
- Przyciski < > do przechodzenia między multimediami
- Klawiatura: strzałki lewo/prawo
- Touch: swipe lewo/prawo (mobile)

#### 2.2.4 Dodawanie Multimediów bez Obserwacji
**Lokalizacja**: Przycisk na zakładce Multimedia  
**Przycisk**: "Dodaj multimedia do profilu" (ikona: +)

**Modal dodawania**:
```
┌──────────────────────────────────────────┐
│ Dodaj multimedia do profilu              │
├──────────────────────────────────────────┤
│                                          │
│ Zawodnik: Mateusz Izbicki (2008)         │
│                                          │
│ [Opcja 1: Zrób zdjęcie]                  │
│ [Opcja 2: Nagraj video]                  │
│ [Opcja 3: Wybierz z galerii]             │
│ [Opcja 4: Wklej link YouTube]            │
│                                          │
│ Powiążanie z obserwacją (opcjonalne):   │
│ [Dropdown: Brak / Mecz 15.09.2025 / ...] │
│                                          │
│ [Cofnij] [Dodaj]                         │
└──────────────────────────────────────────┘
```

**Zachowanie**:
- Multimedia może być dodane **bez** powiązania z konkretną obserwacją
- Jeśli brak powiązania → pojawia się w galerii jako "Bez obserwacji"
- Później można zmienić powiązanie w edycji multimediów

---

### 2.3 Usuwanie Multimediów

#### 2.3.1 Przepływ Usunięcia
**Trigger**: Klik na [X] / Przycisk "Usuń"

**Dialog potwierdzenia**:
```
┌─────────────────────────────────────┐
│ Potwierdź usunięcie                 │
├─────────────────────────────────────┤
│ Czy na pewno chcesz usunąć ten plik?│
│ Tej operacji nie można cofnąć.      │
│                                     │
│ [Anuluj] [Usuń]                     │
└─────────────────────────────────────┘
```

**Efekt usunięcia**:
1. Plik usuwany z Supabase Storage
2. Rekord usuwany z bazy danych
3. Interfejs aktualizowany (plik znika z galerii)
4. Komunikat potwierdzenia: "Plik usunięty"

---

### 2.4 Tryb Offline (PWA Sync)

#### 2.4.1 Scenariusz Offline
Scout na stadionie bez internetu:
1. Dodaje zdjęcia/video do obserwacji (zapisuje się lokalnie w IndexedDB)
2. Dodaje YouTube link (zapisuje się URL w IndexedDB)
3. Przychodzi do biura, łączy się z WiFi
4. System automatycznie synchronizuje multimedia do Supabase Storage

#### 2.4.2 Implementacja
**Lokalny Cache (IndexedDB)**:
```javascript
DB: scoutpro
├─ observations (zawiera multimedia metadata)
│  └─ {observation_id}
│     ├─ local_media: [{file, blob, status: 'pending'}, ...]
│     └─ youtube_links: [{url, status: 'pending'}, ...]
└─ pending_uploads: [{media_id, observation_id, file}]
```

**Synchronizacja**:
- Trigger: Nawiązanie połączenia (online event)
- Proces: Batching - wgrywanie wszystkich pending plików w backgrondzie
- Retry logic: 3 próby z exponential backoff
- UI feedback: Indikator synchronizacji ("Synchronizacja w toku...")

**Status multimediów**:
- `pending` - czeka na upload
- `syncing` - trwa wgrywanie
- `synced` - zsynchronizowane
- `error` - błąd, wymaga retry

---

## 3. WYMAGANIA TECHNICZNE

### 3.1 Stack Techniczny

**Frontend**:
- React 18 + TypeScript
- Mobile-first CSS (Tailwind/Styled Components)
- Biblioteka obsługi galerii: `react-photoswipe` lub `yet-another-react-lightbox`
- Obsługa wideo: HTML5 `<video>` tag
- Upload multifila: `react-dropzone` lub `uppy`

**Backend/Cloud**:
- Supabase Storage (bucket: `scoutpro-media`)
- Supabase Database (tabela: `multimedia`)
- YouTube API (opcjonalnie, do pobierania metadanych)

**Offline Sync**:
- IndexedDB API (wbudowany w przeglądarki)
- Service Worker (obsługa offline)

### 3.2 Model Danych

#### 3.2.1 Tabela: `multimedia`
```sql
CREATE TABLE multimedia (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  observation_id UUID NULL REFERENCES observations(id) ON DELETE CASCADE,
  
  -- Metadane pliku
  file_name VARCHAR(255) NOT NULL,
  file_type ENUM('image', 'video', 'youtube_link') NOT NULL,
  file_size INT,
  file_format VARCHAR(20), -- jpg, png, mp4, mov
  storage_path VARCHAR(512), -- ścieżka w Supabase Storage
  
  -- YouTube-specific
  youtube_url VARCHAR(512),
  youtube_video_id VARCHAR(20),
  youtube_title VARCHAR(500),
  youtube_thumbnail_url VARCHAR(512),
  youtube_duration_seconds INT,
  
  -- Metadane
  created_by UUID NOT NULL REFERENCES auth_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Status synchronizacji
  sync_status ENUM('pending', 'syncing', 'synced', 'error') DEFAULT 'pending',
  sync_error_message TEXT,
  
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (observation_id) REFERENCES observations(id),
  FOREIGN KEY (created_by) REFERENCES auth_users(id)
);

-- Indeksy
CREATE INDEX idx_multimedia_player_id ON multimedia(player_id);
CREATE INDEX idx_multimedia_observation_id ON multimedia(observation_id);
CREATE INDEX idx_multimedia_created_at ON multimedia(created_at DESC);
CREATE INDEX idx_multimedia_sync_status ON multimedia(sync_status);
```

#### 3.2.2 Tabela: `observations` - Rozszerzenie
```sql
-- Dodaj kolumnę jeśli nie istnieje
ALTER TABLE observations ADD COLUMN IF NOT EXISTS 
  multimedia_count INT DEFAULT 0;

-- Trigger do automatycznego aktualizowania liczby multimediów
CREATE OR REPLACE FUNCTION update_observation_media_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE observations 
    SET multimedia_count = multimedia_count + 1
    WHERE id = NEW.observation_id AND NEW.observation_id IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE observations 
    SET multimedia_count = multimedia_count - 1
    WHERE id = OLD.observation_id AND OLD.observation_id IS NOT NULL;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_count
AFTER INSERT OR DELETE ON multimedia
FOR EACH ROW
EXECUTE FUNCTION update_observation_media_count();
```

#### 3.2.3 Relacja z Obserwacją
```json
{
  "observation_id": "uuid",
  "player_id": "uuid",
  "observation_date": "2025-09-15",
  "scout": "Wojciech Majewski",
  "multimedia": [
    {
      "id": "uuid",
      "type": "image",
      "file_name": "IMG_20250915_144530.jpg",
      "storage_url": "scoutpro-media/players/.../observations/.../IMG_*.jpg",
      "thumbnail_url": "...",
      "created_at": "2025-09-15T14:45:30Z"
    },
    {
      "id": "uuid",
      "type": "video",
      "file_name": "VID_20250915_152015.mp4",
      "storage_url": "...",
      "duration": "00:35",
      "created_at": "2025-09-15T15:20:15Z"
    },
    {
      "id": "uuid",
      "type": "youtube_link",
      "youtube_url": "https://www.youtube.com/watch?v=...",
      "youtube_title": "Polska U17 vs Niemcy",
      "youtube_thumbnail": "...",
      "youtube_duration": 245,
      "created_at": "2025-09-15T16:00:00Z"
    }
  ]
}
```

### 3.3 API Endpoints (Supabase / Custom API)

#### 3.3.1 Upload Multimediów
```
POST /api/multimedia/upload
Content-Type: multipart/form-data

Request:
├─ player_id: UUID (required)
├─ observation_id: UUID (optional)
├─ file: File (required)
│  └─ Max size: 50MB (image), 200MB (video)
│  └─ Supported: JPG, PNG, MP4, MOV
└─ created_by: UUID (from auth context)

Response: 201 Created
{
  "id": "uuid",
  "player_id": "uuid",
  "observation_id": "uuid",
  "file_name": "IMG_*.jpg",
  "file_type": "image",
  "storage_path": "scoutpro-media/players/.../",
  "storage_url": "https://...",
  "thumbnail_url": "https://...",
  "created_at": "2025-09-15T14:45:30Z",
  "sync_status": "synced"
}

Error: 400 Bad Request
{
  "error": "File too large",
  "message": "Maksymalny rozmiar pliku: 50MB"
}
```

#### 3.3.2 Dodawanie YouTube Link
```
POST /api/multimedia/youtube
Content-Type: application/json

Request:
{
  "player_id": "uuid",
  "observation_id": "uuid (optional)",
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "created_by": "uuid"
}

Response: 201 Created
{
  "id": "uuid",
  "player_id": "uuid",
  "observation_id": "uuid",
  "file_type": "youtube_link",
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "youtube_video_id": "...",
  "youtube_title": "Polska U17 vs Niemcy",
  "youtube_thumbnail_url": "https://img.youtube.com/vi/.../0.jpg",
  "youtube_duration_seconds": 245,
  "created_at": "2025-09-15T16:00:00Z"
}
```

#### 3.3.3 Pobranie Multimediów Zawodnika
```
GET /api/multimedia/player/{player_id}?type=all|image|video|youtube

Response: 200 OK
{
  "player_id": "uuid",
  "total_count": 7,
  "media": [
    { /* multimedia object */ },
    { /* multimedia object */ }
  ]
}
```

#### 3.3.4 Pobranie Multimediów Obserwacji
```
GET /api/multimedia/observation/{observation_id}

Response: 200 OK
{
  "observation_id": "uuid",
  "player_id": "uuid",
  "media_count": 3,
  "media": [
    { /* multimedia object */ }
  ]
}
```

#### 3.3.5 Usunięcie Multimediów
```
DELETE /api/multimedia/{multimedia_id}

Response: 204 No Content

Error: 404 Not Found
{
  "error": "Multimedia not found"
}
```

### 3.4 Bezpieczeństwo

#### 3.4.1 Row-Level Security (Supabase)
```sql
-- Polityka dostępu do tabeli multimedia
CREATE POLICY "All authenticated users can view media"
  ON multimedia
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own media"
  ON multimedia
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own media"
  ON multimedia
  FOR DELETE
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM observations o
    WHERE o.id = multimedia.observation_id
    AND o.created_by = auth.uid()
  ));
```

#### 3.4.2 Validacja Plików
- Server-side MIME type check (magic bytes)
- Quarantine stage - nowe pliki przechowywane w osobnym folderze do weryfikacji
- Antivirus scan (opcjonalnie: Supabase Integration)
- Brak dostępu do surowych path - tylko przez Storage API

#### 3.4.3 Obsługa CORS
```
Supabase Storage CORS:
Access-Control-Allow-Origin: https://yourapp.com
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 4. USER EXPERIENCE (UX)

### 4.1 Mobile-First Design

#### 4.1.1 Formularz Obserwacji (Mobile)
```
┌─────────────────────────────────┐
│ Nowa obserwacja                 │
├─────────────────────────────────┤
│                                 │
│ Zawodnik: [Dropdown zawodnika] │
│ Data: [15.09.2025]              │
│ Pozycja: [4/5]                  │
│                                 │
│ ── MULTIMEDIA ──                │
│ [+ Dodaj multimedia]            │
│ ┌─────────┐ ┌─────────┐         │
│ │  [📷]   │ │  [📹]   │         │
│ │ Zdjęcie1│ │ Video1  │         │
│ │   [X]   │ │   [X]   │         │
│ └─────────┘ └─────────┘         │
│                                 │
│ Ocena: [Suwak 1-5]              │
│ Notatka: [Textarea]             │
│                                 │
│ [Anuluj] [Zapisz obserwację]    │
└─────────────────────────────────┘
```

#### 4.1.2 Akcje Szybkie (Mobile Context Menu)
```
Długie naciśnięcie na miniatuę:
┌────────────────┐
│ Podgląd        │
│ Usuń           │
│ Pobierz        │
└────────────────┘
```

### 4.2 Desktop Workflow

#### 4.2.1 Formularz Obserwacji (Desktop)
- Layout side-by-side: formularz (lewa) + podgląd multimediów (prawa)
- Drag & drop area dla multimediów
- Możliwość wgrania wielu plików naraz

#### 4.2.2 Galeria Zawodnika (Desktop)
- Mosaic layout (Pinterest-style) dla zdjęć
- Lightbox na fullscreen
- Batch operations: select, delete multiple

### 4.3 Feedbacki i Komunikaty

#### 4.3.1 Komunikaty Powodzenia
- Zdjęcie dodane: "✓ Zdjęcie dodane pomyślnie"
- Plik usunięty: "✓ Plik usunięty"
- Wszystko zsynchronizowane: "✓ Wszystko zsynchronizowane"

#### 4.3.2 Komunikaty Błędu
- Format nieobsługiwany: "❌ Format pliku nie jest wspierany"
- Za duży rozmiar: "❌ Plik za duży (limit: 50 MB)"
- Brak internetu: "⚠ Brak połączenia. Multimedia zostanie wysłane po nawiązaniu połączenia."
- Błąd upload: "❌ Błąd przesyłania. Spróbuj ponownie." [Retry button]

#### 4.3.3 Loadingbar
- Podczas uploadu: procent postępu (0-100%)
- Podczas synchronizacji offline: indykator statusu

### 4.4 Accessibility

- **Alt text dla zdjęć**: Auto-generate na podstawie date + observation
- **Keyboard navigation**: Tab, Enter, Delete, Arrows
- **Screen reader support**: ARIA labels na ikonach
- **Touch targets**: Min 44x44 px (mobile)
- **Color contrast**: WCAG AA standard

---

## 5. PLAN IMPLEMENTACJI (ROADMAP)

### 5.1 Etap 1: MVP (Iteracja 1) - 2 tygodnie

**Cele**:
- Obsługa podstawowego uploadu zdjęć/video
- Przechowywanie w Supabase Storage
- Wyświetlanie w formularzu obserwacji
- Usuwanie plików

**Komponenty do zbudowania**:
- `MediaUploadButton` - przycisk + input file
- `MediaPreview` - miniatury dodanych plików
- `MediaGallery` - grid galerii
- `MediaViewer` - modal podglądu
- `MediaUploadService` - logika uploadu do Supabase

**Baza danych**:
- Tabela `multimedia` (basic)
- RLS policies

**Nie wliczone w MVP**:
- YouTube links (Etap 2)
- Offline sync (Etap 2)
- Drag & drop reorder (Etap 3)
- Advanced filters (Etap 3)

### 5.2 Etap 2: YouTube + Offline (Iteracja 2) - 1,5 tygodnia

**Cele**:
- Dodawanie YouTube links
- Offline sync z IndexedDB
- Background upload

**Komponenty**:
- `YouTubeInput` - input + validation + metadata fetch
- `OfflineSyncManager` - Service Worker integration
- `PendingMediaQueue` - UI dla oczekujących multimediów

### 5.3 Etap 3: Zaawansowane Funkcje (Iteracja 3) - 1 tydzień

**Cele**:
- Drag & drop reordering
- Batch operations
- Advanced filters by type, date

**Komponenty**:
- `SortableMediaGallery` - drag & drop
- `MediaFilters` - filter UI
- `BatchActions` - multi-select, delete

### 5.4 Etap 4: Optymalizacje (Iteracja 4) - opcjonalnie

**Cele**:
- Image compression
- Video thumbnail generation
- CDN caching
- Analytics

---

## 6. PRZYPADKI UŻYCIA (USER SCENARIOS)

### Scenario A: Scout na Stadionie
```
1. Scout obserwuje mecz
2. Podczas/po meczu otwiera ScoutPro na telefonie
3. Tworzy nową obserwację zawodnika
4. Klik: "+ Dodaj multimedia"
5. Wybiera: "Zrób zdjęcie" (lub "Wybierz z galerii")
6. Robi 3 zdjęcia zawodnika w akcji
7. Dodaje notatkę o grze
8. Zapisuje obserwację
→ Zdjęcia czekają na upload (status: pending)
→ Kiedy scout wraca do biura, system synchronizuje multimediów
```

### Scenario B: Trener Analizuje Zawodnika
```
1. Trener otwiera profil zawodnika
2. Przechodzi na zakładkę "Multimedia"
3. Widzi wszystkie zdjęcia i video
4. Filtruje: "Tylko video"
5. Klik na video → lightbox z odtwarzaczem
6. Obserwuje grę, analizuje technikę
7. Wraca do galerii, sprawdza zdjęcia
```

### Scenario C: Kierownik Akademii - Zarządzanie
```
1. Kierownik otwiera zawodnika z highest priority
2. Przegląda wszystkie multimedia
3. Zauważa zbyt małą liczbę video
4. Dodaje link YouTube do turnieju z zawodnikiem
5. Prosi scoutów o dodatkowe obserwacje
```

### Scenario D: Offline Scenario
```
1. Scout jest na stadionie, brak internetu
2. Dodaje obserwację ze zdjęciami (IndexedDB local save)
3. Zdjęcia mają status: "Oczekujące na sync"
4. Scout widzi: "⚠ Synchronizacja będzie dostępna po nawiązaniu internetu"
5. Wraca do biura, łączy WiFi
6. System automatycznie zaczyna wgrywanie
7. Progress bar: "Synchronizacja: 45%"
8. Po zakończeniu: "✓ Wszystko zsynchronizowane"
```

---

## 7. METRYKI POWODZENIA (KPIs)

### 7.1 Adoption Metrics
- % scautów dodających multimedia w obserwacjach: **target 80%** w ciągu miesiąca
- Średnia liczba plików na obserwację: **target 2-3**
- Liczba YouTube linków dodanych: **track monthly growth**

### 7.2 Performance Metrics
- Średni czas uploadu (50MB zdjęcie): **< 5 sekund** (4G+)
- Czas ładowania galerii: **< 2 sekundy** (20 zdjęć)
- Offline sync success rate: **> 99%**
- Error rate na upload: **< 1%**

### 7.3 User Experience Metrics
- User satisfaction: **NPS > 7/10** (survey)
- Feature discovery: **> 70%** scautów wie o funkcji
- Usability: **SUS score > 70** (System Usability Scale)

---

## 8. INTEGRACJA Z ISTNIEJĄCĄ ARCHITEKTURĄ

### 8.1 Połączenie z Obserwacjami
```
Observations Table ←→ Multimedia Table
├─ observation.multimedia_count (COUNT)
├─ observation.media_preview (first thumbnail URL)
└─ API: GET /api/observations/{id}/media
```

### 8.2 Połączenie z Profilem Zawodnika
```
Players Table ←→ Multimedia Table
├─ player.total_media_count (SUM)
├─ player.last_media_date (MAX created_at)
└─ API: GET /api/players/{id}/media
```

### 8.3 Wspólne Komponenty
- `MediaPreview` - wyświetlanie miniatur w listach
- `MediaContext` - React Context dla globalnego state multimediów
- `useMediaUpload` - custom hook dla uploadu

---

## 9.ESTING & QA

### 9.1 Test Cases - Upload

| Case | Scenario | Expected | Priority |
|------|----------|----------|----------|
| T1 | Upload JPG < 50MB | Success | CRITICAL |
| T2 | Upload MP4 < 200MB | Success | CRITICAL |
| T3 | Upload > size limit | Error msg | HIGH |
| T4 | Upload unsupported format | Error msg | HIGH |
| T5 | Concurrent uploads (5 files) | All succeed | MEDIUM |
| T6 | Network interrupted mid-upload | Retry or offline queue | HIGH |

### 9.2 Test Cases - YouTube

| Case | Scenario | Expected | Priority |
|------|----------|----------|----------|
| T7 | Valid YouTube URL | Link added | CRITICAL |
| T8 | Invalid YouTube URL | Error msg | HIGH |
| T9 | Metadata fetched | Title + thumbnail shown | MEDIUM |
| T10 | Broken YouTube link | Graceful error | MEDIUM |

### 9.3 Test Cases - Offline

| Case | Scenario | Expected | Priority |
|------|----------|----------|----------|
| T11 | Add media offline | Queued locally | CRITICAL |
| T12 | Sync after online | Files uploaded | CRITICAL |
| T13 | Sync with conflicts | Last-write-wins | MEDIUM |

### 9.4 Test Cases - UX

| Case | Scenario | Expected | Priority |
|------|----------|----------|----------|
| T14 | Delete media | Confirmation dialog | CRITICAL |
| T15 | View full image | Lightbox opens | HIGH |
| T16 | Mobile camera | Captures photo | HIGH |
| T17 | Keyboard navigation | Full accessibility | MEDIUM |

### 9.5 Performance Testing
- Load 100 media items: **< 2s**
- Render gallery with 50 images: **60 FPS**
- Upload stress test (1GB total): **No crashes**

---

## 10. DOKUMENTACJA & HANDOFF

### 10.1 Developer Documentation
- **Tech Specs**: React components, API endpoints, DB schema
- **Code Examples**: Upload service, offline sync manager
- **Environment Setup**: Supabase bucket config, API keys
- **Error Handling**: Standardized error codes
- **Testing Guide**: Jest/RTL test patterns

### 10.2 User Documentation
- **How-To Guide**: Dodaj zdjęcie do obserwacji, przeglądaj multimedia
- **Mobile Tips**: Używaj aparatu vs galeria
- **Troubleshooting**: "Why is my upload slow?", "How do I delete a file?"

### 10.3 Admin Documentation
- **Storage Management**: Monitor storage usage, cleanup policies
- **Backup**: Daily backup strategy for Supabase
- **Compliance**: GDPR - data retention policy

---

## 11. HARMONOGRAM & OŚ CZASU

```
┌─────────────────────────────────────────────────────────────┐
│ MULTIMEDIA FEATURE - TIMELINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ WEEK 1 (Feb 10-16): Etap 1 - MVP                          │
│ ├─ Day 1-2: Setup Supabase Storage, Database              │
│ ├─ Day 3-4: Build MediaUpload, MediaPreview components   │
│ ├─ Day 5: Gallery + Lightbox                              │
│ └─ Day 6-7: Testing, Bug fixes, Code review               │
│                                                             │
│ WEEK 2 (Feb 17-23): Etap 2 - YouTube + Offline           │
│ ├─ Day 1-2: YouTube URL validation + metadata fetch      │
│ ├─ Day 3-4: IndexedDB sync, Service Worker               │
│ ├─ Day 5: Background upload logic                         │
│ └─ Day 6-7: Offline testing, Integration test             │
│                                                             │
│ WEEK 3 (Feb 24-Mar 2): Etap 3 - Zaawansowane             │
│ ├─ Day 1-2: Drag & drop, Filter UI                       │
│ ├─ Day 3-4: Batch operations                              │
│ └─ Day 5-7: E2E testing, Performance opt.                 │
│                                                             │
│ WEEK 4 (Mar 3-9): Release Prep                            │
│ ├─ Security audit                                         │
│ ├─ Performance testing                                    │
│ ├─ Documentation                                          │
│ └─ Stakeholder demo                                       │
│                                                             │
│ TARGET GO-LIVE: Mid-March 2026                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. PYTANIA DO WYJAŚNIENIA (OPEN ITEMS)

### Przed Startem Implementacji:
- [ ] Czy YouTube API key jest dostępny w projekcie?
- [ ] Czy Supabase Storage bucket jest już skonfigurowany?
- [ ] Czy istnieje policy przechowywania danych (retention policy)?
- [ ] Czy multimedia powinna być dostępna w API eksportów (CSV)?
- [ ] Czy trzeba integrować z systemem logowania/auditowania akcji?

### W Trakcie Implementacji:
- [ ] Czy potrzebna kompresja zdjęć (PIL/ImageMagick)?
- [ ] Czy generować automatyczne thumbnails dla video?
- [ ] Czy implementować watermarking dla zdjęć?

### Po MVP:
- [ ] User feedback na UX multimediów
- [ ] Performance na rzeczywistych danych
- [ ] Czy rozszerzyć na obsługę PDFów (skauta raportów)?

---

## KONKLUZJA

Funkcja dodawania multimediów jest **kluczowa dla efektywności skautingu**. Plan implementacji zakłada iteracyjne dostarczanie wartości:
1. **MVP (Tygodniu 1-2)**: Upload, storage, basic gallery
2. **Iteracja 2**: YouTube + offline sync
3. **Iteracja 3**: Advanced features

Zespół powinien być gotowy na start w poniedziałek (10 lutego). Dokumentacja zawiera wszystkie szczegóły potrzebne do szybkiego desenvolvents bez blokujących pytań.

---

**Przygotował**: Przemek - Analityk UX/UI & Business Analyst  
**Data**: 10.02.2026  
**Status**: ✅ Gotowe do Development Handoff
