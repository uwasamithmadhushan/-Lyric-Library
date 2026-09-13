# Lyric Library

Monorepo for the Lyric Library platform:

```text
Lyric-Library/
├── mobile-app/          # Expo / React Native client
├── admin-dashboard/     # Admin web dashboard (Vite + React + Tailwind)
└── backend/             # Shared Express + Prisma API + SQLite database
```

## Architecture

```text
Admin Dashboard  →  Backend REST API  →  Deezer Music API
                           ↓
                     SQLite Database
                           ↓
              Lyric Library Mobile App
```

- External music API calls happen **only on the backend**
- API secrets stay in `backend/.env`
- Mobile app reads public catalog endpoints from the same backend

## Prerequisites

- Node.js 20+
- npm 10+

## 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Backend runs at [http://localhost:4000](http://localhost:4000).

Default admin login (from `.env`):

- Email: `admin@lyriclibrary.local`
- Password: `Admin123!`

### Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `4000`) |
| `JWT_SECRET` | Admin JWT signing secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin credentials |
| `MUSIC_API_BASE_URL` | Deezer base URL |
| `MUSIC_API_CLIENT_ID` / `MUSIC_API_CLIENT_SECRET` | Reserved for keyed APIs |
| `DATABASE_URL` | Prisma SQLite URL (`file:./dev.db`) |
| `CORS_ORIGIN` | Allowed frontend origins |

### Key endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/admin/music/search/artists?query=` | Admin |
| GET | `/api/admin/music/search/songs?query=` | Admin |
| POST | `/api/admin/artists/sync` | Admin |
| POST | `/api/admin/songs/sync` | Admin |
| GET | `/api/admin/stats` | Admin |
| GET | `/api/artists` | Public |
| GET | `/api/artists/:id` | Public |
| PATCH/DELETE | `/api/artists/:id` | Admin |
| GET | `/api/songs` | Public |
| GET | `/api/songs/:id` | Public |
| PATCH/DELETE | `/api/songs/:id` | Admin |

## 2) Admin Dashboard

```bash
cd admin-dashboard
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Test Artist Sync

1. Sign in with admin credentials
2. Open **Sync Music** → **Search Artists**
3. Search `Taylor Swift`
4. Preview → **Add Artist**
5. Confirm it appears under **Artists** and Dashboard stats

### Test Song Sync

1. Open **Sync Music** → **Search Songs**
2. Search `Anti-Hero` (artist optional: Taylor Swift)
3. Preview → **Add Song**
4. Confirm it appears under **Songs**

## 3) Mobile App

```bash
cd mobile-app
cp .env.example .env
npm install
npm run web
# or: npm start
```

Set:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

The mobile app merges:

1. Backend database content (admin-synced artists/songs)
2. Existing local curated catalog (offline-friendly fallback)

After syncing an artist/song in Admin, refresh the mobile Artists/Songs screens to see the new content.

## Development tips

- Run backend before admin sync flows
- Keep mobile and admin pointed at the same backend URL
- SQLite DB file: `backend/prisma/dev.db`
