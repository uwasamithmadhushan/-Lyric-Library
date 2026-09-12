/**
 * Lyrics API client — LRCLIB primary, lyrics.ovh fallback.
 * Both APIs allow browser CORS (`Access-Control-Allow-Origin: *`).
 */

export interface FetchedLyrics {
  songTitle: string;
  artistName: string;
  albumTitle?: string;
  plainText: string;
  source: 'lrclib' | 'lyrics.ovh';
}

interface LrcLibTrack {
  id?: number;
  name?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
  instrumental?: boolean;
}

function cleanParam(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Lyrics request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

function pickPlainLyrics(track: LrcLibTrack | null | undefined): string | undefined {
  if (!track || track.instrumental) return undefined;
  const plain = track.plainLyrics?.trim();
  if (plain) return plain;

  const synced = track.syncedLyrics?.trim();
  if (!synced) return undefined;

  // Strip [mm:ss.xx] timestamps from synced lyrics.
  return synced
    .split('\n')
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}

async function fetchFromLrcLib(
  artistName: string,
  songTitle: string,
): Promise<FetchedLyrics | null> {
  const artist = encodeURIComponent(cleanParam(artistName));
  const track = encodeURIComponent(cleanParam(songTitle));

  const exact = await fetchJson<LrcLibTrack>(
    `https://lrclib.net/api/get?artist_name=${artist}&track_name=${track}`,
  );
  const exactText = pickPlainLyrics(exact);
  if (exactText) {
    return {
      songTitle: exact?.name || exact?.trackName || songTitle,
      artistName: exact?.artistName || artistName,
      albumTitle: exact?.albumName,
      plainText: exactText,
      source: 'lrclib',
    };
  }

  const query = encodeURIComponent(`${cleanParam(songTitle)} ${cleanParam(artistName)}`);
  const search = await fetchJson<LrcLibTrack[]>(
    `https://lrclib.net/api/search?q=${query}`,
  );
  const best = (search ?? []).find((item) => pickPlainLyrics(item));
  const searchText = pickPlainLyrics(best);
  if (!best || !searchText) return null;

  return {
    songTitle: best.name || best.trackName || songTitle,
    artistName: best.artistName || artistName,
    albumTitle: best.albumName,
    plainText: searchText,
    source: 'lrclib',
  };
}

async function fetchFromLyricsOvh(
  artistName: string,
  songTitle: string,
): Promise<FetchedLyrics | null> {
  const artist = encodeURIComponent(cleanParam(artistName));
  const title = encodeURIComponent(cleanParam(songTitle));
  const data = await fetchJson<{ lyrics?: string; error?: string }>(
    `https://api.lyrics.ovh/v1/${artist}/${title}`,
  );
  const text = data?.lyrics?.trim();
  if (!text) return null;

  return {
    songTitle,
    artistName,
    plainText: text,
    source: 'lyrics.ovh',
  };
}

export async function fetchLyricsByTrack(
  artistName: string,
  songTitle: string,
): Promise<FetchedLyrics | null> {
  if (!cleanParam(artistName) || !cleanParam(songTitle)) return null;

  try {
    const fromLrc = await fetchFromLrcLib(artistName, songTitle);
    if (fromLrc) return fromLrc;
  } catch {
    // try fallback
  }

  try {
    return await fetchFromLyricsOvh(artistName, songTitle);
  } catch {
    return null;
  }
}
