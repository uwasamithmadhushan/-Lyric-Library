import type { Song, SearchResult, SearchFilterType } from '@/types';

/**
 * Filter songs by a text query (matches title or artistName).
 */
export function filterSongs(songs: Song[], query: string): Song[] {
  const q = query.toLowerCase().trim();
  if (!q) return songs;
  return songs.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artistName.toLowerCase().includes(q),
  );
}

/**
 * Generic filter by search query over string fields.
 */
export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) =>
      String(item[field] ?? '')
        .toLowerCase()
        .includes(q),
    ),
  );
}

/**
 * Filter songs by genre; "all" returns the original list.
 */
export function filterByGenre(songs: Song[], genre: string): Song[] {
  const g = genre.toLowerCase().trim();
  if (!g || g === 'all') return songs;
  return songs.filter((song) => (song.genre ?? '').toLowerCase() === g);
}

/**
 * Filter search results by type.
 */
export function filterResultsByType(
  results: SearchResult[],
  type: SearchFilterType,
): SearchResult[] {
  if (type === 'all') return results;
  return results.filter((r) => r.type === type);
}
