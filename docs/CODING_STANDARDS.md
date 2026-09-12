# Coding Standards — Lyric Library

## TypeScript

- **Strict mode** is on — no `any` unless explicitly justified
- Use `interface` for object shapes, `type` for unions/aliases
- Import types with `import type { ... }` when only used as types
- Path alias: use `@/` instead of relative paths

## React & React Native

- **Functional components only** — no class components
- Use `export default function ScreenName()` for screens
- Use `React.memo()` for list item components (ArtistCard, SongRow, etc.)
- Use `useCallback` / `useMemo` when passing callbacks to memoized children
- Prefer `FlashList` over `FlatList` for lists >20 items

## Styling

- Use `StyleSheet.create()` — **no inline style objects**
- Access theme via `useThemedStyles()` or `useTheme()`
- Use theme tokens for all colors, spacing, typography — no magic numbers
- Keep styles at the bottom of the file

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `ArtistCard.tsx` |
| Hooks | camelCase, `use` prefix | `useArtists.ts` |
| Utils | camelCase | `formatters.ts` |
| Types/Interfaces | PascalCase | `Artist`, `Song` |
| Constants | UPPER_SNAKE | `FAKE_DELAY` |
| Route names | PascalCase | `ArtistDetail` |

## Git

- Branch: `feature/S2-XX-short-description`
- Commits: imperative mood — "Add artist grid" not "Added artist grid"
- One logical change per commit
- PR must pass CI (lint + type-check + tests) before review

## Testing

- Co-locate test files: `MyComponent.test.tsx` next to `MyComponent.tsx`
- Test user-visible behavior, not implementation details
- Use `@testing-library/react-native`
- Minimum coverage target: 60% for Sprint 2, 80% for Sprint 3
