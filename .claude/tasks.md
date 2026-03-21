# Project: CherryOps

> Last synced to repo: —
> Last agent update: 2026-03-21

## Active Sprint

### P0 — Must do now

- [ ] Build Web Dashboard (React + TypeScript + Vite) `[L]` #frontend #web
  > Plan at `.claude/plans/web-dashboard.md`
  - [ ] Phase 1: Scaffold + Auth (Vite, React Router, React Query, Tailwind, OAuth login)
  - [ ] Phase 2: Layout + Overview (AppShell, Sidebar, Dashboard with task count charts)
  - [ ] Phase 3: Projects + File Browser (repo list, file tree, markdown viewer)
  - [ ] Phase 4: Skills + Task Dispatch (skill grid, dynamic form, ad-hoc dispatch)
  - [ ] Phase 5: Task Status + Review (polling, diff viewer, approve/redirect/discard)
  - [ ] Phase 6: Settings + Polish
  - [ ] Phase 7: Deployment (nginx config, CI/CD, VPS setup)
- [ ] Backend API gaps for web dashboard `[S]` #backend
  - [ ] Add `GET /api/v1/tasks` list endpoint with filters
  - [ ] Add `GET /api/v1/devices` list endpoint
  - [ ] Add task counts + stats to health endpoint

### P1 — Should do this week

- [ ] Manual test: Backend API smoke tests `[S]` #testing 👤 manual
  - [ ] `curl https://cherryops.samantafluture.com/api/v1/health` returns `{"status":"ok"}`
  - [ ] Generate a test JWT on VPS and test authenticated endpoints
  - [ ] `POST /api/v1/skills/validate` with valid YAML returns `{"valid":true}`
  - [ ] `POST /api/v1/skills/validate` with invalid YAML returns errors
  - [ ] `POST /api/v1/device/register` with test FCM token succeeds
- [ ] Manual test: Android app build `[S]` #testing 👤 manual
  - [ ] Open project in Android Studio, sync Gradle
  - [ ] Add `google-services.json` from Firebase Console
  - [ ] Build and run on emulator (backend at `http://10.0.2.2:3100`)
  - [ ] Onboarding flow: select persona → enter GitHub PAT → complete setup
  - [ ] Project list loads GitHub repos
  - [ ] File browser displays repo tree, files render correctly
  - [ ] Skill grid loads, dispatch form generates from skill inputs
  - [ ] Ad-hoc dispatch creates a task, status polling works
  - [ ] Voice capture: record → transcribe → edit → dispatch
- [ ] Manual test: VPS deployment pipeline `[S]` #testing 👤 manual
  - [ ] SSH into VPS: `docker ps | grep cherryops` shows running container
  - [ ] `docker logs cherryops-api --tail 20` shows healthy startup
  - [ ] Push a backend change → Deploy workflow triggers on GitHub Actions
  - [ ] Verify deploy script runs health check successfully
  - [ ] `curl https://cherryops.samantafluture.com/api/v1/health` still returns ok after deploy
- [ ] Manual test: End-to-end task flow `[M]` #testing 👤 manual
  - [ ] Create a test repo with a `pending/` directory
  - [ ] Set `GITHUB_PAT` and `ANTHROPIC_API_KEY` in VPS `.env`
  - [ ] Dispatch a task via API (with curl or Android app)
  - [ ] Task moves through queued → running → complete
  - [ ] Output file appears in repo `outputs/` directory
  - [ ] Approve task → moves to `done/`

### P2 — Nice to have

- [ ] Write Android UI tests (Compose testing) `[L]` #testing
- [ ] Add Web Audio API voice capture to web dashboard `[M]` #web
- [ ] Real-time updates via WebSocket (replace polling) `[M]` #backend #web

## Blocked

## Completed (recent)

- [x] VPS deployment — backend live at cherryops.samantafluture.com ✅ 2026-03-21
- [x] Fix CI — Backend CI + Android CI both green ✅ 2026-03-21
- [x] Add GitHub OAuth PKCE flow (backend + Android) ✅ 2026-03-20
- [x] Write backend integration tests (Vitest) — 3 test suites ✅ 2026-03-20
- [x] Enhance CI/CD — Docker build + APK artifact upload ✅ 2026-03-20
- [x] Add pagination for GitHub repo list ✅ 2026-03-20
- [x] Add offline file browsing with Room cache ✅ 2026-03-20
- [x] Add retry with exponential backoff to TaskRunner ✅ 2026-03-20
- [x] Add repo poll watcher for auto-execution of pending tasks ✅ 2026-03-20
- [x] Add diff renderer for code changes in task review ✅ 2026-03-20
- [x] Add FCM notification handling with tap-to-navigate ✅ 2026-03-20
- [x] Add variable interpolation + context file merging to TaskRunner ✅ 2026-03-20
- [x] Add Voice Capture — record, transcribe, dispatch by voice ✅ 2026-03-20
- [x] Wire all screens into NavGraph + fix DI bindings ✅ 2026-03-20
- [x] Build Onboarding flow (PersonaSelect, BuilderSetup, OperatorSetup) ✅ 2026-03-20
- [x] Build Settings screen (persona, GitHub status, dark mode, logout) ✅ 2026-03-20
- [x] Build ProjectList + ProjectHome screens ✅ 2026-03-20
- [x] Build Output Review screens (TaskReviewScreen, approve/redirect/discard) ✅ 2026-03-20
- [x] Build Task Dispatch flow (AdHocDispatch + TaskStatus with polling) ✅ 2026-03-20
- [x] Build Skills Grid screen (grid + category filters + dispatch form) ✅ 2026-03-20
- [x] Build File Browser screen (tree view + file viewer with markdown) ✅ 2026-03-20
- [x] All prior scaffolding + infrastructure ✅ 2026-03-20

## Notes
- Check CLAUDE.md for architectural decisions before starting work
- Backend runs on port 3100 (not 3000)
- Never import CherryAgent from cherryops-backend
- Skill schema is v1 — don't change field names without bumping version
- Two agent modes: api_direct (Claude API) and cherry_agent (Claude CLI headless)
- Web dashboard plan: `.claude/plans/web-dashboard.md`
- Backend live at: https://cherryops.samantafluture.com/api/v1/health
