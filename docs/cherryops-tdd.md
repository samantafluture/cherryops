# CherryOps — Technical Design Document

**Version:** 0.2  
**Status:** Draft  
**Owner:** Sam  
**Last updated:** March 2026  
**Companion doc:** `cherryops-prd.md` v0.2

---

## 0. Decision Log

Decisions that must be locked before writing code. This section is resolved before anything else.

| # | Decision | Resolution | Rationale |
|---|---|---|---|
| D1 | KMM vs Android-only | **Android-only (Kotlin + Compose)** | iOS is v3 at earliest. KMM adds complexity before v1 is validated. Revisit after first 500 users. |
| D2 | Skill format | **YAML with frontmatter** | Human-readable, Git-diffable, easy to validate, Hub-compatible from day one. |
| D3 | API key handling (Persona B) | **User-supplied, encrypted on device** | Never proxy user keys through CherryOps infra in v1. AES-256 encrypted in Android Keystore. |
| D4 | Git sync mechanism | **GitHub REST API (no native Git)** | No SSH key management on mobile. GitHub API handles auth via OAuth token. Simpler, safer. |
| D5 | Agent communication | **File-based via repo (pending/ folder)** | Auditable, async, no persistent connection required. Backend polls or watches. |
| D6 | Push notifications | **Firebase Cloud Messaging (FCM)** | Free tier covers MVP volume. Already standard for Android. |
| D7 | Conflict resolution (MVP) | **Show error, block action, prompt manual resolve** | Git merge on mobile is out of scope for v1. Surface the problem clearly, don't silently corrupt. |
| D8 | Voice transcription | **Gemini Flash via cherryops-backend proxy** | API key stays on VPS, not on device. |
| D9 | Repo structure | **Monorepo (`cherry-ops`)** | Tight coupling between android/, backend/, and skills/ warrants a single repo. Split only when contributors need isolated pieces. |
| D10 | Backend origin | **New standalone service (`cherryops-backend`)** | CherryAgent is personal infrastructure not designed for multi-tenancy, external users, or commercial hardening. CherryOps gets a clean slate. CherryAgent remains untouched as personal tooling. |
| D11 | Licensing model | **Open Core** | android/, backend/, skills/ are open source (Apache 2.0). CherryOps Cloud infrastructure (orchestrator, billing, dashboard) is closed source commercial. This maximises community contribution and distribution while protecting the paid tier. |

---

## 1. Repository Structure

### Monorepo — `cherry-ops` (public, Apache 2.0)

```
cherry-ops/
├── android/                  # Kotlin + Jetpack Compose app
├── backend/                  # cherryops-backend — Fastify, Node.js
├── skills/                   # Starter skill packs (open source)
├── docs/                     # PRD, TDD, CLAUDE.md, ADRs
├── docker/                   # Dockerfile for self-hosted backend
├── .github/
│   ├── workflows/            # CI — lint, test, build
│   └── ISSUE_TEMPLATE/
├── LICENSE                   # Apache 2.0
├── CONTRIBUTING.md
└── README.md
```

### Cloud repo — `cherry-ops-cloud` (private, closed source)

```
cherry-ops-cloud/
├── orchestrator/             # Container provisioning service
├── billing/                  # Stripe webhook handlers
├── dashboard/                # Web dashboard (Astro + TypeScript)
└── infra/                    # Hetzner/Nginx/Certbot config
```

### Separation principle

The `cherry-ops` monorepo contains everything a self-hosted user needs to run CherryOps end-to-end. The `cherry-ops-cloud` repo contains only what powers the managed hosting tier — it depends on `cherry-ops/backend` as a Docker image but adds no features to it. No feature should ever be added to `cherry-ops-cloud` that belongs in the open source backend.

---

## 2. System Overview

CherryOps is composed of three runtime layers that communicate asynchronously:

