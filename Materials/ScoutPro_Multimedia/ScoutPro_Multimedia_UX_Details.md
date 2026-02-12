# ScoutPro - Wymagania UX/UI dla Multimediów
## Formularz Obserwacji + Edycji & Zakładka Multimedia

---

## 1. FORMULARZ OBSERWACJI - INTEGRACJA MULTIMEDIÓW

### 1.1 Lokalizacja w Formularzu

```
┌─────────────────────────────────────────────────────────┐
│ NOWA OBSERWACJA ZAWODNIKA                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sekcja 1: DANE PODSTAWOWE                             │
│  ├─ Zawodnik: [Dropdown/Search]                        │
│  ├─ Data obserwacji: [Data picker]                     │
│  ├─ Mecz/Turniej: [Text input]                         │
│  └─ Pozycja: [Dropdown: GK, FB, CB, CM, W, S]          │
│                                                         │
│  Sekcja 2: OCENA (Position-specific template)          │
│  ├─ Technika: [Slider 1-5]                             │
│  ├─ Fizyka: [Slider 1-5]                               │
│  └─ Mentalność: [Slider 1-5]                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Sekcja 3: MULTIMEDIA 🎥                         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │  [+ Dodaj multimedia]                           │   │
│  │  (Zdjęcia, Video, YouTube link)                 │   │
│  │                                                 │   │
│  │  Dodane pliki (3):                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐         │   │
│  │  │  [IMG]   │ │  [IMG]   │ │  [VID]   │         │   │
│  │  │  photo1  │ │  photo2  │ │  video1  │         │   │
│  │  │   [X]    │ │   [X]    │ │   [X]    │         │   │
│  │  └──────────┘ └──────────┘ └──────────┘         │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Sekcja 4: NOTATKI                                     │
│  └─ Komentarz: [Textarea - wolny tekst]               │
│                                                         │
│  Akcje:                                                 │
│  [← Anuluj] ────────────────── [Zapisz obserwację ✓]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Sekcja Multimediów - Szczegóły

#### 1.2.1 Przycisk "Dodaj Multimedia"

**Style Button**:
- Typ: Primary button z ikoną
- Ikona: 📷 (camera) / 🎬 (video)
- Label: "+ Dodaj multimedia"
- Hover: Zmiana koloru, shadow effect
- Active: Depressed state

**Położenie**: Nad galerią podglądu

**Responsive**:
- Mobile: Full width, 48px height
- Desktop: Auto width, 40px height

#### 1.2.2 Modal/Drawer - Dodawanie Multimediów

**Trigger**: Klik na "Dodaj multimedia"

**Mobile - Drawer od dołu (Bottom Sheet)**:
```
┌─────────────────────────────┐ ↓ Można przetasować w górę
│  Dodaj multimedia            │
├─────────────────────────────┤
│                             │
│ 📷 Zrób zdjęcie             │ ← Tap to open camera
│                             │
│ 🎬 Nagraj video             │ ← Tap to open video camera
│                             │
│ 🖼️ Wybierz z galerii        │ ← Tap to open file picker
│    (wielokrotny wybór)      │   [Multiple files] ✓
│                             │
│ 🔗 Wklej link YouTube       │ ← Input field
│    [https://youtube.com/...] │
│    [Dodaj]                  │
│                             │
├─────────────────────────────┤
│ [Zamknij]                   │
└─────────────────────────────┘
```

**Desktop - Modal (Centered)**:
```
┌─────────────────────────────────────┐
│ Dodaj multimedia                 [X] │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📷 Zrób zdjęcie                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎬 Nagraj video                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🖼️  Wybierz z galerii           │ │
│ │ (przytrzymaj Ctrl dla wielokr.) │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Link YouTube:                   │ │
│ │ [https://youtube.com/watch?v=..] │ │
│ │ [Dodaj link]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│            [Zamknij]                │
└─────────────────────────────────────┘
```

#### 1.2.3 Galeria Miniatur - Podgląd

**Layout - Mobile**:
```
Dodane multimedia (3 pliki):

[📷 IMG]    [📷 IMG]
[photo1]    [photo2]
[  X  ]     [  X  ]

[🎬 VID]
[video1]
[  X  ]
```

**Layout - Desktop**:
```
Dodane multimedia (5 plików):

[📷] IMG_001   [📷] IMG_002   [🎬] VID_001
[  X  ]        [  X  ]        [  X  ]

[📷] IMG_003   [🔗] YouTube   [  +  ]
[  X  ]        [  X  ]        Dodaj więcej
```

**Miniatura - Specyfikacja**:

| Właściwość | Wartość |
|-----------|---------|
| Rozmiar | 80x80px (mobile), 100x100px (desktop) |
| Border-radius | 8px |
| Aspect-ratio | 1:1 (square) |
| Object-fit | cover |
| Border | 2px solid #e0e0e0 on hover |
| Position na ikonę X | top-right corner, 8px padding |
| Ikona X | 20x20px, white, bg-dark-semi-transparent |

**Hover Effects**:
- Brightness: -10%
- Overlay: "Usuń? [X]" appears
- Cursor: pointer

**Ikony Typów**:
- 📷 dla JPG/PNG
- 🎬 dla MP4/MOV
- 🔗 dla YouTube link

---

## 2. EDYCJA OBSERWACJI

### 2.1 Zachowanie Edycji

**Scenariusz**: Użytkownik wraca do istniejącej obserwacji

```
1. Otwiera obserwację (z listy lub z profilu zawodnika)
2. Klik [Edytuj] (lub Edit mode automatycznie włącza się)
3. Widzi wszystkie dotychczasowe multimedia
4. Może dodać nowe multimedia (klik "+ Dodaj multimedia")
5. Może usunąć istniejące multimedia (klik X na miniaturze)
6. Może zastąpić multimedia (usunąć stare, dodać nowe)
7. Zapisuje zmiany [Zapisz] lub [Aktualizuj obserwację]
```

### 2.2 Interfejs Edycji

```
┌─────────────────────────────────────────────────────────┐
│ EDYTUJ OBSERWACJĘ                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Zawodnik: Mateusz Izbicki (2008)    [zmienić?]         │
│ Data obserwacji: 15.09.2025                             │
│ Pozycja: 4/5                                            │
│                                                         │
│ Sekcja: MULTIMEDIA                                      │
│ ─────────────────────────────────────────────────      │
│                                                         │
│ Dodane pliki (5):                                       │
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│ │  [📷]    │ │  [📷]    │ │  [🎬]    │                 │
│ │  photo1  │ │  photo2  │ │  video1  │                 │
│ │ 15.09.25 │ │ 15.09.25 │ │ 15.09.25 │                 │
│ │  [X]     │ │  [X]     │ │  [X]     │                 │
│ └──────────┘ └──────────┘ └──────────┘                 │
│                                                         │
│ ┌──────────┐ ┌──────────┐                               │
│ │  [🔗]    │ │  [+]     │                               │
│ │YouTube   │ │Dodaj     │                               │
│ │  [X]     │ │więcej    │                               │
│ └──────────┘ └──────────┘                               │
│                                                         │
│ [+ Dodaj multimedia]                                    │
│                                                         │
│ ─────────────────────────────────────────────────      │
│                                                         │
│ Akcje:                                                  │
│ [← Anuluj] ───────────────── [Aktualizuj obserwację ✓] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Potwierdzeń przy Usuwaniu Multimedia

```
Dialog potwierdzenia:
┌──────────────────────────────────────┐
│ Potwierdź usunięcie                  │
├──────────────────────────────────────┤
│                                      │
│ Czy na pewno chcesz usunąć ten plik?│
│ [Miniatura zdjęcia]                  │
│ Tej operacji nie można cofnąć.       │
│                                      │
│ [Nie, wróć] ───────── [Tak, usuń ✓] │
│                                      │
└──────────────────────────────────────┘
```

**Opcje**:
- Przycisk X na miniatuze → confirmation dialog
- Przycisk delete na expanded view → confirmation dialog
- Bulk delete checkbox + delete button → mass confirmation

---

## 3. ZAKŁADKA MULTIMEDIA W PROFILU ZAWODNIKA

### 3.1 Layout Główny

```
┌──────────────────────────────────────────────────────────┐
│ PROFIL ZAWODNIKA: Mateusz Izbicki (2008)                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Dane] [Obserwacje] [MULTIMEDIA] [Porównanie] [Kontakty]│
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Multimedia zawodnika (12 plików)                        │
│                                                          │
│ [Wszystkie] [📷 Zdjęcia (7)] [🎬 Video (3)] [🔗 Linki (2)]│
│                                                          │
│ Sortowanie: [Recent ▼]                                  │
│                                                          │
│ [+ Dodaj multimedia]                                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ GALERIA:                                                │
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ [📷]     │ │ [📷]     │ │ [📷]     │ │ [🎬]     │    │
│ │ photo1   │ │ photo2   │ │ photo3   │ │ video1   │    │
│ │ 15.09.25 │ │ 15.09.25 │ │ 12.08.25 │ │ 12.08.25 │    │
│ │ Mecz...  │ │ Mecz...  │ │ Turniej..│ │ Turniej..│    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ [📷]     │ │ [📷]     │ │ [🎬]     │ │ [🔗]     │    │
│ │ photo4   │ │ photo5   │ │ video2   │ │YouTube   │    │
│ │ 05.08.25 │ │ 02.08.25 │ │ 31.07.25 │ │ 20.09.25 │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│ ... [Więcej artykułów]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Filtry

**Button Group - Responsive**:

Mobile:
```
[Wszystkie] [Foto] [Video] [Linki]
(scrolls horizontally)
```

Desktop:
```
[Wszystkie] [Zdjęcia (7)] [Video (3)] [Linki (2)]
```

**Zachowanie filtru**:
- Default: "Wszystkie"
- Klik na filtr → aktualizacja galerii (animation: fade)
- Aktywny filtr: highlighted background
- Liczba licznik w nawiasach

**Filtry zaawansowane (future)**:
```
Sortowanie: [Recent ▼]
Opcje:
├─ Recent (newest first)
├─ Oldest first
├─ Largest files
└─ By observation date
```

### 3.3 Sekcja "Dodaj Multimedia"

**Przycisk**:
```
[+ Dodaj multimedia]
```

**Lokalizacja**: 
- Nad galerią (desktop)
- W sticky header (mobile)

**Klik** → Otwiera modal "Dodaj multimedia do profilu"

### 3.4 Galeria - Komponenty

#### A. Zdjęcia (Grid Layout)

```
Responsive breakpoints:
├─ Mobile: 2 kolumny
├─ Tablet: 3 kolumny
└─ Desktop: 4 kolumny

Każda pozycja (Card):
┌──────────────────┐
│                  │
│    [Zdjęcie]     │ ← Image z hover darkening
│                  │
│ ┌────────────────┤
│ │ 📷             │ ← Type icon
│ │ 15.09.2025     │ ← Date
│ │ Mecz...        │ ← Observation name (2 linii max)
│ │                │
│ │ [👁️] [🗑️]      │ ← Action buttons (appear on hover)
│ └────────────────┘
└──────────────────┘
```

**Akcje on hover**:
- Eye icon: Klik → Lightbox podgląd
- Trash icon: Klik → Confirmation dialog

#### B. Video (Grid Layout)

```
┌──────────────────┐
│                  │
│  [Video Thumb]   │ ← Auto-generated or first frame
│  ▶ [Overlay]     │ ← Play button overlay
│                  │
│ ┌────────────────┤
│ │ 🎬             │
│ │ 12.08.2025     │
│ │ Turniej U14    │
│ │ 2:45           │ ← Duration (if available)
│ │                │
│ │ [👁️] [🗑️]      │
│ └────────────────┘
└──────────────────┘
```

#### C. YouTube Links (List Layout)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│ [YouTube Thumbnail]  Polska U17 vs Niemcy         │
│  (105 x 60)          3:45 | 20.09.2025            │
│                                                    │
│                      [🔗 Otwórz] [🗑️ Usuń]        │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Layouty alternatywne**:
- Compact: Thumbnail + title + actions (inline)
- Expanded: Thumbnail + full info + actions

### 3.5 Modal Podglądu (Lightbox)

#### A. Podgląd Zdjęcia

```
┌───────────────────────────────────────────┐
│ [<] Zdjęcie (2 z 7) [>]          [X]      │
├───────────────────────────────────────────┤
│                                           │
│              [PEŁNE ZDJĘCIE]              │
│              (możliwość zoom)             │
│              (touch: pinch-to-zoom)       │
│                                           │
│                                           │
│            (double-tap: auto zoom)        │
│                                           │
├───────────────────────────────────────────┤
│                                           │
│ 📷 Zdjęcie nr 2                           │
│ Data: 15.09.2025 | Rozmiar: 2.4 MB       │
│ Obserwacja: Mecz Ekstraklasa - Warszawa  │
│ Scout: Wojciech Majewski                 │
│                                           │
│ [Pobierz] [Usuń] [Zamknij]               │
│                                           │
└───────────────────────────────────────────┘
```

**Keyboard Navigation**:
- Arrow left/right: Previous/next
- Escape: Close
- Delete: Delete file (with confirmation)
- Z: Zoom mode toggle
- D: Download

**Touch Navigation**:
- Swipe left/right: Previous/next
- Pinch: Zoom in/out
- Double-tap: Auto zoom
- Tap: Hide/show controls

#### B. Podgląd Video

```
┌───────────────────────────────────────────┐
│ [<] Video (1 z 3) [>]            [X]     │
├───────────────────────────────────────────┤
│                                           │
│         [VIDEO PLAYER]                    │
│         ▶  ──────●──── :45/:30            │
│            🔇 ☷  ⛶  ⊕                    │
│                                           │
│        (HTML5 video element)              │
│                                           │
├───────────────────────────────────────────┤
│                                           │
│ 🎬 Video nr 1                             │
│ Data: 12.08.2025 | Rozmiar: 125 MB       │
│ Czas trwania: 2:45 | Obserwacja: Turniej │
│ Scout: Krystian Ambroziak                │
│                                           │
│ [Pobierz] [Usuń] [Zamknij]               │
│                                           │
└───────────────────────────────────────────┘
```

**Kontrolki wideo**:
- Play/Pause
- Timeline scrubber
- Volume control
- Fullscreen
- Settings (speed, quality)

#### C. Podgląd YouTube Link

```
┌───────────────────────────────────────────┐
│ [<] Link YouTube (3 z 7) [>]     [X]     │
├───────────────────────────────────────────┤
│                                           │
│     [YOUTUBE EMBED]                       │
│     ▶  Polska U17 vs Niemcy (3:45)       │
│                                           │
│     (iframe embed)                        │
│                                           │
├───────────────────────────────────────────┤
│                                           │
│ 🔗 YouTube Link                           │
│ Tytuł: Polska U17 vs Niemcy               │
│ Długość: 3:45 | 20.09.2025               │
│ Źródło: YouTube                           │
│                                           │
│ [Otwórz w YouTube] [Usuń] [Zamknij]      │
│                                           │
└───────────────────────────────────────────┘
```

---

## 4. MODAL DODAWANIA MULTIMEDIA DO PROFILU

### 4.1 Trigger

**Lokalizacja**: Przycisk "Dodaj multimedia" na zakładce Multimedia  
**Pozycja**: Top section, przed galerią

### 4.2 Treść Modalu

```
┌──────────────────────────────────────────────┐
│ Dodaj multimedia do profilu zawodnika        │
├──────────────────────────────────────────────┤
│                                              │
│ Zawodnik: Mateusz Izbicki (2008)             │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 📷 Zrób zdjęcie (camera)                 │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🎬 Nagraj video (video camera)           │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🖼️  Wybierz z galerii urządzenia          │ │
│ │ (wielokrotny wybór plików)               │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🔗 Wklej link YouTube                    │ │
│ │ [https://youtube.com/watch?v=...]       │ │
│ │ [Dodaj link]                             │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Powiąż z obserwacją (opcjonalne):            │
│ [Dropdown: Brak / Mecz 15.09.2025 / ...]    │
│                                              │
│ ┌─ Bez powiązania (pojawi się bez obserwacji)
│                                              │
│ [Cofnij] ────────────────── [Dodaj medium] │
│                                              │
└──────────────────────────────────────────────┘
```

### 4.3 Opcje Dodawania

Każda opcja może być:
- Button (primary style) - główny CTA
- Card style (clickable) - przy desktopie
- List item - na mobile

---

## 5. KOMUNIKATY I FEEDBACK

### 5.1 Statusy Upload

**W trakcie uploadu**:
```
▣ Wgrywanie... 45%
[████████░░░░░░░░░░]

lub

Wgrywanie zdjęcia... ⊙ (spinner)
```

**Sukces**:
```
✓ Zdjęcie dodane pomyślnie
(toast notification, auto-dismiss w 3s)
```

**Błąd**:
```
❌ Błąd przesyłania pliku
Wiadomość: "Rozmiar pliku przekracza limit 50MB"
[Spróbuj ponownie]
```

### 5.2 Statusy Offline

**Brak internetu**:
```
⚠️  Brak połączenia z internetem
Multimedia zostanie wysłane automatycznie 
po nawiązaniu połączenia.

Status: Oczekujące (1 plik)
```

**Synchronizacja**:
```
↻ Synchronizacja w toku...
[████████░░] 80%

lub

✓ Wszystko zsynchronizowane
```

### 5.3 Potwierdzenia

**Usunięcie multimediów**:
```
⚠️  Potwierdź usunięcie
Czy na pewno chcesz usunąć ten plik?
Tej operacji nie można cofnąć.

[Nie] [Tak, usuń]
```

---

## 6. RESPONSIVE DESIGN

### 6.1 Breakpoints

```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
```

### 6.2 Formularz Obserwacji

**Mobile**:
- Sekcje ułożone vertically (full width)
- Galeria multimediów: 2 kolumny
- Modal drawer od dołu
- Suwaki większe (łatwiej operować)

**Tablet**:
- 2-kolumnowy layout: formularz | podgląd multimediów
- Galeria: 3 kolumny

**Desktop**:
- Opcjonalnie: side-by-side layout
- Galeria: 4+ kolumny

### 6.3 Zakładka Multimedia

**Mobile**:
- Filtry: scrollable horizontal buttons
- Galeria: 2 kolumny
- Pełnoekranowy lightbox

**Tablet**:
- Filtry: row of buttons
- Galeria: 3 kolumny

**Desktop**:
- Filtry: row + sorting dropdown
- Galeria: 4 kolumny
- Sidebar możliwy (filters/info)

---

## 7. KOLORY & STYLING

### 7.1 Powiązane Kolory (Design System)

```
Akcje:
├─ Primary (Dodaj): #007AFF (Blue)
├─ Secondary (Edytuj): #34C759 (Green)
├─ Danger (Usuń): #FF3B30 (Red)
└─ Neutral (Anuluj): #8E8E93 (Gray)

Status:
├─ Success: #34C759 (Green) ✓
├─ Error: #FF3B30 (Red) ❌
├─ Warning: #FF9500 (Orange) ⚠️
└─ Info: #007AFF (Blue) ℹ️

Tło:
├─ Card/Modal: #FFFFFF
├─ Overlay: rgba(0, 0, 0, 0.3)
└─ Background: #F2F2F7
```

### 7.2 Miniatura - Styling

```css
.media-thumbnail {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px solid #E0E0E0;
  object-fit: cover;
  transition: all 0.2s ease;
}

.media-thumbnail:hover {
  border-color: #007AFF;
  filter: brightness(0.9);
  cursor: pointer;
}

.media-thumbnail.uploading {
  opacity: 0.5;
}

.media-thumbnail.error {
  border-color: #FF3B30;
  background: #FFE0E0;
}
```

---

## 8. ACCESSIBILITY (A11Y)

### 8.1 ARIA Labels

```html
<!-- Image thumbnail -->
<img 
  src="..." 
  alt="Zdjęcie obserwacji z dnia 15.09.2025"
  role="button"
  tabindex="0"
  aria-label="Otwórz podgląd zdjęcia"
/>

<!-- Delete button -->
<button 
  aria-label="Usuń zdjęcie"
  title="Usuń zdjęcie"
>
  [X]
</button>

<!-- Upload button -->
<button 
  aria-label="Dodaj multimedia (Zdjęcia, Video, YouTube)"
>
  + Dodaj multimedia
</button>
```

### 8.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between buttons |
| Enter | Activate button, open modal |
| Space | Activate button |
| Escape | Close modal |
| Delete | Delete current item (with confirmation) |
| Arrow Left/Right | Previous/next item in lightbox |

### 8.3 Focus Management

- Focus visible on all interactive elements
- Focus outline: 2px, color: #007AFF
- Focus trapping w modalach
- Restore focus po zamknięciu modalu

### 8.4 Color Contrast

- Text on background: WCAG AA (4.5:1 minimum)
- Icons: 3:1 minimum
- Test narzędzie: axe, WAVE

---

## 9. WYTYCZNE IMPLEMENTACJI

### 9.1 Komponenty do Stworzenia

```
MediaComponents/
├─ MediaUploadButton.tsx
├─ MediaUploadModal.tsx
├─ MediaPreview.tsx
├─ MediaGallery.tsx
├─ MediaLightbox.tsx
├─ MediaFilters.tsx
├─ YouTubeInput.tsx
├─ OfflineSyncIndicator.tsx
└─ index.ts
```

### 9.2 Hooks

```
useMediaUpload.ts
├─ uploadFile(file): Promise
├─ uploadYoutubeLink(url): Promise
├─ deleteMedia(id): Promise
└─ getMediaByPlayer(playerId): Promise

useMediaGallery.ts
├─ media: Media[]
├─ filter: 'all' | 'image' | 'video' | 'youtube'
├─ setFilter(filter)
└─ sortBy: 'recent' | 'oldest'

useOfflineSync.ts
├─ isPending: boolean
├─ pendingCount: number
├─ syncProgress: number (0-100)
└─ sync(): Promise
```

### 9.3 Testy

```
__tests__/
├─ MediaUploadButton.test.tsx
├─ MediaGallery.test.tsx
├─ MediaLightbox.test.tsx
├─ useMediaUpload.test.ts
├─ useOfflineSync.test.ts
└─ integration.test.tsx
```

**Minimum coverage**: 80%

---

## 10. ZAPAMIĘTAJ PODCZAS IMPLEMENTACJI

✅ **Mobile-first** - Zacznij od mobile, potem desktop  
✅ **Offline first** - Dane przechowywane localnie (IndexedDB)  
✅ **Responsive images** - Miniatury, nie full resolution  
✅ **Lazy loading** - Załaduj zdjęcia na demand (intersection observer)  
✅ **Error handling** - Graceful degradation przy błędach  
✅ **A11y** - ARIA labels, keyboard navigation, color contrast  
✅ **UX feedback** - Loading states, success/error messages  
✅ **Performance** - Optimize image sizes, batch uploads  

---

**Koniec dokumentu**
