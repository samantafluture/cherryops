# Project: CherryOps

> Last synced to repo: 2026-04-02T21:42:16.634Z
> Last agent update: 2026-04-04

## Active Sprint

### P0 — Must do now
(none — all P0 complete)

### P1 — Should do this week

- [ ] Fix shipit_ci_status: gh CLI in vps-mcp-server container needs GitHub auth (GITHUB_TOKEN env var) `[S]` #devops
- [ ] Register vps-mcp-server as a managed project in the MCP project registry `[S]` #devops
### P2 — Nice to have
- [ ] Add Web Audio API voice capture to web dashboard #feature
- [ ] GitHub OAuth login for web dashboard (end-user auth) #feature
- [ ] Write Android UI tests (Compose testing) #chore

## Blocked

## Completed (recent)
- [x] Backend API gaps for web dashboard #feature ✅ 2026-04-03
- [x] Build Web Dashboard (React + TypeScript + Vite) #feature ✅ 2026-04-03
- [x] Wire context file merging into skill dispatch flow #feature ✅ 2026-04-03
- [x] Add quick capture widget to web dashboard #feature ✅ 2026-04-03
- [x] Add checkbox toggling in file browser markdown viewer #feature ✅ 2026-04-03
- [x] Checkbox toggling in file browser — clickable [ ]/[x] + PUT /files/content endpoint ✅ 2026-04-03
- [x] Quick capture widget — floating Zap button with Ctrl+K shortcut ✅ 2026-04-03
- [x] Context file merging in skill dispatch — loads skill context_files into task brief ✅ 2026-04-03
- [x] Skill execution UI — Run button + variable form on skill cards ✅ 2026-04-03
- [x] File browser — backend routes + web page with tree + content viewer ✅ 2026-04-03
- [x] Diff viewer component — color-coded unified diff renderer ✅ 2026-04-03
- [x] Real-time updates via WebSocket — EventBus + WS route + useTaskStream hook ✅ 2026-04-03
- [x] Onboarding flow — persona selection + repo connect + settings re-run ✅ 2026-04-03
- [x] Task dispatch form — New Task button + repo/brief form on Tasks page ✅ 2026-04-03
- [x] Skills browser — Browse tab with card grid + category filter ✅ 2026-04-03
- [x] GET /skills endpoint — list starter skills from YAML files ✅ 2026-04-03
- [x] POST /tasks/create endpoint — high-level task creation + dispatch ✅ 2026-04-03
- [x] Add vps_read_file tool — read any file across all VPS projects #feature ✅ 2026-04-02
- [x] Add vps_list_files tool — browse directory structure in any project #feature ✅ 2026-04-02
- [x] Add vps_search_code tool — grep across all project codebases #feature ✅ 2026-04-02
- [x] Add vps_create_branch tool — create feature branch from main in a project #feature ✅ 2026-04-02
- [x] Add vps_create_pr tool — open GitHub PR from a claude/* branch #feature ✅ 2026-04-02
- [x] Add vps_write_file tool — write files only on non-main branches #feature ✅ 2026-04-02

## Notes
- Check CLAUDE.md for architectural decisions before starting work
