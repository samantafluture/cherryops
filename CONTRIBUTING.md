# Contributing to CherryOps

Thank you for your interest in contributing to CherryOps! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch from `main`
4. Make your changes
5. Submit a pull request

## Development Setup

### Backend

```bash
cd backend
cp .env.example .env.development
npm install
npm run dev
```

### Android

1. Open `android/` in Android Studio (Meerkat or later)
2. Sync Gradle
3. Run on emulator (min SDK 26)

## Code Standards

### Backend (TypeScript)

- `strict: true` in tsconfig — no `any` types, no `@ts-ignore`
- Routes → services → db — no business logic in routes
- All external calls have proper error handling
- SQL queries use parameterized statements

### Android (Kotlin)

- MVVM strict — no network/db calls in Composables or ViewModels directly
- Hilt for dependency injection — no manual instantiation
- No `!!` force unwraps without justification
- Android Keystore for all sensitive storage

### General

- camelCase for TypeScript/Kotlin, snake_case for database columns
- Functions should be small and single-purpose (extract if > 30 lines)
- No magic numbers or hardcoded strings — use constants/enums
- No dead code, no commented-out blocks, no TODOs without linked issues

## Skill Contributions

Skills live in `skills/` as YAML files following the schema in `docs/cherryops-tdd.md` §4. All skills must pass `/skills/validate` before merge.

## Pull Request Process

1. Ensure your PR has a clear title and description
2. Link any related issues
3. Ensure CI passes (lint, typecheck, tests)
4. Request review from a maintainer

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
