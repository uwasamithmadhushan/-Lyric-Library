import { LyricsRepository } from './LyricsRepository';
import { MockLyricsRepository } from './mockLyricsRepository';
import type {
  Artist,
  Song,
  SearchResult,
  SongSortMode,
  ArtistsQueryParams,
  SongsQueryParams,
  SearchFilterType,
  Album,
  LyricsLookupParams,
} from '@/types';
import {
  lookupArtistAlbums,
  lookupArtistsByIds,
  lookupAlbumSongs,
  upscaleArtworkUrl,
  type ItunesAlbumResult,
  type ItunesArtistResult,
  type ItunesSongResult,
} from '@/services/itunes/itunesApi';
import { fetchLyricsByTrack } from '@/services/lyrics/lyricsApi';
import { plainTextToLyrics } from '@/services/lyrics/parseLyrics';
import { searchDeezerArtist, searchDeezerTrack } from '@/services/deezer/deezerApi';
import { fetchMediaJson } from '@/services/media/mediaProxy';
import {
  buildLocalCatalogArtists,
  buildLocalCatalogSongs,
  getCatalogAlbum,
  getCatalogEntry,
  parseCatalogAlbumId,
  parseCatalogArtistId,
  parseCatalogSongId,
  toCatalogAlbumId,
  toCatalogArtistId,
  toCatalogSongId,
} from '@/data/catalog/featuredCatalog';
import {
  fetchBackendArtistById,
  fetchBackendArtists,
  fetchBackendSongById,
  fetchBackendSongs,
} from '@/services/api/backendCatalog';

function yearFromIso(iso?: string): number {
  if (!iso) return 0;
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function mapItunesArtist(  artist: ItunesArtistResult,
  albums: Album[] = [],
  songCount = 0,
  imageUrl?: string,
): Artist {
  const cover =
    imageUrl ??
    albums.find((album) => album.artworkUrl)?.artworkUrl;

  return {
    id: String(artist.artistId),
    name: artist.artistName,
    songCount: songCount || albums.reduce((sum, album) => sum + album.songCount, 0),
    albums,
    imageUrl: cover,
  };
}

function mapItunesAlbum(album: ItunesAlbumResult): Album {
  return {
    id: String(album.collectionId),
    title: album.collectionName,
    artistId: String(album.artistId),
    artistName: album.artistName,
    releaseYear: yearFromIso(album.releaseDate),
    songCount: album.trackCount ?? 0,
    artworkUrl: upscaleArtworkUrl(album.artworkUrl100, 300),
  };
}

function mapItunesSong(song: ItunesSongResult): Song {
  return {
    id: String(song.trackId),
    title: song.trackName,
    artistId: String(song.artistId),
    artistName: song.artistName,
    albumId: song.collectionId ? String(song.collectionId) : undefined,
    albumTitle: song.collectionName,
    releaseYear: yearFromIso(song.releaseDate),
    genre: song.primaryGenreName,
    popularity: 0,
    artworkUrl: upscaleArtworkUrl(song.artworkUrl100, 300),
    previewUrl: song.previewUrl,
  };
}

function isNoiseAlbumTitle(title: string): boolean {
  return /commentary|instrumental|track by track|remix ep|karaoke|acoustic collection/i.test(
    title,
  );
}

function mapCatalogAlbums(artistName: string, artistId: string): Album[] {
  const entry = getCatalogEntry(artistName);
  const albums = (entry?.albums ?? [])
    .filter((album) => album.songs.length > 0 && !isNoiseAlbumTitle(album.name))
    .map((album) => ({
      id: toCatalogAlbumId(artistName, album.name),
      title: album.name,
      artistId,
      artistName,
      releaseYear: album.year ?? 0,
      songCount: album.songs.length,
    }));

  // Keep at most 8 studio-ish albums for a clean detail screen.
  return albums.slice(0, 8);
}

function mapCatalogSongsForArtist(artistName: string): Song[] {
  const entry = getCatalogEntry(artistName);
  if (!entry) return [];

  const artistId = toCatalogArtistId(entry.artist);
  const seen = new Set<string>();
  const songs: Song[] = [];

  for (const title of entry.songs) {
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    songs.push({
      id: toCatalogSongId(entry.artist, title),
      title,
      artistId,
      artistName: entry.artist,
    });
  }

  // Pull a few album cuts so popular list isn't only singles.
  for (const album of entry.albums ?? []) {
    for (const title of album.songs.slice(0, 4)) {
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      songs.push({
        id: toCatalogSongId(entry.artist, title),
        title,
        artistId,
        artistName: entry.artist,
        albumId: toCatalogAlbumId(entry.artist, album.name),
        albumTitle: album.name,
        releaseYear: album.year,
      });
      if (songs.length >= 20) break;
    }
    if (songs.length >= 20) break;
  }

  return songs;
}

function normalizeArtistKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCatalogArtistId(id: string): boolean {
  return id.startsWith('cat-artist:');
}

function mergeArtistsByName(artists: Artist[]): Artist[] {
  const byName = new Map<string, Artist>();
  for (const artist of artists) {
    const key = normalizeArtistKey(artist.name);
    if (!key) continue;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, artist);
      continue;
    }

    // Prefer backend/library records over catalog placeholders, then higher song counts.
    const preferIncoming =
      (!isCatalogArtistId(artist.id) && isCatalogArtistId(existing.id)) ||
      (isCatalogArtistId(artist.id) === isCatalogArtistId(existing.id) &&
        artist.songCount > existing.songCount);

    if (preferIncoming) {
      byName.set(key, {
        ...artist,
        songCount: Math.max(artist.songCount, existing.songCount),
        imageUrl: artist.imageUrl || existing.imageUrl,
        albums: artist.albums.length ? artist.albums : existing.albums,
      });
    } else {
      byName.set(key, {
        ...existing,
        songCount: Math.max(artist.songCount, existing.songCount),
        imageUrl: existing.imageUrl || artist.imageUrl,
        albums: existing.albums.length ? existing.albums : artist.albums,
      });
    }
  }
  return Array.from(byName.values());
}

