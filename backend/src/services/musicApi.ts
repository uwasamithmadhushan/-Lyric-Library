import { env } from '../env.js';
import { HttpError } from '../middleware/error.js';

interface ItunesListResponse<T> {
  resultCount: number;
  results: T[];
}

export interface MusicArtistHit {
  externalApiId: string;
  name: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  description?: string;
  popularity?: number;
  source: 'itunes';
}

export interface MusicSongHit {
  externalApiId: string;
  title: string;
  artistName: string;
  artistExternalId: string;
  album?: string;
  albumImageUrl?: string;
  releaseDate?: string;
  duration?: number;
  previewUrl?: string;
  genre?: string;
  source: 'itunes';
}

function upscaleArtwork(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace('100x100bb', '600x600bb').replace('60x60bb', '600x600bb');
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 429) {
      throw new HttpError(429, 'Music service rate limit reached. Please wait and try again.');
    }
    if (!response.ok) {
      throw new HttpError(502, 'Unable to connect to music service.');
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'Unable to connect to music service.');
  } finally {
    clearTimeout(timeout);
  }
}

async function itunesSearch<T>(params: Record<string, string>): Promise<T[]> {
  const query = new URLSearchParams({ media: 'music', limit: '25', ...params });
  const data = await fetchJson<ItunesListResponse<T>>(`${env.musicApiBaseUrl}/search?${query.toString()}`);
  return data.results ?? [];
}

async function enrichArtistImage(name: string): Promise<string | undefined> {
  try {
    const query = new URLSearchParams({ q: name, limit: '1' });
    const data = await fetchJson<{ data?: Array<{ picture_medium?: string; picture_xl?: string }> }>(
      `${env.deezerApiBaseUrl}/search/artist?${query.toString()}`,
    );
    return data.data?.[0]?.picture_xl || data.data?.[0]?.picture_medium;
  } catch {
    return undefined;
  }
}

export async function searchExternalArtists(query: string): Promise<MusicArtistHit[]> {
  const term = query.trim();
  if (term.length < 2) {
    throw new HttpError(400, 'Enter at least 2 characters to search artists.');
  }

  const results = await itunesSearch<{
    wrapperType?: string;
    artistType?: string;
    artistId: number;
    artistName: string;
    primaryGenreName?: string;
    artistLinkUrl?: string;
  }>({ term, entity: 'musicArtist' });

  const artists = results.filter((item) => item.artistName && item.artistId);
  const unique = new Map<string, MusicArtistHit>();

  for (const artist of artists) {
    const id = String(artist.artistId);
    if (unique.has(id)) continue;
    unique.set(id, {
      externalApiId: id,
      name: artist.artistName,
      genre: artist.primaryGenreName,
      source: 'itunes',
    });
  }

  const hits = [...unique.values()].slice(0, 20);
  await Promise.all(
    hits.map(async (hit) => {
      hit.imageUrl = await enrichArtistImage(hit.name);
    }),
  );

  return hits;
}

export async function searchExternalSongs(params: {
  query: string;
  artistName?: string;
  album?: string;
  year?: string;
}): Promise<MusicSongHit[]> {
  const title = params.query.trim();
  if (title.length < 2) {
    throw new HttpError(400, 'Enter at least 2 characters to search songs.');
  }

  const term = [title, params.artistName?.trim(), params.album?.trim(), params.year?.trim()]
    .filter(Boolean)
    .join(' ');

  const results = await itunesSearch<{
    wrapperType?: string;
    kind?: string;
    trackId: number;
    trackName: string;
    artistId: number;
    artistName: string;
    collectionName?: string;
    releaseDate?: string;
    trackTimeMillis?: number;
    previewUrl?: string;
    artworkUrl100?: string;
    primaryGenreName?: string;
    country?: string;
  }>({ term, entity: 'song' });

  return results
    .filter((item) => item.kind === 'song' && item.trackName && item.artistName)
    .map((item) => ({
      externalApiId: String(item.trackId),
      title: item.trackName,
      artistName: item.artistName,
      artistExternalId: String(item.artistId),
      album: item.collectionName,
      albumImageUrl: upscaleArtwork(item.artworkUrl100),
      releaseDate: item.releaseDate,
      duration: item.trackTimeMillis,
      previewUrl: item.previewUrl,
      genre: item.primaryGenreName,
      source: 'itunes' as const,
    }))
    .slice(0, 25);
}
