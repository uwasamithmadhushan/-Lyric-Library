import { useState, useEffect, useMemo } from 'react';
import {
  FEATURED_CATALOG,
  buildLocalCatalogArtists,
  buildLocalCatalogSongs,
  toCatalogArtistId,
} from '@/data/catalog/featuredCatalog';
import type { Song, Artist, Album } from '@/types';
import type { UseSearchParams, UseSearchReturn, SearchResults } from '../types';

function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function searchCatalog(query: string, type: UseSearchParams['type']): SearchResults {
  const q = normalize(query);

  const songs: Song[] =
    type === 'artist' || type === 'album'
      ? []
      : buildLocalCatalogSongs({ query: q }).map((item) => ({
          id: item.id,
          title: item.title,
          artistId: item.artistId,
          artistName: item.artistName,
        }));

  const artists: Artist[] =
    type === 'song' || type === 'album'
      ? []
      : buildLocalCatalogArtists({ query: q }).map((item) => ({
          id: item.id,
          name: item.name,
          songCount: item.songCount,
          albums: [],
        }));

  const albums: Album[] =
    type === 'song' || type === 'artist'
      ? []
      : FEATURED_CATALOG.filter(
          (entry) =>
            normalize(entry.artist).includes(q) ||
            entry.songs.some((song) => normalize(song).includes(q)),
        ).map((entry) => ({
          id: `album-${toCatalogArtistId(entry.artist)}`,
          title: `${entry.artist} Essentials`,
          artistId: toCatalogArtistId(entry.artist),
          artistName: entry.artist,
          releaseYear: 0,
          songCount: entry.songs.length,
        }));

  return { songs, artists, albums };
}

const DEBOUNCE_MS = 300;

export function useSearch({ query, type }: UseSearchParams): UseSearchReturn {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    if (query === '') {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debouncedQuery.trim();

  const results = useMemo<SearchResults>(() => {
    if (!trimmed) return { songs: [], artists: [], albums: [] };
    return searchCatalog(trimmed, type);
  }, [trimmed, type]);

  const total = results.songs.length + results.artists.length + results.albums.length;

  return {
    results,
    isLoading: false,
    isEmpty: !trimmed,
    hasNoResults: !!trimmed && total === 0,
  };
}
