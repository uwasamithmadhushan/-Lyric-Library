import { useAuth } from '../lib/auth';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-slate-500">Admin workspace details. Music API credentials stay on the backend only.</p>
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">Signed in as</h2>
        <p className="mt-2 text-sm text-slate-600">{user?.name}</p>
        <p className="text-sm text-slate-600">{user?.email}</p>
        <p className="mt-4 text-sm text-slate-500">
          External music search is proxied through <code className="rounded bg-slate-100 px-1">GET /api/admin/music/search</code>.
          The mobile app reads the same database from public catalog endpoints.
        </p>
      </section>
    </div>
  );
}
