export type { Artist, Song, Album, SearchFilterType } from '@/types';

export type SearchScopeFilter = Exclude<import('@/types').SearchFilterType, 'lyrics'>;

export interface SearchResults {
  songs:   import('@/types').Song[];
  artists: import('@/types').Artist[];
  albums:  import('@/types').Album[];
}

export interface UseSearchParams {
  query: string;
  type:  SearchScopeFilter;
}

export interface UseSearchReturn {
  results:      SearchResults;
  isLoading:    boolean;
  isEmpty:      boolean;
  hasNoResults: boolean;
}