```
┌─────────────────────────────────────────────────────────────┐
│                   CherryOps Android App                      │
│  Kotlin + Jetpack Compose · MVVM + Clean Architecture        │
│  GitHub REST API · FCM · Gemini Flash (via proxy)            │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTPS (GitHub API)            │ HTTPS (cherryops-backend API)
               ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│      GitHub Repo          │   │    cherryops-backend (VPS)   │
│  project context files    │   │  Fastify · Node.js · TS      │
│  skills/*.yaml            │   │  Claude Code headless        │
│  pending/*.md             │   │  File watcher (chokidar)     │
│  outputs/*.md             │   │  FCM push sender             │
│  done/*.md                │   │  Gemini Flash transcription  │
└──────────────────────────┘   └──────────────────────────────┘
```

The app never communicates directly with Claude or Gemini. All AI calls are proxied through `cherryops-backend`. This keeps API keys off the device and makes it trivial to swap models later.

**Note:** `cherryops-backend` is a new, standalone service. It shares no code with CherryAgent, which remains a separate personal tool on the same VPS. They run on different ports behind the same Nginx reverse proxy.

---

## 3. Project Config File — `.cherryops.yaml`

Every connected repo has a `.cherryops.yaml` at root. Created during onboarding, committed by the app.

```yaml
# .cherryops.yaml
version: "1"
project:
  name: "CherryTree"
  persona: builder          # builder | operator
  icon: "🌳"

agent:
  mode: cherry_agent        # cherry_agent | api_direct
  endpoint: "https://ops.yourvps.com"   # cherryops-backend endpoint
  timeout_seconds: 300

context:
  primary_files:
    - backlog.md
    - roadmap.md
    - CLAUDE.md
  always_include: true

notifications:
  fcm_enabled: true
  on_complete: true
  on_error: true

sync:
  branch: main
  auto_pull_on_open: true
```

---

## 4. Skill YAML Schema (v1 — Hub-Compatible)

This schema is finalized. Do not change field names after the first skill is published. Hub compatibility depends on schema stability.

```yaml
# skills/[skill-id].yaml

# ── Required fields ──────────────────────────────────────────
schema_version: "1"

id: "draft-client-email"
name: "Draft Client Email"
description: "Write a follow-up email based on the client brief"
version: "1.0.0"
author: "sam"                        # GitHub username or "community"

# ── Display ──────────────────────────────────────────────────
icon: "📧"
category: client                     # client | content | dev | ops | finance | custom
persona: operator                    # builder | operator | both

# ── Execution ─────────────────────────────────────────────────
agent_mode: api_direct               # api_direct | cherry_agent

# ── Context ───────────────────────────────────────────────────
context_files:
  - "context/clients/{{client_name}}/brief.md"
  - "context/sops/email-tone.md"

# ── Variables ─────────────────────────────────────────────────
variables:
  - id: client_name
    label: "Client name"
    type: string                     # string | select | file_picker
    required: true
    placeholder: "acme-corp"

# ── Prompt ────────────────────────────────────────────────────
prompt_template: |
  You are a professional business writer.

  Using the client brief and tone guidelines below, draft a
  follow-up email. Requirements:
  - Under 200 words
  - Include a subject line
  - Match the tone from the SOP

  ---
  {{context}}
  ---

  Additional notes from user: {{user_brief}}

# ── Output ────────────────────────────────────────────────────
output_file: "outputs/emails/{{client_name}}-followup.md"
output_format: markdown              # markdown | plain | diff

# ── Optional ──────────────────────────────────────────────────
tags:
  - email
  - client
  - communication
min_app_version: "1.0.0"
```

### Variable types

| Type | UI shown | Notes |
|---|---|---|
| `string` | Text input | Free text, injected into template |
| `select` | Dropdown | Requires `options: [...]` list |
| `file_picker` | File browser | Resolves to file content at dispatch |

### Reserved template tokens

| Token | Resolves to |
|---|---|
| `{{context}}` | Concatenated content of all `context_files` |
| `{{user_brief}}` | User's optional free-text addition at dispatch |
| `{{project_name}}` | From `.cherryops.yaml` |
| `{{date}}` | ISO date at dispatch time |
| `{{variable_id}}` | Any declared variable |

---

