import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Artist, Song } from '@/types';

export const BACKEND_ARTIST_PREFIX = 'll-artist:';
export const BACKEND_SONG_PREFIX = 'll-song:';

interface BackendArtist {
  id: string;
  publicId: string;
  name: string;
  imageUrl?: string | null;
  genre?: string | null;
  songCount: number;
  songs?: Array<{
    id: string;
    publicId: string;
    title: string;
    album?: string | null;
    albumImageUrl?: string | null;
  }>;
}

interface BackendSong {
  id: string;
  publicId: string;
  title: string;
  artistId: string;
  artistPublicId: string;
  artistName: string;
  album?: string | null;
  albumImageUrl?: string | null;
  releaseDate?: string | null;
  previewUrl?: string | null;
  lyrics?: string | null;
  genre?: string | null;
}

function getBackendBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

async function fetchJson<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${getBackendBaseUrl()}${path}`, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function isBackendArtistId(id: string): boolean {
  return id.startsWith(BACKEND_ARTIST_PREFIX);
}

export function isBackendSongId(id: string): boolean {
  return id.startsWith(BACKEND_SONG_PREFIX);
}

export function parseBackendArtistId(id: string): string | null {
  return isBackendArtistId(id) ? id.slice(BACKEND_ARTIST_PREFIX.length) : null;
}

export function parseBackendSongId(id: string): string | null {
  return isBackendSongId(id) ? id.slice(BACKEND_SONG_PREFIX.length) : null;
}

function mapArtist(artist: BackendArtist): Artist {
  const albums =
    artist.songs?.reduce<Artist['albums']>((list, song) => {
      const title = song.album?.trim();
      if (!title) return list;
      const existing = list.find((album) => album.title === title);
      if (existing) {
        existing.songCount += 1;
        return list;
      }
      list.push({
        id: `${artist.publicId}-album-${encodeURIComponent(title)}`,
        title,
        artistId: artist.publicId,
        artistName: artist.name,
        releaseYear: 0,
        songCount: 1,
        artworkUrl: song.albumImageUrl ?? undefined,
      });
      return list;
    }, []) ?? [];

  return {
    id: artist.publicId,
    name: artist.name,
    songCount: artist.songCount || artist.songs?.length || 0,
    albums,
    imageUrl: artist.imageUrl ?? undefined,
  };
}

function mapSong(song: BackendSong): Song {
  const year = song.releaseDate ? Number(song.releaseDate.slice(0, 4)) : undefined;
  return {
    id: song.publicId,
    title: song.title,
    artistId: song.artistPublicId,
    artistName: song.artistName,
    albumTitle: song.album ?? undefined,
    artworkUrl: song.albumImageUrl ?? undefined,
    previewUrl: song.previewUrl ?? undefined,
    genre: song.genre ?? undefined,
    releaseYear: Number.isFinite(year) ? year : undefined,
  };
}

export async function fetchBackendArtists(query?: string): Promise<Artist[]> {
  const suffix = query?.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
  const data = await fetchJson<{ artists?: BackendArtist[] }>(`/api/artists${suffix}`);
  return (data?.artists ?? []).map(mapArtist);
}

export async function fetchBackendArtistById(publicId: string): Promise<Artist | undefined> {
  const id = parseBackendArtistId(publicId);
  if (!id) return undefined;
  const data = await fetchJson<{ artist?: BackendArtist }>(`/api/artists/${id}`);
  return data?.artist ? mapArtist(data.artist) : undefined;
}

export async function fetchBackendSongs(params?: {
  query?: string;
  artistPublicId?: string;
}): Promise<Song[]> {
  const search = new URLSearchParams();
  if (params?.query?.trim()) search.set('query', params.query.trim());
  const artistId = params?.artistPublicId ? parseBackendArtistId(params.artistPublicId) : null;
  if (artistId) search.set('artistId', artistId);
  const qs = search.toString();
  const data = await fetchJson<{ songs?: BackendSong[] }>(`/api/songs${qs ? `?${qs}` : ''}`);
  return (data?.songs ?? []).map(mapSong);
}

export async function fetchBackendSongById(publicId: string): Promise<(Song & { lyrics?: string | null }) | undefined> {
  const id = parseBackendSongId(publicId);
  if (!id) return undefined;
  const data = await fetchJson<{ song?: BackendSong }>(`/api/songs/${id}`);
  return data?.song ? { ...mapSong(data.song), lyrics: data.song.lyrics } : undefined;
}
