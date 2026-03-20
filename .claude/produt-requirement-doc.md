# CherryOps — Product Requirements Document

**Version:** 0.2  
**Status:** In Progress  
**Owner:** Sam  
**Last updated:** March 2026

---

## 1. Problem & Vision

### The Problem

AI workflows are desktop-bound. Whether you're a developer running Claude Code agents or a solopreneur using Claude to draft proposals, process clients, and manage operations — the moment you step away from your laptop, the loop breaks.

The tools that exist today force a choice: either stay at your desk to direct your AI, or lose continuity entirely. Telegram bots like OpenClaw partially solve this for power users willing to wire their own infrastructure, but there is no dedicated, polished, mobile-first product for directing AI agents from your phone.

Meanwhile, the files that give AI agents their context — project briefs, backlogs, SOPs, client notes, roadmaps — live scattered across machines, with no elegant mobile interface to read, update, and act on them.

The result: AI agents are underutilized. They sit idle when their operator is mobile. Tasks pile up waiting for the next desktop session. The promise of "your AI does the work while you live your life" remains largely theoretical.

### The Vision

**CherryOps is a mobile command center for your AI workflows.**

It gives you a clean, fast mobile interface to:

- Browse and edit your project context files (markdown-based, Git-synced)
- Trigger reusable workflow skills with one tap
- Dispatch ad-hoc tasks to your AI agent from anywhere
- Review what the agent produced and approve, redirect, or discard
- Stay in the loop without being at your desk

CherryOps does not replace your AI agent. It gives it a remote control.

The north star experience: you're on the subway, you open CherryOps, you see your project backlog, you tap a skill ("Draft client follow-up"), and by the time you arrive, there's a result waiting for your review.

---

## 2. User Personas

CherryOps targets two distinct personas who share the same core need but come from different contexts. Both are addressed from day one, with onboarding paths tailored to each.

---

### Persona A — The Builder

**Who they are:** Indie developers, freelance engineers, indie hackers, technical solopreneurs. They use Claude Code or similar agentic coding tools daily. They manage multiple personal projects simultaneously. They are comfortable with Git, markdown, and CLI tools.

**Their workflow today:** They have project repos with `CLAUDE.md`, `backlog.md`, and `roadmap.md` files. They run Claude Code from their terminal. When they're away from their laptop, everything stops. They might send themselves a Telegram message with a task idea, then manually pick it up later.

**Their pain:** They can't delegate tasks to their agent when they're not at their desk. They lose context switching between ideas and execution. They want to use commute time, waiting time, and side-thinking time productively.

**What they want from CherryOps:**
- Browse their project files on mobile with markdown rendering
- One-tap skills for recurring dev workflows (run tests, draft changelog, review PR)
- Dispatch ad-hoc tasks to Claude Code
- See a diff or summary of what the agent did
- Approve a PR draft or redirect with a voice note

**Their tolerance:** High. They'll configure things, read docs, and tolerate a rough v1 if the core workflow works. They are the right early adopters. They self-host their own VPS and CherryAgent backend.

---

### Persona B — The Operator

**Who they are:** Solopreneurs, freelancers, small business owners, consultants. They use Claude heavily but not for code — for drafting, processing, summarizing, generating, and organizing. They run lean operations where they are the strategist, manager, and executor simultaneously.

**Their workflow today:** They use Claude on desktop to write proposals, summarize client feedback, draft content, create SOPs, and manage their pipeline. They save outputs manually, copy-paste between tools, and lose context frequently. On mobile they are essentially disconnected from their AI workflow.

**Their pain:** Their AI assistant only works when they are sitting at a computer. Client ideas, task briefs, and workflow triggers happen throughout the day — but there is no way to act on them in the moment.

**What they want from CherryOps:**
- A clean view of their projects and current status
- One-tap skills tailored to their work type (draft proposal, summarize meeting, generate invoice brief)
- Quick capture of a task brief or client update from mobile
- Receive the output and approve it for sending or saving

