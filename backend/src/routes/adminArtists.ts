import { Router } from 'express';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  artistSyncSchema,
  artistUpdateSchema,
  deleteArtist,
  getArtistById,
  listArtists,
  syncArtist,
  updateArtist,
} from '../services/catalog.js';

export const adminArtistsRouter = Router();
adminArtistsRouter.use(requireAdmin);

adminArtistsRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const parsed = artistSyncSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid artist data.', parsed.error.flatten());
    }
    const result = await syncArtist(parsed.data);
    res.status(result.success ? 201 : 409).json(result);
  }),
);

adminArtistsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const artists = await listArtists(req.query.query ? String(req.query.query) : undefined);
    res.json({ success: true, artists });
  }),
);

adminArtistsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const artist = await getArtistById(req.params.id);
    res.json({ success: true, artist });
  }),
);

adminArtistsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = artistUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid artist update.', parsed.error.flatten());
    }
    const artist = await updateArtist(req.params.id, parsed.data);
    res.json({ success: true, message: 'Artist updated.', artist });
  }),
);

adminArtistsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteArtist(req.params.id);
    res.json({ success: true, message: 'Artist deleted.' });
  }),
);
