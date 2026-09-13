import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ArtistSearchResult, type SongSearchResult } from '../lib/api';
import { useToast } from '../lib/toast';

type Step = 1 | 2;

function formatDuration(seconds?: number) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function SyncMusicPage() {
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [artistQuery, setArtistQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
  const [songs, setSongs] = useState<SongSearchResult[]>([]);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [songFilter, setSongFilter] = useState('');

  const filteredSongs = useMemo(() => {
    const q = songFilter.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        (song.albumTitle ?? '').toLowerCase().includes(q),
    );
  }, [songFilter, songs]);

  const selectableSongs = filteredSongs.filter((song) => !song.alreadyAdded);
  const selectedCount = selectableSongs.filter((song) => selectedSongIds.has(song.externalApiId)).length;

  async function searchArtists(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setArtists([]);
    try {
      const { data } = await api.get('/api/admin/music/search/artists', {
        params: { query: artistQuery },
      });
      if (!data.success) throw new Error(data.message);
      setArtists(data.results ?? []);
      if (!(data.results ?? []).length) toast.push('info', 'No artists found.');
    } catch (error) {
      toast.push('error', error instanceof Error ? error.message : 'Unable to connect to music service.');
    } finally {
      setLoading(false);
    }
  }

  async function chooseArtist(artist: ArtistSearchResult) {
    setSaving(true);
    try {
      // Ensure artist exists in DB first (no auto song import).
      if (!artist.alreadyAdded) {
        const { data } = await api.post('/api/admin/artists/sync', {
          externalApiId: artist.externalApiId,
          name: artist.name,
          imageUrl: artist.imageUrl,
          popularity: artist.popularity,
          includeTopSongs: false,
        });
        if (!data.success && data.message !== 'Artist already exists') {
          throw new Error(data.message || 'Failed to add artist');
        }
        toast.push('success', `${artist.name} saved. Now select songs to add.`);
      } else {
        toast.push('info', `${artist.name} already in library. Select songs to add.`);
      }

      setSelectedArtist({ ...artist, alreadyAdded: true });
      setArtists((prev) =>
        prev.map((item) =>
          item.externalApiId === artist.externalApiId ? { ...item, alreadyAdded: true } : item,
        ),
      );

      setLoading(true);
      setSongs([]);
      setSelectedSongIds(new Set());
      setSongFilter('');
      setStep(2);

      const { data: top } = await api.get(
        `/api/admin/music/artists/${encodeURIComponent(artist.externalApiId)}/top`,
        { params: { limit: 50 } },
      );
      if (!top.success) throw new Error(top.message || 'Could not load songs');
      setSongs(top.results ?? []);
      if (!(top.results ?? []).length) toast.push('info', 'No top tracks found for this artist.');
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to continue');
      toast.push('error', message);
      setStep(1);
    } finally {
      setSaving(false);
      setLoading(false);
    }
  }

  function toggleSong(id: string, alreadyAdded?: boolean) {
    if (alreadyAdded) return;
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedSongIds((prev) => {
      const next = new Set(prev);
      for (const song of selectableSongs) next.add(song.externalApiId);
      return next;
    });
  }

  function clearSelection() {
    setSelectedSongIds(new Set());
  }

  async function addSelectedSongs() {
    if (!selectedArtist) return;
    const toAdd = songs.filter(
      (song) => selectedSongIds.has(song.externalApiId) && !song.alreadyAdded,
    );
    if (!toAdd.length) {
      toast.push('info', 'Select at least one song to add.');
      return;
    }

    setSaving(true);
    let added = 0;
    let skipped = 0;
    try {
      for (const song of toAdd) {
        try {
          const { data } = await api.post('/api/admin/songs/sync', {
            externalApiId: song.externalApiId,
            title: song.title,
            artistName: selectedArtist.name,
            artistExternalId: selectedArtist.externalApiId,
            albumTitle: song.albumTitle,
            albumExternalId: song.albumExternalId,
            artworkUrl: song.artworkUrl,
            releaseDate: song.releaseDate,
            releaseYear: song.releaseYear,
            duration: song.duration,
            previewUrl: song.previewUrl,
          });
          if (data.success) added += 1;
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }

      toast.push(
        'success',
        added > 0
          ? `Added ${added} song${added === 1 ? '' : 's'} for ${selectedArtist.name}`
          : 'No new songs were added',
      );

      setSongs((prev) =>
        prev.map((song) =>
          selectedSongIds.has(song.externalApiId) ? { ...song, alreadyAdded: true } : song,
        ),
      );
      clearSelection();
    } finally {
      setSaving(false);
    }

    if (skipped && !added) {
      toast.push('error', 'Could not add the selected songs.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Dashboard sync</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Sync Music</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            1) Sync an artist · 2) Select the songs you want · 3) Add them to the library
          </p>
        </div>
        <Link to="/" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
          Back to Dashboard
        </Link>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2">
        <li
          className={`rounded-2xl border p-4 ${
            step === 1 ? 'border-accent bg-accent/10' : 'border-white/10 bg-ink-800/50'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step 1</p>
          <p className="mt-1 font-medium text-white">Sync artist</p>
        </li>
        <li
          className={`rounded-2xl border p-4 ${
            step === 2 ? 'border-accent bg-accent/10' : 'border-white/10 bg-ink-800/50'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step 2</p>
          <p className="mt-1 font-medium text-white">Select & add songs</p>
        </li>
      </ol>

      {step === 1 && (
        <>
          <form
            onSubmit={searchArtists}
            className="grid gap-3 rounded-2xl border border-white/10 bg-ink-800/70 p-5 md:grid-cols-[1fr_auto]"
          >
            <label className="text-sm text-slate-300">
              Artist name
              <input
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 outline-none ring-accent focus:ring-2"
                placeholder="Taylor Swift"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading || saving}
              className="self-end rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Searching…' : 'Search Artist'}
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!artists.length && (
              <p className="text-sm text-slate-400 md:col-span-full">
                {loading ? 'Searching music database…' : 'Search for an artist to begin.'}
              </p>
            )}
            {artists.map((artist) => (
              <article
                key={artist.externalApiId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70 shadow-panel"
              >
                <div className="aspect-[16/10] bg-ink-900">
                  {artist.imageUrl ? (
                    <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">No image</div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-display text-lg text-white">{artist.name}</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {artist.alreadyAdded ? 'Already in library' : 'Not in library yet'}
                      {artist.popularity ? ` · ${artist.popularity.toLocaleString()} fans` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void chooseArtist(artist)}
                    className="w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? 'Working…'
                      : artist.alreadyAdded
                        ? 'Select songs'
                        : 'Sync artist → select songs'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {step === 2 && selectedArtist && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-800/70 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-ink-900">
                {selectedArtist.imageUrl ? (
                  <img
                    src={selectedArtist.imageUrl}
                    alt={selectedArtist.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-medium text-white">{selectedArtist.name}</p>
                <p className="text-sm text-slate-400">
                  {songs.length} tracks · {selectedCount} selected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setSelectedArtist(null);
                setSongs([]);
                clearSelection();
              }}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              ← Change artist
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={songFilter}
              onChange={(e) => setSongFilter(e.target.value)}
              placeholder="Filter songs"
              className="w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-accent focus:ring-2"
            />
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/5"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={saving || selectedCount === 0}
              onClick={() => void addSelectedSongs()}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Adding…' : `Add selected (${selectedCount})`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-800/70">
            {loading && <p className="p-5 text-sm text-slate-400">Loading songs…</p>}
            {!loading && filteredSongs.length === 0 && (
              <p className="p-5 text-sm text-slate-400">No songs to show.</p>
            )}
            {filteredSongs.map((song) => {
              const checked = selectedSongIds.has(song.externalApiId);
              return (
                <label
                  key={song.externalApiId}
                  className={`flex cursor-pointer flex-col gap-4 border-b border-white/5 p-4 last:border-b-0 sm:flex-row sm:items-center ${
                    song.alreadyAdded ? 'cursor-default opacity-60' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sky-500"
                    checked={song.alreadyAdded ? true : checked}
                    disabled={song.alreadyAdded || saving}
                    onChange={() => toggleSong(song.externalApiId, song.alreadyAdded)}
                  />
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-900">
                    {song.artworkUrl ? (
                      <img src={song.artworkUrl} alt={song.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-white">{song.title}</h3>
                    <p className="truncate text-sm text-slate-400">
                      {song.albumTitle || 'No album'}
                      {song.releaseDate ? ` · ${song.releaseDate}` : ''}
                      {` · ${formatDuration(song.duration)}`}
                    </p>
                  </div>
                  {song.alreadyAdded ? (
                    <span className="text-xs text-emerald-300">Already added</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
