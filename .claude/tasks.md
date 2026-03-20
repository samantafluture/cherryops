# Project: CherryOps

> Last synced to repo: —
> Last agent update: 2026-03-20

## Active Sprint

### P0 — Must do now

- [ ] Implement Android NetworkModule (Hilt DI for Retrofit/OkHttp) `[S]` #frontend #setup
- [ ] Implement Android AuthInterceptor (JWT header injection) `[S]` #frontend #setup
- [ ] Build File Browser screen (GitHub file tree + navigation) `[L]` #frontend
  - [ ] FileNode model + FileTreeParser implementation
  - [ ] FileBrowserViewModel with GitHub API integration
  - [ ] FileBrowserScreen composable (tree view, folder expand/collapse)
  - [ ] FileViewerScreen composable (markdown rendering, syntax highlight)
- [ ] Build Skills Grid screen (list skills by category/persona) `[M]` #frontend
  - [ ] SkillGridViewModel (load YAML skills, filter by category)
  - [ ] SkillGridScreen composable (grid cards with icons)
  - [ ] SkillDispatchScreen composable (dynamic form from skill inputs)
- [ ] Build Task Dispatch flow `[L]` #frontend #backend
  - [ ] AdHocDispatchScreen composable (free-form prompt + file picker)
  - [ ] TaskRepository implementation (backend API calls)
  - [ ] Wire dispatch → backend → GitHub pending/ flow end-to-end
- [ ] Build Output Review screens `[L]` #frontend
  - [ ] TaskStatusScreen composable (polling, status badges)
  - [ ] TaskReviewScreen composable (markdown output, approve/reject/redirect)
  - [ ] Diff renderer for file changes
- [ ] Build Quick Capture (voice dispatch) `[M]` #frontend
  - [ ] VoiceCaptureManager implementation (AudioRecord)
  - [ ] TranscriptionService (Gemini Flash proxy)
  - [ ] Voice UI (record button, waveform, transcription preview)
- [ ] Build Onboarding flow `[M]` #frontend
  - [ ] PersonaSelectScreen (Builder vs Operator)
  - [ ] BuilderSetupScreen (GitHub OAuth, repo select, backend URL)
  - [ ] OperatorSetupScreen (simplified, no GitHub needed)

### P1 — Should do this week

- [ ] Implement backend FCM sender (Firebase Admin SDK) `[M]` #backend
- [ ] Implement backend voice transcription proxy (Gemini Flash) `[M]` #backend
- [ ] Complete TaskRunner variable interpolation + context file merging `[M]` #backend
- [ ] Build Settings screen (tokens, backend URL, persona switch) `[M]` #frontend
- [ ] Build ProjectList + ProjectHome screens `[M]` #frontend
  - [ ] ProjectListViewModel (fetch repos from GitHub)
  - [ ] ProjectListScreen composable (repo cards)
  - [ ] ProjectHomeScreen composable (recent tasks, quick actions)
- [ ] Implement DataStoreModule for local preferences `[S]` #frontend #setup
- [ ] FCM notification handling — tap-to-navigate to task review `[M]` #frontend

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
