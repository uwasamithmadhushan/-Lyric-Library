import { LyricsRepository } from './LyricsRepository';
import type {
  Artist,
  Song,
  Lyrics,
  SearchResult,
  SongSortMode,
  ArtistsQueryParams,
  SongsQueryParams,
  SearchFilterType,
} from '@/types';

import artistsData from '@/data/mock/artists.json';
import songsData from '@/data/mock/songs.json';
import lyricsData from '@/data/mock/lyrics.json';

/* ── Typed references ──────────────────────────────────────────── */
const artists: Artist[] = artistsData as Artist[];
const songs: Song[] = songsData as Song[];
const lyrics: Record<string, Lyrics> = lyricsData as unknown as Record<
  string,
  Lyrics
>;

/** Simulated network latency for realistic loading states (ms). */
const FAKE_DELAY = 350;

const delay = (ms: number = FAKE_DELAY) =>
  new Promise<void>((r) => setTimeout(r, ms));

const ARTIST_TARGET_COUNT = 60;
const SONG_TARGET_COUNT = 125;

function cloneArtist(artist: Artist, cloneIndex: number): Artist {
  const suffix = `-x${cloneIndex}`;
  const cloneName = `${artist.name} ${cloneIndex + 1}`;

  return {
    ...artist,
    id: `${artist.id}${suffix}`,
    name: cloneName,
    albums: artist.albums.map((album) => ({
      ...album,
      id: `${album.id}${suffix}`,
      artistId: `${artist.id}${suffix}`,
      artistName: cloneName,
    })),
  };
}

function buildScaledArtists(baseArtists: Artist[]): Artist[] {
  if (baseArtists.length >= ARTIST_TARGET_COUNT) {
    return baseArtists;
  }

  const result: Artist[] = [...baseArtists];
  let cloneIndex = 1;

  while (result.length < ARTIST_TARGET_COUNT) {
    const sourceArtist = baseArtists[(cloneIndex - 1) % baseArtists.length];
    result.push(cloneArtist(sourceArtist, cloneIndex));
    cloneIndex += 1;
  }

  return result;
}

function cloneSong(song: Song, cloneIndex: number, artistMap: Map<string, Artist>): Song {
  const suffix = `-x${cloneIndex}`;
  const clonedArtistId = `${song.artistId}${suffix}`;
  const clonedArtist = artistMap.get(clonedArtistId);

  return {
    ...song,
    id: `${song.id}${suffix}`,
    artistId: clonedArtist?.id ?? song.artistId,
    artistName: clonedArtist?.name ?? song.artistName,
    albumId: song.albumId ? `${song.albumId}${suffix}` : song.albumId,
    albumTitle: song.albumTitle,
  };
}

function buildScaledSongs(baseSongs: Song[], scaledArtists: Artist[]): Song[] {
  if (baseSongs.length >= SONG_TARGET_COUNT) {
    return baseSongs;
  }

  const artistMap = new Map(scaledArtists.map((artist) => [artist.id, artist]));
  const result: Song[] = [...baseSongs];
  let cloneIndex = 1;

  while (result.length < SONG_TARGET_COUNT) {
    for (const baseSong of baseSongs) {
      if (result.length >= SONG_TARGET_COUNT) {
        break;
      }
      result.push(cloneSong(baseSong, cloneIndex, artistMap));
    }
    cloneIndex += 1;
  }

  return result;
}

const scaledArtists = buildScaledArtists(artists);
const scaledSongs = buildScaledSongs(songs, scaledArtists);

/* ── Mock implementation ───────────────────────────────────────── */
export class MockLyricsRepository implements LyricsRepository {
  /* ── Private helpers ─────────────────────────────────────────── */

  /**
   * Normalize search filter types to an array.
   */
  private normalizeSearchTypes(
    types?: SearchFilterType | SearchFilterType[],
  ): SearchFilterType[] {
    if (!types) {
      return ['artist', 'song', 'lyrics', 'album'];
    }
    return Array.isArray(types) ? types : [types];
  }

  /* Artists */
  async getArtists(params?: ArtistsQueryParams): Promise<Artist[]> {
    await delay();

    let result = [...scaledArtists];

    if (params?.startsWith) {
      const startsWith = params.startsWith.toLowerCase();
      result = result.filter((artist) =>
        artist.name.toLowerCase().startsWith(startsWith),
      );
    }

    if (params?.query?.trim()) {
      const query = params.query.trim().toLowerCase();
      result = result.filter((artist) =>
        artist.name.toLowerCase().includes(query),
      );
    }

    return result;
  }

