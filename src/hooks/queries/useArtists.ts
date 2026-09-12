import { useQuery } from '@tanstack/react-query';
import { lyricsRepository } from '@/services';
import type { ArtistsQueryParams } from '@/types';

/** Fetch all artists. */
export const useArtists = (params?: ArtistsQueryParams) =>
  useQuery({
    queryKey: [
      'artists',
      params?.query ?? '',
      params?.startsWith ?? '',
      params?.browseAll ? 'all' : 'featured',
    ],
    queryFn: () => lyricsRepository.getArtists(params),
  });

/** Fetch a single artist by ID. */
export const useArtistById = (artistId: string) =>
  useQuery({
    queryKey: ['artists', artistId],
    queryFn: () => lyricsRepository.getArtistById(artistId),
    enabled: !!artistId,
  });
