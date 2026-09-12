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
  getCatalogEntry,
  parseCatalogArtistId,
  parseCatalogSongId,
  toCatalogArtistId,
  toCatalogSongId,
} from '@/data/catalog/featuredCatalog';

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

    // Curated catalog list is local + instant (avoids hundreds of iTunes calls / timeouts).
    if (browseAll || (!query && !startsWith)) {
      const local = buildLocalCatalogArtists();
      // Home featured: first 12; Artists browseAll: full catalog.
      const sliced = browseAll ? local : local.slice(0, 12);
      return sliced
        .map((item) =>
          this.rememberArtist({
            id: item.id,
            name: item.name,
            songCount: item.songCount,
            albums: [],
          }),
        )
        .sort((left, right) => left.name.localeCompare(right.name));
    }

    if (query) {
      // Curated matches first — no live iTunes (403 in many networks).
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
        if (deezer && !localMatches.some((a) => a.name.toLowerCase() === deezer.name.toLowerCase())) {
          localMatches.push(
            this.rememberArtist({
              id: toCatalogArtistId(deezer.name),
              name: deezer.name,
              songCount: 0,
              albums: [],
              imageUrl: deezer.imageUrl,
            }),
          );
        }
      } catch {
        // ignore
      }

      return localMatches.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Letter filter — curated catalog only (reliable + fast).
    return buildLocalCatalogArtists({ startsWith })
      .map((item) =>
        this.rememberArtist({
          id: item.id,
          name: item.name,
          songCount: item.songCount,
          albums: [],
        }),
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async getArtistById(id: string): Promise<Artist | undefined> {
    const catalogName = parseCatalogArtistId(id);
    if (catalogName) {
      const entry = getCatalogEntry(catalogName);
      // Local catalog first — never wait on iTunes for browse/detail reliability.
      return this.rememberArtist({
        id,
        name: catalogName,
        songCount: entry?.songs.length ?? 0,
        albums: [],
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
      try {
        const tracks = await lookupAlbumSongs(normalized.albumId);
        return this.sortSongs(this.rememberSongs(tracks.map(mapItunesSong)), normalized.sort);
      } catch {
        return this.mock.getSongs(params);
      }
    }

    // Default Songs tab + text/genre search against curated catalog (instant).
    // Genre is treated as a text filter over the local catalog — no iTunes.
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
    return this.sortSongs(local, normalized.sort);
  }

  async getSongsByArtist(artistId: string, knownName?: string): Promise<Song[]> {
    const catalogName =
      parseCatalogArtistId(artistId) ?? knownName ?? this.artistCache.get(artistId)?.name;
    const entry = catalogName ? getCatalogEntry(catalogName) : undefined;

    if (entry) {
      return entry.songs.map((title) =>
        this.rememberSongs([
          {
            id: toCatalogSongId(entry.artist, title),
            title,
            artistId: toCatalogArtistId(entry.artist),
            artistName: entry.artist,
          },
        ])[0],
      );
    }

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
