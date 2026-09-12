# Lyric Library — Architecture Guide

This document explains how the codebase is organized so you can find your way around quickly.

---

## Directory structure

```
src/
├── app/                      # App entry, navigation, providers
│   ├── AppNavigator.tsx      # Bottom tabs + stack navigators
│   ├── navigationTypes.ts    # Route param type definitions
│   └── providers/
│       └── QueryProvider.tsx  # TanStack Query client
│
├── components/               # Shared UI building blocks
│   ├── primitives/           # Atoms: AppScreen, AppText, AppButton, etc.
│   └── composite/            # Molecules: ArtistCard, SongRow, ResultRow, etc.
│
├── features/                 # Feature modules (one per domain)
│   ├── artists/              # Artists browse + detail
│   ├── songs/                # Songs browse + lyrics display
│   ├── search/               # Search tab
│   └── saved/                # Saved collection tab
│
├── hooks/                    # Custom React hooks
│   ├── useTheme.ts           # Theme access hook
│   └── queries/              # TanStack Query hooks (useArtists, useSongs, etc.)
│
├── data/mock/                # Mock JSON fixtures
├── services/repository/      # Data layer (interface + mock implementation)
├── store/                    # Zustand state stores (saved lyrics, UI prefs)
├── theme/                    # Design tokens (colors, spacing, typography, shadows)
├── types/                    # TypeScript interfaces & type unions
└── utils/                    # Utility functions (formatters, groupers, filters)
```

---

## Data flow

```
Screen → useQuery hook → repository.method() → mock JSON data
                                    ↕
                            Zustand store (saved/UI)
```

1. **Screens** call **query hooks** (`useArtists`, `useSongs`, etc.)
2. Query hooks call **repository methods** (via `lyricsRepository` singleton)
3. Repository reads from **mock JSON files** (Sprint 1) — can be swapped for API later
4. Local state (saved lyrics, text size) is managed by **Zustand stores** with persistence

---

## Key patterns

### 1. Theme usage
```tsx
import { useThemedStyles } from '@/hooks';

function MyScreen() {
  const styles = useThemedStyles((theme) => ({
    container: { backgroundColor: theme.colors.bgPrimary },
  }));
  return <View style={styles.container} />;
}
```

### 2. Query hooks
```tsx
import { useArtists } from '@/hooks';

function ArtistsScreen() {
  const { data: artists, isLoading, error } = useArtists();
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;
  return <FlatList data={artists} ... />;
}
```

### 3. Navigation
```tsx
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ArtistsStackParamList } from '@/app/navigationTypes';

type Nav = NativeStackNavigationProp<ArtistsStackParamList>;
const navigation = useNavigation<Nav>();
navigation.navigate('ArtistDetail', { artistId: 'a01', artistName: 'Adele' });
```

### 4. Zustand store
```tsx
import { useSavedStore } from '@/store';

const { saveLyric, removeLyric, isSaved } = useSavedStore();
```

---

## Component conventions

- **Primitives** are generic, reusable, and theme-aware
- **Composites** combine primitives for app-specific patterns
- **Screens** live inside `features/<domain>/screens/`
- All components use `React.memo()` where performance matters (list items)
- Use `StyleSheet.create()` — no inline style objects

---

## Adding a new screen

1. Create `src/features/<domain>/screens/MyScreen.tsx`
2. Add the route to `src/app/navigationTypes.ts`
3. Register it in the relevant stack inside `AppNavigator.tsx`
4. Export from `src/features/<domain>/index.ts`
