import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DashboardStats } from '../lib/api';
import { useToast } from '../lib/toast';

export function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch(() => toast.push('error', 'Could not load dashboard stats'))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return <p className="text-slate-400">Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Overview</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Dashboard</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Sync lives here only: add an artist first, then choose which songs to import.
          </p>
        </div>
        <Link
          to="/sync"
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-panel"
        >
          Sync Music
        </Link>
      </header>

      <section className="rounded-2xl border border-white/10 bg-ink-800/70 p-5">
        <h3 className="font-display text-lg text-white">How sync works</h3>
        <ol className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
          <li className="rounded-xl border border-white/10 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">1</p>
            <p className="mt-2 font-medium text-white">Sync artist</p>
            <p className="mt-1 text-slate-400">Search Deezer and save the artist to the library.</p>
          </li>
          <li className="rounded-xl border border-white/10 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">2</p>
            <p className="mt-2 font-medium text-white">Select songs</p>
            <p className="mt-1 text-slate-400">Pick only the tracks you want from that artist.</p>
          </li>
          <li className="rounded-xl border border-white/10 bg-ink-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">3</p>
            <p className="mt-2 font-medium text-white">Add to library</p>
            <p className="mt-1 text-slate-400">Selected songs appear under Artists and Songs.</p>
          </li>
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Artists', value: stats?.totalArtists ?? 0 },
          { label: 'Songs', value: stats?.totalSongs ?? 0 },
          { label: 'Users', value: stats?.totalUsers ?? 0 },
          { label: 'Library ready', value: (stats?.totalSongs ?? 0) > 0 ? 'Yes' : 'Seed sync' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-ink-800/70 p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5">
          <h3 className="font-display text-lg text-white">Recently added artists</h3>
          <ul className="mt-4 space-y-3">
            {(stats?.recentlyAddedArtists ?? []).length === 0 && (
              <li className="text-sm text-slate-400">No artists yet. Sync from Deezer to get started.</li>
            )}
            {(stats?.recentlyAddedArtists ?? []).map((artist) => (
              <li key={artist.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-100">{artist.name}</span>
                <span className="text-slate-500">{new Date(artist.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5">
          <h3 className="font-display text-lg text-white">Recently added songs</h3>
          <ul className="mt-4 space-y-3">
            {(stats?.recentlyAddedSongs ?? []).length === 0 && (
              <li className="text-sm text-slate-400">No songs yet.</li>
            )}
            {(stats?.recentlyAddedSongs ?? []).map((song) => (
              <li key={song.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-100">
                  {song.title}
                  <span className="text-slate-500"> · {song.artistName}</span>
                </span>
                <span className="text-slate-500">{new Date(song.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
