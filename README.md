# The Mind Palace

A local-first PWA for organizing maintenance knowledge across every domain of your life — vehicles, kitchen, yard, and home. Themed after the Memory Warehouse from Stephen King's *Dreamcatcher*.

**Your knowledge warehouse. File it now, thank yourself later.**

## What It Does

Every maintenance domain shares the same workflow: research the task, gather tools and parts, follow a procedure, take photos, save references, and track when it's due again. The Mind Palace gives each domain a **Room** in your warehouse, with:

- **Schedules** — Time-based and mileage-based recurring tasks with auto-advance on completion
- **Procedures** — Step-by-step instructions with torque specs, warnings, tips, and supply lists (tools, parts with order links, prices)
- **Task Log** — History of completed work with cost tracking and labor hours
- **Photo Wall** — Capture and store photos linked to rooms, procedures, and log entries (OPFS storage with IndexedDB fallback)
- **Reference Shelf** — YouTube videos, articles, manuals, and links with auto-extracted thumbnails
- **Notes** — Freeform notes with pin support
- **The Dreamcatcher** — Cross-room reminder feed that catches what's coming due before it slips through, with Apple Reminders export via `.ics`

## Key Features

- **100% local-first** — All data stored on-device via IndexedDB (Dexie.js). Zero hosting costs. No accounts.
- **Full offline PWA** — Install it, use it without internet. Service worker caches everything.
- **Module system** — Garage module ships first (vehicles with make/model/year/VIN/mileage tracking). Kitchen and Yard modules coming in v2/v3.
- **Export/Import** — Full data + photos backup as a single ZIP file. Take your warehouse anywhere.
- **Apple Reminders integration** — Export any schedule as an `.ics` file with native VALARM triggers for real iPhone/macOS notifications.
- **Atmospheric theming** — Warm dark wood tones, amber accents, and Dreamcatcher lore throughout. Light mode also available.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite 8 |
| Database | Dexie.js (IndexedDB) |
| Photo Storage | OPFS with IndexedDB fallback |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | CSS Modules + CSS custom properties |
| Export | JSZip |
| Hosting | GitHub Pages |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/        # AppShell, BottomNav, PageHeader
│   ├── photo/         # PhotoThumbnail strip
│   ├── room/          # RoomCard
│   ├── schedule/      # ScheduleCard
│   └── ui/            # Button, Input, Select, EmptyState
├── db/                # Dexie database schema and singleton
├── hooks/             # React hooks for all CRUD operations
├── lib/               # Formatters, constants, lore (themed copy)
├── modules/           # Module definitions (garage, future: kitchen, yard)
├── pages/             # Route-level page components
├── services/          # Photo storage, reminders, export/import
├── styles/            # CSS custom properties (design tokens)
└── types/             # TypeScript interfaces
```

## Modules

The core handles rooms, schedules, procedures, photos, references, notes, and reminders. Each **module** extends the core with domain-specific fields and vocabulary:

| Module | Status | Adds |
|--------|--------|------|
| **Garage** | v1 (shipped) | Make/model/year/VIN, mileage tracking, torque specs, parts with order links |
| **Kitchen** | v2 (planned) | Recipes as procedures, pantry inventory, meal planner, grocery lists |
| **Yard** | v3 (planned) | Seasonal schedules, planting calendar, garden tracking |

Adding a new module means adding a single config file — no new DB tables or core components needed.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the included GitHub Actions workflow.

## Roadmap

- [x] **v1** — Garage module + full core (schedules, procedures, task log, photos, references, notes, Dreamcatcher, export/import)
- [ ] **v2** — Kitchen module (inventory, recipes, meal planner)
- [ ] **v3** — Yard module (seasonal triggers, planting calendar)
- [ ] Full-text search across all rooms
- [ ] Cost tracking dashboard
- [ ] `clean` branch with IP-stripped neutral theming

## License

MIT
