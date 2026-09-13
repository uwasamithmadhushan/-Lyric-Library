import { useQuery } from '@tanstack/react-query';
import { lyricsRepository } from '@/services';
import type { SongsQueryParams } from '@/types';

/** Fetch all songs with optional sort. */
export const useSongs = (params: SongsQueryParams = {}) =>
  useQuery({
    queryKey: [
      'songs',
      params.sort ?? 'title',
      params.query ?? '',
      params.artistId ?? '',
      params.albumId ?? '',
      params.genre ?? '',
    ],
    queryFn: () => lyricsRepository.getSongs(params),
  });

/** Fetch songs for a specific artist. */
export const useSongsByArtist = (artistId: string) =>
  useQuery({
    queryKey: ['songs', 'artist', artistId],
    queryFn: () => lyricsRepository.getSongsByArtist(artistId),
    enabled: !!artistId,
  });

/** Fetch a single song (includes previewUrl when available). */
export const useSongById = (
  songId: string,
  songTitle?: string,
  artistName?: string,
) =>
  useQuery({
    queryKey: ['songs', 'by-id', songId, songTitle ?? '', artistName ?? ''],
    queryFn: async () => {
      const song = await lyricsRepository.getSongById(songId);
      if (song?.previewUrl) return song;

      // Fallback resolve by title/artist (covers legacy ids + missing previews).
      if (songTitle && artistName) {
        const { searchDeezerTrack } = await import('@/services/deezer/deezerApi');
        const { normalizeForLyricsLookup } = await import('@/services/lyrics/lyricsApi');
        const cleaned = normalizeForLyricsLookup(artistName, songTitle);
        const deezer =
          (await searchDeezerTrack(cleaned.songTitle, cleaned.artistName)) ??
          (await searchDeezerTrack(songTitle, artistName));
        if (!deezer?.previewUrl) return song;
        return {
          id: songId,
          title: songTitle,
          artistId: song?.artistId ?? '',
          artistName,
          previewUrl: deezer.previewUrl,
          artworkUrl: song?.artworkUrl ?? deezer.artworkUrl,
          albumTitle: song?.albumTitle ?? deezer.albumTitle,
        };
      }

      return song;
    },
    enabled: !!songId,
  });