## 5. Task File Format

Every dispatched task writes a structured markdown file to `pending/`.

```markdown
---
id: 01HX7K2P3Q4R5S6T7U8V9W0XY
type: skill                          # skill | adhoc
skill_id: draft-client-email
skill_version: 1.0.0
status: pending                      # pending | running | complete | error | discarded
created_at: 2026-03-20T14:32:00Z
dispatched_by: sam
agent_mode: api_direct
output_file: outputs/emails/acme-corp-followup.md
variables:
  client_name: acme-corp
---

# Task Brief

Draft a follow-up email for Acme Corp after our discovery call.
They're interested in the quarterly retainer.

---

# Resolved Context

[content of context/clients/acme-corp/brief.md]

---

[content of context/sops/email-tone.md]
```

`cherryops-backend` reads this file, executes the task, then:
1. Writes result to the path in `output_file`
2. Updates `status` in the frontmatter to `complete` or `error`
3. Commits both files, pushes
4. Sends FCM notification

File IDs use ULID format — sortable, collision-resistant.

---

## 6. cherryops-backend API Contract

Base URL: `https://[vps-domain]/api/v1`  
Auth: `Authorization: Bearer [jwt]`  
Content-Type: `application/json`

---

### POST `/tasks/dispatch`

Validate and acknowledge a task. Does not execute — execution is triggered by the file watcher.

**Request:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "repo": "samantafluture/cherrytree",
  "branch": "main",
  "task_file_path": "pending/01HX7K2P3Q4R5S6T7U8V9W0XY.md"
}
```

**Response 202:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "status": "queued",
  "estimated_start_seconds": 5
}
```

**Response 409** — task ID already exists  
**Response 422** — task file not found or malformed frontmatter

---

### GET `/tasks/:task_id/status`

**Response 200:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "status": "running",
  "started_at": "2026-03-20T14:32:05Z",
  "completed_at": null,
  "output_file": "outputs/emails/acme-corp-followup.md",
  "error": null
}
```

---

### GET `/tasks/:task_id/result`

**Response 200:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "output_file": "outputs/emails/acme-corp-followup.md",
  "content": "# Follow-up Email\n\n**Subject:** ...",
  "output_format": "markdown",
  "diff": null,
  "commit_sha": "a1b2c3d4"
}
```

---

### POST `/tasks/:task_id/approve`

**Request:**
```json
{ "action": "approve" }
```

