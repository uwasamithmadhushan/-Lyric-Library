import type { Album, Artist, Song } from '@/types';
import { backendFetch } from '@/services/api/backendClient';

type BackendArtist = {
  id: string;
  name: string;
  imageUrl?: string;
  songCount: number;
  albums?: Album[];
  popularSongs?: Array<{
    id: string;
    title: string;
    artistId: string;
    artistName: string;
    albumTitle?: string;
    artworkUrl?: string;
    releaseYear?: number;
    previewUrl?: string;
  }>;
};

type BackendSong = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumTitle?: string;
  artworkUrl?: string;
  releaseYear?: number;
  previewUrl?: string;
  genre?: string;
};

function isLocalCatalogId(id: string): boolean {
  return (
    id.startsWith('cat-artist:') ||
    id.startsWith('cat-song:') ||
    id.startsWith('cat-album:')
  );
}

export async function fetchBackendArtists(params?: {
  query?: string;
  startsWith?: string;
}): Promise<Artist[]> {
  const search = new URLSearchParams();
  if (params?.query) search.set('query', params.query);
  if (params?.startsWith) search.set('startsWith', params.startsWith);
  const qs = search.toString();
  const data = await backendFetch<{ success: boolean; artists: BackendArtist[] }>(
    `/api/artists${qs ? `?${qs}` : ''}`,
  );
  return (data.artists ?? []).map((artist) => ({
    id: artist.id,
    name: artist.name,
    songCount: artist.songCount,
    albums: artist.albums ?? [],
    imageUrl: artist.imageUrl,
  }));
}

export async function fetchBackendArtistById(id: string): Promise<Artist | undefined> {
  // Local curated IDs are not stored in the backend DB — skip the round-trip/404 noise.
  if (!id || isLocalCatalogId(id)) return undefined;

  try {
    const data = await backendFetch<{ success: boolean; artist: BackendArtist }>(
      `/api/artists/${encodeURIComponent(id)}`,
    );
    const artist = data.artist;
    if (!artist) return undefined;
    return {
      id: artist.id,
      name: artist.name,
      songCount: artist.songCount,
      albums: artist.albums ?? [],
      imageUrl: artist.imageUrl,
    };
  } catch {
    return undefined;
  }
}

export async function fetchBackendSongs(params?: {
  query?: string;
  artistId?: string;
  albumId?: string;
}): Promise<Song[]> {
  // Don't query backend with local catalog artist/album ids.
  if (params?.artistId && isLocalCatalogId(params.artistId)) {
    return [];
  }
  if (params?.albumId && isLocalCatalogId(params.albumId)) {
    return [];
  }

  const search = new URLSearchParams();
  if (params?.query) search.set('query', params.query);
  if (params?.artistId) search.set('artistId', params.artistId);
  if (params?.albumId) search.set('albumId', params.albumId);
  const qs = search.toString();
  const data = await backendFetch<{ success: boolean; songs: BackendSong[] }>(
    `/api/songs${qs ? `?${qs}` : ''}`,
  );
  return (data.songs ?? []).map((song) => ({
    id: song.id,
    title: song.title,
    artistId: song.artistId,
    artistName: song.artistName,
    albumId: song.albumId,
    albumTitle: song.albumTitle,
    artworkUrl: song.artworkUrl,
    releaseYear: song.releaseYear,
    previewUrl: song.previewUrl,
    genre: song.genre,
  }));
}

export async function fetchBackendSongById(id: string): Promise<Song | undefined> {
  if (!id || isLocalCatalogId(id)) return undefined;

  try {
    const data = await backendFetch<{ success: boolean; song: BackendSong }>(
      `/api/songs/${encodeURIComponent(id)}`,
    );
    const song = data.song;
    if (!song) return undefined;
    return {
      id: song.id,
      title: song.title,
      artistId: song.artistId,
      artistName: song.artistName,
      albumId: song.albumId,
      albumTitle: song.albumTitle,
      artworkUrl: song.artworkUrl,
      releaseYear: song.releaseYear,
      previewUrl: song.previewUrl,
      genre: song.genre,
    };
  } catch {
    return undefined;
  }
}
