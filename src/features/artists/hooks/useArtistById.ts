import { useQuery } from '@tanstack/react-query';
import { lyricsRepository } from '@/services';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Song {
  id: string;
  title: string;
  album: string;
  year: number;
}

export interface Album {
  id: string;
  name: string;
  year: number;
  songCount: number;
}

export interface Artist {
  id: string;
  name: string;
  songCount: number;
  popularSongs: Song[];
  albums: Album[];
  imageUrl?: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

async function fetchArtistById(artistId: string): Promise<Artist> {
  const [artistData, artistSongs] = await Promise.all([
    lyricsRepository.getArtistById(artistId),
    lyricsRepository.getSongsByArtist(artistId),
  ]);

  // Catalog artists always resolve locally even if iTunes enrichment failed.
  if (!artistData) {
    throw new Error(`Artist with id "${artistId}" not found`);
  }

  const popularSongs: Song[] = [...artistSongs]
    .sort((left, right) => (right.popularity ?? 0) - (left.popularity ?? 0))
    .slice(0, 8)
    .map((song) => ({
      id: song.id,
      title: song.title,
      album: song.albumTitle ?? 'Single',
      year: song.releaseYear ?? 0,
    }));

  const albums: Album[] = [...(artistData.albums ?? [])]
    .map((album) => ({
      id: album.id,
      name: album.title,
      year: album.releaseYear,
      songCount: album.songCount,
    }))
    .sort((left, right) => right.year - left.year);

  return {
    id: artistData.id,
    name: artistData.name,
    songCount: artistData.songCount || popularSongs.length,
    popularSongs,
    albums,
    imageUrl: artistData.imageUrl,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useArtistById(artistId: string) {
  return useQuery<Artist, Error>({
    queryKey: ['artist', artistId],
    queryFn: () => fetchArtistById(artistId),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}