**Response 200:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "status": "done",
  "commit_sha": "b2c3d4e5"
}
```

---

### POST `/tasks/:task_id/redirect`

**Request:**
```json
{
  "new_brief": "Keep the tone warmer. Mention the free audit.",
  "inherit_context": true
}
```

**Response 202:**
```json
{
  "original_task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "new_task_id": "01HX8M3N4O5P6Q7R8S9T0U1VW",
  "status": "queued"
}
```

---

### POST `/tasks/:task_id/discard`

**Response 200:**
```json
{
  "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
  "status": "discarded"
}
```

---

### POST `/skills/validate`

**Request:**
```json
{
  "skill_yaml": "schema_version: \"1\"\nid: draft-client-email\n..."
}
```

**Response 200:**
```json
{
  "valid": true,
  "skill_id": "draft-client-email",
  "warnings": []
}
```

**Response 422:**
```json
{
  "valid": false,
  "errors": [
    "Missing required field: prompt_template",
    "agent_mode must be one of: api_direct, cherry_agent"
  ]
}
```

---

### POST `/voice/transcribe`

**Request:**
```json
{
  "audio_base64": "...",
  "mime_type": "audio/webm",
  "language_hint": "en"
}
```

**Response 200:**
```json
{
  "transcript": "Follow up with Acme Corp about the quarterly retainer.",
  "confidence": 0.97,
  "duration_seconds": 4.2
}
```

**Response 413** — audio exceeds 60 second limit  
**Response 422** — unsupported audio format

---

### POST `/device/register`

**Request:**
```json
{
  "fcm_token": "...",
  "device_id": "[android_id]",
  "platform": "android"
}
```

**Response 200:**
```json
{ "registered": true }
```

---

## 7. cherryops-backend Internal Architecture

### Stack

- **Runtime:** Node.js 20+, TypeScript
- **Framework:** Fastify
- **Database:** SQLite via `better-sqlite3` (task state, device tokens)
- **File watching:** `chokidar`
- **YAML parsing:** `js-yaml`
- **AI execution:** `@anthropic-ai/sdk` (Claude API) + `claude` CLI (Claude Code headless)
- **Push:** Firebase Admin SDK
- **Voice:** Google Generative AI SDK (Gemini Flash)

### Module structure

```
cherry-ops/backend/
├── src/
│   ├── routes/
│   │   ├── tasks.ts            # /tasks/* endpoints
│   │   ├── skills.ts           # /skills/validate
│   │   ├── voice.ts            # /voice/transcribe
│   │   └── device.ts           # /device/register
│   ├── services/
│   │   ├── taskRunner.ts       # executes via Claude Code or API
│   │   ├── fileWatcher.ts      # chokidar watcher on pending/
│   │   ├── skillValidator.ts   # YAML parse + schema validation
│   │   ├── fcmSender.ts        # Firebase Admin push
│   │   ├── geminiProxy.ts      # Gemini Flash transcription
│   │   └── repoManager.ts      # clone/pull/push repos via GitHub API
│   ├── db/
│   │   ├── schema.ts           # SQLite schema
│   │   ├── tasks.ts            # task CRUD
│   │   └── devices.ts          # FCM token management
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification
│   │   └── rateLimit.ts        # per-user rate limiting
│   └── index.ts                # Fastify server entry point
├── .env.example
├── Dockerfile                  # self-hosted deployment
├── package.json
└── tsconfig.json
```

### Environment variables

```bash
# Auth
CHERRYOPS_JWT_SECRET=...

# GitHub (PAT for repo read/write on behalf of users)
GITHUB_PAT=...

# Firebase (FCM)
FIREBASE_SERVICE_ACCOUNT_JSON=...

# Gemini (voice transcription)
GEMINI_API_KEY=...

# Claude Code (Builder mode task execution)
ANTHROPIC_API_KEY=...            # used when agent_mode = cherry_agent

