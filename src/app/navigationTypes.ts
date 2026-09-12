/**
 * Navigation route types — single source of truth for all navigation params.
 *
 * Usage in screens:
 *   import { ArtistsStackParamList } from '@/app/navigationTypes';
 *   type Props = NativeStackScreenProps<ArtistsStackParamList, 'ArtistDetail'>;
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Stack Param Lists ───────────────────────────────────────────

export type ArtistsStackParamList = {
  ArtistsList: undefined;
  ArtistDetail: { artistId: string; artistName: string };
  AlbumDetail: { albumId: string; albumName: string; artistId: string; artistName: string };
  Lyrics: { songId: string; songTitle: string; artistName: string };
};

export type SongsStackParamList = {
  SongsList: undefined;
  Lyrics: { songId: string; songTitle: string; artistName: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Lyrics: { songId: string; songTitle: string; artistName: string };
};

export type GenresStackParamList = {
  GenresMain: undefined;
  GenreDetail: { genre: string };
};

export type PlaylistsStackParamList = {
  PlaylistsMain: undefined;
  PlaylistDetail: { playlistId: string };
};

export type RecentlyStackParamList = {
  RecentlyMain: undefined;
};

export type FavoritesStackParamList = {
  FavoritesMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};

export type SearchStackParamList = {
  SearchMain: undefined;
  ArtistDetail: { artistId: string; artistName: string };
  Lyrics: { songId: string; songTitle: string; artistName: string };
};

export type SavedStackParamList = {
  SavedList: undefined;
  Lyrics: { songId: string; songTitle: string; artistName: string };
};

// ─── Root Tab Param List ────────────────────────────────────────

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ArtistsTab: NavigatorScreenParams<ArtistsStackParamList>;
  SongsTab: NavigatorScreenParams<SongsStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  SavedTab: NavigatorScreenParams<SavedStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ─── Convenience types ──────────────────────────────────────────

/** All possible route names across the app */
export type AllRouteNames =
  | keyof ArtistsStackParamList
  | keyof SongsStackParamList
  | keyof SearchStackParamList
  | keyof SavedStackParamList
  | keyof RootTabParamList;
