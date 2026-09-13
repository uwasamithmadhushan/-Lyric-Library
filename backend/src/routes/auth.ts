import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signAdminToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/error.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'Enter a valid email and password.', parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'ADMIN') {
      throw new HttpError(401, 'Invalid admin credentials.');
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, 'Invalid admin credentials.');
    }

    const token = signAdminToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);
