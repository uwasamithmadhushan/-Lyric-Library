/**
 * Lightweight iTunes Search / Lookup client.
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

const ITUNES_BASE = 'https://itunes.apple.com';

export interface ItunesArtistResult {
  wrapperType?: string;
  artistType?: string;
  artistId: number;
  artistName: string;
  primaryGenreName?: string;
  artistLinkUrl?: string;
}

export interface ItunesAlbumResult {
  wrapperType?: string;
  collectionType?: string;
  collectionId: number;
  collectionName: string;
  artistId: number;
  artistName: string;
  trackCount?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
}

export interface ItunesSongResult {
  wrapperType?: string;
  kind?: string;
  trackId: number;
  trackName: string;
  artistId: number;
  artistName: string;
  collectionId?: number;
  collectionName?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
}

interface ItunesListResponse<T> {
  resultCount: number;
  results: T[];
}

async function itunesFetch<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes request failed (${response.status})`);
  }
  const data = (await response.json()) as ItunesListResponse<T>;
  return data.results ?? [];
}

export async function searchMusicArtists(
  term: string,
  limit = 20,
): Promise<ItunesArtistResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const url =
    `${ITUNES_BASE}/search?term=${encodeURIComponent(trimmed)}` +
    `&entity=musicArtist&limit=${limit}`;

  const results = await itunesFetch<ItunesArtistResult>(url);
  return results.filter((item) => item.artistId && item.artistName);
}

export async function lookupArtistsByIds(
  artistIds: Array<string | number>,
): Promise<ItunesArtistResult[]> {
  const ids = artistIds.map(String).filter(Boolean);
  if (ids.length === 0) return [];

  const url = `${ITUNES_BASE}/lookup?id=${ids.join(',')}&entity=musicArtist`;
  const results = await itunesFetch<ItunesArtistResult>(url);
  return results.filter((item) => item.wrapperType === 'artist' && item.artistId);
}

export async function lookupArtistAlbums(
  artistId: string | number,
  limit = 20,
): Promise<ItunesAlbumResult[]> {
  const url =
    `${ITUNES_BASE}/lookup?id=${encodeURIComponent(String(artistId))}` +
    `&entity=album&limit=${limit}`;

  const results = await itunesFetch<ItunesAlbumResult | ItunesArtistResult>(url);
  return results.filter(
    (item): item is ItunesAlbumResult =>
      'collectionId' in item && item.wrapperType === 'collection',
  );
}

export async function searchSongs(
  term: string,
  limit = 50,
): Promise<ItunesSongResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const url =
    `${ITUNES_BASE}/search?term=${encodeURIComponent(trimmed)}` +
    `&entity=song&limit=${limit}`;

  const results = await itunesFetch<ItunesSongResult>(url);
  return results.filter((item) => item.trackId && item.trackName && item.artistName);
}

export async function searchSongsByArtistName(
  artistName: string,
  limit = 25,
): Promise<ItunesSongResult[]> {
  const trimmed = artistName.trim();
  if (!trimmed) return [];

  const url =
    `${ITUNES_BASE}/search?term=${encodeURIComponent(trimmed)}` +
    `&entity=song&attribute=artistTerm&limit=${limit}`;

  const results = await itunesFetch<ItunesSongResult>(url);
  return results.filter((item) => item.trackId && item.trackName);
}

export async function lookupAlbumSongs(
  albumId: string | number,
  limit = 50,
): Promise<ItunesSongResult[]> {
  const url =
    `${ITUNES_BASE}/lookup?id=${encodeURIComponent(String(albumId))}` +
    `&entity=song&limit=${limit}`;

  const results = await itunesFetch<ItunesSongResult | ItunesAlbumResult>(url);
  return results.filter(
    (item): item is ItunesSongResult => 'trackId' in item && item.kind === 'song',
  );
}

/** iTunes artist payloads have no image — use album/song artwork instead. */
export function upscaleArtworkUrl(url?: string, size = 300): string | undefined {
  if (!url) return undefined;
  return url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`);
}

export async function lookupArtistArtwork(
  artistId: string | number,
): Promise<string | undefined> {
  const albums = await lookupArtistAlbums(artistId, 1);
  return upscaleArtworkUrl(albums[0]?.artworkUrl100, 300);
}