# Server
PORT=3100                        # different from CherryAgent (3000)
NODE_ENV=production
```

### File watcher behavior

On startup, `cherryops-backend` clones or pulls each registered project repo into a local working directory. A `chokidar` watcher monitors each `pending/` directory. On new `.md` file detection:

1. Read and parse YAML frontmatter
2. Validate task file schema
3. Update `status: running` in SQLite + commit to repo
4. Execute task:
   - `api_direct`: construct prompt from template + context, call Claude API
   - `cherry_agent`: run `claude` CLI headless with task brief + CLAUDE.md
5. Write output to `output_file` path
6. Update `status: complete` or `status: error` in frontmatter
7. Commit all changes, push to GitHub
8. Send FCM push notification to registered device(s)

**Concurrency:** max 2 concurrent executions per registered repo (configurable via env). Additional tasks are queued in SQLite. Prevents runaway costs on active days.

**Separation from CherryAgent:** `cherryops-backend` runs on port 3100. CherryAgent continues running on port 3000. Both sit behind Nginx on the same VPS with separate `server` blocks:

```nginx
# cherryops-backend
server {
    listen 443 ssl;
    server_name ops.yourdomain.com;
    location / { proxy_pass http://localhost:3100; }
}

# CherryAgent (unchanged)
server {
    listen 443 ssl;
    server_name agent.yourdomain.com;
    location / { proxy_pass http://localhost:3000; }
}
```

---

## 8. Android App Architecture

### Stack

- **Language:** Kotlin
- **UI:** Jetpack Compose
- **Architecture:** MVVM + Clean Architecture
- **DI:** Hilt
- **Navigation:** Compose Navigation
- **Networking:** Retrofit + OkHttp
- **Local storage:** DataStore (preferences) + Room (task cache)
- **Markdown rendering:** `compose-markdown` — evaluate, fallback to custom renderer
- **YAML parsing:** `kaml` (Kotlin YAML, no reflection)
- **Async:** Coroutines + Flow

### Module structure

```
cherry-ops/android/
├── app/
│   ├── core/
│   │   ├── network/          # Retrofit clients (GitHub API, cherryops-backend)
│   │   ├── auth/             # GitHub OAuth, JWT storage (Android Keystore)
│   │   ├── storage/          # DataStore, Room database
│   │   ├── notifications/    # FCM handler
│   │   └── ui/               # Design system, theme, shared components
│   ├── feature/
│   │   ├── onboarding/       # Builder and Operator onboarding flows
│   │   ├── projects/         # Project list, project home screen
│   │   ├── browser/          # File tree, markdown viewer, checkbox toggle
│   │   ├── skills/           # Skill card grid, dispatch view
│   │   ├── dispatch/         # Ad-hoc task brief, voice capture
│   │   ├── review/           # Output view, diff viewer, approve/redirect/discard
│   │   ├── capture/          # Quick capture widget, share sheet
│   │   └── settings/         # Account, backend config, API key management
│   └── data/
│       ├── github/           # GitHub REST API data source
│       ├── backend/          # cherryops-backend API data source
│       ├── skill/            # Skill YAML parser, validator
│       └── task/             # Task model, Room cache
├── local.properties          # not committed
├── google-services.json      # not committed — from Firebase Console
└── build.gradle.kts
```

### Navigation graph

```
OnboardingFlow
  └── PersonaSelect → BuilderSetup | OperatorSetup
        └── RepoConnect → BackendConnect → SkillsPreview → Home

Home (ProjectList)
  └── ProjectHome
        ├── FileBrowser → FileViewer (markdown, checkbox toggle)
        ├── SkillGrid → SkillDispatch → TaskStatus → OutputReview
        │                                                 ├── Approve
        │                                                 ├── Redirect → SkillDispatch
        │                                                 └── Discard
        └── Dispatch (ad-hoc) → TaskStatus → OutputReview

Settings
  ├── AccountSettings
  ├── BackendSettings
  └── ApiKeySettings

QuickCapture (widget / share sheet → modal overlay)
```

### Key data models

```kotlin
data class Project(
    val id: String,              // repo full name "sam/cherrytree"
    val name: String,
    val icon: String,
    val persona: Persona,        // BUILDER | OPERATOR
    val repoFullName: String,
    val branch: String,
    val agentMode: AgentMode,    // CHERRY_AGENT | API_DIRECT
    val agentEndpoint: String?,
    val lastSyncedAt: Instant?
)

data class Skill(
    val schemaVersion: String,
    val id: String,
    val name: String,
    val description: String,
    val version: String,
    val icon: String,
    val category: SkillCategory,
    val persona: SkillPersona,
    val agentMode: AgentMode,
    val contextFiles: List<String>,
    val variables: List<SkillVariable>,
    val promptTemplate: String,
    val outputFile: String,
    val outputFormat: OutputFormat,
    val tags: List<String>,
    val isValid: Boolean,
    val validationWarnings: List<String>
)

data class Task(
    val id: String,              // ULID
    val projectId: String,
    val type: TaskType,          // SKILL | ADHOC
    val skillId: String?,
    val status: TaskStatus,      // PENDING | RUNNING | COMPLETE | ERROR | DISCARDED | DONE
    val brief: String,
    val outputFilePath: String?,
    val outputContent: String?,
    val diff: String?,
    val createdAt: Instant,
    val completedAt: Instant?,
    val error: String?
)
```

---

## 9. GitHub API Integration

CherryOps uses GitHub REST API v3 exclusively. No native Git, no SSH on device.

### Auth

OAuth 2.0 with PKCE. Required scope: `repo`. Token stored in Android Keystore via Jetpack Security. Never in SharedPreferences or DataStore unencrypted.

### Operations used

| Operation | Endpoint | Notes |
|---|---|---|
| List repos | `GET /user/repos` | Filter by push permission |
| Get file | `GET /repos/{owner}/{repo}/contents/{path}` | Returns base64 content |
| Create/update file | `PUT /repos/{owner}/{repo}/contents/{path}` | Requires SHA for updates |
| Delete file | `DELETE /repos/{owner}/{repo}/contents/{path}` | Used for discard |
| Get file tree | `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | Full tree in one call |
| Get branch SHA | `GET /repos/{owner}/{repo}/branches/{branch}` | For sync state |

### Sync strategy

On project open: fetch branch SHA, compare with cached SHA. If different, fetch updated tree and content for `.cherryops.yaml`, `skills/*.yaml`, `backlog.md`, `roadmap.md`. All other file content fetched lazily on open. `pending/`, `outputs/`, `done/` refreshed every 30s while a task is in `RUNNING` state.

### Write conflict handling

All writes: read current SHA → write with SHA → handle 409. On conflict: show error dialog "This file was modified elsewhere. Please resolve manually." Block the action. No silent corruption.

---

## 10. FCM Notification Design

### Payload

```json
{
  "to": "[fcm_token]",
  "data": {
    "type": "task_update",
    "task_id": "01HX7K2P3Q4R5S6T7U8V9W0XY",
    "status": "complete",
    "project_id": "samantafluture/cherrytree",
    "output_file": "outputs/emails/acme-corp-followup.md",
    "skill_name": "Draft Client Email"
  },
  "notification": {
    "title": "Draft Client Email — done",
    "body": "Tap to review the output for Acme Corp."
  }
}
```

### Notification types

| type | When sent | Tap action |
|---|---|---|
| `task_update` (complete) | Task finished | Open OutputReview |
| `task_update` (error) | Task failed | Open TaskStatus with error |
| `task_update` (running) | Task started (>30s tasks) | No-op, informational |

---

## 11. Voice Capture Flow

```
User taps mic → Android AudioRecord → encode webm/opus →
POST /voice/transcribe → Gemini Flash → transcript →
inject into brief text field (editable before dispatch)
```

- Max 60 seconds (client-side countdown)
- Format: `audio/webm` opus codec (Android MediaRecorder default)
- Transcript is always editable — voice is input assistance, not direct dispatch
- Audio never stored server-side

---

## 12. Security Model

### API key storage (Android)

Anthropic API key (Persona B API Direct) stored in `EncryptedSharedPreferences` (Android Keystore). Never logged. Sent per-request in the `Authorization` header to the `/tasks/dispatch` body over TLS. `cherryops-backend` uses it for that request only and does not persist it.

### JWT auth

Short-lived (24h), silently refreshed. Stored in Android Keystore. Invalidated server-side on logout. Nginx enforces TLS 1.2+ and HSTS.

### Repo access

GitHub OAuth tokens scoped to `repo` minimum. Token not logged on VPS — used only to verify repo access when validating task files.

### Skill sandboxing (MVP)

In v1 (self-hosted), skills are trusted and run in the same process as `cherryops-backend`. This is acceptable because the user owns the VPS. Document this clearly in release notes. For CherryOps Cloud (v2), skills will run in isolated subprocess environments with filesystem restrictions.

### CherryAgent isolation

`cherryops-backend` and CherryAgent share a VPS but are completely independent processes. They do not share databases, environment variables, code, or network ports. There is no dependency between them in either direction.

---

## 13. Starter Skill Packs

Located at `cherry-ops/skills/`. Committed to user repos during onboarding.

### Builder pack (5 skills)

| File | Name | agent_mode |
|---|---|---|
| `run-tests.yaml` | Run Test Suite | `cherry_agent` |
| `draft-changelog.yaml` | Draft Changelog Entry | `cherry_agent` |
| `summarize-pr.yaml` | Summarize PR Diff | `api_direct` |
| `review-claude-md.yaml` | Review CLAUDE.md | `api_direct` |
| `release-notes.yaml` | Generate Release Notes | `api_direct` |

### Operator pack (5 skills)

| File | Name | agent_mode |
|---|---|---|
| `draft-client-email.yaml` | Draft Client Email | `api_direct` |
| `summarize-meeting.yaml` | Summarize Meeting Notes | `api_direct` |
| `proposal-outline.yaml` | Write Proposal Outline | `api_direct` |
| `weekly-review.yaml` | Create Weekly Review | `api_direct` |
| `invoice-brief.yaml` | Generate Invoice Brief | `api_direct` |

All Operator pack skills use `api_direct` — no VPS required for v1 Persona B.

---

## 14. Local Development Setup

### Prerequisites

**Android:**
- Android Studio Meerkat or later
- Min SDK 26 (Android 8.0)
- Target SDK 35
- JDK 17

**Backend:**
- Node.js 20+
- Docker (for self-hosted container testing)
- `ngrok` or Cloudflare Tunnel for FCM testing in development

### Environment files

```
cherry-ops/android/
  local.properties          # debug flags — not committed
  app/google-services.json  # from Firebase Console — not committed

cherry-ops/backend/
  .env.development          # local dev keys
  .env.production           # production keys — never committed
```

### Running locally

```bash
# Backend
cd cherry-ops/backend
cp .env.example .env.development
npm install
npm run dev               # starts on port 3100

# Android
# Open cherry-ops/android/ in Android Studio
# Add google-services.json to app/
# Run on emulator or physical device
```

### Testing the full loop locally

1. Start `cherryops-backend` on port 3100
2. Use `ngrok http 3100` to expose it publicly
3. Set the ngrok URL as the backend endpoint in the Android app settings
4. Connect a test GitHub repo
5. Dispatch a skill — watch the `pending/` folder in the test repo

---

## 15. V2 Technical Additions (CherryOps Cloud)

Not built in v1. Documented here for awareness — v1 decisions must not block these.

**Container spec:** `cherryops-backend` packaged as a Docker image. Startup script clones the user's repo, registers with the orchestrator, and starts the file watcher. Image stored in GitHub Container Registry under `cherry-ops`.

**Orchestrator:** A separate Fastify service in `cherry-ops-cloud/orchestrator/` that receives Stripe webhook events and spins up/tears down user containers via Hetzner Cloud API. One container per user (see PRD §4 for rationale).

**Routing:** Nginx reverse proxy routes `[user-id].ops.cherryops.com` to the correct container. Wildcard cert via Certbot.

**Skills Hub:** A public GitHub repo (`cherryops/skills-hub`) with community-contributed skills following the v1 YAML schema. The Android app fetches the index, shows a browsable library, and installs skills by committing the YAML to the user's project repo.

**Web dashboard:** Astro + TypeScript in `cherry-ops-cloud/dashboard/`. GitHub OAuth, same token flow as mobile. Account, billing, container status.

---

## 16. Open Questions — Deferred to Build Phase

| Question | Resolution |
|---|---|
| ULID library (Android) | `com.github.f4b6a3:ulid-creator` |
| Markdown renderer (Android) | `com.github.jeziellago:compose-markdown` — evaluate first, custom fallback |
| YAML parsing (Android) | `com.charleskorn.kaml:kaml` (no reflection, Kotlin-native) |
| Room migrations | `fallbackToDestructiveMigration` in dev; proper migrations before v1 release |
| Diff renderer | Custom Compose component — unified diff, syntax highlight by file extension |
| ULID library (backend) | `ulid` npm package |
| Task queue (backend) | SQLite-backed in-process queue for MVP; consider BullMQ if load warrants it in v2 |
| Multi-repo support | One registered repo per project in v1. Multiple repos per project is v2. |

---

## 17. CLAUDE.md Template for This Project

Place this file at `cherry-ops/docs/CLAUDE.md` to give Claude Code full product context when working inside the monorepo.

```markdown
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
```

---

*Commit both `cherryops-prd.md` and `cherryops-tdd.md` to `cherry-ops/docs/` as the first commit in the monorepo. The `CLAUDE.md` at `cherry-ops/docs/CLAUDE.md` (or root) should be set up before any feature work begins.*
