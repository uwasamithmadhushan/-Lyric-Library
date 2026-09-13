import { useMemo } from 'react';
import { useSavedStore } from '@/store';
import type { SavedArtist } from '@/types';
import type { SavedTab, SavedLyricItem } from '../types';

interface UseSavedLyricsResult {
  items: SavedLyricItem[];
  artists: SavedArtist[];
  isEmpty: boolean;
  removeLyric: (songId: string) => void;
  removeArtist: (artistId: string) => void;
}

/**
 * Saved lyrics + saved artists for the Saved tab.
 */
export function useSavedLyrics(tab: SavedTab): UseSavedLyricsResult {
  const savedMap = useSavedStore((s) => s.savedMap);
  const savedOrder = useSavedStore((s) => s.savedOrder);
  const artistMap = useSavedStore((s) => s.artistMap);
  const artistOrder = useSavedStore((s) => s.artistOrder);
  const removeLyric = useSavedStore((s) => s.removeLyric);
  const removeArtist = useSavedStore((s) => s.removeArtist);

  const items = useMemo<SavedLyricItem[]>(() => {
    return savedOrder.map((id) => savedMap[id]).filter(Boolean) as SavedLyricItem[];
  }, [savedMap, savedOrder]);

  const artists = useMemo<SavedArtist[]>(() => {
    return artistOrder.map((id) => artistMap[id]).filter(Boolean) as SavedArtist[];
  }, [artistMap, artistOrder]);

  const isEmpty = tab === 'savedArtists' ? artists.length === 0 : items.length === 0;

  return { items, artists, isEmpty, removeLyric, removeArtist };
}
