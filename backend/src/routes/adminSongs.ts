import { Router } from 'express';
import { asyncHandler, HttpError } from '../middleware/error.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  deleteSong,
  getSongById,
  listSongs,
  songSyncSchema,
  songUpdateSchema,
  syncSong,
  updateSong,
} from '../services/catalog.js';

export const adminSongsRouter = Router();
adminSongsRouter.use(requireAdmin);

adminSongsRouter.post(
  '/sync',
  asyncHandler(async (req, res) => {
    const parsed = songSyncSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid song data.', parsed.error.flatten());
    }
    const result = await syncSong(parsed.data);
    res.status(result.success ? 201 : 409).json(result);
  }),
);

adminSongsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const songs = await listSongs({
      query: req.query.query ? String(req.query.query) : undefined,
      artistId: req.query.artistId ? String(req.query.artistId) : undefined,
    });
    res.json({ success: true, songs });
  }),
);

adminSongsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const song = await getSongById(req.params.id);
    res.json({ success: true, song });
  }),
);

adminSongsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = songUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Invalid song update.', parsed.error.flatten());
    }
    const song = await updateSong(req.params.id, parsed.data);
    res.json({ success: true, message: 'Song updated.', song });
  }),
);

adminSongsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteSong(req.params.id);
    res.json({ success: true, message: 'Song deleted.' });
  }),
);
