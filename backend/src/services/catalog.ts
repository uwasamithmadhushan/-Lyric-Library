import { z } from 'zod';
import { prisma } from '../prisma.js';
import { HttpError } from '../middleware/error.js';

export const artistSyncSchema = z.object({
  externalApiId: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  genre: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  popularity: z.number().int().optional(),
});

export const songSyncSchema = z.object({
  externalApiId: z.string().min(1),
  title: z.string().min(1),
  artistName: z.string().min(1),
  artistExternalId: z.string().min(1),
  album: z.string().optional(),
  albumImageUrl: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  releaseDate: z.string().optional(),
  duration: z.number().int().optional(),
  previewUrl: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
  genre: z.string().optional(),
  lyrics: z.string().optional(),
  artistImageUrl: z.string().optional().or(z.literal('')).transform((v) => v || undefined),
});

export const artistUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const songUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  album: z.string().nullable().optional(),
  albumImageUrl: z.string().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  previewUrl: z.string().nullable().optional(),
  lyrics: z.string().nullable().optional(),
  genre: z.string().nullable().optional(),
});

function toArtistDto(artist: {
  id: string;
  externalApiId: string;
  name: string;
  imageUrl: string | null;
  genre: string | null;
  country: string | null;
  description: string | null;
  popularity: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { songs: number };
  songs?: Array<{ id: string }>;
}) {
  return {
    id: artist.id,
    publicId: `ll-artist:${artist.id}`,
    externalApiId: artist.externalApiId,
    name: artist.name,
    imageUrl: artist.imageUrl,
    genre: artist.genre,
    country: artist.country,
    description: artist.description,
    popularity: artist.popularity,
    songCount: artist._count?.songs ?? artist.songs?.length ?? 0,
    createdAt: artist.createdAt,
    updatedAt: artist.updatedAt,
  };
}

function toSongDto(song: {
  id: string;
  externalApiId: string;
  title: string;
  artistId: string;
  album: string | null;
  albumImageUrl: string | null;
  releaseDate: string | null;
  duration: number | null;
  previewUrl: string | null;
  lyrics: string | null;
  genre: string | null;
  createdAt: Date;
  updatedAt: Date;
  artist: { id: string; name: string; imageUrl: string | null };
}) {
  return {
    id: song.id,
    publicId: `ll-song:${song.id}`,
    externalApiId: song.externalApiId,
    title: song.title,
    artistId: song.artistId,
    artistPublicId: `ll-artist:${song.artistId}`,
    artistName: song.artist.name,
    album: song.album,
    albumImageUrl: song.albumImageUrl,
    releaseDate: song.releaseDate,
    duration: song.duration,
    previewUrl: song.previewUrl,
    lyrics: song.lyrics,
    genre: song.genre,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  };
}

