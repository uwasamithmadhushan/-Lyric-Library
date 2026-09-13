# Lyric Library Backend

Shared REST API and SQLite database for the mobile app and admin dashboard.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev
```

API: `http://localhost:4000`

Default admin:

- Email: `admin@lyriclibrary.local`
- Password: `Admin123!`

## Environment

See `.env.example`. Music search uses the iTunes Search API from the backend. API keys stay on the server.

## Endpoints

Public (mobile):

- `GET /api/health`
- `GET /api/artists`
- `GET /api/artists/:id`
- `GET /api/songs`
- `GET /api/songs/:id`

Admin (Bearer JWT):

- `POST /api/admin/auth/login`
- `GET /api/admin/me`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/music/search/artists?query=`
- `GET /api/admin/music/search/songs?query=`
- `POST /api/admin/artists/sync`
- `POST /api/admin/songs/sync`
- `GET/PATCH/DELETE /api/admin/artists` and `.../songs`
