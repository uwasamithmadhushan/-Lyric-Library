import type { SavedLyric } from '@/types';

/** Tab options for the Saved screen. */
export type SavedTab = 'recentlySaved' | 'savedArtists';

/** SavedLyric enriched with derived display fields (reserved for future extension). */
export type SavedLyricItem = SavedLyric;
