import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@lyriclibrary.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'Admin123!',
  musicApiBaseUrl: (process.env.MUSIC_API_BASE_URL ?? 'https://api.deezer.com').replace(/\/$/, ''),
  musicApiClientId: process.env.MUSIC_API_CLIENT_ID ?? '',
  musicApiClientSecret: process.env.MUSIC_API_CLIENT_SECRET ?? '',
};
