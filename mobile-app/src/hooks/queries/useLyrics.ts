import { useQuery } from '@tanstack/react-query';
import { lyricsRepository } from '@/services';

/** Fetch lyrics for a single song from the lyrics API. */
export const useLyrics = (
  songId: string,
  songTitle?: string,
  artistName?: string,
) =>
  useQuery({
    queryKey: ['lyrics', songId, songTitle ?? '', artistName ?? ''],
    queryFn: async () => {
      const lyrics = await lyricsRepository.getLyrics({
        songId,
        songTitle,
        artistName,
      });
      // TanStack Query v5 forbids `undefined` — use null for "not found".
      return lyrics ?? null;
    },
    enabled: Boolean(songId && songTitle),
    retry: 1,
  });
