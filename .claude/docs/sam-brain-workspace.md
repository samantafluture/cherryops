# Sam's AI-Optimized Workspace — Implementation Plan

Based on David Ondrej's "Second Brain" structure, mapped to your existing projects, tools, and goals.

---

## Root Structure

Claude Code walks up the directory tree and reads `CLAUDE.md` from parent directories. So placing it at `Development/` root means every project session automatically inherits your identity, principles, and business rules.

```
~/Development/
├── CLAUDE.md                  # Master "who I am" file (inherited by all projects)
├── agents.md -> CLAUDE.md     # Symlink for any new agent
├── .queue                     # Active initiatives draining energy
├── .claude/
│   └── skills/                # Shared skills (your existing setup)
│       ├── deployment.md      # VPS deploy checklist, Docker commands
│       ├── surpride-ops.md    # Etsy messaging, Printful webhooks, P&L
│       ├── blog-publish.md    # saminprogress editorial + publish pipeline
│       ├── app-scaffold.md    # Kotlin/Compose app bootstrap pattern
│       └── code-review.md     # PR review standards for Turbulent
│
├── brain/                     # Its own git repo — personal context & data
│   ├── current-state.md       # Snapshot: bottlenecks, revenue, active fires
│   ├── identity.md            # Who you are, how you think, your taste
│   ├── principles.md          # Non-negotiable rules (self-host > managed, TS/pnpm, etc.)
│   ├── energy.md              # Spoon theory patterns, PDA-aware strategies
│   ├── goals/
│   │   ├── business.md        # Quarterly blocks — income targets, Surpride, apps
│   │   ├── personal.md        # TEFAQ, health, relationship, creative
│   │   └── archive/           # Past quarters for pattern review
│   ├── work/
│   │   ├── daily/             # Daily focus logs (what you shipped, what blocked you)
│   │   ├── surpride/          # Operational notes specific to Surpride
│   │   ├── cherry/            # CherryOps, CherryAgent, FinCherry status
│   │   └── apps/              # VoilàPrep, SpoonLog, SessionLog, etc.
│   ├── library/
│   │   ├── etsy-pod/          # Surpride research: Etsy SEO, Printful, POD margins
│   │   ├── llm-agents/        # Paperclip, MCP servers, agentic patterns
│   │   ├── kotlin-mobile/     # Compose, Room, RevenueCat, KMP references
│   │   ├── vps-infra/         # Docker, Nginx, Certbot, Hostinger notes
│   │   ├── french-exam/       # TEFAQ/TEF prep materials, transcripts
│   │   └── neurodivergence/   # PDA, autism, energy management research
│   └── data/
│       └── tracking.db        # SQLite: behavior, frustration, productivity
│
├── cherryagent/               # Project repos (your existing folders)
├── cherrykit/
├── mcp/
├── surpride-app/
├── voila-prep/
├── saminprogress/
├── samantafluture/
│
└── sandbox/                   # Git-ignored. Throwaway experiments.
```

**Why this layout works:**

- `CLAUDE.md` at `Development/` root is inherited by every project via Claude Code's directory walk — you never re-explain yourself.
- `brain/` is its own git repo, cloneable independently on the VPS. It holds the heavier context (goals, library, SQLite) that you reference when needed but don't want loaded into every session.
- `.claude/skills/` at the root level are your existing shared skills — already David's pattern.
- Project folders stay exactly where they are. Nothing moves.

---

## Key Files — What Goes In Each

### CLAUDE.md (Master Instruction File)

Lives at `~/Development/CLAUDE.md`. Claude Code's directory walk means every project inside `Development/` inherits this automatically. This replaces scattering preferences across project-level CLAUDE.md files.

```markdown
# Claude.md — Sam's Operating Manual

## Who I Am
Senior Frontend Lead at Turbulent (remote, Montreal). Brazilian heritage.
Building a portfolio of income streams targeting $5K CAD/month.
Fluent in Portuguese, French (studying for TEFAQ), English.

## How I Work
- Primary stack: TypeScript, pnpm, Fastify, Astro, SQLite (better-sqlite3)
- Mobile: Kotlin + Jetpack Compose + Room + RevenueCat + Vico
- Infrastructure: Self-hosted on Hostinger KVM1 VPS, Docker, Nginx, Certbot
- Dev tool: Claude Code is primary execution layer
- I process through writing. Be direct, not cheerleading.
- PDA profile: avoid demands disguised as suggestions. Frame as options.

## Business Rules
- Surpride earns in EUR (N26 Europe), I live in Canada
- Pride season (May–June) is the critical revenue window — prioritize accordingly
- Self-host over managed services, always
- Every app follows: ULID keys, SQLite, Fastify APIs, Docker on VPS
- Revenue > polish. Ship the thing that makes money first.

## Current Tools
- MCP server: mcp.samantafluture.com (vps_health, morning_standup, blog tools, tasks)
- CherryAgent: Telegram bot for VPS task execution
- CherryTasks: tasks.md files on VPS, auto-committed to GitHub

## Communication Style
- Warm but direct. No fluff.
- Narrative arc with section breaks for writing.
- Quiet endings, not triumphant ones.
```

### .queue (Active Initiatives)

Lives at `~/Development/.queue`. Not tasks — these are the big things occupying mental bandwidth.

