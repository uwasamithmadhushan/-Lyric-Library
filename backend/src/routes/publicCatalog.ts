import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { getArtistById, getSongById, listArtists, listSongs } from '../services/catalog.js';

export const publicRouter = Router();

publicRouter.get(
  '/artists',
  asyncHandler(async (req, res) => {
    const artists = await listArtists(req.query.query ? String(req.query.query) : undefined);
    res.json({ success: true, artists });
  }),
);

publicRouter.get(
  '/artists/:id',
  asyncHandler(async (req, res) => {
    const artist = await getArtistById(req.params.id);
    res.json({ success: true, artist });
  }),
);

publicRouter.get(
  '/songs',
  asyncHandler(async (req, res) => {
    const songs = await listSongs({
      query: req.query.query ? String(req.query.query) : undefined,
      artistId: req.query.artistId ? String(req.query.artistId) : undefined,
    });
    res.json({ success: true, songs });
  }),
);

publicRouter.get(
  '/songs/:id',
  asyncHandler(async (req, res) => {
    const song = await getSongById(req.params.id);
    res.json({ success: true, song });
  }),
);
