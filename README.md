# CherryOps

A mobile command center for AI workflows.

**Browse context files → trigger skill or dispatch task → review output.**

CherryOps gives you a clean, fast mobile interface to direct your AI agents from anywhere. Whether you're a developer running Claude Code or a solopreneur using Claude for business operations, CherryOps keeps you in the loop without being at your desk.

## Architecture

| Component | Stack | Purpose |
|---|---|---|
| `android/` | Kotlin + Jetpack Compose | Mobile app |
| `backend/` | Fastify + TypeScript + SQLite | Task execution, API proxy |
| `skills/` | YAML | Reusable workflow templates |

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env.development
npm install
npm run dev  # starts on port 3100
```

### Android

1. Open `android/` in Android Studio
2. Add `google-services.json` from Firebase Console
3. Run on emulator or physical device

### Full Loop Testing

1. Start backend on port 3100
2. Use `ngrok http 3100` to expose publicly
3. Set ngrok URL as backend endpoint in app settings
4. Connect a test GitHub repo
5. Dispatch a skill and watch `pending/` in the test repo

## Documentation

- [Product Requirements](docs/cherryops-prd.md)
- [Technical Design](docs/cherryops-tdd.md)

## License

[Apache License 2.0](LICENSE)
