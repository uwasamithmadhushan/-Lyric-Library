/**
 * Rebuild featuredCatalog.ts from catalog-enriched.json (clean, no broken strings).
 * Usage: node scripts/rebuildCatalogFromEnriched.cjs
 */
const fs = require('fs');
const path = require('path');

const enriched = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'catalog-enriched.json'), 'utf8'),
);

const ORIGINAL_FALLBACK = {
  'Taylor Swift': ['Blank Space', 'Cruel Summer', 'Anti-Hero'],
  'The Weeknd': ['Blinding Lights', 'Starboy', 'Save Your Tears'],
  'Bruno Mars': [
    'Just the Way You Are',
    'Uptown Funk',
    'Locked Out of Heaven',
    'Grenade',
    '24K Magic',
    'When I Was Your Man',
  ],
  'Ariana Grande': ['7 rings', 'thank u, next', 'Into You'],
  'Billie Eilish': ['bad guy', 'lovely', 'BIRDS OF A FEATHER'],
  Drake: ["God's Plan", 'One Dance', 'Hotline Bling'],
  'Justin Bieber': ['Sorry', 'Love Yourself', 'Baby'],
  'Ed Sheeran': ['Perfect', 'Shape of You', 'Photograph'],
  Rihanna: ['Diamonds', 'Umbrella', 'We Found Love'],
  'Lady Gaga': ['Poker Face', 'Bad Romance', 'Shallow'],
  Beyoncé: ['Halo', 'Crazy in Love', 'Single Ladies'],
  Eminem: ['Lose Yourself', 'Mockingbird', 'Without Me'],
  Adele: ['Hello', 'Someone Like You', 'Rolling in the Deep'],
  'Dua Lipa': ['Levitating', 'New Rules', "Don't Start Now"],
  'Bad Bunny': ['Tití Me Preguntó', 'Moscow Mule', 'DtMF'],
  'Kendrick Lamar': ['HUMBLE.', 'DNA.', 'Not Like Us'],
  SZA: ['Kill Bill', 'Snooze', 'Good Days'],
  'Post Malone': ['Circles', 'Sunflower', 'Rockstar'],
  'Harry Styles': ['As It Was', 'Watermelon Sugar', 'Sign of the Times'],
  'Miley Cyrus': ['Flowers', 'Wrecking Ball', 'Party in the U.S.A.'],
  'Selena Gomez': ['Lose You to Love Me', 'Wolves', 'Hands to Myself', 'Rare', 'Good for You'],
  'Katy Perry': ['Firework', 'Roar', 'Dark Horse'],
  'Maroon 5': ['Sugar', 'Girls Like You', 'Memories', 'This Love', 'Payphone'],
  Coldplay: ['Yellow', 'Viva La Vida', 'A Sky Full of Stars'],
  'Imagine Dragons': ['Believer', 'Thunder', 'Demons'],
  OneRepublic: ['Counting Stars', 'Apologize', "I Ain't Worried"],
  'Shawn Mendes': ['Treat You Better', 'Stitches', "There's Nothing Holdin' Me Back"],
  'Camila Cabello': ['Havana', 'Señorita', 'Never Be the Same'],
  'Olivia Rodrigo': ['drivers license', 'good 4 u', 'vampire'],
  'Sabrina Carpenter': ['Espresso', 'Please Please Please', 'Taste'],
  'Doja Cat': ['Say So', 'Woman', 'Paint The Town Red'],
  'Nicki Minaj': ['Super Bass', 'Starships', 'Anaconda'],
  'Cardi B': ['Bodak Yellow', 'I Like It', 'WAP'],
  'Travis Scott': ['SICKO MODE', 'Goosebumps', 'Highest in the Room'],
  Future: ['Mask Off', 'Life Is Good', 'Wait for U'],
  'Metro Boomin': ["Creepin'", 'Superhero', 'Am I Dreaming'],
  '21 Savage': ['a lot', 'Bank Account', 'redrum'],
  'J. Cole': ['No Role Modelz', 'Middle Child', 'Wet Dreamz'],
  'Nick Jonas': ['Jealous', 'Chains', 'Close'],
  'Jonas Brothers': ['Sucker', "Burnin' Up", 'What a Man Gotta Do'],
  BTS: ['Dynamite', 'Butter', 'Boy With Luv'],
  BLACKPINK: ['DDU-DU DDU-DU', 'How You Like That', 'Kill This Love'],
  Jungkook: ['Seven', 'Standing Next to You', '3D'],
  Jimin: ['Like Crazy', 'Who', 'Set Me Free Pt.2'],
  V: ['Love Me Again', 'Slow Dancing', 'FRI(END)S'],
  ROSÉ: ['APT.', 'On The Ground', 'Gone'],
  Jennie: ['SOLO', 'Mantra', 'like JENNIE'],
  Lisa: ['MONEY', 'LALISA', 'Rockstar'],
  TWICE: ['What Is Love?', 'TT', 'Feel Special'],
  NewJeans: ['Hype Boy', 'Super Shy', 'OMG'],
  Shakira: ["Hips Don't Lie", 'Waka Waka', 'Whenever, Wherever'],
  'Jennifer Lopez': ['On the Floor', "Love Don't Cost a Thing", 'Jenny from the Block'],
  "Guns N' Roses": ["Sweet Child o' Mine", 'November Rain', 'Paradise City'],
  Fergie: ["Big Girls Don't Cry", 'Glamorous', 'Fergalicious'],
  Maneskin: ["Beggin'", 'I WANNA BE YOUR SLAVE', 'The Loneliest'],
  'Gracie Abrams': ["That's So True", "I miss you, I'm sorry", 'Close to You'],
  'James Arthur': ["Say You Won't Let Go", 'Impossible', "Car's Outside"],
  'Norah Jones': ["Don't Know Why", 'Come Away With Me', 'Sunrise'],
  'Ricky Martin': ["Livin' la Vida Loca", 'La Copa de la Vida', "Vente Pa' Ca"],
  'Elvis Presley': ["Can't Help Falling in Love", 'Jailhouse Rock', 'Hound Dog'],
  'The Rolling Stones': ["(I Can't Get No) Satisfaction", 'Paint It Black', 'Angie'],
};