  async getArtistById(id: string): Promise<Artist | undefined> {
    await delay();
    return scaledArtists.find((a) => a.id === id);
  }

  /* Songs */
  async getSongs(params?: SongsQueryParams | SongSortMode): Promise<Song[]> {
    await delay();

    const normalizedParams: SongsQueryParams =
      typeof params === 'string'
        ? { sort: params }
        : params ?? { sort: 'title' };

    const sort = normalizedParams.sort ?? 'title';
    let result = [...scaledSongs];

    if (normalizedParams.artistId) {
      result = result.filter((song) => song.artistId === normalizedParams.artistId);
    }

    if (normalizedParams.albumId) {
      result = result.filter((song) => song.albumId === normalizedParams.albumId);
    }

    if (normalizedParams.genre) {
      const genre = normalizedParams.genre.toLowerCase();
      result = result.filter((song) => (song.genre ?? '').toLowerCase() === genre);
    }

    if (normalizedParams.query?.trim()) {
      const query = normalizedParams.query.trim().toLowerCase();
      result = result.filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artistName.toLowerCase().includes(query) ||
          (song.albumTitle ?? '').toLowerCase().includes(query),
      );
    }

    const sorted = [...result];
    switch (sort) {
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'genre':
        sorted.sort((a, b) => (a.genre ?? '').localeCompare(b.genre ?? ''));
        break;
      case 'recent':
        sorted.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
        break;
      case 'popular':
        sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        break;
    }
    return sorted;
  }

  async getSongsByArtist(artistId: string): Promise<Song[]> {
    await delay();
    return scaledSongs.filter((s) => s.artistId === artistId);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    await delay();
    return scaledSongs.find((s) => s.id === id);
  }

  /* Lyrics */
  async getLyrics(songId: string): Promise<Lyrics | undefined> {
    await delay();
    return lyrics[songId];
  }

  /* Search */
  async search(
    query: string,
    types?: SearchFilterType | SearchFilterType[],
  ): Promise<SearchResult[]> {
    await delay(200);
    const q = query.toLowerCase().trim();
    if (!q) return [];

    // Normalize types to array
    const typeArray: SearchFilterType[] = this.normalizeSearchTypes(types);
    const includeAll = typeArray.includes('all') || typeArray.length === 0;

    const results: SearchResult[] = [];

    // Search artists
    if (includeAll || typeArray.includes('artist')) {
      scaledArtists.forEach((artist) => {
        if (artist.name.toLowerCase().includes(q)) {
          results.push({
            id: `result-artist-${artist.id}`,
            type: 'artist',
            title: artist.name,
            subtitle: `${artist.songCount} songs`,
            referenceId: artist.id,
          });
        }
      });
    }

    // Search songs
    if (includeAll || typeArray.includes('song')) {
      scaledSongs.forEach((song) => {
        if (
          song.title.toLowerCase().includes(q) ||
          song.artistName.toLowerCase().includes(q)
        ) {
          results.push({
            id: `result-song-${song.id}`,
            type: 'song',
            title: song.title,
            subtitle: song.artistName,
            referenceId: song.id,
          });
        }
      });
    }

    // Search albums
    if (includeAll || typeArray.includes('album')) {
      scaledArtists.forEach((artist) => {
        artist.albums.forEach((album) => {
          if (album.title.toLowerCase().includes(q)) {
            results.push({
              id: `result-album-${album.id}`,
              type: 'album',
              title: album.title,
              subtitle: `${artist.name} · ${album.releaseYear}`,
              referenceId: album.id,
            });
          }
        });
      });
    }

    // Search lyrics
    if (includeAll || typeArray.includes('lyrics')) {
      Object.values(lyrics).forEach((lyricsEntry) => {
        const match = lyricsEntry.sections.some((section) =>
          section.lines.some((line) => line.toLowerCase().includes(q)),
        );
        if (match) {
          const song = scaledSongs.find((s) => s.id === lyricsEntry.songId);
          if (song) {
            // avoid duplicate if song was already matched by title
            const alreadyAdded = results.some(
              (r) => r.type === 'song' && r.referenceId === song.id,
            );
            if (!alreadyAdded) {
              results.push({
                id: `result-lyric-${song.id}`,
                type: 'lyrics',
                title: song.title,
                subtitle: `${song.artistName} · lyrics match`,
                referenceId: song.id,
              });
            }
          }
        }
      });
    }

    return results;
  }
}

/** Singleton instance used throughout the app. */
export const lyricsRepository = new MockLyricsRepository();
