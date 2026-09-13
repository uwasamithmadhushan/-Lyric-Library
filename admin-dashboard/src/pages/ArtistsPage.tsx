import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DbArtist } from '../lib/api';
import { useToast } from '../lib/toast';

export function ArtistsPage() {
  const toast = useToast();
  const [artists, setArtists] = useState<DbArtist[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DbArtist | null>(null);
  const [editName, setEditName] = useState('');

  async function load(search = query) {
    setLoading(true);
    try {
      const { data } = await api.get('/api/artists', { params: { query: search || undefined } });
      setArtists(data.artists ?? []);
    } catch {
      toast.push('error', 'Could not load artists');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function removeArtist(artist: DbArtist) {
    if (!window.confirm(`Delete ${artist.name}? This also removes their songs.`)) return;
    try {
      await api.delete(`/api/artists/${artist.id}`);
      toast.push('success', 'Artist deleted');
      await load();
    } catch {
      toast.push('error', 'Delete failed');
    }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await api.patch(`/api/artists/${editing.id}`, { name: editName });
      toast.push('success', 'Artist updated');
      setEditing(null);
      await load();
    } catch {
      toast.push('error', 'Update failed');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Library</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Artists</h2>
          <p className="mt-2 text-sm text-slate-400">
            Browse and manage artists. Add new ones from{' '}
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
          void load(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists"
          className="w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-accent focus:ring-2"
        />
        <button type="submit" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70">
        {loading && <p className="p-5 text-sm text-slate-400">Loading artists…</p>}
        {!loading && artists.length === 0 && <p className="p-5 text-sm text-slate-400">No artists in the database yet.</p>}
        {artists.map((artist) => (
          <div key={artist.id} className="flex flex-col gap-4 border-b border-white/5 p-4 last:border-b-0 sm:flex-row sm:items-center">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-ink-900">
              {artist.imageUrl ? <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-white">{artist.name}</h3>
              <p className="text-sm text-slate-400">
                {artist.songCount} songs · {new Date(artist.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(artist);
                  setEditName(artist.name);
                }}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm"
              >
                Edit
              </button>
              <button type="button" onClick={() => removeArtist(artist)} className="rounded-xl border border-rose-500/30 px-3 py-2 text-sm text-rose-200">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900 p-6">
            <h3 className="font-display text-xl text-white">Edit artist</h3>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-4 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">
                Cancel
              </button>
              <button type="button" onClick={saveEdit} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