**v1 mode:** Claude API Direct — no VPS required, agent generates outputs but does not execute code or make commits.  
**v2 mode:** CherryOps Cloud — fully managed backend, full agent execution loop, zero infrastructure to manage.

**Their tolerance:** Lower. They need guided onboarding, templates, and a UI that does not expose the underlying Git or markdown mechanics.

---

### The Bridge

Both personas share the same core loop: **capture context → trigger skill or dispatch task → review output → act.** The architecture is identical. The surface layer and backend differ. CherryOps serves both with a single codebase and two onboarding modes.

---

## 3. Core Features & MVP Scope

### MVP Philosophy

Ship the smallest version that makes the core loop work end-to-end for Persona A. The skills system is included in MVP as a lightweight, file-based layer — it is a core primitive, not a nice-to-have. Managed hosting (CherryOps Cloud) is v2. Do not build features that do not serve the loop.

**The loop:** Browse context files → trigger skill or dispatch task → review output.

---

### Feature 1 — Project File Browser

**What it does:** Connects to a GitHub or GitLab repository and displays project folders and markdown files in a clean, readable interface.

**MVP scope:**
- OAuth or PAT-based GitHub connection
- Folder and file tree navigation
- Markdown rendering with checkbox support (`- [ ]` / `- [x]`)
- Inline checkbox toggling (tap to check/uncheck without opening an editor)
- Pull on open and manual pull button to sync latest

**Out of scope for MVP:** Full markdown editor, conflict resolution UI, branch switching.

---

### Feature 2 — Skills System

**What it does:** Exposes reusable, one-tap workflow templates defined as files in the repo. This is the core extensibility primitive for both personas, present from MVP.

**How it works (light version):**

Skills are YAML files stored in a `skills/` folder at the root of the project repo. The app reads them at sync time and surfaces them in the UI as tappable workflow cards. Each skill defines:

```yaml
# skills/draft-client-email.yaml
name: Draft Client Email
description: Write a follow-up email based on the client brief
icon: email
context_files:
  - clients/{{client}}/brief.md
  - ops/sops/email-tone.md
prompt_template: |
  Using the client brief and tone guidelines provided,
  draft a professional follow-up email.
  Keep it under 200 words. Subject line included.
output_file: outputs/emails/{{client}}-followup.md
agent_mode: api  # or: claude_code
```

**MVP scope:**
- App reads `skills/` folder from connected repo on sync
- Skills displayed as a card grid on the project home screen
- Tapping a skill opens a pre-filled dispatch view with context resolved
- Skills work in both agent modes (Claude API Direct and CherryAgent)
- Starter skill packs included in both Builder and Operator onboarding templates

**Builder starter skills:** Run tests, Draft changelog, Summarize PR diff, Review CLAUDE.md, Generate release notes  
**Operator starter skills:** Draft client email, Summarize meeting notes, Write proposal outline, Create weekly review, Generate invoice brief

**v2 additions (not MVP):**
- CherryOps Skills Hub: a community repository of shareable skills
- One-click skill installation from hub into your repo
- Skill versioning and update notifications
- Skills with external integrations (send output to Notion, post to Slack, etc.)

*Note: The skill YAML schema must be designed from day one with Hub compatibility in mind. A migration later would be painful.*

---

### Feature 3 — Task Dispatch

**What it does:** Lets the user write an ad-hoc brief and send it to their AI agent for execution, outside of a predefined skill.

**MVP scope:**
- Tap any checklist item in the file browser to open dispatch view
- Write or edit a task brief (text input)
- Voice note capture → transcription via Gemini Flash → populates brief
- Dispatch writes a structured `pending/[task-id].md` to the repo and pushes
- CherryAgent watcher on VPS picks up and runs Claude Code
- Status indicator: Pending / In Progress / Done / Needs Review

**Out of scope for MVP:** Real-time streaming, multiple agent backends, in-app agent configuration.

---

### Feature 4 — Output Review

**What it does:** Shows what the agent produced and lets the user approve, redirect, or discard.

