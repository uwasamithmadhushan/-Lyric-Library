import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/config';

type CatalogAlbum = {
  name: string;
  year?: number;
  deezerId?: string;
  songs: string[];
};

type CatalogEntry = {
  artist: string;
  songs: string[];
  albums?: CatalogAlbum[];
};

function catalogArtistKey(name: string) {
  return `catalog:${name.trim().toLowerCase()}`;
}

function catalogSongKey(artistName: string, title: string) {
  return `catalog:${artistName.trim().toLowerCase()}:${title.trim().toLowerCase()}`;
}

function catalogAlbumKey(artistName: string, albumName: string) {
  return `catalog-album:${artistName.trim().toLowerCase()}:${albumName.trim().toLowerCase()}`;
}

function loadFeaturedCatalog(): CatalogEntry[] {
  const file = join(process.cwd(), 'data', 'featured-catalog.json');
  const raw = readFileSync(file, 'utf8');
  return JSON.parse(raw) as CatalogEntry[];
}

/**
 * Upsert the mobile app featured catalog into SQLite so admin web
 * shows the same artists/songs the app browses.
 */
export async function importFeaturedCatalog() {
  const catalog = loadFeaturedCatalog();
  let artistsCreated = 0;
  let artistsUpdated = 0;
  let songsCreated = 0;
  let songsSkipped = 0;
  let albumsCreated = 0;

  for (const entry of catalog) {
    const artistKey = catalogArtistKey(entry.artist);
    const existingArtist = await prisma.artist.findUnique({
      where: { externalApiId: artistKey },
    });

    const artist =
      existingArtist ??
      (await prisma.artist.findFirst({
        where: { name: entry.artist },
      }));

    let artistId: string;
    if (artist) {
      const updated = await prisma.artist.update({
        where: { id: artist.id },
        data: {
          name: entry.artist,
          externalApiId: artist.externalApiId || artistKey,
        },
      });
      artistId = updated.id;
      artistsUpdated += 1;
    } else {
      const created = await prisma.artist.create({
        data: {
          externalApiId: artistKey,
          name: entry.artist,
        },
      });
      artistId = created.id;
      artistsCreated += 1;
    }

    // Import the same featured song list the mobile Songs tab uses.
    for (const title of entry.songs) {
      const songKey = catalogSongKey(entry.artist, title);
      const existingSong =
        (await prisma.song.findUnique({ where: { externalApiId: songKey } })) ??
        (await prisma.song.findFirst({
          where: {
            artistId,
            title: { equals: title },
          },
        }));

      if (existingSong) {
        songsSkipped += 1;
        continue;
      }

      await prisma.song.create({
        data: {
          externalApiId: songKey,
          title,
          artistId,
        },
      });
      songsCreated += 1;
    }

    // Optional albums for richer Songs grouping / future use.
    for (const album of entry.albums ?? []) {
      const albumKey = album.deezerId
        ? String(album.deezerId)
        : catalogAlbumKey(entry.artist, album.name);

      const existingAlbum =
        (await prisma.album.findUnique({ where: { externalApiId: albumKey } })) ??
        (await prisma.album.findFirst({
          where: { artistId, title: album.name },
        }));

      if (existingAlbum) continue;

      await prisma.album.create({
        data: {
          externalApiId: albumKey,
          title: album.name,
          artistId,
          releaseYear: album.year,
        },
      });
      albumsCreated += 1;
    }
  }

  return {
    artistsCreated,
    artistsUpdated,
    songsCreated,
    songsSkipped,
    albumsCreated,
    catalogArtists: catalog.length,
    catalogSongs: catalog.reduce((sum, entry) => sum + entry.songs.length, 0),
  };
}