```markdown
# .queue — What's On My Plate

## Active
- [ ] Surpride Pride season prep (18 Notion tasks, May–June window)
- [ ] Wix second-channel store migration (top 50 best sellers first)
- [ ] VoilàPrep UI redesign
- [ ] TEFAQ certification study
- [ ] samantafluture.com portfolio redesign ("The Open Workshop")

## Simmering
- [ ] CherryOps Android app (PRD + TDD done, not started)
- [ ] KDP workbooks + Notion templates for app companions
- [ ] saminprogress.dev domain migration

## Parked
- [ ] Arche-Signal System (glitch art)
- [ ] Brazilian AI education market
- [ ] CardClaw (M5Stack Cardputer)
```

### current-state.md

Lives at `~/Development/brain/current-state.md`. The file your AI reads first to know what's happening *right now*.

```markdown
# Current State — Last updated: YYYY-MM-DD

## Revenue
- Surpride: ~€65/month profit, targeting €330+/month peak season
- Turbulent salary: [primary income]
- Apps: $0 (pre-launch)

## Bottlenecks
- Disk capacity concern on VPS (flagged in health check)
- cherryops-api container unhealthy
- Surpride automation platform not yet live (Playwright for Etsy messaging)

## This Week's Focus
- [update daily or every few days]

## Decisions Needed
- [things you're stuck on]
```

---

## How This Maps to What You Already Have

| You already have | Brain workspace equivalent | Gap to close |
|---|---|---|
| Project-level CLAUDE.md files | `CLAUDE.md` at `Development/` root | Consolidate into one master + symlink |
| `morning_standup` MCP tool | `brain/current-state.md` | The MCP tool could *write* this file |
| CherryTasks (tasks.md on VPS) | `.queue` + `brain/work/daily/` | .queue = strategic; tasks.md = tactical |
| Spoons tracking (/spoons-morning) | `brain/energy.md` + `brain/data/tracking.db` | Log spoon data into SQLite for trends |
| Scattered research across projects | `brain/library/` by topic | Consolidate into one place |
| .claude/ skills (planned for blog) | `.claude/skills/` at `Development/` root | Expand pattern to all projects |

---

## Implementation Steps

### Phase 1: Today (30 min)

1. Create `CLAUDE.md` at `~/Development/` root (use the template above, customize)
2. Create `agents.md` symlink: `cd ~/Development && ln -s CLAUDE.md agents.md`
3. Write your `.queue` at `~/Development/.queue` from memory
4. Create `~/Development/brain/` as its own git repo: `mkdir brain && cd brain && git init`
5. Write a first-pass `brain/current-state.md`
6. Add `sandbox/` to `~/Development/.gitignore` (or to brain's `.gitignore`)

### Phase 2: This Week

1. Create `brain/goals/business.md` with Q2 2026 targets (Surpride peak, app launches)
2. Create `brain/goals/personal.md` (TEFAQ timeline, energy management)
3. Populate `brain/library/` with at least 2-3 topic folders from existing research
4. Set up `brain/data/tracking.db` with a simple schema:

```sql
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,  -- ULID
  date TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'business', 'technical', 'personal'
  lesson TEXT NOT NULL,
  source TEXT  -- what triggered the insight
);

CREATE TABLE energy_log (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time_of_day TEXT NOT NULL,  -- 'morning', 'evening'
  spoons INTEGER NOT NULL,
  notes TEXT
);
```

### Phase 3: Integration

1. Update your MCP `morning_standup` to also write/update `brain/current-state.md`
2. Move your blog editor/publisher/designer skills into `~/Development/.claude/skills/`
3. Set up a CherryAgent command: `/brain-sync` — commits and pushes the brain repo
4. Clone `brain/` on the VPS so MCP tools and CherryAgent can read/write it directly

### Phase 4: MCP Brain Tools

This is where you leapfrog David's setup. He pushes to GitHub 50x/day for portability. You already have a live MCP server — so wire the brain repo into it.

New tools to add to `mcp.samantafluture.com`:

| Tool | What it does |
|---|---|
| `brain_status` | Reads `current-state.md` + `.queue` and returns them. Any Claude conversation instantly knows what you're working on, what's blocked, and what's on your plate — no copy-pasting. |
| `brain_update` | Writes to `current-state.md` (specific sections like "This Week's Focus" or "Bottlenecks"). Auto-commits and pushes. |
| `brain_log_lesson` | Inserts a row into `data/tracking.db` lessons table. Capture business/technical insights mid-conversation without breaking flow. |
| `brain_log_energy` | Inserts into `energy_log` table. Replaces or supplements your existing `/spoons-morning` and `/spoons-evening` commands with queryable data. |
| `brain_query` | Runs a read-only SQL query against `tracking.db`. Ask "what lessons did I log this month?" or "what's my average spoon count on Mondays?" from any conversation. |

**Why this matters:** David's system requires you to be in the repo to get context. Yours would be ambient — every Claude conversation (mobile, desktop, claude.ai) gets brain-level context via MCP without you doing anything extra. The brain follows you instead of you going to the brain.

---

## Key Difference From David's Setup

David works primarily from a single local machine with frequent GitHub pushes. Your setup is more distributed — VPS as execution layer, mobile via Telegram/GitHub, laptop for Turbulent work. So:

1. `CLAUDE.md` + `.queue` + `.claude/skills/` live at `~/Development/` (not a separate repo — these are workspace-level files)
2. `brain/` is its own git repo inside `Development/`, cloned independently on the VPS
3. Git sync (not Syncthing) keeps everything aligned across machines

David's portability comes from git discipline. Yours comes from the MCP server making the brain ambient across every Claude session (see Phase 4). That's a strictly better version of the same idea.
