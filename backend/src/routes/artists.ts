import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/config';
import { asyncHandler, requireAdmin } from '../middleware/auth';

const router = Router();

function mapArtist(artist: {
  id: string;
  externalApiId: string | null;
  name: string;
  imageUrl: string | null;
  genre: string | null;
  country: string | null;
  description: string | null;
  popularity: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { songs: number; albums: number };
  songs?: unknown[];
  albums?: Array<{
    id: string;
    title: string;
    artworkUrl: string | null;
    releaseYear: number | null;
    _count?: { songs: number };
  }>;
}) {
  const songCount = artist._count?.songs ?? artist.songs?.length ?? 0;
  return {
    id: artist.id,
    externalApiId: artist.externalApiId,
    name: artist.name,
    imageUrl: artist.imageUrl ?? undefined,
    genre: artist.genre ?? undefined,
    country: artist.country ?? undefined,
    description: artist.description ?? undefined,
    popularity: artist.popularity ?? undefined,
    songCount,
    albums: (artist.albums ?? []).map((album) => ({
      id: album.id,
      title: album.title,
      artistId: artist.id,
      artistName: artist.name,
      releaseYear: album.releaseYear ?? 0,
      songCount: album._count?.songs ?? 0,
      artworkUrl: album.artworkUrl ?? undefined,
    })),
    createdAt: artist.createdAt,
    updatedAt: artist.updatedAt,
  };
}

function mapSong(song: {
  id: string;
  externalApiId: string | null;
  title: string;
  artistId: string;
  albumId: string | null;
  albumTitle: string | null;
  artworkUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  duration: number | null;
  previewUrl: string | null;
  genre: string | null;
  lyricsText: string | null;
  createdAt: Date;
  updatedAt: Date;
  artist?: { id: string; name: string };
}) {
  return {
    id: song.id,
    externalApiId: song.externalApiId,
    title: song.title,
    artistId: song.artistId,
    artistName: song.artist?.name ?? 'Unknown',
    albumId: song.albumId ?? undefined,
    albumTitle: song.albumTitle ?? undefined,
    artworkUrl: song.artworkUrl ?? undefined,
    releaseDate: song.releaseDate ?? undefined,
    releaseYear: song.releaseYear ?? undefined,
    duration: song.duration ?? undefined,
    previewUrl: song.previewUrl ?? undefined,
    genre: song.genre ?? undefined,
    lyricsText: song.lyricsText ?? undefined,
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
  };
}

/** Public mobile + admin read endpoints */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? '').trim();
    const startsWith = String(req.query.startsWith ?? '').trim();

    const artists = await prisma.artist.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { name: { contains: query } },
                  { songs: { some: { title: { contains: query } } } },
                ],
              }
            : {},
          startsWith ? { name: { startsWith } } : {},
        ],
      },
      include: { _count: { select: { songs: true, albums: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, artists: artists.map(mapArtist) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const artist = await prisma.artist.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { songs: true, albums: true } },
        albums: {
          include: { _count: { select: { songs: true } } },
          orderBy: { releaseYear: 'desc' },
        },
        songs: { orderBy: { title: 'asc' }, take: 50 },
      },
    });

    if (!artist) {
      res.status(404).json({ success: false, message: 'Artist not found' });
      return;
    }

    res.json({
      success: true,
      artist: {
        ...mapArtist(artist),
        popularSongs: artist.songs.map(mapSong),
      },
    });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).optional(),
        imageUrl: z.string().url().nullable().optional(),
        genre: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
      .parse(req.body);

    const artist = await prisma.artist.update({
      where: { id: req.params.id },
      data: body,
      include: { _count: { select: { songs: true, albums: true } } },
    });

    res.json({ success: true, artist: mapArtist(artist) });
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.artist.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Artist deleted' });
  }),
);

export default router;
