import type { Artist, Song, Lyrics, LyricsSection } from '@/types';

/**
 * Group artists alphabetically by first letter of name.
 * Returns a sorted array of { letter, data } sections for SectionList.
 */
export function groupArtistsByLetter(
  artists: Artist[],
): { letter: string; data: Artist[] }[] {
  const map = new Map<string, Artist[]>();

  artists.forEach((artist) => {
    const letter = artist.name.charAt(0).toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(artist);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, data]) => ({ letter, data }));
}

/**
 * Generic A-Z grouping by a string key.
 */
export function groupByInitial<T extends Record<string, string>>(
  items: T[],
  key: keyof T,
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  items.forEach((item) => {
    const value = item[key] ?? '';
    const letter = value.toString().charAt(0).toUpperCase();
    if (!map[letter]) map[letter] = [];
    map[letter].push(item);
  });
  return map;
}

/**
 * Group songs by genre.
 * Returns a map of genre → Song[].
 */
export function groupSongsByGenre(songs: Song[]): Record<string, Song[]> {
  const map: Record<string, Song[]> = {};
  songs.forEach((song) => {
    const genre = song.genre ?? 'Unknown';
    if (!map[genre]) map[genre] = [];
    map[genre].push(song);
  });
  return map;
}

/**
 * Group lyrics sections by section type.
 */
export function groupBySectionType(
  lyrics: Lyrics,
): Record<LyricsSection['type'], LyricsSection[]> {
  const map = {} as Record<LyricsSection['type'], LyricsSection[]>;
  lyrics.sections.forEach((section) => {
    if (!map[section.type]) map[section.type] = [];
    map[section.type].push(section);
  });
  return map;
}

/**
 * Sort a list alphabetically by string key (A-Z).
 */
export function sortAlphabetical<T extends Record<string, string>>(
  items: T[],
  key: keyof T,
): T[] {
  return [...items].sort((a, b) =>
    a[key].toString().localeCompare(b[key].toString()),
  );
}
