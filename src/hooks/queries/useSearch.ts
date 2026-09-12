import { useQuery } from '@tanstack/react-query';
import { lyricsRepository } from '@/services';
import type { SearchFilterType } from '@/types';

/**
 * Normalize search filter types to a consistent string for query key.
 */
const normalizeTypesForKey = (
  types?: SearchFilterType | SearchFilterType[],
): string | undefined => {
  if (!types) return undefined;
  return Array.isArray(types) ? types.join(',') : types;
};

/**
 * Search artists, songs, and lyrics.
 * Automatically disabled when query is empty.
 * @param query - The search query string
 * @param types - Optional filter types to restrict search results
 */
export const useSearch = (query: string, types?: SearchFilterType | SearchFilterType[]) =>
  useQuery({
    queryKey: ['search', query, normalizeTypesForKey(types)],
    queryFn: () => lyricsRepository.search(query, types),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60, // 1 min
  });
