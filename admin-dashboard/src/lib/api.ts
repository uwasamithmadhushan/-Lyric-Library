import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ll_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!error.response) return 'Unable to connect to the server.';
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface ArtistRecord {
  id: string;
  publicId: string;
  externalApiId: string;
  name: string;
  imageUrl?: string | null;
  genre?: string | null;
  country?: string | null;
  description?: string | null;
  popularity?: number | null;
  songCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SongRecord {
  id: string;
  publicId: string;
  externalApiId: string;
  title: string;
  artistId: string;
  artistPublicId: string;
  artistName: string;
  album?: string | null;
  albumImageUrl?: string | null;
  releaseDate?: string | null;
  duration?: number | null;
  previewUrl?: string | null;
  lyrics?: string | null;
  genre?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistSearchHit {
  externalApiId: string;
  name: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  description?: string;
  popularity?: number;
  alreadyAdded?: boolean;
}

export interface SongSearchHit {
  externalApiId: string;
  title: string;
  artistName: string;
  artistExternalId: string;
  album?: string;
  albumImageUrl?: string;
  releaseDate?: string;
  duration?: number;
  previewUrl?: string;
  genre?: string;
  alreadyAdded?: boolean;
}
