import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const catalogPath = join(root, 'mobile-app/src/data/catalog/featuredCatalog.ts');
const outDir = join(root, 'backend/data');
const outFile = join(outDir, 'featured-catalog.json');

const mod = await import(pathToFileURL(catalogPath).href);
const payload = mod.FEATURED_CATALOG.map((entry) => ({
  artist: entry.artist,
  songs: entry.songs,
  albums: (entry.albums ?? []).map((album) => ({
    name: album.name,
    year: album.year,
    deezerId: album.deezerId,
    songs: album.songs,
  })),
}));

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(payload));
console.log(
  'Wrote',
  outFile,
  'artists=',
  payload.length,
  'songs=',
  payload.reduce((n, e) => n + e.songs.length, 0),
);