export async function listArtists(query?: string) {
  const artists = await prisma.artist.findMany({
    where: query?.trim()
      ? { name: { contains: query.trim() } }
      : undefined,
    include: { _count: { select: { songs: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return artists.map(toArtistDto);
}

export async function getArtistById(id: string) {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: { _count: { select: { songs: true } }, songs: { orderBy: { title: 'asc' } } },
  });
  if (!artist) throw new HttpError(404, 'Artist not found.');
  return {
    ...toArtistDto(artist),
    songs: artist.songs.map((song) => ({
      id: song.id,
      publicId: `ll-song:${song.id}`,
      title: song.title,
      album: song.album,
      albumImageUrl: song.albumImageUrl,
    })),
  };
}

export async function listSongs(params?: { query?: string; artistId?: string }) {
  const songs = await prisma.song.findMany({
    where: {
      AND: [
        params?.query?.trim()
          ? {
              OR: [
                { title: { contains: params.query.trim() } },
                { album: { contains: params.query.trim() } },
                { artist: { name: { contains: params.query.trim() } } },
              ],
            }
          : {},
        params?.artistId ? { artistId: params.artistId } : {},
      ],
    },
    include: { artist: true },
    orderBy: { createdAt: 'desc' },
  });
  return songs.map(toSongDto);
}

export async function getSongById(id: string) {
  const song = await prisma.song.findUnique({
    where: { id },
    include: { artist: true },
  });
  if (!song) throw new HttpError(404, 'Song not found.');
  return toSongDto(song);
}

export async function syncArtist(input: z.infer<typeof artistSyncSchema>) {
  const existing = await prisma.artist.findFirst({
    where: {
      OR: [
        { externalApiId: input.externalApiId },
        { name: input.name },
      ],
    },
    include: { _count: { select: { songs: true } } },
  });

  if (existing) {
    return {
      success: false as const,
      message: 'Artist already exists',
      alreadyExists: true,
      artist: toArtistDto(existing),
    };
  }

  const created = await prisma.artist.create({
    data: {
      externalApiId: input.externalApiId,
      name: input.name,
      imageUrl: input.imageUrl,
      genre: input.genre,
      country: input.country,
      description: input.description,
      popularity: input.popularity,
    },
    include: { _count: { select: { songs: true } } },
  });

  return {
    success: true as const,
    message: 'Artist added successfully',
    artist: toArtistDto(created),
  };
}

async function ensureArtistForSong(input: z.infer<typeof songSyncSchema>) {
  const existing = await prisma.artist.findFirst({
    where: {
      OR: [{ externalApiId: input.artistExternalId }, { name: input.artistName }],
    },
  });
  if (existing) return existing;

  return prisma.artist.create({
    data: {
      externalApiId: input.artistExternalId,
      name: input.artistName,
      imageUrl: input.artistImageUrl ?? input.albumImageUrl,
      genre: input.genre,
    },
  });
}

export async function syncSong(input: z.infer<typeof songSyncSchema>) {
  const duplicate = await prisma.song.findFirst({
    where: {
      OR: [
        { externalApiId: input.externalApiId },
        {
          title: input.title,
          artist: { name: input.artistName },
        },
      ],
    },
    include: { artist: true },
  });

  if (duplicate) {
    return {
      success: false as const,
      message: 'This song has already been added.',
      alreadyExists: true,
      song: toSongDto(duplicate),
    };
  }

  const artist = await ensureArtistForSong(input);
  const created = await prisma.song.create({
    data: {
      externalApiId: input.externalApiId,
      title: input.title,
      artistId: artist.id,
      album: input.album,
      albumImageUrl: input.albumImageUrl,
      releaseDate: input.releaseDate,
      duration: input.duration,
      previewUrl: input.previewUrl,
      lyrics: input.lyrics,
      genre: input.genre,
    },
    include: { artist: true },
  });

  return {
    success: true as const,
    message: 'Song added successfully',
    song: toSongDto(created),
  };
}

export async function updateArtist(id: string, input: z.infer<typeof artistUpdateSchema>) {
  const artist = await prisma.artist.update({
    where: { id },
    data: input,
    include: { _count: { select: { songs: true } } },
  });
  return toArtistDto(artist);
}

export async function deleteArtist(id: string) {
  await prisma.artist.delete({ where: { id } });
}

export async function updateSong(id: string, input: z.infer<typeof songUpdateSchema>) {
  const song = await prisma.song.update({
    where: { id },
    data: input,
    include: { artist: true },
  });
  return toSongDto(song);
}

export async function deleteSong(id: string) {
  await prisma.song.delete({ where: { id } });
}

export async function getDashboardStats() {
  const [artistCount, songCount, userCount, recentArtists, recentSongs] = await Promise.all([
    prisma.artist.count(),
    prisma.song.count(),
    prisma.user.count(),
    prisma.artist.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { _count: { select: { songs: true } } },
    }),
    prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { artist: true },
    }),
  ]);

  return {
    artistCount,
    songCount,
    userCount,
    recentArtists: recentArtists.map(toArtistDto),
    recentSongs: recentSongs.map(toSongDto),
  };
}

export async function markSearchDuplicates<T extends { externalApiId: string }>(
  items: T[],
  type: 'artist' | 'song',
) {
  if (items.length === 0) return [];
  const ids = items.map((item) => item.externalApiId);
  const existing =
    type === 'artist'
      ? await prisma.artist.findMany({ where: { externalApiId: { in: ids } }, select: { externalApiId: true } })
      : await prisma.song.findMany({ where: { externalApiId: { in: ids } }, select: { externalApiId: true } });
  const set = new Set(existing.map((row) => row.externalApiId));
  return items.map((item) => ({ ...item, alreadyAdded: set.has(item.externalApiId) }));
}
