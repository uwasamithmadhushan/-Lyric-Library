import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { requireAdmin } from '../middleware/auth.js';
import { searchExternalArtists, searchExternalSongs } from '../services/musicApi.js';
import { markSearchDuplicates } from '../services/catalog.js';

export const adminMusicRouter = Router();

adminMusicRouter.use(requireAdmin);

adminMusicRouter.get(
  '/search/artists',
  asyncHandler(async (req, res) => {
    const query = String(req.query.query ?? '');
    const results = await searchExternalArtists(query);
    const withFlags = await markSearchDuplicates(results, 'artist');
    res.json({
      success: true,
      results: withFlags,
      message: withFlags.length ? undefined : 'No artists found.',
    });
  }),
);

adminMusicRouter.get(
  '/search/songs',
  asyncHandler(async (req, res) => {
    const results = await searchExternalSongs({
      query: String(req.query.query ?? ''),
      artistName: req.query.artistName ? String(req.query.artistName) : undefined,
      album: req.query.album ? String(req.query.album) : undefined,
      year: req.query.year ? String(req.query.year) : undefined,
    });
    const withFlags = await markSearchDuplicates(results, 'song');
    res.json({
      success: true,
      results: withFlags,
      message: withFlags.length ? undefined : 'No songs found.',
    });
  }),
);
