import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'lyric-library-dev-secret-change-in-production'),
  adminEmail: required('ADMIN_EMAIL', 'admin@lyriclibrary.local').toLowerCase(),
  adminPassword: required('ADMIN_PASSWORD', 'Admin123!'),
  adminName: process.env.ADMIN_NAME ?? 'Lyric Library Admin',
  musicApiBaseUrl: (process.env.MUSIC_API_BASE_URL ?? 'https://itunes.apple.com').replace(/\/$/, ''),
  musicApiClientId: process.env.MUSIC_API_CLIENT_ID ?? '',
  musicApiClientSecret: process.env.MUSIC_API_CLIENT_SECRET ?? '',
  deezerApiBaseUrl: (process.env.DEEZER_API_BASE_URL ?? 'https://api.deezer.com').replace(/\/$/, ''),
};
