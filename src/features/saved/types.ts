import type { SavedLyric } from '@/types';

/** Tab options for the Saved screen. */
export type SavedTab = 'recentlySaved' | 'mostViewed';

/** SavedLyric enriched with derived display fields (reserved for future extension). */
export type SavedLyricItem = SavedLyric;
