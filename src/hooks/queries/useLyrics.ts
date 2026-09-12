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
    queryFn: () =>
      lyricsRepository.getLyrics({
        songId,
        songTitle,
        artistName,
      }),
    enabled: Boolean(songId && songTitle),
  });
