import {
  Artist,
  Song,
  Lyrics,
  SearchResult,
  SongSortMode,
  ArtistsQueryParams,
  SongsQueryParams,
  SearchFilterType,
} from '@/types';

/**
 * Abstract repository interface for the Lyric Library data layer.
 * Sprint 1 uses MockLyricsRepository; Sprint 3 can swap in an API-backed one.
 */
export interface LyricsRepository {
  /* ── Artists ─────────────────────────────────────────────────── */
  getArtists(params?: ArtistsQueryParams): Promise<Artist[]>;
  getArtistById(id: string): Promise<Artist | undefined>;

  /* ── Songs ──────────────────────────────────────────────────── */
  getSongs(params?: SongsQueryParams | SongSortMode): Promise<Song[]>;
  getSongsByArtist(artistId: string): Promise<Song[]>;
  getSongById(id: string): Promise<Song | undefined>;

  /* ── Lyrics ─────────────────────────────────────────────────── */
  getLyrics(songId: string): Promise<Lyrics | undefined>;

  /* ── Search ─────────────────────────────────────────────────── */
  search(
    query: string,
    types?: SearchFilterType | SearchFilterType[]
  ): Promise<SearchResult[]>;
}
