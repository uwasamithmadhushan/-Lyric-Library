import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SavedArtist, SavedLyric } from '@/types';
import { mmkvStorage } from './mmkvStorage';

interface SavedStore {
  savedMap: Record<string, SavedLyric>;
  savedOrder: string[];

  artistMap: Record<string, SavedArtist>;
  artistOrder: string[];

  saveLyric: (entry: SavedLyric) => void;
  removeLyric: (songId: string) => void;
  isSaved: (songId: string) => boolean;
  getSavedList: () => SavedLyric[];

  saveArtist: (entry: SavedArtist) => void;
  removeArtist: (artistId: string) => void;
  isArtistSaved: (artistId: string) => boolean;
  getSavedArtists: () => SavedArtist[];

  clearAll: () => void;

  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useSavedStore = create<SavedStore>()(
  persist(
    (set, get) => ({
      savedMap: {},
      savedOrder: [],
      artistMap: {},
      artistOrder: [],

      saveLyric: (entry) =>
        set((state) => ({
          savedMap: { ...state.savedMap, [entry.songId]: entry },
          savedOrder: [
            entry.songId,
            ...state.savedOrder.filter((id) => id !== entry.songId),
          ],
        })),

      removeLyric: (songId) =>
        set((state) => {
          const rest = { ...state.savedMap };
          delete rest[songId];
          return {
            savedMap: rest,
            savedOrder: state.savedOrder.filter((id) => id !== songId),
          };
        }),

      isSaved: (songId) => songId in get().savedMap,

      getSavedList: () => {
        const { savedMap, savedOrder } = get();
        return savedOrder.map((id) => savedMap[id]).filter(Boolean) as SavedLyric[];
      },

      saveArtist: (entry) =>
        set((state) => ({
          artistMap: { ...state.artistMap, [entry.artistId]: entry },
          artistOrder: [
            entry.artistId,
            ...state.artistOrder.filter((id) => id !== entry.artistId),
          ],
        })),

      removeArtist: (artistId) =>
        set((state) => {
          const rest = { ...state.artistMap };
          delete rest[artistId];
          return {
            artistMap: rest,
            artistOrder: state.artistOrder.filter((id) => id !== artistId),
          };
        }),

      isArtistSaved: (artistId) => artistId in get().artistMap,

      getSavedArtists: () => {
        const { artistMap, artistOrder } = get();
        return artistOrder
          .map((id) => artistMap[id])
          .filter(Boolean) as SavedArtist[];
      },

      clearAll: () =>
        set({ savedMap: {}, savedOrder: [], artistMap: {}, artistOrder: [] }),

      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'lyric-library-saved',
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
