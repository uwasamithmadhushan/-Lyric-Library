/**
 * Lightweight iTunes Search / Lookup client.
 * Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 * Web traffic goes through Metro /proxy/itunes to avoid CORS / 403.
 */

import { fetchMediaJson } from '@/services/media/mediaProxy';

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
  previewUrl?: string;
}

interface ItunesListResponse<T> {
  resultCount: number;
  results: T[];
}

async function itunesFetch<T>(
  path: 'search' | 'lookup',
  query: Record<string, string>,
): Promise<T[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const data = await fetchMediaJson<ItunesListResponse<T>>(
      'itunes',
      { path, ...query },
      controller.signal,
    );
    return data.results ?? [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchMusicArtists(
  term: string,
  limit = 20,
): Promise<ItunesArtistResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const results = await itunesFetch<ItunesArtistResult>('search', {
    term: trimmed,
    entity: 'musicArtist',
    limit: String(limit),
  });
  return results.filter((item) => item.artistId && item.artistName);
}

export async function lookupArtistsByIds(
  artistIds: Array<string | number>,
): Promise<ItunesArtistResult[]> {
  const ids = artistIds.map(String).filter(Boolean);
  if (ids.length === 0) return [];

  const results = await itunesFetch<ItunesArtistResult>('lookup', {
    id: ids.join(','),
    entity: 'musicArtist',
  });
  return results.filter((item) => item.wrapperType === 'artist' && item.artistId);
}

export async function lookupArtistAlbums(
  artistId: string | number,
  limit = 20,
): Promise<ItunesAlbumResult[]> {
  const results = await itunesFetch<ItunesAlbumResult | ItunesArtistResult>('lookup', {
    id: String(artistId),
    entity: 'album',
    limit: String(limit),
  });
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

  const results = await itunesFetch<ItunesSongResult>('search', {
    term: trimmed,
    entity: 'song',
    limit: String(limit),
  });
  return results.filter((item) => item.trackId && item.trackName && item.artistName);
}

export async function searchSongsByArtistName(
  artistName: string,
  limit = 25,
): Promise<ItunesSongResult[]> {
  const trimmed = artistName.trim();
  if (!trimmed) return [];

  const results = await itunesFetch<ItunesSongResult>('search', {
    term: trimmed,
    entity: 'song',
    attribute: 'artistTerm',
    limit: String(limit),
  });
  return results.filter((item) => item.trackId && item.trackName);
}

export async function lookupAlbumSongs(
  albumId: string | number,
  limit = 50,
): Promise<ItunesSongResult[]> {
  const id = String(albumId).trim();
  // iTunes lookup only accepts numeric collection ids.
  if (!/^\d+$/.test(id)) return [];

  const results = await itunesFetch<ItunesSongResult | ItunesAlbumResult>('lookup', {
    id,
    entity: 'song',
    limit: String(limit),
  });
  return results.filter(
    (item): item is ItunesSongResult => 'trackId' in item && item.kind === 'song',
  );
}

export async function lookupSongById(
  trackId: string | number,
): Promise<ItunesSongResult | undefined> {
  const results = await itunesFetch<ItunesSongResult>('lookup', {
    id: String(trackId),
    entity: 'song',
  });
  return results.find((item) => item.kind === 'song' && item.trackId);
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

/** Artwork + rough song count from recent albums (for grid cards). */
export async function enrichArtistMedia(
  artistId: string | number,
  artistName?: string,
): Promise<{ imageUrl?: string; songCount: number }> {
  let resolvedId: string | number = artistId;
  const idText = String(artistId);
  const needsNameLookup =
    idText.startsWith('cat-artist:') || !/^\d+$/.test(idText);

  if (needsNameLookup) {
    const name =
      artistName?.trim() ||
      (idText.startsWith('cat-artist:')
        ? decodeURIComponent(idText.slice('cat-artist:'.length))
        : '');
    if (!name) return { songCount: 0 };
    const matches = await searchMusicArtists(name, 5);
    const normalized = name.toLowerCase();
    const best =
      matches.find((artist) => artist.artistName.trim().toLowerCase() === normalized) ??
      matches.find((artist) => artist.artistName.trim().toLowerCase().includes(normalized)) ??
      matches[0];
    if (!best) return { songCount: 0 };
    resolvedId = best.artistId;
  }

  const albums = await lookupArtistAlbums(resolvedId, 10);
  const imageUrl = upscaleArtworkUrl(albums[0]?.artworkUrl100, 300);
  const songCount = albums.reduce((sum, album) => sum + (album.trackCount ?? 0), 0);
  return { imageUrl, songCount };
}

/** Drop junk iTunes hits from single-letter searches (punctuation "artists", etc.). */
export function isDisplayableArtist(artist: ItunesArtistResult): boolean {
  const name = artist.artistName?.trim() ?? '';
  if (!artist.artistId || name.length < 2 || name.length > 64) return false;
  if (artist.artistType && artist.artistType !== 'Artist') return false;
  if (!artist.primaryGenreName) return false;
  if (!/^[A-Za-z0-9]/.test(name)) return false;
  if (!/[A-Za-z]{2,}/.test(name)) return false;
  return true;
}
