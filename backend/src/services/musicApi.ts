import { env } from '../lib/config';

export interface MusicArtistResult {
  externalApiId: string;
  name: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  popularity?: number;
  description?: string;
  raw?: unknown;
}

export interface MusicSongResult {
  externalApiId: string;
  title: string;
  artistExternalId?: string;
  artistName: string;
  albumTitle?: string;
  albumExternalId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  duration?: number;
  previewUrl?: string;
  genre?: string;
  raw?: unknown;
}

interface DeezerArtist {
  id?: number;
  name?: string;
  picture_xl?: string;
  picture_big?: string;
  picture_medium?: string;
  nb_fan?: number;
  type?: string;
}

interface DeezerTrack {
  id?: number;
  title?: string;
  duration?: number;
  preview?: string;
  release_date?: string;
  artist?: { id?: number; name?: string };
  album?: {
    id?: number;
    title?: string;
    cover_xl?: string;
    cover_big?: string;
    cover_medium?: string;
    release_date?: string;
  };
}

async function deezerGet<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${env.musicApiBaseUrl}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (response.status === 429) {
    throw new Error('RATE_LIMIT');
  }
  if (!response.ok) {
    throw new Error(`MUSIC_API_${response.status}`);
  }
  return (await response.json()) as T;
}

function yearFromDate(value?: string): number | undefined {
  if (!value) return undefined;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

function mapArtist(item: DeezerArtist): MusicArtistResult | null {
  if (!item?.id || !item.name) return null;
  return {
    externalApiId: String(item.id),
    name: item.name,
    imageUrl: item.picture_xl || item.picture_big || item.picture_medium,
    popularity: item.nb_fan,
    raw: item,
  };
}

function mapTrack(item: DeezerTrack): MusicSongResult | null {
  if (!item?.id || !item.title || !item.artist?.name) return null;
  const releaseDate = item.release_date || item.album?.release_date;
  return {
    externalApiId: String(item.id),
    title: item.title,
    artistExternalId: item.artist.id ? String(item.artist.id) : undefined,
    artistName: item.artist.name,
    albumTitle: item.album?.title,
    albumExternalId: item.album?.id ? String(item.album.id) : undefined,
    artworkUrl: item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium,
    releaseDate,
    releaseYear: yearFromDate(releaseDate),
    duration: item.duration,
    previewUrl: item.preview || undefined,
    raw: item,
  };
}

export async function searchArtists(query: string, limit = 12): Promise<MusicArtistResult[]> {
  const payload = await deezerGet<{ data?: DeezerArtist[] }>('/search/artist', {
    q: query,
    limit: String(limit),
  });
  return (payload.data ?? []).map(mapArtist).filter((item): item is MusicArtistResult => Boolean(item));
}

export async function searchSongs(
  query: string,
  options: { artistName?: string; album?: string; limit?: number } = {},
): Promise<MusicSongResult[]> {
  const terms = [query.trim()];
  if (options.artistName?.trim()) terms.push(options.artistName.trim());
  if (options.album?.trim()) terms.push(options.album.trim());

  const payload = await deezerGet<{ data?: DeezerTrack[] }>('/search', {
    q: terms.join(' '),
    limit: String(options.limit ?? 12),
  });

  let results = (payload.data ?? [])
    .map(mapTrack)
    .filter((item): item is MusicSongResult => Boolean(item));

  const artistFilter = options.artistName?.trim().toLowerCase();
  if (artistFilter) {
    results = results.filter((item) => item.artistName.toLowerCase().includes(artistFilter));
  }

  const albumFilter = options.album?.trim().toLowerCase();
  if (albumFilter) {
    results = results.filter((item) => (item.albumTitle ?? '').toLowerCase().includes(albumFilter));
  }

  return results;
}

export async function getArtistByExternalId(externalApiId: string): Promise<MusicArtistResult | null> {
  const item = await deezerGet<DeezerArtist>(`/artist/${externalApiId}`);
  return mapArtist(item);
}

export async function getSongByExternalId(externalApiId: string): Promise<MusicSongResult | null> {
  const item = await deezerGet<DeezerTrack>(`/track/${externalApiId}`);
  return mapTrack(item);
}

/** Popular tracks for an artist (Deezer `/artist/{id}/top`). */
export async function getArtistTopTracks(
  externalApiId: string,
  limit = 50,
): Promise<MusicSongResult[]> {
  const payload = await deezerGet<{ data?: DeezerTrack[] }>(`/artist/${externalApiId}/top`, {
    limit: String(limit),
  });
  return (payload.data ?? [])
    .map(mapTrack)
    .filter((item): item is MusicSongResult => Boolean(item));
}