function esc(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function isNoiseAlbum(title) {
  return /commentary|instrumental|track by track|remix ep|karaoke|acoustic collection|live at|sessions/i.test(
    title,
  );
}

function mergeSongs(artist, deezerSongs) {
  const out = [];
  const seen = new Set();
  for (const title of [...(ORIGINAL_FALLBACK[artist] || []), ...(deezerSongs || [])]) {
    const cleaned = String(title || '').trim();
    if (!cleaned || cleaned.length < 2) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= 12) break;
  }
  return out;
}

function pickAlbums(albums) {
  const unique = [];
  const keys = new Set();
  for (const album of albums || []) {
    if (!album?.name || !album.songs?.length) continue;
    if (isNoiseAlbum(album.name)) continue;
    const base = album.name
      .toLowerCase()
      .replace(/\s*[\(\[]?(deluxe|expanded|remaster(ed)?|anniversary|complete edition|scary hours).*$/i, '')
      .trim();
    if (keys.has(base)) continue;
    keys.add(base);
    unique.push(album);
    if (unique.length >= 6) break;
  }
  return unique;
}

// Ensure Guns N' Roses present
const names = new Set(enriched.map((e) => e.artist.toLowerCase()));
if (!names.has("guns n' roses")) {
  enriched.push({
    artist: "Guns N' Roses",
    songs: ["Sweet Child o' Mine", 'November Rain', 'Paradise City', "Don't Cry", 'Welcome to the Jungle'],
    albums: [],
  });
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
  const songs = mergeSongs(entry.artist, entry.songs);
  const albums = pickAlbums(entry.albums);
  const songLit = songs.map((s) => `'${esc(s)}'`).join(', ');

  if (!albums.length) {
    lines.push(`  { artist: '${esc(entry.artist)}', songs: [${songLit}] },`);
    continue;
  }

  lines.push(`  { artist: '${esc(entry.artist)}', songs: [${songLit}], albums: [`);
  for (const album of albums) {
    const yearPart = album.year ? `, year: ${album.year}` : '';
    const idPart = album.deezerId ? `, deezerId: '${esc(album.deezerId)}'` : '';
    const tracks = album.songs.map((s) => `'${esc(s)}'`).join(', ');
    lines.push(
      `    { name: '${esc(album.name)}'${yearPart}${idPart}, songs: [${tracks}] },`,
    );
  }
  lines.push(`  ] },`);
}

lines.push(`];`);
lines.push(``);
lines.push(`function mergeCatalog(entries: CatalogEntry[]): CatalogEntry[] {`);
lines.push(`  const byArtist = new Map<string, { songs: Set<string>; albums: CatalogAlbum[] }>();`);
lines.push(`  entries.forEach((entry) => {`);
lines.push(`    const key = entry.artist.trim();`);
lines.push(`    if (!byArtist.has(key)) byArtist.set(key, { songs: new Set(), albums: [] });`);
lines.push(`    const bucket = byArtist.get(key)!;`);
lines.push(`    entry.songs.forEach((song) => bucket.songs.add(song));`);
lines.push(`    (entry.albums ?? []).forEach((album) => {`);
lines.push(
  `      if (!bucket.albums.some((a) => a.name.toLowerCase() === album.name.toLowerCase())) {`,
);
lines.push(`        bucket.albums.push(album);`);
lines.push(`      }`);
lines.push(`    });`);
lines.push(`  });`);
lines.push(`  return Array.from(byArtist.entries())`);
lines.push(`    .map(([artist, data]) => ({`);
lines.push(`      artist,`);
lines.push(`      songs: Array.from(data.songs),`);
lines.push(`      albums: data.albums.length ? data.albums : undefined,`);
lines.push(`    }))`);
lines.push(`    .sort((a, b) => a.artist.localeCompare(b.artist));`);
lines.push(`}`);
lines.push(``);
lines.push(`export const FEATURED_CATALOG = mergeCatalog(RAW_CATALOG);`);
lines.push(``);
lines.push(`export const CATALOG_ARTIST_NAMES = FEATURED_CATALOG.map((entry) => entry.artist);`);
lines.push(``);
lines.push(`export const CATALOG_SONG_QUERIES = FEATURED_CATALOG.flatMap((entry) =>`);
lines.push(`  entry.songs.map((song) => \`\${song} \${entry.artist}\`),`);
lines.push(`);`);
lines.push(``);
lines.push(`export const HOME_FEATURED_SONGS = [`);
lines.push(`  { title: 'Anti-Hero', artist: 'Taylor Swift' },`);
lines.push(`  { title: 'Cruel Summer', artist: 'Taylor Swift' },`);
lines.push(`  { title: 'Blinding Lights', artist: 'The Weeknd' },`);
lines.push(`  { title: 'Espresso', artist: 'Sabrina Carpenter' },`);
lines.push(`  { title: 'Flowers', artist: 'Miley Cyrus' },`);
lines.push(`  { title: 'Levitating', artist: 'Dua Lipa' },`);
lines.push(`  { title: 'Hello', artist: 'Adele' },`);
lines.push(`  { title: 'Shape of You', artist: 'Ed Sheeran' },`);
lines.push(`] as const;`);
lines.push(``);
lines.push(`export const CATALOG_ARTIST_PREFIX = 'cat-artist:';`);
lines.push(`export const CATALOG_SONG_PREFIX = 'cat-song:';`);
lines.push(`export const CATALOG_ALBUM_PREFIX = 'cat-album:';`);
lines.push(``);
lines.push(`export function toCatalogArtistId(artistName: string): string {`);
lines.push(`  return \`\${CATALOG_ARTIST_PREFIX}\${encodeURIComponent(artistName)}\`;`);
lines.push(`}`);
lines.push(``);
lines.push(`export function toCatalogSongId(artistName: string, songTitle: string): string {`);
lines.push(
  `  return \`\${CATALOG_SONG_PREFIX}\${encodeURIComponent(artistName)}:\${encodeURIComponent(songTitle)}\`;`,
);
lines.push(`}`);
lines.push(``);
lines.push(`export function toCatalogAlbumId(artistName: string, albumName: string): string {`);
lines.push(
  `  return \`\${CATALOG_ALBUM_PREFIX}\${encodeURIComponent(artistName)}:\${encodeURIComponent(albumName)}\`;`,
);
lines.push(`}`);
lines.push(``);
lines.push(`export function parseCatalogArtistId(id: string): string | null {`);
lines.push(`  if (!id.startsWith(CATALOG_ARTIST_PREFIX)) return null;`);
lines.push(`  return decodeURIComponent(id.slice(CATALOG_ARTIST_PREFIX.length));`);
lines.push(`}`);
lines.push(``);
lines.push(`export function parseCatalogSongId(`);
lines.push(`  id: string,`);
lines.push(`): { artistName: string; songTitle: string } | null {`);
lines.push(`  if (!id.startsWith(CATALOG_SONG_PREFIX)) return null;`);
lines.push(`  const payload = id.slice(CATALOG_SONG_PREFIX.length);`);
lines.push(`  const splitAt = payload.indexOf(':');`);
lines.push(`  if (splitAt < 0) return null;`);
lines.push(`  return {`);
lines.push(`    artistName: decodeURIComponent(payload.slice(0, splitAt)),`);
lines.push(`    songTitle: decodeURIComponent(payload.slice(splitAt + 1)),`);
lines.push(`  };`);
lines.push(`}`);
lines.push(``);
lines.push(`export function parseCatalogAlbumId(`);
lines.push(`  id: string,`);
lines.push(`): { artistName: string; albumName: string } | null {`);
lines.push(`  if (!id.startsWith(CATALOG_ALBUM_PREFIX)) return null;`);
lines.push(`  const payload = id.slice(CATALOG_ALBUM_PREFIX.length);`);
lines.push(`  const splitAt = payload.indexOf(':');`);
lines.push(`  if (splitAt < 0) return null;`);
lines.push(`  return {`);
lines.push(`    artistName: decodeURIComponent(payload.slice(0, splitAt)),`);
lines.push(`    albumName: decodeURIComponent(payload.slice(splitAt + 1)),`);
lines.push(`  };`);
lines.push(`}`);
lines.push(``);
lines.push(`export function getCatalogEntry(artistName: string): CatalogEntry | undefined {`);
lines.push(`  const wanted = artistName.trim().toLowerCase();`);
lines.push(`  return FEATURED_CATALOG.find((entry) => entry.artist.toLowerCase() === wanted);`);
lines.push(`}`);
lines.push(``);
lines.push(`export function getCatalogAlbum(`);
lines.push(`  artistName: string,`);
lines.push(`  albumName: string,`);
lines.push(`): CatalogAlbum | undefined {`);
lines.push(`  const entry = getCatalogEntry(artistName);`);
lines.push(`  const wanted = albumName.trim().toLowerCase();`);
lines.push(`  return entry?.albums?.find((album) => album.name.toLowerCase() === wanted);`);
lines.push(`}`);
lines.push(``);
lines.push(`export function buildLocalCatalogArtists(filter?: {`);
lines.push(`  query?: string;`);
lines.push(`  startsWith?: string;`);
lines.push(`}): Array<{ id: string; name: string; songCount: number }> {`);
lines.push(`  const query = filter?.query?.trim().toLowerCase() ?? '';`);
lines.push(`  const startsWith = filter?.startsWith?.trim().toLowerCase() ?? '';`);
lines.push(``);
lines.push(`  return FEATURED_CATALOG.filter((entry) => {`);
lines.push(`    const name = entry.artist.toLowerCase();`);
lines.push(`    if (startsWith && !name.startsWith(startsWith)) return false;`);
lines.push(`    if (query) {`);
lines.push(`      const nameMatch = name.includes(query);`);
lines.push(`      const songMatch = entry.songs.some((song) => song.toLowerCase().includes(query));`);
lines.push(`      return nameMatch || songMatch;`);
lines.push(`    }`);
lines.push(`    return true;`);
lines.push(`  }).map((entry) => ({`);
lines.push(`    id: toCatalogArtistId(entry.artist),`);
lines.push(`    name: entry.artist,`);
lines.push(`    songCount: entry.songs.length,`);
lines.push(`  }));`);
lines.push(`}`);
lines.push(``);
lines.push(`export function buildLocalCatalogSongs(filter?: {`);
lines.push(`  query?: string;`);
lines.push(`  artistName?: string;`);
lines.push(`}): Array<{`);
lines.push(`  id: string;`);
lines.push(`  title: string;`);
lines.push(`  artistId: string;`);
lines.push(`  artistName: string;`);
lines.push(`}> {`);
lines.push(`  const query = filter?.query?.trim().toLowerCase() ?? '';`);
lines.push(`  const artistName = filter?.artistName?.trim().toLowerCase() ?? '';`);
lines.push(``);
lines.push(`  return FEATURED_CATALOG.flatMap((entry) => {`);
lines.push(`    if (artistName && entry.artist.toLowerCase() !== artistName) return [];`);
lines.push(`    return entry.songs`);
lines.push(`      .filter((song) => {`);
lines.push(`        if (!query) return true;`);
lines.push(`        const haystack = \`\${song} \${entry.artist}\`.toLowerCase();`);
lines.push(`        return haystack.includes(query);`);
lines.push(`      })`);
lines.push(`      .map((song) => ({`);
lines.push(`        id: toCatalogSongId(entry.artist, song),`);
lines.push(`        title: song,`);
lines.push(`        artistId: toCatalogArtistId(entry.artist),`);
lines.push(`        artistName: entry.artist,`);
lines.push(`      }));`);
lines.push(`  });`);
lines.push(`}`);
lines.push(``);
lines.push(`/** Run async work with limited concurrency. */`);
lines.push(`export async function mapPool<T, R>(`);
lines.push(`  items: readonly T[],`);
lines.push(`  concurrency: number,`);
lines.push(`  worker: (item: T, index: number) => Promise<R>,`);
lines.push(`): Promise<R[]> {`);
lines.push(`  const results = new Array<R>(items.length);`);
lines.push(`  let nextIndex = 0;`);
lines.push(``);
lines.push(`  async function runWorker() {`);
lines.push(`    while (nextIndex < items.length) {`);
lines.push(`      const current = nextIndex;`);
lines.push(`      nextIndex += 1;`);
lines.push(`      results[current] = await worker(items[current], current);`);
lines.push(`    }`);
lines.push(`  }`);
lines.push(``);
lines.push(`  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());`);
lines.push(`  await Promise.all(runners);`);
lines.push(`  return results;`);
lines.push(`}`);
lines.push(``);

fs.writeFileSync('src/data/catalog/featuredCatalog.ts', lines.join('\n'));
const songAvg =
  enriched.reduce((sum, e) => sum + mergeSongs(e.artist, e.songs).length, 0) / enriched.length;
const withAlbums = enriched.filter((e) => pickAlbums(e.albums).length > 0).length;
console.log(
  `Rebuilt ${enriched.length} artists, avg songs ${songAvg.toFixed(1)}, with albums ${withAlbums}`,
);
