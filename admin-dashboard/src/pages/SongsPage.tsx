import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ArtistRecord, type SongRecord } from '../lib/api';
import { Button, EmptyState, Input, Modal, formatDate, formatDuration } from '../components/ui';
import { useToast } from '../lib/toast';

export function SongsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [artistId, setArtistId] = useState('');
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SongRecord | null>(null);
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [songsRes, artistsRes] = await Promise.all([
        api.get('/admin/songs', { params: { query, artistId: artistId || undefined } }),
        api.get('/admin/artists'),
      ]);
      setSongs(songsRes.data.songs);
      setArtists(artistsRes.data.artists);
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(song: SongRecord) {
    setEditing(song);
    setTitle(song.title);
    setAlbum(song.album ?? '');
  }

  async function saveEdit() {
    if (!editing) return;
    if (!title.trim()) {
      notify('Song title is required.', 'error');
      return;
    }
    try {
      await api.patch(`/admin/songs/${editing.id}`, { title, album });
      notify('Song updated.', 'success');
      setEditing(null);
      await load();
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    }
  }

  async function removeSong() {
    if (!confirmId) return;
    try {
      await api.delete(`/admin/songs/${confirmId}`);
      notify('Song deleted.', 'success');
      setConfirmId(null);
      await load();
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Songs</h1>
          <p className="mt-1 text-slate-500">Songs stored in the shared database.</p>
        </div>
        <Button onClick={() => navigate('/sync?type=songs')}>+ Sync New Song</Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Input label="Search songs" value={query} onChange={setQuery} placeholder="Anti-Hero" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Filter by artist</span>
          <select
            value={artistId}
            onChange={(event) => setArtistId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm"
          >
            <option value="">All artists</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => void load()}>
            Apply filters
          </Button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="space-y-3 p-6">{[1, 2, 3].map((row) => <div key={row} className="skeleton h-16" />)}</div>
        ) : songs.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No songs found." body="Sync a song from the music API to populate this list." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Song</th>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Album</th>
                <th className="px-4 py-3">Release</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {songs.map((song) => (
                <tr key={song.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={song.albumImageUrl || ''} alt="" className="h-12 w-12 rounded-xl bg-slate-200 object-cover" />
                      <div>
                        <p className="font-semibold">{song.title}</p>
                        <p className="text-xs text-slate-400">{formatDuration(song.duration)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{song.artistName}</td>
                  <td className="px-4 py-3">{song.album || '—'}</td>
                  <td className="px-4 py-3">{formatDate(song.releaseDate)}</td>
                  <td className="px-4 py-3">{formatDate(song.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(song)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => setConfirmId(song.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        title="Edit song"
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Album" value={album} onChange={setAlbum} />
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmId)}
        title="Delete song?"
        onClose={() => setConfirmId(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void removeSong()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This song will be removed from the shared database and the mobile app.</p>
      </Modal>
    </div>
  );
}
