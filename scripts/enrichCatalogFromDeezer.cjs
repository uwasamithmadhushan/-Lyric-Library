/**
 * One-shot: enrich curated catalog with Deezer top tracks + albums.
 * Usage: node scripts/enrichCatalogFromDeezer.mjs
 */
const fs = require('fs');
const path = require('path');

const artists = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'catalog-artists.json'), 'utf8'),
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function esc(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function yearFrom(date) {
  if (!date) return 0;
  const y = Number(String(date).slice(0, 4));
  return Number.isFinite(y) ? y : 0;
}

async function enrichArtist(name) {
  const search = await getJson(
    `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=5`,
  );
  const wanted = name.trim().toLowerCase();
  const ranked = (search.data ?? [])
    .filter((a) => a?.name)
    .sort((a, b) => {
      const aExact = a.name.toLowerCase() === wanted ? 1 : 0;
      const bExact = b.name.toLowerCase() === wanted ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return (b.nb_fan ?? 0) - (a.nb_fan ?? 0);
    });
  const artist = ranked[0];
  if (!artist?.id) {
    return { artist: name, songs: [], albums: [] };
  }

  const [top, albumsPayload] = await Promise.all([
    getJson(`https://api.deezer.com/artist/${artist.id}/top?limit=12`),
    getJson(`https://api.deezer.com/artist/${artist.id}/albums?limit=8`),
  ]);

  const songs = [];
  const seenSongs = new Set();
  for (const track of top.data ?? []) {
    const title = (track.title || '').trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seenSongs.has(key)) continue;
    seenSongs.add(key);
    songs.push(title);
  }

  const albums = [];
  for (const album of albumsPayload.data ?? []) {
    if (!album?.id || !album?.title) continue;
    // Skip obvious deluxe duplicates later by title key
    let tracks = [];
    try {
      const trackPayload = await getJson(
        `https://api.deezer.com/album/${album.id}/tracks?limit=30`,
      );
      tracks = (trackPayload.data ?? [])
        .map((t) => (t.title || '').trim())
        .filter(Boolean);
      await sleep(80);
    } catch {
      tracks = [];
    }

    albums.push({
      deezerId: String(album.id),
      name: album.title,
      year: yearFrom(album.release_date),
      songs: tracks,
    });

    for (const title of tracks.slice(0, 3)) {
      const key = title.toLowerCase();
      if (!seenSongs.has(key)) {
        seenSongs.add(key);
        if (songs.length < 16) songs.push(title);
      }
    }
  }

  // Prefer unique album names (drop "Deluxe" near-duplicates if base exists)
  const uniqueAlbums = [];
  const albumKeys = new Set();
  for (const album of albums) {
    const base = album.name
      .toLowerCase()
      .replace(/\s*[\(\[]?(deluxe|expanded|remaster(ed)?|anniversary).*?[\)\]]?/gi, '')
      .trim();
    if (albumKeys.has(base)) continue;
    albumKeys.add(base);
    uniqueAlbums.push(album);
    if (uniqueAlbums.length >= 6) break;
  }

  return {
    artist: name,
    songs: songs.slice(0, 12),
    albums: uniqueAlbums,
  };
}

async function mapPool(items, concurrency, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      process.stdout.write(`\r[${idx + 1}/${items.length}] ${items[idx].slice(0, 40).padEnd(40)}`);
      try {
        out[idx] = await worker(items[idx], idx);
      } catch (err) {
        console.error(`\nfail ${items[idx]}:`, err.message);
        out[idx] = { artist: items[idx], songs: [], albums: [] };
      }
      await sleep(120);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => run()));
  return out;
}

