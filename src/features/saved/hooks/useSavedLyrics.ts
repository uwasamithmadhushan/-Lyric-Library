import { useMemo } from 'react';
import { useSavedStore } from '@/store';
import type { SavedTab, SavedLyricItem } from '../types';

interface UseSavedLyricsResult {
  items: SavedLyricItem[];
  isEmpty: boolean;
  removeLyric: (songId: string) => void;
}

/**
 * Combines savedStore state with tab-specific sorting.
 *
 * - 'recentlySaved': newest first (store's natural order)
 * - 'mostViewed': sorted descending by viewCount
 */
export function useSavedLyrics(tab: SavedTab): UseSavedLyricsResult {
  const savedMap = useSavedStore((s) => s.savedMap);
  const savedOrder = useSavedStore((s) => s.savedOrder);
  const removeLyric = useSavedStore((s) => s.removeLyric);

  const items = useMemo<SavedLyricItem[]>(() => {
    const list = savedOrder
      .map((id) => savedMap[id])
      .filter(Boolean) as SavedLyricItem[];

    if (tab === 'mostViewed') {
      return [...list].sort((a, b) => b.viewCount - a.viewCount);
    }

    return list;
  }, [savedMap, savedOrder, tab]);

  return { items, isEmpty: items.length === 0, removeLyric };
}
