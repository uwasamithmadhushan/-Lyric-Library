import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSavedStore } from '@/store/savedStore';
import { lyricsRepository } from '@/services';
import type { SavedLyric, Lyrics } from '@/types';

/** Combined saved lyric with full lyrics data */
export interface SavedLyricWithData extends SavedLyric {
  lyrics: Lyrics | undefined;
}

/**
 * Hook that combines saved lyrics from store with full lyric data from repository.
 * Returns saved lyrics with their complete lyrics content.
 */
export const useSavedLyrics = () => {
  // Use stable selectors to prevent unnecessary re-renders
  const savedMap = useSavedStore((state) => state.savedMap);
  const savedOrder = useSavedStore((state) => state.savedOrder);
  const hasHydrated = useSavedStore((state) => state.hasHydrated);

  // Memoize the saved lyrics list to maintain stable reference
  const savedLyrics = useMemo(() => {
    return savedOrder
      .map((id) => savedMap[id])
      .filter(Boolean) as SavedLyric[];
  }, [savedMap, savedOrder]);

  // Memoize song IDs to prevent queryKey changes
  const savedSongIds = useMemo(
    () => savedLyrics.map((lyric) => lyric.songId),
    [savedLyrics]
  );

  // Fetch lyrics for all saved songs
  const lyricsQuery = useQuery({
    queryKey: ['lyrics', 'saved', savedSongIds],
    queryFn: async (): Promise<Lyrics[]> => {
      if (savedSongIds.length === 0) return [];
      const lyricsPromises = savedSongIds.map((songId) =>
        lyricsRepository.getLyrics(songId)
      );
      const results = await Promise.all(lyricsPromises);
      return results.filter((lyric): lyric is Lyrics => lyric !== undefined);
    },
    enabled: savedSongIds.length > 0,
  });

  // Combine saved lyrics with their full lyrics data
  const combinedData = useMemo((): SavedLyricWithData[] => {
    return savedLyrics.map((saved) => ({
      ...saved,
      lyrics: lyricsQuery.data?.find((l) => l.songId === saved.songId),
    }));
  }, [savedLyrics, lyricsQuery.data]);

  return {
    data: combinedData,
    isLoading: lyricsQuery.isLoading,
    error: lyricsQuery.error,
    /** Whether the store has finished hydrating from storage */
    isHydrated: hasHydrated,
  };
};