**MVP scope:**
- Push notification (FCM) when agent completes a task or skill
- Output view: rendered markdown of what was produced
- Lightweight diff view for code changes (unified diff format, syntax highlighted)
- Three actions: Approve (merges/commits), Redirect (sends new brief back), Discard (cleans up)
- Redirect opens dispatch view pre-filled with previous brief and "Here is what I want changed:" prompt

**Out of scope for MVP:** In-app code editor, multi-file diff browser, PR integration.

---

### Feature 5 — Quick Capture

**What it does:** A fast, low-friction way to capture a task idea or context update without navigating the full app.

**MVP scope:**
- Home screen widget: one tap → voice note or text → dispatched to selected default project
- Share sheet integration: share text from any app into CherryOps as a task brief
- Quick capture saves to `inbox/[timestamp].md` if no project is selected

**Out of scope for MVP:** Google Assistant integration, background processing.

---

### Feature 6 — Onboarding Modes

**What it does:** Two distinct first-run experiences depending on which persona the user identifies with.

**Builder Mode (Persona A):**
- Connect GitHub repo
- Select or confirm file structure (`backlog.md`, `roadmap.md`, etc.)
- Connect agent backend (VPS webhook URL or CherryAgent endpoint)
- Auto-installs Builder starter skill pack into `skills/` folder
- Done — you are in

**Operator Mode (Persona B — v1 / API Direct):**
- Choose a template: Consulting Practice / Content Creator / E-commerce / Freelancer / Custom
- Template creates a starter repo with pre-built folder structure, example files, and Operator skill pack
- Agent backend defaults to Claude API Direct (no infrastructure required)
- Guided first skill walkthrough
- Upsell prompt for CherryOps Cloud (v2) once user completes first workflow

---

### Feature 7 — Agent Backend Abstraction

**What it does:** Connects CherryOps to the actual AI execution layer. Two modes for MVP.

**Mode A — CherryAgent / Self-hosted VPS:**
The app writes task files to the repo. A watcher service on the user's VPS executes Claude Code and writes results back. Full agent execution. Best for Persona A.

**Mode B — Claude API Direct:**
For users without a VPS. The app calls Claude API directly with the task brief and context files as input. Output is returned in-app. No code execution, no commits — Claude generates text, documents, and plans. Best for Persona B v1 workflows.

Both modes use the same dispatch and review UI. The backend is a configuration setting, not a product split.

---

### What Is Not in MVP

- CherryOps Cloud / managed hosting (v2 — see section 4)
- Skills Hub / community skill registry (v2)
- Team and multi-user support
- Desktop app
- Direct GitHub PR integration (diff view only for now)
- iOS version
- Billing and paywall (ship free first, monetize at v2)

---

## 4. V2 — CherryOps Cloud (Managed Hosting)

### The Concept

CherryOps Cloud closes the gap for Persona B completely. Instead of requiring a self-hosted VPS and CherryAgent setup, CherryOps provisions and manages the full backend infrastructure on the user's behalf. Persona B gets the complete agent execution loop — real task execution, Git commits, output delivery — without touching a terminal.

This is the primary monetization layer. It transforms CherryOps from a free utility into a recurring SaaS.

### What Gets Managed

Each CherryOps Cloud user receives:

- An isolated Docker container running a managed CherryAgent instance
- Persistent storage for their project files, or connection to their own GitHub repo
- A dedicated agent execution environment (Claude Code headless or Claude API)
- Automated Git sync, commit, and push on their behalf
- FCM push notification routing through managed infrastructure
- A web dashboard for configuration and billing

### What the User Brings

- Their own Anthropic API key (CherryOps Cloud does not absorb LLM costs — standard industry pattern, same as Vercel, Railway, etc.)
- Their GitHub account for repo access, or use hosted storage
- Their project files and skills

### Pricing Model (Draft)

