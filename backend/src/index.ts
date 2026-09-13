import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { env, prisma } from './lib/config';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import artistRoutes from './routes/artists';
import songRoutes from './routes/songs';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigin.includes(origin) || env.nodeEnv === 'development') {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'lyric-library-backend', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/songs', songRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Invalid request data',
      errors: err.flatten(),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

async function start() {
  await prisma.$connect();
  app.listen(env.port, () => {
    console.log(`Lyric Library backend listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
