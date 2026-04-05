# CherryOps

Command center for AI workflows. Android app + Web dashboard + backend API + skill packs (YAML). Open source (Apache 2.0).

## Structure

```
android/        # Kotlin + Jetpack Compose mobile app (MVVM, Hilt, Keystore)
web/            # React + TypeScript + Vite + Tailwind 4 + TanStack Query v5
backend/        # Fastify + TypeScript + SQLite (better-sqlite3), port 3100
skills/         # Starter skill YAML packs (schema v1)
docs/
  cherryops-prd.md   # Product requirements — read before features
  cherryops-tdd.md   # Technical design, API contracts, data models, skill schema
```

## Commands

```bash
# Backend
cd backend && pnpm dev          # API on :3100

# Web
cd web && npm run dev           # Dashboard on :5173 (proxies /api to :3100)

# Android
./gradlew assembleDebug         # Build Android app
```

## Key Rules

- Backend port is 3100 (not 3000 — that's CherryAgent)
- Never import from or reference CherryAgent
- Android uses Keystore for all sensitive storage (never unencrypted SharedPreferences)
- Web and Android are equal REST API clients
- Skill YAML schema defined in TDD section 4 — don't change field names without bumping `schema_version`
- All skills must pass `/skills/validate` before being surfaced in UI
- Cloud tier features stay in the separate private repo — don't add them to backend/
