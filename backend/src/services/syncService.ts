import { prisma } from '../lib/config';
import type { MusicArtistResult, MusicSongResult } from './musicApi';
import {
  getArtistByExternalId,
  getArtistTopTracks,
  getSongByExternalId,
} from './musicApi';

const DEFAULT_TOP_SONG_LIMIT = 50;

export async function syncArtistTopSongs(
  artist: { id: string; externalApiId: string | null; name: string },
  limit = DEFAULT_TOP_SONG_LIMIT,
) {
  if (!artist.externalApiId || artist.externalApiId.startsWith('name:')) {
    return { added: 0, skipped: 0, total: 0 };
  }

  const tracks = await getArtistTopTracks(artist.externalApiId, limit);
  let added = 0;
  let skipped = 0;

  for (const track of tracks) {
    const result = await syncSongFromPayload({
      externalApiId: track.externalApiId,
      title: track.title,
      artistName: artist.name,
      artistExternalId: artist.externalApiId,
      albumTitle: track.albumTitle,
      albumExternalId: track.albumExternalId,
      artworkUrl: track.artworkUrl,
      releaseDate: track.releaseDate,
      releaseYear: track.releaseYear,
      duration: track.duration,
      previewUrl: track.previewUrl,
      genre: track.genre,
    });
    if (result.success) added += 1;
    else skipped += 1;
  }

  return { added, skipped, total: tracks.length };
}

export async function syncArtistFromPayload(input: {
  externalApiId: string;
  name?: string;
  imageUrl?: string;
  genre?: string;
  country?: string;
  description?: string;
  popularity?: number;
  includeTopSongs?: boolean;
  topSongLimit?: number;
}) {
  const existing = await prisma.artist.findUnique({
    where: { externalApiId: input.externalApiId },
  });
  if (existing) {
    return { success: false as const, message: 'Artist already exists', artist: existing };
  }

  const remote = await getArtistByExternalId(input.externalApiId).catch(() => null);
  const data: MusicArtistResult = {
    externalApiId: input.externalApiId,
    name: input.name || remote?.name || 'Unknown Artist',
    imageUrl: input.imageUrl ?? remote?.imageUrl,
    genre: input.genre ?? remote?.genre,
    country: input.country ?? remote?.country,
    description: input.description ?? remote?.description,
    popularity: input.popularity ?? remote?.popularity,
  };

  const artist = await prisma.artist.create({
    data: {
      externalApiId: data.externalApiId,
      name: data.name,
      imageUrl: data.imageUrl,
      genre: data.genre,
      country: data.country,
      description: data.description,
      popularity: data.popularity,
    },
  });

  const includeTopSongs = input.includeTopSongs === true;
  const songs = includeTopSongs
    ? await syncArtistTopSongs(artist, input.topSongLimit ?? DEFAULT_TOP_SONG_LIMIT).catch(() => ({
        added: 0,
        skipped: 0,
        total: 0,
      }))
    : { added: 0, skipped: 0, total: 0 };

  return {
    success: true as const,
    message:
      songs.added > 0
        ? `Artist added with ${songs.added} songs`
        : 'Artist added successfully',
    artist,
    songs,
  };
}

export async function syncSongFromPayload(input: {
  externalApiId: string;
  title?: string;
  artistName?: string;
  artistExternalId?: string;
  albumTitle?: string;
  albumExternalId?: string;
  artworkUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  duration?: number;
  previewUrl?: string;
  genre?: string;
}) {
  const existing = await prisma.song.findUnique({
    where: { externalApiId: input.externalApiId },
    include: { artist: true },
  });
  if (existing) {
    return { success: false as const, message: 'Song already exists', song: existing };
  }

  const remote = await getSongByExternalId(input.externalApiId).catch(() => null);
  const data: MusicSongResult = {
    externalApiId: input.externalApiId,
    title: input.title || remote?.title || 'Untitled',
    artistName: input.artistName || remote?.artistName || 'Unknown Artist',
    artistExternalId: input.artistExternalId ?? remote?.artistExternalId,
    albumTitle: input.albumTitle ?? remote?.albumTitle,
    albumExternalId: input.albumExternalId ?? remote?.albumExternalId,
    artworkUrl: input.artworkUrl ?? remote?.artworkUrl,
    releaseDate: input.releaseDate ?? remote?.releaseDate,
    releaseYear: input.releaseYear ?? remote?.releaseYear,
    duration: input.duration ?? remote?.duration,
    previewUrl: input.previewUrl ?? remote?.previewUrl,
    genre: input.genre ?? remote?.genre,
  };

  let artist =
    (data.artistExternalId
      ? await prisma.artist.findUnique({ where: { externalApiId: data.artistExternalId } })
      : null) ??
    (await prisma.artist.findFirst({
      where: { name: data.artistName },
    }));

  if (!artist) {
    const created = await syncArtistFromPayload({
      externalApiId: data.artistExternalId ?? `name:${data.artistName.toLowerCase()}`,
      name: data.artistName,
      imageUrl: data.artworkUrl,
      includeTopSongs: false,
    });
    artist = created.artist;
  }

  let albumId: string | undefined;
  if (data.albumTitle) {
    const album =
      (data.albumExternalId
        ? await prisma.album.findUnique({ where: { externalApiId: data.albumExternalId } })
        : null) ??
      (await prisma.album.findFirst({
        where: { artistId: artist.id, title: data.albumTitle },
      }));

    if (album) {
      albumId = album.id;
    } else {
      const createdAlbum = await prisma.album.create({
        data: {
          externalApiId: data.albumExternalId,
          title: data.albumTitle,
          artistId: artist.id,
          artworkUrl: data.artworkUrl,
          releaseYear: data.releaseYear,
        },
      });
      albumId = createdAlbum.id;
    }
  }

  const song = await prisma.song.create({
    data: {
      externalApiId: data.externalApiId,
      title: data.title,
      artistId: artist.id,
      albumId,
      albumTitle: data.albumTitle,
      artworkUrl: data.artworkUrl,
      releaseDate: data.releaseDate,
      releaseYear: data.releaseYear,
      duration: data.duration,
      previewUrl: data.previewUrl,
      genre: data.genre,
    },
    include: { artist: true, album: true },
  });

  return { success: true as const, message: 'Song added successfully', song };
}