function mergeSongsByTitleArtist(songs: Song[]): Song[] {
  const byKey = new Map<string, Song>();
  for (const song of songs) {
    const key = `${song.artistName.trim().toLowerCase()}::${song.title.trim().toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, song);
      continue;
    }
    const preferIncoming = !song.id.startsWith('cat-song:') && existing.id.startsWith('cat-song:');
    byKey.set(key, preferIncoming ? { ...existing, ...song } : { ...song, ...existing });
  }
  return Array.from(byKey.values());
}

/**
 * Hybrid repository: artists/albums/songs-by-artist from iTunes Search API,
 * lyrics + general song catalog still from local mock data.
 */
export class ItunesLyricsRepository implements LyricsRepository {
  private readonly mock = new MockLyricsRepository();
  private readonly artistCache = new Map<string, Artist>();
  private readonly songCache = new Map<string, Song>();

  private rememberArtist(artist: Artist): Artist {
    this.artistCache.set(artist.id, artist);
    return artist;
  }

  private rememberSongs(songs: Song[]): Song[] {
    songs.forEach((song) => this.songCache.set(song.id, song));
    return songs;
  }

  private sortSongs(songs: Song[], sort?: SongSortMode): Song[] {
    const sorted = [...songs];
    switch (sort) {
      case 'genre':
        sorted.sort(
          (a, b) =>
            (a.genre ?? '').localeCompare(b.genre ?? '') || a.title.localeCompare(b.title),
        );
        break;
      case 'recent':
        sorted.sort(
          (a, b) =>
            (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.title.localeCompare(b.title),
        );
        break;
      case 'popular':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title':
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }

  async getArtists(params?: ArtistsQueryParams): Promise<Artist[]> {
    const query = params?.query?.trim() ?? '';
    const startsWith = params?.startsWith?.trim() ?? '';
    const browseAll = Boolean(params?.browseAll);

    // Backend-synced artists first (admin dashboard imports), then local catalog.
    let backendArtists: Artist[] = [];
    try {
      backendArtists = await fetchBackendArtists({
        query: query || undefined,
        startsWith: startsWith || undefined,
      });
      backendArtists.forEach((artist) => this.rememberArtist(artist));
    } catch {
      // Backend may be offline during local mobile development.
    }

    // Curated catalog list is local + instant (avoids hundreds of iTunes calls / timeouts).
    if (browseAll || (!query && !startsWith)) {
      const local = buildLocalCatalogArtists();
      const sliced = browseAll ? local : local.slice(0, 12);
      const localMapped = sliced.map((item) =>
        this.rememberArtist({
          id: item.id,
          name: item.name,
          songCount: item.songCount,
          albums: [],
        }),
      );
      return mergeArtistsByName([...backendArtists, ...localMapped]).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    }

    if (query) {
      const localMatches = buildLocalCatalogArtists({ query }).map((item) =>
        this.rememberArtist({
          id: item.id,
          name: item.name,
          songCount: item.songCount,
          albums: [],
        }),
      );

      try {
        const deezer = await searchDeezerArtist(query);
        if (deezer) {
          const deezerKey = normalizeArtistKey(deezer.name);
          let libraryMatch =
            backendArtists.find((artist) => normalizeArtistKey(artist.name) === deezerKey) ??
            localMatches.find((artist) => normalizeArtistKey(artist.name) === deezerKey);

          // Typo search often misses backend `contains` — re-query using Deezer's real name.
          if (!libraryMatch || isCatalogArtistId(libraryMatch.id)) {
            try {
              const tokens = deezerKey.split(' ').filter((token) => token.length > 2);
              const lookupQuery = tokens[tokens.length - 1] || deezer.name;
              const synced = await fetchBackendArtists({ query: lookupQuery });
              const exact = synced.find(
                (artist) => normalizeArtistKey(artist.name) === deezerKey,
              );
              if (exact) {
                libraryMatch = this.rememberArtist(exact);
                if (!backendArtists.some((artist) => artist.id === exact.id)) {
                  backendArtists.push(exact);
                }
              }
            } catch {
              // ignore
            }
          }

          const alreadyPresent = [...backendArtists, ...localMatches].some(
            (artist) => normalizeArtistKey(artist.name) === deezerKey,
          );
          if (!alreadyPresent && !libraryMatch) {
            localMatches.push(
              this.rememberArtist({
                id: toCatalogArtistId(deezer.name),
                name: deezer.name,
                songCount: 0,
                albums: [],
                imageUrl: deezer.imageUrl,
              }),
            );
          } else if (libraryMatch?.imageUrl || deezer.imageUrl) {
            // Attach Deezer artwork onto the library record when missing.
            const target = backendArtists.find((artist) => artist.id === libraryMatch?.id);
            if (target && !target.imageUrl && deezer.imageUrl) {
              target.imageUrl = deezer.imageUrl;
            }
          }
        }
      } catch {
        // ignore
      }

      return mergeArtistsByName([...backendArtists, ...localMatches]).sort(
        (a, b) =>
          b.songCount - a.songCount || a.name.localeCompare(b.name),
      );
    }

    // Letter filter — curated catalog only (reliable + fast).
    const letterMatches = buildLocalCatalogArtists({ startsWith }).map((item) =>
      this.rememberArtist({
        id: item.id,
        name: item.name,
        songCount: item.songCount,
        albums: [],
      }),
    );
    return mergeArtistsByName([...backendArtists, ...letterMatches]).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  async getArtistById(id: string): Promise<Artist | undefined> {
    const backendArtist = await fetchBackendArtistById(id);
    if (backendArtist) return this.rememberArtist(backendArtist);

    const catalogName = parseCatalogArtistId(id);
    if (catalogName) {
      const entry = getCatalogEntry(catalogName);
      const albums = mapCatalogAlbums(catalogName, id);
      const songCount = Math.max(entry?.songs.length ?? 0, mapCatalogSongsForArtist(catalogName).length);

      // If admin already synced this artist, prefer the backend record.
      try {
        const synced = await fetchBackendArtists({ query: catalogName });
        const wanted = normalizeArtistKey(catalogName);
        const exact =
          synced.find((item) => normalizeArtistKey(item.name) === wanted) ??
          synced.find((item) => item.name.toLowerCase() === catalogName.toLowerCase());
        if (exact) return this.rememberArtist(exact);

        // Fallback: last name / significant token search (handles "M S Fernando" vs "M. S. Fernando").
        const tokens = wanted.split(' ').filter((token) => token.length > 2);
        const lookupQuery = tokens[tokens.length - 1];
        if (lookupQuery) {
          const broader = await fetchBackendArtists({ query: lookupQuery });
          const match = broader.find((item) => normalizeArtistKey(item.name) === wanted);
          if (match) return this.rememberArtist(match);
        }
      } catch {
        // ignore
      }

      return this.rememberArtist({
        id,
        name: catalogName,
        songCount,
        albums,
      });
    }

    const numericId = id.trim();
    if (!numericId) return undefined;

    try {
      const [artists, albums] = await Promise.all([
        lookupArtistsByIds([numericId]),
        lookupArtistAlbums(numericId, 25),
      ]);

      const itunesArtist = artists[0];
      if (itunesArtist) {
        const mappedAlbums = albums.map(mapItunesAlbum);
        return this.rememberArtist(mapItunesArtist(itunesArtist, mappedAlbums));
      }
    } catch {
      // Fall through to mock for legacy local ids like "a06".
    }

    const mockArtist = await this.mock.getArtistById(id);
    if (mockArtist) this.rememberArtist(mockArtist);
    return mockArtist;
  }

  async getSongs(params?: SongsQueryParams | SongSortMode): Promise<Song[]> {
    const normalized: SongsQueryParams =
      typeof params === 'string' ? { sort: params } : params ?? {};

    if (normalized.artistId) {
      return this.getSongsByArtist(normalized.artistId);
    }

    if (normalized.albumId) {
      const catalogAlbum = parseCatalogAlbumId(normalized.albumId);
      if (catalogAlbum) {
        const album = getCatalogAlbum(catalogAlbum.artistName, catalogAlbum.albumName);
        if (!album) return [];
        const artistId = toCatalogArtistId(catalogAlbum.artistName);
        const songs = album.songs.map((title) =>
          this.rememberSongs([
            {
              id: toCatalogSongId(catalogAlbum.artistName, title),
              title,
              artistId,
              artistName: catalogAlbum.artistName,
              albumId: normalized.albumId,
              albumTitle: album.name,
              releaseYear: album.year,
            },
          ])[0],
        );
        return this.sortSongs(songs, normalized.sort);
      }

      // Backend albums use cuid ids — never send those to iTunes lookup.
      try {
        const backendAlbumSongs = await fetchBackendSongs({ albumId: normalized.albumId });
        if (backendAlbumSongs.length) {
          this.rememberSongs(backendAlbumSongs);
          return this.sortSongs(backendAlbumSongs, normalized.sort);
        }
      } catch {
        // Backend may be offline.
      }

      if (!/^\d+$/.test(normalized.albumId.trim())) {
        return [];
      }

      try {
        const tracks = await lookupAlbumSongs(normalized.albumId);
        return this.sortSongs(this.rememberSongs(tracks.map(mapItunesSong)), normalized.sort);
      } catch {
        return this.mock.getSongs(params);
      }
    }

    // Default Songs tab + text/genre search against curated catalog (instant).
    // Genre is treated as a text filter over the local catalog — no iTunes.
    let backendSongs: Song[] = [];
    try {
      backendSongs = await fetchBackendSongs({
        query: normalized.query || normalized.genre,
      });
      this.rememberSongs(backendSongs);
    } catch {
      // ignore offline backend
    }

    const local = buildLocalCatalogSongs({
      query: normalized.query || normalized.genre,
    }).map((item) =>
      this.rememberSongs([
        {
          id: item.id,
          title: item.title,
          artistId: item.artistId,
          artistName: item.artistName,
        },
      ])[0],
    );
    return this.sortSongs(mergeSongsByTitleArtist([...backendSongs, ...local]), normalized.sort);
  }

  async getSongsByArtist(artistId: string, knownName?: string): Promise<Song[]> {
    let backendSongs: Song[] = [];
    try {
      backendSongs = await fetchBackendSongs({ artistId });
      this.rememberSongs(backendSongs);
    } catch {
      // ignore
    }

    const catalogName =
      parseCatalogArtistId(artistId) ?? knownName ?? this.artistCache.get(artistId)?.name;

    // Backend artist ids differ from catalog ids — also pull by artist name.
    if (catalogName && backendSongs.length === 0) {
      try {
        const named = await fetchBackendSongs({ query: catalogName });
        backendSongs = named.filter(
          (song) => song.artistName.toLowerCase() === catalogName.toLowerCase(),
        );
        this.rememberSongs(backendSongs);
      } catch {
        // ignore
      }
    }

    const entry = catalogName ? getCatalogEntry(catalogName) : undefined;

    if (entry) {
      const local = this.rememberSongs(mapCatalogSongsForArtist(entry.artist));
      return mergeSongsByTitleArtist([...backendSongs, ...local]);
    }

    if (backendSongs.length) return backendSongs;

    const artistName = knownName ?? this.artistCache.get(artistId)?.name;
    if (artistName) {
      try {
        const payload = await fetchMediaJson<{
          data?: Array<{
            title?: string;
            artist?: { name?: string };
            preview?: string;
            album?: { title?: string; cover_medium?: string };
          }>;
        }>('deezer', {
          path: 'search',
          q: `artist:"${artistName}"`,
          limit: '25',
        });

        return this.rememberSongs(
          (payload.data ?? [])
            .filter((track) => track.title && track.artist?.name)
            .map((track) => ({
              id: toCatalogSongId(track.artist!.name!, track.title!),
              title: track.title!,
              artistId: toCatalogArtistId(track.artist!.name!),
              artistName: track.artist!.name!,
              previewUrl: track.preview,
              artworkUrl: track.album?.cover_medium,
              albumTitle: track.album?.title,
            })),
        );
      } catch {
        // fall through
      }
    }

    return this.mock.getSongsByArtist(artistId);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    const cached = this.songCache.get(id);
    if (cached?.previewUrl) return cached;

    const backendSong = await fetchBackendSongById(id);
    if (backendSong) {
      return this.rememberSongs([backendSong])[0];
    }

    const catalogSong = parseCatalogSongId(id);
    if (catalogSong) {
      const fallback: Song = {
        id,
        title: catalogSong.songTitle,
        artistId: toCatalogArtistId(catalogSong.artistName),
        artistName: catalogSong.artistName,
      };
      this.rememberSongs([fallback]);

      const deezer = await searchDeezerTrack(
        catalogSong.songTitle,
        catalogSong.artistName,
      );
      if (deezer?.previewUrl) {
        return this.rememberSongs([
          {
            ...fallback,
            previewUrl: deezer.previewUrl,
            artworkUrl: deezer.artworkUrl,
            albumTitle: deezer.albumTitle,
          },
        ])[0];
      }

      return fallback;
    }

    // Non-catalog ids: resolve preview via Deezer using cache/title metadata only.
    // Do NOT call iTunes from the client (403 / CORS issues on web).
    if (cached?.title && cached.artistName) {
      const deezer = await searchDeezerTrack(cached.title, cached.artistName);
      if (deezer?.previewUrl) {
        return this.rememberSongs([
          {
            ...cached,
            previewUrl: deezer.previewUrl,
            artworkUrl: cached.artworkUrl ?? deezer.artworkUrl,
            albumTitle: cached.albumTitle ?? deezer.albumTitle,
          },
        ])[0];
      }
    }

    return cached ?? this.mock.getSongById(id);
  }

  async getLyrics(params: LyricsLookupParams | string) {
    const lookup = typeof params === 'string' ? { songId: params } : params;

    // Keep mock lyrics for local demo ids when present.
    const mockLyrics = await this.mock.getLyrics(lookup.songId);
    if (mockLyrics) return mockLyrics;

    const cachedSong = this.songCache.get(lookup.songId);
    const songTitle = lookup.songTitle?.trim() || cachedSong?.title;
    const artistName = lookup.artistName?.trim() || cachedSong?.artistName;

    if (!songTitle || !artistName) return undefined;

    const fetched = await fetchLyricsByTrack(artistName, songTitle);
    if (!fetched) return undefined;

    return plainTextToLyrics(lookup.songId, fetched);
  }

  async search(
    query: string,
    types?: SearchFilterType | SearchFilterType[],
  ): Promise<SearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const typeArray = Array.isArray(types) ? types : types ? [types] : [];
    const includeAll = typeArray.length === 0 || typeArray.includes('all');
    const wantArtists = includeAll || typeArray.includes('artist');
    const wantSongs = includeAll || typeArray.includes('song');

    const results: SearchResult[] = [];

    if (wantArtists) {
      buildLocalCatalogArtists({ query: q }).slice(0, 15).forEach((artist) => {
        this.rememberArtist({
          id: artist.id,
          name: artist.name,
          songCount: artist.songCount,
          albums: [],
        });
        results.push({
          id: `result-artist-${artist.id}`,
          type: 'artist',
          title: artist.name,
          subtitle: 'Artist',
          referenceId: artist.id,
        });
      });
    }

    if (wantSongs) {
      buildLocalCatalogSongs({ query: q }).slice(0, 20).forEach((song) => {
        this.rememberSongs([
          {
            id: song.id,
            title: song.title,
            artistId: song.artistId,
            artistName: song.artistName,
          },
        ]);
        results.push({
          id: `result-song-${song.id}`,
          type: 'song',
          title: song.title,
          subtitle: song.artistName,
          referenceId: song.id,
        });
      });

      // Extra Deezer hits for songs not in the curated catalog.
      try {
        const payload = await fetchMediaJson<{
          data?: Array<{
            id?: number;
            title?: string;
            artist?: { name?: string };
            preview?: string;
            album?: { title?: string; cover_medium?: string };
          }>;
        }>('deezer', { path: 'search', q, limit: '10' });

        (payload.data ?? []).forEach((track) => {
          if (!track.id || !track.title || !track.artist?.name) return;
          const id = toCatalogSongId(track.artist.name, track.title);
          if (results.some((item) => item.referenceId === id)) return;
          this.rememberSongs([
            {
              id,
              title: track.title,
              artistId: toCatalogArtistId(track.artist.name),
              artistName: track.artist.name,
              previewUrl: track.preview,
              artworkUrl: track.album?.cover_medium,
              albumTitle: track.album?.title,
            },
          ]);
          results.push({
            id: `result-song-${id}`,
            type: 'song',
            title: track.title,
            subtitle: track.artist.name,
            referenceId: id,
          });
        });
      } catch {
        // ignore
      }
    }

    const mockResults = await this.mock.search(query, types);
    const filteredMock = mockResults.filter((item) => {
      if (wantArtists && item.type === 'artist') return false;
      if (wantSongs && item.type === 'song') return false;
      return true;
    });

    return [...results, ...filteredMock];
  }
}

/** Singleton used throughout the app. */
export const lyricsRepository = new ItunesLyricsRepository();
