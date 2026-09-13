import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { prisma } from './prisma.js';

export async function seedAdminUser() {
  const email = env.adminEmail;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name: env.adminName,
      role: 'ADMIN',
    },
  });
}
