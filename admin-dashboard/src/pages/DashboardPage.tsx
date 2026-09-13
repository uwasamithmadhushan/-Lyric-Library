import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, Users, UserRound } from 'lucide-react';
import { api, getErrorMessage, type ArtistRecord, type SongRecord } from '../lib/api';
import { EmptyState, formatDate } from '../components/ui';
import { useToast } from '../lib/toast';

export function DashboardPage() {
  const { notify } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    artistCount: number;
    songCount: number;
    userCount: number;
    recentArtists: ArtistRecord[];
    recentSongs: SongRecord[];
  } | null>(null);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch((error) => notify(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-32" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-slate-500">Catalog stats from the shared Lyric Library database.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Artists" value={stats?.artistCount ?? 0} onClick={() => navigate('/artists')} />
        <StatCard icon={Disc3} label="Songs" value={stats?.songCount ?? 0} onClick={() => navigate('/songs')} />
        <StatCard icon={UserRound} label="Users" value={stats?.userCount ?? 0} onClick={() => navigate('/users')} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RecentCard
          title="Recently added artists"
          empty="No artists synced yet."
          items={(stats?.recentArtists ?? []).map((artist) => ({
            id: artist.id,
            title: artist.name,
            meta: formatDate(artist.createdAt),
          }))}
        />
        <RecentCard
          title="Recently added songs"
          empty="No songs synced yet."
          items={(stats?.recentSongs ?? []).map((song) => ({
            id: song.id,
            title: song.title,
            meta: `${song.artistName} · ${formatDate(song.createdAt)}`,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5">
      <Icon className="text-brand" />
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </button>
  );
}

function RecentCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: string; title: string; meta: string }>;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold">{title}</h2>
      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={empty} body="Use Sync Music to import catalog content." />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-slate-500">{item.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
