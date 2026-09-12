# Lyric Library — Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 LTS | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Comes with Node |
| Expo CLI | latest | `npm i -g expo-cli` |
| Git | latest | [git-scm.com](https://git-scm.com) |

**Mobile testing** (at least one):
- Expo Go app on your phone (easiest)
- iOS Simulator (macOS only — Xcode)
- Android Emulator (Android Studio)

---

## First-time setup

```bash
# 1 — Clone the repo
git clone <repo-url>
cd Lyric-Library

# 2 — Install dependencies
npm install

# 3 — Start Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npx expo start` | Start dev server |
| `npx expo start --clear` | Start with cache cleared |
| `npx tsc --noEmit` | Type-check without emitting |
| `npx eslint . --ext .ts,.tsx` | Run linter |
| `npx jest` | Run unit tests |
| `npx jest --watch` | Run tests in watch mode |

---

## Path aliases

We use `@/` to alias `src/`. Example:

```tsx
import { AppButton } from '@/components';
import { useArtists } from '@/hooks';
import { colors } from '@/theme';
```

This is configured in `tsconfig.json` and `babel.config.js`.

---

## Branching model

```
main          ← production-ready
  └─ develop  ← integration branch
       └─ feature/S2-XX-description  ← your task branch
```

1. Create your branch from `develop`: `git checkout -b feature/S2-01-artist-grid develop`
2. Commit often with clear messages
3. Push & open a PR against `develop`
4. Wait for CI green + lead review before merging

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Metro bundler cache issues | `npx expo start --clear` |
| Module not found | Delete `node_modules` → `npm install` |
| TypeScript errors in VS Code | Restart TS server: `Cmd+Shift+P` → "TypeScript: Restart" |
| Expo Go version mismatch | Update Expo Go app from store |
