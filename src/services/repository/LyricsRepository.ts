import {
  Artist,
  Song,
  Lyrics,
  LyricsLookupParams,
  SearchResult,
  SongSortMode,
  ArtistsQueryParams,
  SongsQueryParams,
  SearchFilterType,
} from '@/types';

/**
 * Abstract repository interface for the Lyric Library data layer.
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
  getLyrics(params: LyricsLookupParams | string): Promise<Lyrics | undefined>;

  /* ── Search ─────────────────────────────────────────────────── */
  search(
    query: string,
    types?: SearchFilterType | SearchFilterType[]
  ): Promise<SearchResult[]>;
}
