import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, requireAdmin } from '../middleware/auth';
import { searchArtists, searchSongs, getArtistTopTracks } from '../services/musicApi';
import {
  syncArtistFromPayload,
  syncArtistTopSongs,
  syncSongFromPayload,
} from '../services/syncService';
import { importFeaturedCatalog } from '../services/catalogImport';
import { prisma } from '../lib/config';

const router = Router();

router.use(requireAdmin);

router.get(
  '/music/search/artists',
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? '').trim();
    if (!query) {
      res.status(400).json({ success: false, message: 'Query is required' });
      return;
    }

    try {
      const results = await searchArtists(query);
      const externalIds = results.map((item) => item.externalApiId);
      const existing = await prisma.artist.findMany({
        where: { externalApiId: { in: externalIds } },
        select: { externalApiId: true },
      });
      const existingSet = new Set(existing.map((item) => item.externalApiId));

      res.json({
        success: true,
        results: results.map((item) => ({
          ...item,
          alreadyAdded: existingSet.has(item.externalApiId),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      if (message === 'RATE_LIMIT') {
        res.status(429).json({ success: false, message: 'Music service rate limit reached. Try again shortly.' });
        return;
      }
      res.status(502).json({ success: false, message: 'Unable to connect to music service.' });
    }
  }),
);

router.get(
  '/music/search/songs',
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? '').trim();
    if (!query) {
      res.status(400).json({ success: false, message: 'Query is required' });
      return;
    }

    try {
      const results = await searchSongs(query, {
        artistName: String(req.query.artistName ?? ''),
        album: String(req.query.album ?? ''),
        limit: Number(req.query.limit ?? 25) || 25,
      });
      const externalIds = results.map((item) => item.externalApiId);
      const existing = await prisma.song.findMany({
        where: { externalApiId: { in: externalIds } },
        select: { externalApiId: true },
      });
      const existingSet = new Set(existing.map((item) => item.externalApiId));

      res.json({
        success: true,
        results: results.map((item) => ({
          ...item,
          alreadyAdded: existingSet.has(item.externalApiId),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      if (message === 'RATE_LIMIT') {
        res.status(429).json({ success: false, message: 'Music service rate limit reached. Try again shortly.' });
        return;
      }
      res.status(502).json({ success: false, message: 'Unable to connect to music service.' });
    }
  }),
);

/** Top tracks for an artist — used after artist sync so admin can select songs to add. */
router.get(
  '/music/artists/:externalApiId/top',
  asyncHandler(async (req, res) => {
    const externalApiId = String(req.params.externalApiId ?? '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50) || 50, 1), 100);
    if (!externalApiId) {
      res.status(400).json({ success: false, message: 'Artist id is required' });
      return;
    }

    try {
      const results = await getArtistTopTracks(externalApiId, limit);
      const externalIds = results.map((item) => item.externalApiId);
      const existing = await prisma.song.findMany({
        where: { externalApiId: { in: externalIds } },
        select: { externalApiId: true },
      });
      const existingSet = new Set(existing.map((item) => item.externalApiId));

      res.json({
        success: true,
        results: results.map((item) => ({
          ...item,
          alreadyAdded: existingSet.has(item.externalApiId),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      if (message === 'RATE_LIMIT') {
        res.status(429).json({ success: false, message: 'Music service rate limit reached. Try again shortly.' });
        return;
      }
      res.status(502).json({ success: false, message: 'Unable to load artist tracks.' });
    }
  }),
);

router.post(
  '/artists/sync',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        externalApiId: z.string().min(1),
        name: z.string().optional(),
        imageUrl: z.string().url().optional().or(z.literal('')).optional(),
        genre: z.string().optional(),
        country: z.string().optional(),
        description: z.string().optional(),
        popularity: z.number().int().optional(),
        includeTopSongs: z.boolean().optional(),
        topSongLimit: z.number().int().min(1).max(100).optional(),
      })
      .parse(req.body);

    const result = await syncArtistFromPayload({
      ...body,
      imageUrl: body.imageUrl || undefined,
    });

    res.status(result.success ? 201 : 409).json(result);
  }),
);

/** Pull top tracks for an artist already in the DB (fills Songs page). */
router.post(
  '/artists/:id/sync-songs',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        topSongLimit: z.number().int().min(1).max(100).optional(),
      })
      .parse(req.body ?? {});

    const artist = await prisma.artist.findUnique({ where: { id: req.params.id } });
    if (!artist) {
      res.status(404).json({ success: false, message: 'Artist not found' });
      return;
    }

    try {
      const songs = await syncArtistTopSongs(artist, body.topSongLimit ?? 50);
      res.json({
        success: true,
        message:
          songs.added > 0
            ? `Imported ${songs.added} songs for ${artist.name}`
            : songs.total === 0
              ? 'No tracks found for this artist'
              : 'All top tracks already in library',
        artist,
        songs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN';
      if (message === 'RATE_LIMIT') {
        res.status(429).json({ success: false, message: 'Music service rate limit reached. Try again shortly.' });
        return;
      }
      res.status(502).json({ success: false, message: 'Unable to sync songs from music service.' });
    }
  }),
);

router.post(
  '/songs/sync',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        externalApiId: z.string().min(1),
        title: z.string().optional(),
        artistName: z.string().optional(),
        artistExternalId: z.string().optional(),
        albumTitle: z.string().optional(),
        albumExternalId: z.string().optional(),
        artworkUrl: z.string().url().optional().or(z.literal('')).optional(),
        releaseDate: z.string().optional(),
        releaseYear: z.number().int().optional(),
        duration: z.number().int().optional(),
        previewUrl: z.string().url().optional().or(z.literal('')).optional(),
        genre: z.string().optional(),
      })
      .parse(req.body);

    const result = await syncSongFromPayload({
      ...body,
      artworkUrl: body.artworkUrl || undefined,
      previewUrl: body.previewUrl || undefined,
    });

    res.status(result.success ? 201 : 409).json(result);
  }),
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [artistCount, songCount, recentArtists, recentSongs, userCount] = await Promise.all([
      prisma.artist.count(),
      prisma.song.count(),
      prisma.artist.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.song.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { artist: true } }),
      prisma.adminUser.count(),
    ]);

    res.json({
      success: true,
      stats: {
        totalArtists: artistCount,
        totalSongs: songCount,
        totalUsers: userCount,
        recentlyAddedArtists: recentArtists,
        recentlyAddedSongs: recentSongs,
      },
    });
  }),
);

/** Import the mobile app featured catalog so admin web mirrors the app library. */
router.post(
  '/catalog/import',
  asyncHandler(async (_req, res) => {
    const result = await importFeaturedCatalog();
    res.json({
      success: true,
      message: `Imported app catalog: +${result.artistsCreated} artists, +${result.songsCreated} songs`,
      result,
    });
  }),
);

export default router;
