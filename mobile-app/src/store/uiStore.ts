import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppBackgroundId, LyricsTextSize, ThemeMode } from '@/types';
import { mmkvStorage } from './mmkvStorage';

interface UIStore {
  /** Current lyrics text size preference. */
  textSize: LyricsTextSize;
  setTextSize: (size: LyricsTextSize) => void;

  /** Theme preference (light/dark ready). */
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  /** App background preset (adapts with dark mode). */
  backgroundId: AppBackgroundId;
  setBackgroundId: (id: AppBackgroundId) => void;

  /** User-picked background image (data URI or file URI). */
  customBackgroundUri: string | null;
  setCustomBackgroundUri: (uri: string | null) => void;

  /** Recent search queries (max 10). */
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  /** Hydration state (true once storage rehydrated). */
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      textSize: 'normal',
      setTextSize: (size) => set({ textSize: size }),

      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),

      backgroundId: 'default',
      setBackgroundId: (id) => set({ backgroundId: id }),

      customBackgroundUri: null,
      setCustomBackgroundUri: (uri) => set({ customBackgroundUri: uri }),

      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const filtered = state.recentSearches.filter((q) => q !== trimmed);
          return { recentSearches: [trimmed, ...filtered].slice(0, 10) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'lyric-library-ui',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
