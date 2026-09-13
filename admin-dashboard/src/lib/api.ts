import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ArtistSearchResult = {
  externalApiId: string;
  name: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  popularity?: number;
  alreadyAdded?: boolean;
};

export type SongSearchResult = {
  externalApiId: string;
  title: string;
  artistName: string;
  artistExternalId?: string;
  albumTitle?: string;
  albumExternalId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  duration?: number;
  previewUrl?: string;
  alreadyAdded?: boolean;
};

export type DbArtist = {
  id: string;
  name: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  songCount: number;
  createdAt: string;
};

export type DbSong = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumTitle?: string;
  artworkUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  previewUrl?: string;
  createdAt: string;
};

export type DashboardStats = {
  totalArtists: number;
  totalSongs: number;
  totalUsers: number;
  recentlyAddedArtists: DbArtist[];
  recentlyAddedSongs: DbSong[];
};
