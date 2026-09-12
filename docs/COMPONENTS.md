# Components

This is a quick reference to the shared UI components.

## Primitives

- **AppScreen**: Safe-area aware screen container with consistent padding
- **AppText**: Typography variants (use instead of raw Text)
- **AppButton**: Primary/secondary/tertiary button styles
- **AppSearchBar**: Search input with icons and active state
- **Chip**: Filter pill (active/inactive)

Example:

```tsx
import { AppScreen, AppText, AppButton } from '@/components';

export default function Example() {
  return (
    <AppScreen>
      <AppText variant="pageTitle">Artists</AppText>
      <AppButton label="View" onPress={() => {}} />
    </AppScreen>
  );
}
```

## Composite

- **ArtistCard**: Artist avatar + name + song count
- **SongRow**: Song title + meta + action button
- **ResultRow**: Search result row with icon
- **LoadingState / EmptyState / ErrorState**: Consistent async states
