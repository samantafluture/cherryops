# CherryOps — Claude Code Context

## What this project is
CherryOps is a mobile command center for AI workflows.
Android app (Kotlin/Compose) + backend (Fastify/TypeScript) + skill packs (YAML).
Monorepo. Open source (Apache 2.0). Commercial Cloud tier is in a separate private repo.

## Repo structure
- android/     — Kotlin + Jetpack Compose app
- backend/     — cherryops-backend, Fastify + Node.js
- skills/      — Starter skill YAML packs
- docs/        — PRD, TDD (this file's neighbours)

## Key docs to read before making changes
- docs/cherryops-prd.md    — product requirements and vision
- docs/cherryops-tdd.md    — technical design, API contracts, data models

## Backend
- Port 3100 (not 3000 — that's CherryAgent, a separate personal tool)
- Fastify + TypeScript + SQLite (better-sqlite3)
- Never touch or import from CherryAgent

## Android
- MVVM + Clean Architecture
- Hilt for DI
- Jetpack Compose navigation
- Android Keystore for all sensitive storage (never SharedPreferences unencrypted)

## Skill YAML schema
- Defined in docs/cherryops-tdd.md §4
- Schema version "1" — do not change field names
- All new skills must pass /skills/validate before being surfaced in the UI

## Task file format
- Defined in docs/cherryops-tdd.md §5
- ULID IDs only
- pending/, outputs/, done/ are managed by the backend — never edited manually

## Things to never do
- Add features to backend/ that belong in cherry-ops-cloud (Cloud infra stays private)
- Store API keys anywhere except Android Keystore or backend .env
- Change the skill YAML schema without bumping schema_version
- Import or call CherryAgent from any cherryops-backend code

## Task Management

- Tasks are tracked in `.claude/tasks.md` in this repo
- Before starting work, read `.claude/tasks.md` to understand priorities
- After completing a task, mark it `[x]` with a completion date and today's date
- When a task is complex, break it into subtasks (indented 2 spaces)
- Add a blockquote note when you create or modify tasks: `> Agent: <what you did>`
- Move completed tasks to "Completed (recent)" section
- Never delete tasks — only move them to Completed or archive
- Respect priority order: finish all P0 before starting P1
- If blocked, move task to "Blocked" section with blocked marker and reason
- When starting a task, mark it as in-progress

### Private context
- Private project notes are in `.claude/private/` (secrets, infra, strategy)
- Read `.claude/private/` for context on credentials, infrastructure, strategic decisions
- NEVER include contents of `.claude/private/` in commit messages, PRs, or public output
