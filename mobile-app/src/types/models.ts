/**
 * Core data models for Lyric Library.
 * These types are the single source of truth — used in repository, hooks, stores, and UI.
 */

export interface Artist {
  id: string;
  name: string;
  songCount: number;
  albums: Album[];
  /** Optional artwork (iTunes artist endpoint has none — usually album cover) */
  imageUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  releaseYear: number;
  songCount: number;
  artworkUrl?: string;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumTitle?: string;
  releaseYear?: number;
  genre?: string;
  popularity?: number;
  artworkUrl?: string;
  /** iTunes 30s preview stream URL */
  previewUrl?: string;
}

export interface LyricsSection {
  type: 'verse' | 'chorus' | 'pre-chorus' | 'bridge' | 'outro' | 'intro';
  label: string;
  lines: string[];
}

export interface Lyrics {
  songId: string;
  songTitle: string;
  artistName: string;
  albumTitle?: string;
  sections: LyricsSection[];
}

export interface LyricsLookupParams {
  songId: string;
  songTitle?: string;
  artistName?: string;
}

export interface SavedLyric {
  lyricId: string;
  songId: string;
  songTitle: string;
  artistName: string;
  previewText: string;
  savedAt: number; // unix timestamp
  viewCount: number;
}

export interface SavedArtist {
  artistId: string;
  artistName: string;
  songCount: number;
  imageUrl?: string;
  savedAt: number;
}

export interface SearchResult {
  type: 'song' | 'artist' | 'album' | 'lyrics';
  id: string;
  title: string;
  subtitle: string;
  referenceId: string;
}

export interface ArtistsQueryParams {
  query?: string;
  startsWith?: string;
  /** Load a larger A–Z catalog (Artists browse), not just featured artists */
  browseAll?: boolean;
}

export interface SongsQueryParams {
  sort?: SongSortMode;
  query?: string;
  artistId?: string;
  albumId?: string;
  genre?: string;
}

/** Filter/sort options for Songs list */
export type SongSortMode = 'title' | 'genre' | 'recent' | 'popular';

/** Filter tabs for Search */
export type SearchFilterType = 'all' | 'song' | 'artist' | 'album' | 'lyrics';

/** Saved list tab mode */
export type SavedTabMode = 'recent' | 'most-viewed';

/** Text size levels for lyrics display */
export type LyricsTextSize = 'small' | 'normal' | 'large';

/** Theme preference (light/dark ready) */
export type ThemeMode = 'light' | 'dark' | 'system';

/** App background preset (adapts with dark mode) */
export type AppBackgroundId =
  | 'default'
  | 'mist'
  | 'ocean'
  | 'sand'
  | 'forest'
  | 'slate'
  | 'custom';
