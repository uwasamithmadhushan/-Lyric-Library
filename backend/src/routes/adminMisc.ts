import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { getDashboardStats } from '../services/catalog.js';

export const adminMiscRouter = Router();
adminMiscRouter.use(requireAdmin);

adminMiscRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.admin });
  }),
);

adminMiscRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await getDashboardStats();
    res.json({ success: true, stats });
  }),
);

adminMiscRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users });
  }),
);
