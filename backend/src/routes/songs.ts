import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/config';
import { asyncHandler, requireAdmin } from '../middleware/auth';

const router = Router();

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

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? '').trim();
    const artistId = String(req.query.artistId ?? '').trim();
    const albumId = String(req.query.albumId ?? '').trim();

    const songs = await prisma.song.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  { title: { contains: query } },
                  { artist: { name: { contains: query } } },
                  { albumTitle: { contains: query } },
                ],
              }
            : {},
          artistId ? { artistId } : {},
          albumId ? { albumId } : {},
        ],
      },
      include: { artist: true },
      orderBy: { title: 'asc' },
    });

    res.json({ success: true, songs: songs.map(mapSong) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const song = await prisma.song.findUnique({
      where: { id: req.params.id },
      include: { artist: true },
    });
    if (!song) {
      res.status(404).json({ success: false, message: 'Song not found' });
      return;
    }
    res.json({ success: true, song: mapSong(song) });
  }),
);

router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        title: z.string().min(1).optional(),
        albumTitle: z.string().nullable().optional(),
        artworkUrl: z.string().url().nullable().optional(),
        releaseDate: z.string().nullable().optional(),
        releaseYear: z.number().int().nullable().optional(),
        previewUrl: z.string().url().nullable().optional(),
        genre: z.string().nullable().optional(),
        lyricsText: z.string().nullable().optional(),
      })
      .parse(req.body);

    const song = await prisma.song.update({
      where: { id: req.params.id },
      data: body,
      include: { artist: true },
    });

    res.json({ success: true, song: mapSong(song) });
  }),
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.song.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Song deleted' });
  }),
);

export default router;
