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
  lookupArtistArtwork,
  searchMusicArtists,
  searchSongsByArtistName,
  upscaleArtworkUrl,
  type ItunesAlbumResult,
  type ItunesArtistResult,
  type ItunesSongResult,
} from '@/services/itunes/itunesApi';
import { fetchLyricsByTrack } from '@/services/lyrics/lyricsApi';
import { plainTextToLyrics } from '@/services/lyrics/parseLyrics';
/** Curated popular artists shown when browse has no search query. */
const FEATURED_ARTIST_IDS = [
  159260351, // Taylor Swift
  262836961, // Adele
  479756766, // The Weeknd
  183313439, // Ed Sheeran
  271256, // Drake
  1419227, // Beyoncé
  471744, // Coldplay
  137057909, // Miley Cyrus
  1065981054, // Billie Eilish
  278873078, // Bruno Mars
];

function yearFromIso(iso?: string): number {
  if (!iso) return 0;
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function mapItunesArtist(
  artist: ItunesArtistResult,
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

  async getArtists(params?: ArtistsQueryParams): Promise<Artist[]> {
    const query = params?.query?.trim() ?? '';
    const startsWith = params?.startsWith?.trim() ?? '';

    let itunesArtists: ItunesArtistResult[] = [];

    if (query) {
      itunesArtists = await searchMusicArtists(query, 30);
    } else if (startsWith) {
      itunesArtists = await searchMusicArtists(startsWith, 30);
      itunesArtists = itunesArtists.filter((artist) =>
        artist.artistName.toLowerCase().startsWith(startsWith.toLowerCase()),
      );
    } else {
      itunesArtists = await lookupArtistsByIds(FEATURED_ARTIST_IDS);
      const enriched = await Promise.all(
        itunesArtists.map(async (artist) => {
          try {
            const albums = await lookupArtistAlbums(artist.artistId, 12);
            return this.rememberArtist(
              mapItunesArtist(artist, albums.map(mapItunesAlbum)),
            );
          } catch {
            return this.rememberArtist(mapItunesArtist(artist));
          }
        }),
      );
      return enriched.sort((left, right) => left.name.localeCompare(right.name));
    }

    const artists = await Promise.all(
      itunesArtists.map(async (artist) => {
        try {
          const imageUrl = await lookupArtistArtwork(artist.artistId);
          return this.rememberArtist(mapItunesArtist(artist, [], 0, imageUrl));
        } catch {
          return this.rememberArtist(mapItunesArtist(artist));
        }
      }),
    );

    return artists.sort((left, right) => left.name.localeCompare(right.name));
  }

  async getArtistById(id: string): Promise<Artist | undefined> {
    const numericId = id.trim();
    if (!numericId) return undefined;

    // Prefer iTunes for numeric IDs (and any id that lookup understands).
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
        return this.rememberSongs(tracks.map(mapItunesSong));
      } catch {
        return this.mock.getSongs(params);
      }
    }

    return this.mock.getSongs(params);
  }

  async getSongsByArtist(artistId: string, knownName?: string): Promise<Song[]> {
    let artistName = knownName ?? this.artistCache.get(artistId)?.name;

    if (!artistName) {
      try {
        const artists = await lookupArtistsByIds([artistId]);
        artistName = artists[0]?.artistName;
        if (artists[0]) {
          this.rememberArtist(mapItunesArtist(artists[0]));
        }
      } catch {
        artistName = undefined;
      }
    }

    if (artistName) {
      try {
        const tracks = await searchSongsByArtistName(artistName, 30);
        const ownTracks = tracks.filter((track) => String(track.artistId) === String(artistId));
        const selected = (ownTracks.length > 0 ? ownTracks : tracks).map(mapItunesSong);
        return this.rememberSongs(selected);
      } catch {
        // fall through
      }
    }

    return this.mock.getSongsByArtist(artistId);
  }

  async getSongById(id: string): Promise<Song | undefined> {
    return this.songCache.get(id) ?? this.mock.getSongById(id);
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

    const results: SearchResult[] = [];

    if (wantArtists) {
      try {
        const artists = await searchMusicArtists(q, 15);
        artists.forEach((artist) => {
          const mapped = this.rememberArtist(mapItunesArtist(artist));
          results.push({
            id: `result-artist-${mapped.id}`,
            type: 'artist',
            title: mapped.name,
            subtitle: artist.primaryGenreName ?? 'Artist',
            referenceId: mapped.id,
          });
        });
      } catch {
        // ignore and continue with mock results
      }
    }

    const mockResults = await this.mock.search(query, types);
    const withoutMockArtists = wantArtists
      ? mockResults.filter((item) => item.type !== 'artist')
      : mockResults;

    return [...results, ...withoutMockArtists];
  }
}

/** Singleton used throughout the app. */
export const lyricsRepository = new ItunesLyricsRepository();
