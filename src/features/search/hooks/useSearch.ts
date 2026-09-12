import { useState, useEffect, useMemo } from 'react';
import artistsJson from '@/data/mock/artists.json';
import songsJson   from '@/data/mock/songs.json';
import type { Song, Artist, Album } from '@/types';
import type { UseSearchParams, UseSearchReturn, SearchResults } from '../types';

// ─── Typed mock data ──────────────────────────────────────────────────────────
const rawSongs    = songsJson    as unknown as Song[];
const rawArtists  = artistsJson  as unknown as Artist[];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalize(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function searchMockData(query: string, type: UseSearchParams['type']): SearchResults {
  const q = normalize(query);

  const songs =
    type === 'artist' || type === 'album'
      ? []
      : rawSongs.filter(
          (s) =>
            normalize(s.title).includes(q) ||
            normalize(s.artistName).includes(q) ||
            normalize(s.albumTitle ?? '').includes(q),
        );

  const artists =
    type === 'song' || type === 'album'
      ? []
      : rawArtists.filter((a) => normalize(a.name).includes(q));

  const albums: Album[] =
    type === 'song' || type === 'artist'
      ? []
      : rawArtists
          .flatMap((a) => a.albums)
          .filter(
            (al) =>
              normalize(al.title).includes(q) ||
              normalize(al.artistName).includes(q),
          );

  return { songs, artists, albums };
}

// ─── Hook ────────────────────────────────────────────────────────────────────
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
    return searchMockData(trimmed, type);
  }, [trimmed, type]);

  const total = results.songs.length + results.artists.length + results.albums.length;

  return {
    results,
    isLoading:    false,
    isEmpty:      !trimmed,
    hasNoResults: !!trimmed && total === 0,
  };
}