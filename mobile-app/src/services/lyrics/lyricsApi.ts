/**
 * Lyrics API client — LRCLIB search primary, lyrics.ovh fallback.
 * Prefer /api/search (200 + []) over /api/get (404) to avoid console noise.
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

const COVER_ARTIST_RE =
  /\b(piano|guitar|violin|karaoke|tribute|acoustic)\s+covers?\b|\bcovers?\b/i;
const COVER_TITLE_RE =
  /\b(piano|guitar|violin|karaoke|instrumental|acoustic)\s+covers?\b|\bcovers?\b/i;

/** True when metadata looks like a cover/karaoke channel rather than the original release. */
function looksLikeCoverMetadata(artistName: string, songTitle: string): boolean {
  return COVER_ARTIST_RE.test(artistName) || COVER_TITLE_RE.test(songTitle);
}

/** Strip cover/karaoke noise so lyric APIs can match the original track. */
export function normalizeForLyricsLookup(
  artistName: string,
  songTitle: string,
): {
  artistName: string;
  songTitle: string;
} {
  let artist = cleanParam(artistName)
    .replace(/\s*[-–—]\s*.*\b(piano|guitar|violin|karaoke|tribute|acoustic)\s+covers?\s*$/i, '')
    .replace(/\s*[-–—]\s*.*\bcovers?\s*$/i, '')
    .replace(/\s+(piano|guitar|violin|karaoke|tribute|acoustic)\s+covers?\b/gi, '')
    .replace(/\s+covers?\b/gi, '')
    .trim();

  let title = cleanParam(songTitle)
    .replace(
      /\s*[-–—|:]\s*(piano|guitar|violin|karaoke|instrumental|acoustic)?\s*covers?\s*$/i,
      '',
    )
    .replace(
      /\s*\((piano|guitar|violin|karaoke|instrumental|acoustic)?\s*covers?\)\s*$/i,
      '',
    )
    .replace(/\s+(piano|guitar|violin|karaoke|instrumental|acoustic)\s+covers?\s*$/i, '')
    .trim();

  if (looksLikeCoverMetadata(artistName, songTitle) && artist.includes(' - ')) {
    artist = artist.split(/\s*[-–—]\s*/)[0]?.trim() || artist;
  }

  if (!artist) artist = cleanParam(artistName);
  if (!title) title = cleanParam(songTitle);
  return { artistName: artist, songTitle: title };
}

/** Extra artist spellings — e.g. "M. S. Fernando" → "M S Fernando" / "MS Fernando". */
function artistNameVariants(artistName: string): string[] {
  const base = cleanParam(artistName);
  const noDots = base.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  const compactInitials = base
    .replace(/\b([A-Za-z])\.(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const noSpacesInitials = base.replace(/\./g, '').replace(/\s+/g, ' ').trim();

  return Array.from(new Set([base, noDots, compactInitials, noSpacesInitials].filter(Boolean)));
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

  return synced
    .split('\n')
    .map((line) => line.replace(/^\[[^\]]+\]\s*/, '').trim())
    .filter(Boolean)
    .join('\n');
}

function scoreSearchHit(
  item: LrcLibTrack,
  artistName: string,
  songTitle: string,
): number {
  const artist = (item.artistName ?? '').toLowerCase();
  const title = (item.trackName || item.name || '').toLowerCase();
  const wantedArtist = artistName.toLowerCase();
  const wantedTitle = songTitle.toLowerCase();
  let score = 0;
  if (title === wantedTitle) score += 5;
  else if (title.includes(wantedTitle) || wantedTitle.includes(title)) score += 2;
  if (artist === wantedArtist) score += 4;
  else if (artist.includes(wantedArtist) || wantedArtist.includes(artist)) score += 2;
  if (pickPlainLyrics(item)) score += 1;
  return score;
}

async function fetchFromLrcLib(
  artistName: string,
  songTitle: string,
): Promise<FetchedLyrics | null> {
  // Use search (HTTP 200) instead of /get (HTTP 404) to avoid browser console noise.
  const queries = Array.from(
    new Set([
      `${cleanParam(songTitle)} ${cleanParam(artistName)}`,
      cleanParam(songTitle),
    ]),
  );

  let best: LrcLibTrack | undefined;
  let bestScore = 0;

  for (const q of queries) {
    const search = await fetchJson<LrcLibTrack[]>(
      `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
    );
    for (const item of search ?? []) {
      if (!pickPlainLyrics(item)) continue;
      const score = scoreSearchHit(item, artistName, songTitle);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    if (best && bestScore >= 6) break;
  }

  const searchText = pickPlainLyrics(best);
  if (!best || !searchText || bestScore < 3) return null;

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

function buildLookupAttempts(
  artistName: string,
  songTitle: string,
): Array<{ artistName: string; songTitle: string }> {
  const normalized = normalizeForLyricsLookup(artistName, songTitle);
  const isCover = looksLikeCoverMetadata(artistName, songTitle);
  const attempts: Array<{ artistName: string; songTitle: string }> = [];

  const pushUnique = (artist: string, title: string) => {
    const next = { artistName: cleanParam(artist), songTitle: cleanParam(title) };
    if (!next.artistName || !next.songTitle) return;
    if (
      attempts.some(
        (item) =>
          item.artistName === next.artistName && item.songTitle === next.songTitle,
      )
    ) {
      return;
    }
    attempts.push(next);
  };

  for (const variant of artistNameVariants(normalized.artistName)) {
    pushUnique(variant, normalized.songTitle);
  }

  if (!isCover) {
    for (const variant of artistNameVariants(artistName)) {
      pushUnique(variant, songTitle);
    }
  }

  return attempts;
}

export async function fetchLyricsByTrack(
  artistName: string,
  songTitle: string,
): Promise<FetchedLyrics | null> {
  if (!cleanParam(artistName) || !cleanParam(songTitle)) return null;

  const attempts = buildLookupAttempts(artistName, songTitle);

  for (const attempt of attempts) {
    try {
      const fromLrc = await fetchFromLrcLib(attempt.artistName, attempt.songTitle);
      if (fromLrc) return fromLrc;
    } catch {
      // try next
    }
  }

  // One ovh fallback with the best cleaned names (may still 404 for obscure tracks).
  const primary = attempts[0];
  if (primary) {
    try {
      const fromOvh = await fetchFromLyricsOvh(primary.artistName, primary.songTitle);
      if (fromOvh) return fromOvh;
    } catch {
      // ignore
    }
  }

  return null;
}
