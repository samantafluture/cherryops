# Plan: CherryOps Web Dashboard (React + TypeScript)

## Context

CherryOps has an Android app and a backend API, but no web interface. New product requirement: users should be able to check their ops from desktop via a web dashboard. The web and mobile apps are equal clients consuming the same backend API. The dashboard lives in the monorepo as `web/`, separate from `backend/` — not embedded.

## Architecture

```
cherryops/
├── android/          # Mobile client (Kotlin + Compose)
├── backend/          # API server (Fastify + TypeScript + SQLite)
├── web/              # NEW — Web client (React + TypeScript + Vite)
├── skills/           # YAML skill packs
├── docs/             # PRD, TDD
└── ...
```

Both `android/` and `web/` are **equal API clients** — they consume the same REST endpoints. No shared type package for now (types are duplicated in each client, as they already are in the Android app). A shared `packages/types/` can be extracted later when the API stabilizes.

**Stack** (matches your existing patterns from fincherry/surpride-app):
- Vite 6 + React 18 + TypeScript
- Tailwind CSS 4 + @tailwindcss/vite
- React Router v7
- TanStack React Query v5
- Lucide React (icons)
- Recharts (charts on overview)
- react-markdown (file viewer)

## Implementation Phases

### Phase 1: Scaffold + Auth

**New files in `web/`:**

```
web/
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # Router + QueryClient + AuthGuard
│   ├── index.css                # Tailwind imports
│   ├── lib/
│   │   ├── api.ts               # Type-safe fetch client for all /api/v1/ endpoints
│   │   └── auth.ts              # JWT storage, token refresh, logout
│   ├── context/
│   │   └── AuthContext.tsx       # Auth state + guard component
│   └── pages/
│       └── Login.tsx             # GitHub OAuth PKCE login
├── vite.config.ts               # React + Tailwind + proxy to backend
├── tsconfig.json
├── package.json
└── index.html
```

**`lib/api.ts`** — Type-safe REST client:
- Mirrors `BackendApiService.kt` types (TaskResponse, SkillResponse, etc.)
- `createApiClient(baseUrl, token)` returns typed methods
- Auto-redirects to `/login` on 401

**`vite.config.ts`** — Proxy `/api` to `http://localhost:3100` in dev.

**Auth flow:** GitHub OAuth PKCE → backend exchanges code → JWT stored in localStorage → AuthGuard checks on app load.

### Phase 2: Layout + Overview

```
src/
├── components/
│   └── layout/
│       ├── AppShell.tsx         # Sidebar + main content area
│       ├── Sidebar.tsx          # Nav links with icons
│       └── Header.tsx           # Project selector + user menu
└── pages/
    └── Dashboard.tsx            # Overview page
```

**Dashboard page:**
- Task count cards by status (queued, running, complete, error) — uses Recharts donut
- Recent tasks list (last 10)
- Server health indicator
- Auto-refresh every 30s via React Query `refetchInterval`

**Backend API gap:** Need `GET /api/v1/tasks` (list all) and task count stats. Add to `backend/src/routes/tasks.ts` and `backend/src/db/tasks.ts`.

### Phase 3: Projects + File Browser

```
src/pages/
├── ProjectList.tsx              # GitHub repos list
└── ProjectHome.tsx              # Quick actions + recent tasks
src/components/features/
├── FileTree.tsx                 # Recursive tree with expand/collapse
├── FileViewer.tsx               # Markdown + code rendering
└── MarkdownRenderer.tsx         # react-markdown wrapper
```

- File tree calls GitHub API via backend proxy (or direct with GitHub token)
- FileViewer renders markdown files with `react-markdown`, code files with monospace
- Same data flow as Android's FileBrowserViewModel

### Phase 4: Skills + Task Dispatch

```
src/pages/
├── Skills.tsx                   # Grid of skill cards with category filters
├── SkillDispatch.tsx            # Dynamic form from skill inputs
└── AdHocDispatch.tsx            # Free-form task dispatch
```

- Skills loaded from backend `GET /api/v1/skills`
- Dynamic form generates inputs from skill definition (text, select, boolean, file_path)
- Dispatch calls `POST /api/v1/tasks/dispatch`
- After dispatch, navigates to task status page

### Phase 5: Task Status + Review

```
src/pages/
├── TaskStatus.tsx               # Polling status with animated badges
└── TaskReview.tsx               # Output + approve/redirect/discard
src/components/features/
└── DiffViewer.tsx               # Unified diff renderer
```

- `useTaskStatus(taskId)` hook polls every 2s via React Query
- TaskReview shows markdown output, files changed, PR link
- Three actions: Approve (green), Redirect (with text field), Discard (red)
- DiffViewer: color-coded add/remove lines (same logic as Android DiffRenderer)

### Phase 6: Settings + Polish

```
src/pages/
└── Settings.tsx                 # Backend URL, GitHub status, logout
```

### Phase 7: Deployment

**Option A (recommended): Nginx serves static build, proxies API**
- `vite build` → `web/dist/`
- Nginx serves `dist/` at `cherryops.samantafluture.com/`
- API stays at `cherryops.samantafluture.com/api/v1/`
- Update `nginx/cherryops.conf` to serve static + proxy API
- Update `docker-compose.prod.yml` to add `cherryops_web` volume
- Update `Dockerfile.prod` or add a separate build step in `scripts/deploy.sh`

**Option B: Separate subdomain**
- `app.cherryops.samantafluture.com` for web
- `cherryops.samantafluture.com` stays API-only
- More infra but cleaner separation

Recommend **Option A** — single domain, API under `/api/v1/`, web at `/`.

## Backend changes needed

| File | Change |
|------|--------|
| `backend/src/db/tasks.ts` | Add `getAllTasks(db, filters)` and `getTaskCountsByStatus(db)` |
| `backend/src/routes/tasks.ts` | Add `GET /tasks` with query params (status, repo, limit, offset) |
| `backend/src/routes/device.ts` | Add `GET /devices` to list registered devices |
| `backend/src/routes/health.ts` | Add task counts + device count to health response |
| `nginx/cherryops.conf` | Serve static web build at `/`, proxy `/api/` to backend |
| `docker-compose.prod.yml` | Add `cherryops_web` volume for built frontend |
| `scripts/deploy.sh` | Add `cd web && npm run build` step |

## CI/CD

Add `.github/workflows/web-ci.yml`:
- Trigger on `web/**` changes
- Steps: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`

Update `.github/workflows/deploy.yml`:
- Add web build step before deploy
- Copy `web/dist/` to nginx volume on VPS

## Verification

1. `cd web && npm run dev` — opens at `http://localhost:5173`, proxies API to `:3100`
2. Login with GitHub OAuth
3. Overview shows task counts and health
4. File browser loads repo tree, renders markdown
5. Skill dispatch creates tasks, status polling works
6. Task review approve/redirect/discard work
7. `npm run typecheck && npm run build` — clean
8. `cd backend && npm run typecheck && npm test` — still green

## Files to create

~25 new files in `web/`, 0 new backend files (only modifications to existing routes).

## What this is NOT

- Not a replacement for the Android app — both are equal clients
- Not CherryOps Cloud dashboard (that's v2, private repo, billing/multi-tenant)
- No voice capture on web MVP (can add later with Web Audio API)
- No offline mode on web (that's an Android-specific feature)