(async () => {
  const enriched = await mapPool(artists, 3, enrichArtist);
  fs.writeFileSync(
    path.join(__dirname, 'catalog-enriched.json'),
    JSON.stringify(enriched, null, 2),
  );

  const keepExistingIfEmpty = new Map();
  const rawSrc = fs.readFileSync('src/data/catalog/featuredCatalog.ts', 'utf8');
  for (const m of rawSrc.matchAll(
    /\{\s*artist:\s*'((?:\\'|[^'])+)',\s*songs:\s*\[([^\]]*)\]/g,
  )) {
    const name = m[1].replace(/\\'/g, "'");
    const songs = [...m[2].matchAll(/'((?:\\'|[^'])*)'/g)].map((x) =>
      x[1].replace(/\\'/g, "'"),
    );
    keepExistingIfEmpty.set(name.toLowerCase(), songs);
  }

  const lines = [];
  lines.push(`/**`);
  lines.push(` * Curated artist + song + album catalog used for Artists / Songs browse.`);
  lines.push(` * Songs/albums enriched from Deezer top charts (static snapshot).`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`export interface CatalogAlbum {`);
  lines.push(`  /** Deezer album id (used for cat-album: ids) */`);
  lines.push(`  deezerId?: string;`);
  lines.push(`  name: string;`);
  lines.push(`  year?: number;`);
  lines.push(`  songs: string[];`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export interface CatalogEntry {`);
  lines.push(`  artist: string;`);
  lines.push(`  songs: string[];`);
  lines.push(`  albums?: CatalogAlbum[];`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`const RAW_CATALOG: CatalogEntry[] = [`);

  for (const entry of enriched) {
    let songs = entry.songs;
    if (!songs.length) {
      songs = keepExistingIfEmpty.get(entry.artist.toLowerCase()) ?? [];
    }
    // Merge fallback songs in front if enrichment was thin
    const fallback = keepExistingIfEmpty.get(entry.artist.toLowerCase()) ?? [];
    const merged = [];
    const seen = new Set();
    for (const title of [...fallback, ...songs]) {
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(title);
      if (merged.length >= 12) break;
    }

    const albumLines = (entry.albums ?? [])
      .filter((a) => a.songs?.length)
      .map((a) => {
        const songLit = a.songs.map((s) => `'${esc(s)}'`).join(', ');
        const yearPart = a.year ? `, year: ${a.year}` : '';
        const idPart = a.deezerId ? `, deezerId: '${esc(a.deezerId)}'` : '';
        return `    { name: '${esc(a.name)}'${yearPart}${idPart}, songs: [${songLit}] }`;
      });

    const songLit = merged.map((s) => `'${esc(s)}'`).join(', ');
    if (albumLines.length) {
      lines.push(
        `  { artist: '${esc(entry.artist)}', songs: [${songLit}], albums: [\n${albumLines.join(',\n')}\n  ] },`,
      );
    } else {
      lines.push(`  { artist: '${esc(entry.artist)}', songs: [${songLit}] },`);
    }
  }

  lines.push(`];`);
  lines.push(``);

  // Keep helper section from existing file (from mergeCatalog onward)
  const helperStart = rawSrc.indexOf('function mergeCatalog');
  if (helperStart < 0) throw new Error('mergeCatalog not found');
  let helpers = rawSrc.slice(helperStart);

  // Update mergeCatalog to preserve albums
  helpers = helpers.replace(
    /function mergeCatalog\(entries: CatalogEntry\[\]\): CatalogEntry\[] \{[\s\S]*?\n\}/,
    `function mergeCatalog(entries: CatalogEntry[]): CatalogEntry[] {
  const byArtist = new Map<string, { songs: Set<string>; albums: CatalogAlbum[] }>();
  entries.forEach((entry) => {
    const key = entry.artist.trim();
    if (!byArtist.has(key)) byArtist.set(key, { songs: new Set(), albums: [] });
    const bucket = byArtist.get(key)!;
    entry.songs.forEach((song) => bucket.songs.add(song));
    (entry.albums ?? []).forEach((album) => {
      if (!bucket.albums.some((a) => a.name.toLowerCase() === album.name.toLowerCase())) {
        bucket.albums.push(album);
      }
    });
  });
  return Array.from(byArtist.entries())
    .map(([artist, data]) => ({
      artist,
      songs: Array.from(data.songs),
      albums: data.albums.length ? data.albums : undefined,
    }))
    .sort((a, b) => a.artist.localeCompare(b.artist));
}`,
  );

  // Patch buildLocalCatalogArtists songCount to include album songs? Keep songs.length
  // Add album helpers after getCatalogEntry if missing
  if (!helpers.includes('toCatalogAlbumId')) {
    helpers = helpers.replace(
      'export function getCatalogEntry(artistName: string): CatalogEntry | undefined {',
      `export const CATALOG_ALBUM_PREFIX = 'cat-album:';

export function toCatalogAlbumId(artistName: string, albumName: string): string {
  return \`\${CATALOG_ALBUM_PREFIX}\${encodeURIComponent(artistName)}:\${encodeURIComponent(albumName)}\`;
}

export function parseCatalogAlbumId(
  id: string,
): { artistName: string; albumName: string } | null {
  if (!id.startsWith(CATALOG_ALBUM_PREFIX)) return null;
  const payload = id.slice(CATALOG_ALBUM_PREFIX.length);
  const splitAt = payload.indexOf(':');
  if (splitAt < 0) return null;
  return {
    artistName: decodeURIComponent(payload.slice(0, splitAt)),
    albumName: decodeURIComponent(payload.slice(splitAt + 1)),
  };
}

export function getCatalogAlbum(
  artistName: string,
  albumName: string,
): CatalogAlbum | undefined {
  const entry = getCatalogEntry(artistName);
  const wanted = albumName.trim().toLowerCase();
  return entry?.albums?.find((album) => album.name.toLowerCase() === wanted);
}

export function getCatalogEntry(artistName: string): CatalogEntry | undefined {`,
    );
  }

  const out = `${lines.join('\n')}\n\n${helpers}`;
  fs.writeFileSync('src/data/catalog/featuredCatalog.ts', out);
  console.log(`\nDone. Artists: ${enriched.length}`);
  const withAlbums = enriched.filter((e) => (e.albums ?? []).length > 0).length;
  const avgSongs =
    enriched.reduce((s, e) => s + (e.songs?.length || 0), 0) / enriched.length;
  console.log(`With albums: ${withAlbums}, avg songs: ${avgSongs.toFixed(1)}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
