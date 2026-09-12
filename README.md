# Lyric Library

A React Native + Expo app for browsing artists, songs, and lyrics with a clean, wireframe-accurate UI.

## Quick start

```bash
npm install
npx expo start
```

For full setup details, see [SETUP.md](docs/SETUP.md).

## Architecture overview

```mermaid
flowchart LR
  subgraph Presentation
    Nav[Navigation] --> Screens[Screens]
    Screens --> UI[UI Components]
  end

  subgraph Data
    Screens --> Hooks[Query Hooks]
    Hooks --> Repo[Repository]
    Repo --> DataSource[Mock JSON Data]
  end

  subgraph State
    Screens --> Stores[Zustand Stores]
    Stores --> Persist[MMKV]
  end

  subgraph Design
    UI --> Theme[Theme Tokens]
  end
```

More details in [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech stack

- React Native + Expo SDK 52
- TypeScript (strict)
- React Navigation (tabs + stacks)
- TanStack Query (server state)
- Zustand + MMKV (local state)
- FlashList (performance lists)
- Jest + Testing Library

## Docs

- [SETUP.md](docs/SETUP.md)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- [docs/DESIGN_TOKENS.md](docs/DESIGN_TOKENS.md)
- [docs/COMPONENTS.md](docs/COMPONENTS.md)
- [docs/BRANCH_WORKFLOW.md](docs/BRANCH_WORKFLOW.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
# -Lyric-Library
