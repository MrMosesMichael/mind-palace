# CLAUDE.md — Mind Palace

## Overview

Mind Palace is a modular home management tool (vehicles, kitchen, yard, home systems). Full-stack app: React 18 + TypeScript frontend, Express.js + SQLite backend, deployed via Docker behind Traefik.

**Live**: https://mind.mdmichael.com
**Repo**: https://github.com/MrMosesMichael/mind-palace

## Architecture

- **Frontend**: React 18, React Router v7, TanStack Query, TipTap editor, Vite build
- **Backend**: Express.js 5, better-sqlite3 (WAL mode), JWT auth + API key auth
- **Database**: SQLite at `/data/db/mind-palace.sqlite`
- **Photos**: Stored on disk at `/data/photos/{userId}/{photoId}.jpg`
- **Deploy**: Docker Compose (mind-palace + Radicale CalDAV), Traefik reverse proxy with TLS

## API

Two API layers exist side by side:

- **`/api/crud/:table`** — Generic CRUD used by the React frontend. Returns flat arrays/objects.
- **`/api/v1/*`** — Proper REST API with dedicated resource routes, input validation, response envelopes (`{ data, count }`). Supports both JWT and API key auth.

API key format: `mp_` + 40 hex chars. Keys are SHA-256 hashed in DB, shown once at creation.

### Key v1 endpoints
```
/api/v1/palaces, /rooms, /vehicles, /schedules, /task-logs
/api/v1/procedures, /procedure-steps, /supplies
/api/v1/inventory, /references, /photos, /notes, /reminders
/api/v1/settings, /search?q=, /api-keys
/api/v1/admin/users, /admin/backup
```

Each resource supports GET (list), POST (create), GET /:id, PUT /:id, DELETE /:id.
Parent resources have nested listings (e.g., `GET /api/v1/rooms/:id/schedules`).

## Common Commands

```bash
# Local dev
npm run dev              # Frontend dev server (Vite, port 5173)
cd server && npm run dev # Backend dev server (tsx watch, port 3001)

# Type check
cd server && npx tsc --noEmit

# Build
cd server && npx tsc    # Compile server TypeScript
npm run build            # Build frontend (Vite)
```

## Deployment

**VPS**: tatertot.work (SSH as mmichael)
**Project path on VPS**: ~/projects/mind-palace/

### Deploy process

1. **Back up the database** (especially if there are schema changes):
   ```bash
   ssh tatertot.work "cd ~/projects/mind-palace && docker exec mind-palace cp /data/db/mind-palace.sqlite /data/db/mind-palace.sqlite.backup-$(date +%Y%m%d-%H%M%S)"
   ```

2. **Push changes to origin/main** from local.

3. **Pull and rebuild on VPS**:
   ```bash
   ssh tatertot.work "cd ~/projects/mind-palace && git pull origin main && docker compose build && docker compose up -d"
   ```

4. **Verify health**:
   ```bash
   curl -s https://mind.mdmichael.com/health
   ```

5. **Check container status**:
   ```bash
   ssh tatertot.work "cd ~/projects/mind-palace && docker compose ps"
   ```

### Notes
- The `data/` directory is owned by `dtuserag` (container user). Use `docker exec` for file operations inside it (e.g., backups). `sudo` requires a password.
- The `.env` file on the VPS contains secrets (JWT_SECRET, ADMIN_PASSWORD, etc.) and is not tracked in git.
- The server auto-backs up the DB on every container start (keeps last 5 in `/data/backups/`).
- The container health check hits `http://127.0.0.1:3001/health` internally.

## Testing Against Live

Generate a JWT from inside the container for API testing:
```bash
ssh tatertot.work "cd ~/projects/mind-palace && docker exec mind-palace node -e \"
const db = require('./dist/db/index.js').default;
const jwt = require('jsonwebtoken');
const user = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get('moses');
const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log(token);
\""
```

Or create an API key (persistent, no expiry):
```bash
# Using a JWT token:
curl -s -X POST https://mind.mdmichael.com/api/v1/api-keys \
  -H "Authorization: Bearer {TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"name":"CLI Testing"}'
```

Then test endpoints:
```bash
curl -s https://mind.mdmichael.com/api/v1/palaces -H "Authorization: Bearer {TOKEN_OR_API_KEY}"
```

### Test data convention
Prefix test resource names with `API-TEST-` so they're identifiable and can be cleaned up via search + delete.

## Project Structure

```
/
├── src/                    # React frontend
│   ├── pages/              # Route-level components
│   ├── components/         # Reusable UI
│   ├── hooks/              # React Query hooks for CRUD
│   ├── services/           # API client, export, reminders
│   ├── lib/                # Utilities, constants, module defs
│   ├── types/              # TypeScript interfaces
│   └── contexts/           # Auth context
├── server/
│   └── src/
│       ├── index.ts        # Express entry, route mounting
│       ├── db/             # SQLite connection + schema
│       ├── middleware/      # JWT + API key auth
│       ├── lib/            # dbUtils (conversion), validate
│       ├── services/       # resources, cascadeDelete, scheduleService, backup
│       └── routes/
│           ├── crud.ts     # Generic CRUD (frontend uses this)
│           ├── auth.ts     # Login/refresh/register
│           ├── photos.ts   # Photo upload/serve
│           ├── sync.ts     # Batch sync
│           ├── users.ts    # Admin user management
│           ├── backup.ts   # Backup management
│           └── v1/         # REST API v1 (18 route files)
├── docker-compose.yml
├── data/                   # Mounted volume (DB, photos, backups)
└── CLAUDE.md               # This file
```

## Database

16 tables: users, refresh_tokens, api_keys, palaces, rooms, room_hotspots, vehicles, schedules, task_logs, procedures, procedure_steps, supplies, inventory, refs, photos, notes, reminders, app_settings.

Schema defined in `server/src/db/schema.ts`. All tables have `userId` for data isolation. CASCADE deletes are handled in `server/src/services/cascadeDelete.ts`.

## Key Conventions

- SQL table names are snake_case; API/client uses camelCase for table names and column names
- `server/src/lib/dbUtils.ts` handles all conversion (TABLE_MAP, rowToClient, clientToRow, JSON/boolean columns)
- v1 routes use the service layer (`services/resources.ts`); legacy CRUD routes have their own inline logic but share cascade delete and schedule services
- Photos use UUID primary keys (not auto-increment); all other tables use integer auto-increment