| Tier | Target | Price | What is included |
|---|---|---|---|
| Self-hosted | Persona A | Free | App only, BYO backend |
| Cloud Starter | Persona B entry | $14.99/month | Managed backend, 3 projects, 500 tasks/month |
| Cloud Pro | Persona B power user | $29.99/month | Managed backend, unlimited projects, priority execution |
| Cloud Team | Small teams | $59.99/month | Multi-user, shared projects, admin dashboard |

### Technical Approach

- Container orchestration: Docker on a scalable VPS cluster (Hetzner or similar)
- Isolation model: one container per user — not shared runtime. Security and reliability over cost efficiency.
- Billing: Stripe integration
- Provisioning: automated on signup, deprovisioned after 30 days of inactivity with data export offered
- API key storage: encrypted at rest, never logged

### Why Not Shared Runtime

Shared runtime is cheaper to operate but creates security and reliability risks that are hard to explain to non-technical users. A rogue skill or a runaway agent loop on one user's account should never affect another's. Container-per-user is the right call even if it costs more, and the pricing reflects it.

### Cost Modelling (Must Be Done Before Building)

A dormant container on Hetzner costs roughly €3-4/month. Active users with frequent task execution consume significantly more. The $14.99/month Starter tier must be margin-positive at realistic usage levels before a single line of Cloud infrastructure is written. Model this carefully against expected task volume and Claude API costs per user.

### V2 Milestone Dependencies

- V1 must be stable and CherryAgent API contracts locked
- CherryAgent must be packaged as a portable, hardened Docker container spec
- Stripe billing integration built
- Web dashboard for account and container management
- Skills Hub ships alongside Cloud — shareable skills are the social layer that drives Cloud adoption

---

## 5. Technical Architecture Overview

### Stack

**Mobile app:** Kotlin + Jetpack Compose (Android first)  
**Backend / agent bridge:** Fastify on existing Hostinger KVM1 VPS, extending CherryAgent  
**Sync layer:** GitHub API + Git over SSH  
**AI execution:** Claude Code SDK/headless for Persona A, Claude API for Persona B  
**Transcription:** Gemini Flash (voice → text, consistent with existing CherryAgent voice pipeline)  
**Push notifications:** Firebase Cloud Messaging (FCM)  
**Auth:** GitHub OAuth for repo access, JWT for CherryAgent API  
**Skills format:** YAML (primary)

---

### Architecture Diagram

```
[CherryOps Android App]
        │
        ├── GitHub API ──────────────── [project repo]
        │       │                              │
        │       └── pull / push files          ├── backlog.md, roadmap.md
        │                                      ├── skills/*.yaml        ← skill definitions
        │                                      ├── pending/*.md         ← dispatched tasks
        │                                      └── outputs/*.md         ← agent results
        │
        └── CherryAgent API (HTTPS) ─── [Hostinger VPS  /  CherryOps Cloud container]
                │                              │
                ├── /tasks/dispatch            ├── File watcher
                ├── /tasks/status              ├── Claude Code (headless)
                ├── /tasks/results             ├── Git auto-commit + push
                └── /skills/validate           └── FCM notification → app
```

---

### Data Flow — Skill Execution

1. User syncs repo → app reads `skills/` folder, surfaces skill cards on project screen
2. User taps a skill (e.g. "Draft Client Email")
3. App resolves context files listed in skill YAML, reads content from repo
4. Opens pre-filled dispatch view — user reviews and optionally edits the brief
5. Taps Run → app writes `pending/skill-[id].md` to repo, pushes
6. CherryAgent detects file, constructs Claude prompt from skill template and context
7. Runs Claude (Code or API depending on `agent_mode` in skill YAML)
8. Writes output to path defined in `output_file`, commits, pushes
9. Sends FCM notification to app
10. User reviews output → Approve / Redirect / Discard

---

### Data Flow — Ad-hoc Task Dispatch

