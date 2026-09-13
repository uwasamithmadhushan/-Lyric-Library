import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { prisma } from './prisma.js';
import { errorMiddleware } from './middleware/error.js';
import { seedAdminUser } from './seed.js';
import { authRouter } from './routes/auth.js';
import { adminMusicRouter } from './routes/adminMusic.js';
import { adminArtistsRouter } from './routes/adminArtists.js';
import { adminSongsRouter } from './routes/adminSongs.js';
import { adminMiscRouter } from './routes/adminMisc.js';
import { publicRouter } from './routes/publicCatalog.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'lyric-library-backend', status: 'ok' });
});

app.use('/api/admin/auth', authRouter);
app.use('/api/admin', adminMiscRouter);
app.use('/api/admin/music', adminMusicRouter);
app.use('/api/admin/artists', adminArtistsRouter);
app.use('/api/admin/songs', adminSongsRouter);
app.use('/api', publicRouter);

app.use(errorMiddleware);

async function start() {
  await seedAdminUser();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Lyric Library API running on http://localhost:${env.port}`);
  });
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
