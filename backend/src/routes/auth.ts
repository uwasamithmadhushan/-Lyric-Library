import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, env } from '../lib/config';
import { asyncHandler, requireAdmin, signAdminToken } from '../middleware/auth';

const router = Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    let admin = await prisma.adminUser.findUnique({ where: { email: body.email.toLowerCase() } });
    const isEnvAdmin = body.email.toLowerCase() === env.adminEmail.toLowerCase();

    // Bootstrap default admin from env on first login attempt.
    if (!admin && isEnvAdmin) {
      const passwordHash = await bcrypt.hash(env.adminPassword, 10);
      admin = await prisma.adminUser.create({
        data: {
          email: env.adminEmail.toLowerCase(),
          passwordHash,
          name: 'Lyric Admin',
        },
      });
    }

    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    let valid = await bcrypt.compare(body.password, admin.passwordHash);

    // If env admin password was changed, realign the stored hash (dev-friendly).
    if (!valid && isEnvAdmin && body.password === env.adminPassword) {
      const passwordHash = await bcrypt.hash(env.adminPassword, 10);
      admin = await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash },
      });
      valid = true;
    }

    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = signAdminToken({ sub: admin.id, email: admin.email, role: 'admin' });
    res.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  }),
);

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }
    res.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  }),
);

export default router;
