# Project: CherryOps

> Last synced to repo: —
> Last agent update: 2026-03-20

## Active Sprint

### P0 — Must do now

(empty — all P0 complete)

### P1 — Should do this week

(empty — all P1 complete)

### P2 — Nice to have

- [ ] Backend file watcher (chokidar) for pending/ auto-execution `[M]` #backend
- [ ] Backend error recovery and retry logic `[M]` #backend
- [ ] Offline mode for file browsing (Room cache) `[M]` #frontend
- [ ] Pagination for GitHub repo/file lists `[S]` #frontend
- [ ] CI/CD pipeline for Android builds `[M]` #devops
- [ ] CI/CD pipeline for backend Docker builds `[M]` #devops
- [ ] Write backend integration tests (Vitest) `[L]` #testing
- [ ] Write Android UI tests (Compose testing) `[L]` #testing
- [ ] GitHub OAuth flow (replace PAT with OAuth token) `[L]` #frontend #backend

## Blocked

## Completed (recent)

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
- [x] Implement DataStoreModule for local preferences ✅ 2026-03-20
- [x] Implement Android NetworkModule (Hilt DI for Retrofit/OkHttp) ✅ 2026-03-20
- [x] Implement Android AuthInterceptor (JWT header injection) ✅ 2026-03-20
- [x] Write PRD and TDD documents ✅ 2026-03-20
- [x] Create skill YAML schema v1 + 10 starter skill packs ✅ 2026-03-20
- [x] Scaffold backend (Fastify + SQLite + routes + middleware) ✅ 2026-03-20
- [x] Implement skill YAML validation endpoint ✅ 2026-03-20
- [x] Implement task queue with concurrency control ✅ 2026-03-20
- [x] Implement basic TaskRunner (Claude API + CLI modes) ✅ 2026-03-20
- [x] Scaffold Android app (Hilt, Compose, navigation graph) ✅ 2026-03-20
- [x] Define all 13 screen routes in navigation graph ✅ 2026-03-20
- [x] Implement TokenManager (EncryptedSharedPreferences) ✅ 2026-03-20
- [x] Implement GitHubRepository (file tree, content, update) ✅ 2026-03-20
- [x] Implement SkillParser (YAML parsing) ✅ 2026-03-20
- [x] Define Retrofit interfaces (BackendApiService, GitHubApiService) ✅ 2026-03-20
- [x] Define data models (Project, Task, Skill) ✅ 2026-03-20
- [x] Set up Material 3 theme (colors, typography) ✅ 2026-03-20

## Notes
- Check CLAUDE.md for architectural decisions before starting work
- Backend runs on port 3100 (not 3000)
- Never import CherryAgent from cherryops-backend
- Skill schema is v1 — don't change field names without bumping version
- Two agent modes: api_direct (Claude API) and cherry_agent (Claude CLI headless)
