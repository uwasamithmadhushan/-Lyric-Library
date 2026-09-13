import type {
  Artist,
  Lyrics,
  LyricsLookupParams,
  SearchFilterType,
  SearchResult,
  Song,
  SongSortMode,
  SongsQueryParams,
  ArtistsQueryParams,
} from '@/types';
import { plainTextToLyrics } from '@/services/lyrics/parseLyrics';
import { ItunesLyricsRepository } from '@/services/repository/itunesLyricsRepository';
import type { LyricsRepository } from '@/services/repository/LyricsRepository';
import {
  fetchBackendArtistById,
  fetchBackendArtists,
  fetchBackendSongById,
  fetchBackendSongs,
  isBackendArtistId,
  isBackendSongId,
} from '@/services/backend/catalogApi';

function mergeArtists(backend: Artist[], local: Artist[]): Artist[] {
  const seen = new Set(backend.map((artist) => artist.name.toLowerCase()));
  return [...backend, ...local.filter((artist) => !seen.has(artist.name.toLowerCase()))];
}

function mergeSongs(backend: Song[], local: Song[]): Song[] {
  const seen = new Set(backend.map((song) => `${song.title.toLowerCase()}::${song.artistName.toLowerCase()}`));
  return [
    ...backend,
    ...local.filter((song) => !seen.has(`${song.title.toLowerCase()}::${song.artistName.toLowerCase()}`)),
  ];
}

export class HybridLyricsRepository implements LyricsRepository {
  constructor(private readonly local = new ItunesLyricsRepository()) {}

  async getArtists(params?: ArtistsQueryParams): Promise<Artist[]> {
    const backend = await fetchBackendArtists(params?.query);
    const local = await this.local.getArtists(params);
    let merged = mergeArtists(backend, local);

    if (params?.startsWith) {
      const letter = params.startsWith.toLowerCase();
      merged = merged.filter((artist) => artist.name.toLowerCase().startsWith(letter));
    }

    return merged.sort((left, right) => left.name.localeCompare(right.name));
  }

  async getArtistById(id: string): Promise<Artist | undefined> {
    if (isBackendArtistId(id)) {
      return fetchBackendArtistById(id);
    }
    return this.local.getArtistById(id);
  }

  async getSongs(params?: SongsQueryParams | SongSortMode): Promise<Song[]> {
    const normalized: SongsQueryParams =
      typeof params === 'string' ? { sort: params } : params ?? {};

    if (normalized.artistId && isBackendArtistId(normalized.artistId)) {
      return this.getSongsByArtist(normalized.artistId);
    }

    if (normalized.albumId?.includes('-album-') && isBackendArtistId(normalized.albumId)) {
      const index = normalized.albumId.indexOf('-album-');
      const artistPublicId = normalized.albumId.slice(0, index);
      const albumName = decodeURIComponent(normalized.albumId.slice(index + '-album-'.length));
      const songs = await fetchBackendSongs({ artistPublicId });
      return this.sortSongs(
        songs.filter((song) => (song.albumTitle ?? '') === albumName),
        normalized.sort,
      );
    }

    const backend = await fetchBackendSongs({
      query: normalized.query || normalized.genre,
      artistPublicId: normalized.artistId,
    });
    const local = await this.local.getSongs(params);
    return this.sortSongs(mergeSongs(backend, local), normalized.sort);
  }

  async getSongsByArtist(artistId: string): Promise<Song[]> {
    if (isBackendArtistId(artistId)) {
      return fetchBackendSongs({ artistPublicId: artistId });
    }
    const [backend, local] = await Promise.all([
      fetchBackendSongs(),
      this.local.getSongsByArtist(artistId),
    ]);
    const localArtist = await this.local.getArtistById(artistId);
    const related = backend.filter(
      (song) => localArtist && song.artistName.toLowerCase() === localArtist.name.toLowerCase(),
    );
    return mergeSongs(related, local);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    if (isBackendSongId(id)) {
      return fetchBackendSongById(id);
    }
    return this.local.getSongById(id);
  }

  async getLyrics(params: LyricsLookupParams | string): Promise<Lyrics | undefined> {
    const lookup = typeof params === 'string' ? { songId: params } : params;
    if (isBackendSongId(lookup.songId)) {
      const song = await fetchBackendSongById(lookup.songId);
      if (song?.lyrics?.trim()) {
        return plainTextToLyrics(lookup.songId, {
          songTitle: song.title,
          artistName: song.artistName,
          albumTitle: song.albumTitle,
          plainText: song.lyrics,
          source: 'lrclib',
        });
      }
    }
    return this.local.getLyrics(params);
  }

  async search(query: string, types?: SearchFilterType | SearchFilterType[]): Promise<SearchResult[]> {
    const q = query.trim();
    const typeArray = Array.isArray(types) ? types : types ? [types] : [];
    const includeAll = typeArray.length === 0 || typeArray.includes('all');
    const wantArtists = includeAll || typeArray.includes('artist');
    const wantSongs = includeAll || typeArray.includes('song');

    const [backendArtists, backendSongs, local] = await Promise.all([
      wantArtists ? fetchBackendArtists(q) : Promise.resolve([]),
      wantSongs ? fetchBackendSongs({ query: q }) : Promise.resolve([]),
      this.local.search(query, types),
    ]);

    const results: SearchResult[] = [];
    backendArtists.forEach((artist) => {
      results.push({
        id: `result-artist-${artist.id}`,
        type: 'artist',
        title: artist.name,
        subtitle: 'Artist',
        referenceId: artist.id,
      });
    });
    backendSongs.forEach((song) => {
      results.push({
        id: `result-song-${song.id}`,
        type: 'song',
        title: song.title,
        subtitle: song.artistName,
        referenceId: song.id,
      });
    });

    const seen = new Set(results.map((item) => `${item.type}:${item.referenceId}:${item.title.toLowerCase()}`));
    local.forEach((item) => {
      const key = `${item.type}:${item.referenceId}:${item.title.toLowerCase()}`;
      if (!seen.has(key)) results.push(item);
    });
    return results;
  }

  private sortSongs(songs: Song[], sort?: SongSortMode): Song[] {
    const sorted = [...songs];
    switch (sort) {
      case 'genre':
        sorted.sort(
          (a, b) => (a.genre ?? '').localeCompare(b.genre ?? '') || a.title.localeCompare(b.title),
        );
        break;
      case 'recent':
        sorted.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.title.localeCompare(b.title));
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }
}

export const lyricsRepository = new HybridLyricsRepository();
