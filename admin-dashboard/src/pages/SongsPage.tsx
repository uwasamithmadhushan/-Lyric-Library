import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DbArtist, type DbSong } from '../lib/api';
import { useToast } from '../lib/toast';

type ArtistSongGroup = {
  artist: DbArtist;
  songs: DbSong[];
};

export function SongsPage() {
  const toast = useToast();
  const [songs, setSongs] = useState<DbSong[]>([]);
  const [artists, setArtists] = useState<DbArtist[]>([]);
  const [query, setQuery] = useState('');
  const [artistId, setArtistId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(nextQuery = query, nextArtistId = artistId) {
    setLoading(true);
    try {
      const [songsRes, artistsRes] = await Promise.all([
        api.get('/api/songs', {
          params: {
            query: nextQuery || undefined,
            artistId: nextArtistId || undefined,
          },
        }),
        api.get('/api/artists'),
      ]);
      setSongs(songsRes.data.songs ?? []);
      setArtists(artistsRes.data.artists ?? []);
    } catch {
      toast.push('error', 'Could not load songs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo<ArtistSongGroup[]>(() => {
    const byArtist = new Map<string, DbSong[]>();
    for (const song of songs) {
      const list = byArtist.get(song.artistId) ?? [];
      list.push(song);
      byArtist.set(song.artistId, list);
    }

    const selected = artistId
      ? artists.filter((artist) => artist.id === artistId)
      : artists;

    const fromArtists: ArtistSongGroup[] = selected.map((artist) => ({
      artist,
      songs: (byArtist.get(artist.id) ?? []).slice().sort((a, b) => a.title.localeCompare(b.title)),
    }));

    const knownIds = new Set(artists.map((artist) => artist.id));
    const orphans = songs.filter((song) => !knownIds.has(song.artistId));
    if (orphans.length) {
      fromArtists.push({
        artist: {
          id: '__orphans__',
          name: 'Other / unknown artist',
          songCount: orphans.length,
          createdAt: new Date().toISOString(),
        },
        songs: orphans,
      });
    }

    if (query.trim()) {
      return fromArtists.filter((group) => group.songs.length > 0);
    }

    return fromArtists.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
  }, [artists, artistId, query, songs]);

  const totalVisibleSongs = useMemo(
    () => groups.reduce((sum, group) => sum + group.songs.length, 0),
    [groups],
  );

  async function removeSong(song: DbSong) {
    if (!window.confirm(`Delete ${song.title}?`)) return;
    try {
      await api.delete(`/api/songs/${song.id}`);
      toast.push('success', 'Song deleted');
      await load();
    } catch {
      toast.push('error', 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Library</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Songs</h2>
          <p className="mt-2 text-sm text-slate-400">
            Songs grouped under each artist
            {!loading ? ` · ${totalVisibleSongs} songs · ${groups.length} artists` : ''}. Add via{' '}
            <Link to="/" className="text-accent underline-offset-2 hover:underline">
              Dashboard → Sync Music
            </Link>
            .
          </p>
        </div>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
        className="grid gap-3 md:grid-cols-[1fr_220px_auto]"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs"
          className="rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-accent focus:ring-2"
        />
        <select
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          className="rounded-xl border border-white/10 bg-ink-800 px-4 py-3"
        >
          <option value="">All artists</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name} ({artist.songCount})
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5">
          Filter
        </button>
      </form>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5 text-sm text-slate-400">
          Loading songs…
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5 text-sm text-slate-400">
          No songs yet. Use Dashboard → Sync Music to add artists, then select songs.
        </div>
      )}

      {!loading &&
        groups.map((group) => (
          <section
            key={group.artist.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70"
          >
            <div className="flex flex-col gap-4 border-b border-white/10 bg-ink-900/50 p-4 sm:flex-row sm:items-center">
              <div className="h-14 w-14 overflow-hidden rounded-full bg-ink-900">
                {group.artist.imageUrl ? (
                  <img
                    src={group.artist.imageUrl}
                    alt={group.artist.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl text-white">{group.artist.name}</h3>
                <p className="text-sm text-slate-400">
                  {group.songs.length} song{group.songs.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {group.songs.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No songs for this artist yet.</p>
            ) : (
              group.songs.map((song) => (
                <div
                  key={song.id}
                  className="flex flex-col gap-4 border-b border-white/5 p-4 last:border-b-0 sm:flex-row sm:items-center"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-ink-900">
                    {song.artworkUrl ? (
                      <img src={song.artworkUrl} alt={song.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-white">{song.title}</h4>
                    <p className="text-sm text-slate-400">
                      {song.albumTitle || 'No album'}
                      {song.releaseDate ? ` · ${song.releaseDate}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeSong(song)}
                    className="rounded-xl border border-rose-500/30 px-3 py-2 text-sm text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </section>
        ))}
    </div>
  );
}
