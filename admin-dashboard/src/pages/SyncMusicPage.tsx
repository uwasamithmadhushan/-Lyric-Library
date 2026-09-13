import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { api, getErrorMessage, type ArtistSearchHit, type SongSearchHit } from '../lib/api';
import { Button, EmptyState, Input, Modal, formatDate, formatDuration } from '../components/ui';
import { useToast } from '../lib/toast';

export function SyncMusicPage() {
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') === 'songs' ? 'songs' : 'artists';
  const [artistQuery, setArtistQuery] = useState('Taylor Swift');
  const [songQuery, setSongQuery] = useState('Anti-Hero');
  const [songArtist, setSongArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [year, setYear] = useState('');
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [artists, setArtists] = useState<ArtistSearchHit[]>([]);
  const [songs, setSongs] = useState<SongSearchHit[]>([]);
  const [previewArtist, setPreviewArtist] = useState<ArtistSearchHit | null>(null);
  const [previewSong, setPreviewSong] = useState<SongSearchHit | null>(null);

  const heading = useMemo(() => (type === 'artists' ? 'Search Artists' : 'Search Songs'), [type]);

  async function searchArtists() {
    if (artistQuery.trim().length < 2) {
      notify('Enter an artist name.', 'error');
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/admin/music/search/artists', { params: { query: artistQuery } });
      setArtists(res.data.results ?? []);
      if (!(res.data.results ?? []).length) notify('No artists found.', 'info');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to connect to music service.'), 'error');
    } finally {
      setSearching(false);
    }
  }

  async function searchSongs() {
    if (songQuery.trim().length < 2) {
      notify('Enter a song title.', 'error');
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/admin/music/search/songs', {
        params: { query: songQuery, artistName: songArtist, album, year },
      });
      setSongs(res.data.results ?? []);
      if (!(res.data.results ?? []).length) notify('No songs found.', 'info');
    } catch (error) {
      notify(getErrorMessage(error, 'Unable to connect to music service.'), 'error');
    } finally {
      setSearching(false);
    }
  }

  async function addArtist(hit: ArtistSearchHit) {
    if (hit.alreadyAdded) {
      notify('Already added', 'info');
      return;
    }
    setAddingId(hit.externalApiId);
    try {
      const res = await api.post('/admin/artists/sync', hit);
      notify(res.data.message || `${hit.name} added successfully.`, 'success');
      setArtists((current) =>
        current.map((item) =>
          item.externalApiId === hit.externalApiId ? { ...item, alreadyAdded: true } : item,
        ),
      );
      setPreviewArtist(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        notify(error.response.data?.message || 'Artist already exists', 'info');
        setArtists((current) =>
          current.map((item) =>
            item.externalApiId === hit.externalApiId ? { ...item, alreadyAdded: true } : item,
          ),
        );
      } else {
        notify(getErrorMessage(error), 'error');
      }
    } finally {
      setAddingId(null);
    }
  }

  async function addSong(hit: SongSearchHit) {
    if (hit.alreadyAdded) {
      notify('This song has already been added.', 'info');
      return;
    }
    setAddingId(hit.externalApiId);
    try {
      const res = await api.post('/admin/songs/sync', hit);
      notify(res.data.message || `${hit.title} added successfully.`, 'success');
      setSongs((current) =>
        current.map((item) =>
          item.externalApiId === hit.externalApiId ? { ...item, alreadyAdded: true } : item,
        ),
      );
      setPreviewSong(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        notify(error.response.data?.message || 'This song has already been added.', 'info');
        setSongs((current) =>
          current.map((item) =>
            item.externalApiId === hit.externalApiId ? { ...item, alreadyAdded: true } : item,
          ),
        );
      } else {
        notify(getErrorMessage(error), 'error');
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Sync Music</h1>
      <p className="mt-1 text-slate-500">Search the music API, preview results, then add them to the shared database.</p>

      <div className="mt-6 inline-flex rounded-2xl bg-slate-200 p-1">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${type === 'artists' ? 'bg-white shadow' : 'text-slate-600'}`}
          onClick={() => setParams({ type: 'artists' })}
        >
          Search Artists
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${type === 'songs' ? 'bg-white shadow' : 'text-slate-600'}`}
          onClick={() => setParams({ type: 'songs' })}
        >
          Search Songs
        </button>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">{heading}</h2>
        {type === 'artists' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <Input label="Artist Name" value={artistQuery} onChange={setArtistQuery} placeholder="Taylor Swift" />
            <div className="flex items-end">
              <Button onClick={() => void searchArtists()} disabled={searching}>
                {searching ? 'Searching music database...' : 'Search Artist'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Song Title" value={songQuery} onChange={setSongQuery} placeholder="Anti-Hero" />
            <Input label="Artist Name (optional)" value={songArtist} onChange={setSongArtist} placeholder="Taylor Swift" />
            <Input label="Album (optional)" value={album} onChange={setAlbum} />
            <Input label="Release Year (optional)" value={year} onChange={setYear} placeholder="2022" />
            <div className="md:col-span-2 xl:col-span-4">
              <Button onClick={() => void searchSongs()} disabled={searching}>
                {searching ? 'Searching music database...' : 'Search Song'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {searching ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-48" />
          ))}
        </div>
      ) : type === 'artists' ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {artists.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No artist results yet." body="Search by artist name to load matches from the music API." />
            </div>
          ) : (
            artists.map((artist) => (
              <article key={artist.externalApiId} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <img src={artist.imageUrl || ''} alt="" className="h-40 w-full rounded-2xl bg-slate-200 object-cover" />
                <h3 className="mt-3 text-lg font-bold">{artist.name}</h3>
                <p className="text-sm text-slate-500">{artist.genre || 'Genre unavailable'}</p>
                <p className="text-xs text-slate-400">External ID {artist.externalApiId}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="ghost" onClick={() => setPreviewArtist(artist)}>
                    Preview
                  </Button>
                  <Button
                    disabled={addingId === artist.externalApiId || artist.alreadyAdded}
                    onClick={() => void addArtist(artist)}
                  >
                    {artist.alreadyAdded
                      ? 'Already added'
                      : addingId === artist.externalApiId
                        ? 'Adding artist...'
                        : 'Add Artist'}
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {songs.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No song results yet." body="Search by song title to load matches from the music API." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Song</th>
                  <th className="px-4 py-3">Artist</th>
                  <th className="px-4 py-3">Album</th>
                  <th className="px-4 py-3">Release</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.externalApiId} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={song.albumImageUrl || ''} alt="" className="h-12 w-12 rounded-xl bg-slate-200 object-cover" />
                        <div>
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-xs text-slate-400">ID {song.externalApiId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{song.artistName}</td>
                    <td className="px-4 py-3">{song.album || '—'}</td>
                    <td className="px-4 py-3">{formatDate(song.releaseDate)}</td>
                    <td className="px-4 py-3">{formatDuration(song.duration)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setPreviewSong(song)}>
                          Preview
                        </Button>
                        <Button
                          disabled={addingId === song.externalApiId || song.alreadyAdded}
                          onClick={() => void addSong(song)}
                        >
                          {song.alreadyAdded
                            ? 'Already added'
                            : addingId === song.externalApiId
                              ? 'Adding song...'
                              : 'Add Song'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        open={Boolean(previewArtist)}
        title="Artist preview"
        onClose={() => setPreviewArtist(null)}
        footer={
          previewArtist ? (
            <>
              <Button variant="ghost" onClick={() => setPreviewArtist(null)}>
                Close
              </Button>
              <Button
                disabled={previewArtist.alreadyAdded || addingId === previewArtist.externalApiId}
                onClick={() => void addArtist(previewArtist)}
              >
                {previewArtist.alreadyAdded ? 'Already added' : 'Add Artist'}
              </Button>
            </>
          ) : null
        }
      >
        {previewArtist ? (
          <div className="space-y-3">
            <img src={previewArtist.imageUrl || ''} alt="" className="h-48 w-full rounded-2xl bg-slate-200 object-cover" />
            <p className="text-xl font-bold">{previewArtist.name}</p>
            <p className="text-sm text-slate-500">Genre: {previewArtist.genre || '—'}</p>
            <p className="text-sm text-slate-500">Country: {previewArtist.country || '—'}</p>
            <p className="text-sm text-slate-500">External ID: {previewArtist.externalApiId}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(previewSong)}
        title="Song preview"
        onClose={() => setPreviewSong(null)}
        footer={
          previewSong ? (
            <>
              <Button variant="ghost" onClick={() => setPreviewSong(null)}>
                Close
              </Button>
              <Button
                disabled={previewSong.alreadyAdded || addingId === previewSong.externalApiId}
                onClick={() => void addSong(previewSong)}
              >
                {previewSong.alreadyAdded ? 'Already added' : 'Add Song'}
              </Button>
            </>
          ) : null
        }
      >
        {previewSong ? (
          <div className="space-y-3">
            <img src={previewSong.albumImageUrl || ''} alt="" className="h-48 w-full rounded-2xl bg-slate-200 object-cover" />
            <p className="text-xl font-bold">{previewSong.title}</p>
            <p className="text-sm text-slate-500">Artist: {previewSong.artistName}</p>
            <p className="text-sm text-slate-500">Album: {previewSong.album || '—'}</p>
            <p className="text-sm text-slate-500">Release: {formatDate(previewSong.releaseDate)}</p>
            <p className="text-sm text-slate-500">Duration: {formatDuration(previewSong.duration)}</p>
            <p className="text-sm text-slate-500">External ID: {previewSong.externalApiId}</p>
            {previewSong.previewUrl ? (
              <audio controls src={previewSong.previewUrl} className="w-full">
                Preview
              </audio>
            ) : (
              <p className="text-sm text-slate-400">No legal preview URL available.</p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
