# UI/UX

## Zasady projektowe
- Mobile-first (minimum 360px).
- Touch-friendly: przyciski min 44x44px.
- Jedna glowna akcja na ekran.
- Maks 3 klikniecia do wykonania kluczowej akcji.
- Szybkie potwierdzenia (toast, status).

## Kolory (tokeny)
```
--primary-50: #eff6ff
--primary-100: #dbeafe
--primary-500: #3b82f6
--primary-600: #2563eb
--primary-700: #1d4ed8

--success-500: #22c55e
--success-600: #16a34a

--warning-500: #eab308
--warning-600: #ca8a04

--danger-500: #ef4444
--danger-600: #dc2626

--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827
```

### Kolory rang i pipeline
```
--rank-a: #22c55e
--rank-b: #3b82f6
--rank-c: #eab308
--rank-d: #ef4444

--status-observed: #6b7280
--status-shortlist: #8b5cf6
--status-trial: #f59e0b
--status-offer: #3b82f6
--status-signed: #22c55e
--status-rejected: #ef4444
```

## Typografia
```
font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
```

## Komponenty (shadcn/ui)
### Buttons
- Primary: bg-primary-600 text-white
- Secondary: bg-gray-100 text-gray-700
- Ghost: bg-transparent
- Danger: bg-danger-600 text-white

### Cards
- rounded-lg, shadow-sm, border border-gray-200
- padding: p-4 (mobile), p-6 (desktop)

### Forms
- Input: h-10, rounded-md, border-gray-300
- Focus: ring-2 primary-500
- Error: text-danger-500

## Layout i nawigacja
- Mobile: header + content + FAB + bottom nav.
- Desktop: header + sidebar + content.
- Nawigacja: Dashboard, Players, Pipeline, Observations, Settings.
