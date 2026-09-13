/**
 * Deezer Search API — 30s MP3 previews, artwork, and artist images.
 * All traffic goes through Metro /proxy/deezer to avoid CORS.
 */

import { fetchMediaJson } from '@/services/media/mediaProxy';

export interface DeezerTrackMatch {
  previewUrl: string;
  artworkUrl?: string;
  albumTitle?: string;
  title: string;
  artistName: string;
}

export interface DeezerArtistMatch {
  id: number;
  name: string;
  imageUrl?: string;
}

interface DeezerSearchResponse {
  data?: Array<{
    title?: string;
    preview?: string;
    artist?: { name?: string; picture_medium?: string; picture_big?: string };
    album?: { title?: string; cover_medium?: string; cover_big?: string };
  }>;
}

interface DeezerArtistSearchResponse {
  data?: Array<{
    id?: number;
    name?: string;
    picture_medium?: string;
    picture_big?: string;
    picture_xl?: string;
    nb_fan?: number;
    type?: string;
  }>;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[’']/g, "'");
}

export async function searchDeezerArtist(
  artistName: string,
): Promise<DeezerArtistMatch | undefined> {
  const artist = artistName.trim();
  if (!artist) return undefined;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const payload = await fetchMediaJson<DeezerArtistSearchResponse>(
      'deezer',
      { path: 'search/artist', q: artist, limit: '5' },
      controller.signal,
    );

    const results = payload.data ?? [];
    const wanted = normalize(artist);

    const exact = results.filter((item) => normalize(item.name ?? '') === wanted);
    const partial = results.filter((item) => normalize(item.name ?? '').includes(wanted));
    const ranked = (exact.length > 0 ? exact : partial.length > 0 ? partial : results).sort(
      (left, right) => (right.nb_fan ?? 0) - (left.nb_fan ?? 0),
    );
    const best = ranked[0];

    if (!best?.name) return undefined;

    return {
      id: best.id ?? 0,
      name: best.name,
      imageUrl: best.picture_xl || best.picture_big || best.picture_medium,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Resolve artist image for grid cards. */
export async function enrichArtistImage(
  artistName: string,
): Promise<{ imageUrl?: string }> {
  const match = await searchDeezerArtist(artistName);
  if (match?.imageUrl) return { imageUrl: match.imageUrl };

  try {
    const payload = await fetchMediaJson<DeezerSearchResponse>(
      'deezer',
      { path: 'search', q: `artist:"${artistName}"`, limit: '3' },
    );
    const hit = payload.data?.find(
      (item) => item.album?.cover_big || item.album?.cover_medium,
    );
    return {
      imageUrl: hit?.album?.cover_big || hit?.album?.cover_medium,
    };
  } catch {
    return {};
  }
}

export async function searchDeezerTrack(
  title: string,
  artistName: string,
): Promise<DeezerTrackMatch | undefined> {
  const track = title.trim();
  const artist = artistName.trim();
  if (!track || !artist) return undefined;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const strictQuery = `track:"${track}" artist:"${artist}"`;
    const payload = await fetchMediaJson<DeezerSearchResponse>(
      'deezer',
      { path: 'search', q: strictQuery, limit: '8' },
      controller.signal,
    );

    const strictMatch = pickBestDeezerTrack(payload.data ?? [], track, artist);
    if (strictMatch) return strictMatch;

    const loosePayload = await fetchMediaJson<DeezerSearchResponse>(
      'deezer',
      { path: 'search', q: `${track} ${artist}`, limit: '8' },
      controller.signal,
    );
    return pickBestDeezerTrack(loosePayload.data ?? [], track, artist);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

function pickBestDeezerTrack(
  results: NonNullable<DeezerSearchResponse['data']>,
  title: string,
  artistName: string,
): DeezerTrackMatch | undefined {
  const wantedTitle = normalize(title);
  const wantedArtist = normalize(artistName);

  const ranked = [...results].filter((item) => item.preview).sort((left, right) => {
    const leftScore =
      (normalize(left.title ?? '') === wantedTitle ? 4 : 0) +
      (normalize(left.title ?? '').includes(wantedTitle) ? 2 : 0) +
      (normalize(left.artist?.name ?? '') === wantedArtist ? 3 : 0) +
      (normalize(left.artist?.name ?? '').includes(wantedArtist) ? 1 : 0);
    const rightScore =
      (normalize(right.title ?? '') === wantedTitle ? 4 : 0) +
      (normalize(right.title ?? '').includes(wantedTitle) ? 2 : 0) +
      (normalize(right.artist?.name ?? '') === wantedArtist ? 3 : 0) +
      (normalize(right.artist?.name ?? '').includes(wantedArtist) ? 1 : 0);
    return rightScore - leftScore;
  });

  const best = ranked[0];
  if (!best?.preview) return undefined;

  return {
    title: best.title ?? title,
    artistName: best.artist?.name ?? artistName,
    previewUrl: best.preview,
    artworkUrl: best.album?.cover_big ?? best.album?.cover_medium,
    albumTitle: best.album?.title,
  };
}
