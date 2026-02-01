# 🏆 ScoutPro - System Scoutingowy Akademii Piłkarskiej

## Spis Dokumentacji

| Nr | Dokument | Opis |
|----|----------|------|
| 01 | [Wizja Produktu](01-PRODUCT-VISION.md) | Cel biznesowy, personas, value proposition |
| 02 | [Wymagania Funkcjonalne](02-FUNCTIONAL-REQUIREMENTS.md) | User stories, acceptance criteria |
| 03 | [Model Danych](03-DATA-MODEL.md) | ERD, opis tabel, relacje |
| 04 | [Architektura Techniczna](04-ARCHITECTURE.md) | Stos technologiczny, diagramy, PWA |
| 05 | [API Specification](05-API-SPEC.md) | Endpointy REST, Supabase RLS |
| 06 | [UI/UX Guidelines](06-UI-UX.md) | Wireframes, komponenty, flow |
| 07 | [Backlog & Roadmap](07-BACKLOG.md) | Zadania podzielone na sprinty |
| 08 | [Offline Strategy](08-OFFLINE.md) | Service Worker, sync, konflikt danych |
| 09 | [Deployment Guide](09-DEPLOYMENT.md) | CI/CD, Supabase setup, Vercel |
| 10 | [Sample Data](10-SAMPLE-DATA.md) | Dane testowe z Excel |

---

## 🎯 Quick Start dla Developerów

### Technologie (MVP)
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **PWA:** Workbox + IndexedDB
- **Hosting:** Vercel (frontend) + Supabase Cloud

### Uruchomienie lokalne
```bash
# 1. Klonowanie repo
git clone <repo-url>
cd scoutpro

# 2. Instalacja zależności
npm install

# 3. Konfiguracja Supabase
cp .env.example .env.local
# Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY

# 4. Start dev server
npm run dev
```

### Struktura projektu
```
scoutpro/
├── src/
│   ├── components/       # Komponenty UI
│   ├── features/         # Moduły funkcjonalne
│   │   ├── auth/         # Logowanie, rejestracja
│   │   ├── players/      # Profile zawodników
│   │   ├── observations/ # Obserwacje meczowe
│   │   ├── pipeline/     # Funnel rekrutacyjny
│   │   └── dashboard/    # KPIs, wykresy
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Supabase client, utils
│   ├── stores/           # Zustand state
│   └── types/            # TypeScript types
├── public/
│   └── sw.js             # Service Worker
├── supabase/
│   ├── migrations/       # SQL migrations
│   └── seed.sql          # Dane testowe
└── docs/                 # Ta dokumentacja
```

---

## 📊 Status Projektu

| Faza | Status | Termin |
|------|--------|--------|
| Analiza biznesowa | ✅ Ukończone | Q1 2025 |
| Projektowanie UX | 🔄 W trakcie | Q1 2025 |
| MVP Development | ⏳ Planowane | Q2 2025 |
| Beta Testing | ⏳ Planowane | Q3 2025 |
| Production Release | ⏳ Planowane | Q3 2025 |

---

## 👥 Zespół

| Rola | Odpowiedzialność |
|------|------------------|
| Product Owner | Wizja, priorytety, akceptacja |
| Tech Lead | Architektura, code review |
| Frontend Dev | React, PWA, UI |
| Backend Dev | Supabase, migrations, API |
| QA | Testy, UAT |

---

## 📞 Kontakt

W razie pytań dotyczących dokumentacji, kontaktuj się z Product Ownerem.
