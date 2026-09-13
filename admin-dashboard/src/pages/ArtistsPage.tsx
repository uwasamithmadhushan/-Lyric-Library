import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ArtistRecord } from '../lib/api';
import { Button, EmptyState, Input, Modal, formatDate } from '../components/ui';
import { useToast } from '../lib/toast';

export function ArtistsPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [artists, setArtists] = useState<ArtistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ArtistRecord | null>(null);
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [country, setCountry] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load(search = query) {
    setLoading(true);
    try {
      const res = await api.get('/admin/artists', { params: { query: search } });
      setArtists(res.data.artists);
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(artist: ArtistRecord) {
    setEditing(artist);
    setName(artist.name);
    setGenre(artist.genre ?? '');
    setCountry(artist.country ?? '');
  }

  async function saveEdit() {
    if (!editing) return;
    if (!name.trim()) {
      notify('Artist name is required.', 'error');
      return;
    }
    try {
      await api.patch(`/admin/artists/${editing.id}`, { name, genre, country });
      notify('Artist updated.', 'success');
      setEditing(null);
      await load();
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    }
  }

  async function removeArtist() {
    if (!confirmId) return;
    try {
      await api.delete(`/admin/artists/${confirmId}`);
      notify('Artist deleted.', 'success');
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
          <h1 className="text-3xl font-bold">Artists</h1>
          <p className="mt-1 text-slate-500">Artists stored in the shared database.</p>
        </div>
        <Button onClick={() => navigate('/sync?type=artists')}>+ Sync New Artist</Button>
      </div>
      <div className="mt-6 max-w-md">
        <Input label="Search artists" value={query} onChange={setQuery} placeholder="Taylor Swift" />
        <Button className="mt-3" variant="ghost" onClick={() => void load(query)}>
          Search
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="space-y-3 p-6">{[1, 2, 3].map((row) => <div key={row} className="skeleton h-16" />)}</div>
        ) : artists.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No artists found." body="Sync an artist from the music API to populate this list." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Songs</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={artist.imageUrl || '/placeholder.svg'} alt="" className="h-12 w-12 rounded-xl object-cover bg-slate-200" />
                      <div>
                        <p className="font-semibold">{artist.name}</p>
                        <p className="text-xs text-slate-400">ID {artist.externalApiId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{artist.genre || '—'}</td>
                  <td className="px-4 py-3">{artist.songCount}</td>
                  <td className="px-4 py-3">{formatDate(artist.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openEdit(artist)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => setConfirmId(artist.id)}>
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
        title="Edit artist"
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
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Genre" value={genre} onChange={setGenre} />
          <Input label="Country" value={country} onChange={setCountry} />
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmId)}
        title="Delete artist?"
        onClose={() => setConfirmId(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void removeArtist()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This also removes related songs from the shared database.</p>
      </Modal>
    </div>
  );
}