1. User browses `backlog.md`, taps a checklist item
2. Opens dispatch view with task title pre-filled
3. Optionally records voice note → Gemini Flash transcribes inline
4. Taps Dispatch → writes `pending/task-[id].md`, pushes
5. CherryAgent picks up, runs Claude Code with task brief + CLAUDE.md context
6. Output committed to `outputs/task-[id].md`, push, FCM notification
7. User reviews → Approve moves task to `done/` and applies changes

---

### Infrastructure Reuse from Cherry Ecosystem

| Component | Cherry equivalent | Extension needed |
|---|---|---|
| Agent backend | CherryAgent (Fastify + VPS) | Add `/tasks/*` and `/skills/validate` endpoints |
| Git sync | CherryTasks (tasks.md + auto-commit) | Generalize to any project repo |
| Voice pipeline | CherryAgent voice plan (Gemini Flash) | Port to Android native |
| VPS and infra | Hostinger KVM1 + Nginx + Certbot | Add FCM webhook routing |
| Android baseline | Voilà Prep (Kotlin + Compose) | New app, shared patterns |
| Skills concept | Claude Code skills (`~/.claude/skills/`) | Expose in mobile UI via YAML |

---

## 6. Open Questions

- **KMM evaluation:** Before writing the first Android screen, evaluate Kotlin Multiplatform Mobile. If iOS is a v2 or v3 target, KMM now prevents a painful rewrite later. Worth 2-3 hours of research before committing.
- **Skill YAML schema:** Must be finalized before writing any skills, because changing the schema later breaks all existing skills. Design it with Hub compatibility in mind from day one.
- **API key handling:** Persona B Claude API Direct mode requires an Anthropic API key. Options: user pastes their own key stored encrypted on device, or proxy through CherryAgent to hide the key. Lean toward user's own key for v1, proxy for CherryOps Cloud.
- **Conflict resolution:** If agent and user edit the same file simultaneously, Git surfaces a conflict. MVP shows an error and asks for manual resolution. V2 gets a merge UI.
- **Cloud cost modelling:** Must be done rigorously before building v2. Model per-user container cost at dormant, low-usage, and high-usage levels against the $14.99 Starter price point.
- **App name:** CherryOps is the working name. Confirm before any public-facing work.

---

## 7. Success Metrics (MVP)

- Core loop works end-to-end: file browse → skill or task dispatch → review in under 60 seconds
- Persona A can connect their existing repo and run a skill within 10 minutes of install
- Persona B can complete guided onboarding and run their first skill without reading documentation
- Skills load correctly from `skills/` folder on sync with zero silent failures
- Zero data loss: no task brief or agent output is ever silently dropped

---

## 8. Next Steps

**V1 (MVP)**
1. ✅ PRD complete (this document)
2. ⬜ Evaluate KMM vs Android-only before writing first screen
3. ⬜ Finalize skill YAML schema (Hub-compatible from day one)
4. ⬜ Technical Design Doc — API contracts, data models, file structure conventions
5. ⬜ Create `cherry-docs` repo with initial project structure
6. ⬜ Extend CherryAgent: `/tasks/dispatch`, `/tasks/status`, `/tasks/results`, `/skills/validate`
7. ⬜ Write Builder and Operator starter skill packs
8. ⬜ Scaffold Android app — baseline navigation and GitHub auth
9. ⬜ Build file browser + markdown renderer
10. ⬜ Wire skills system end-to-end (read → surface → dispatch → execute → notify → review)
11. ⬜ Build output review view with diff renderer
12. ⬜ Internal dogfood on Cherry projects and Surpride
13. ⬜ Soft launch to indie dev and solopreneur communities

**V2 (CherryOps Cloud + Skills Hub)**
1. ⬜ Cost modelling: per-user container economics at realistic usage levels
2. ⬜ Harden CherryAgent as a portable Docker container spec
3. ⬜ Stripe billing integration
4. ⬜ Container provisioning automation
5. ⬜ Web dashboard (account, billing, container status)
6. ⬜ Skills Hub (community skill sharing — launches alongside Cloud)
7. ⬜ iOS evaluation post-v1 validation

---

*This document is a living artifact. Update it as decisions are made and scope evolves.*
