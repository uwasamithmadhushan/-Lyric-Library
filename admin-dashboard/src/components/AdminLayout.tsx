import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/artists', label: 'Artists' },
  { to: '/songs', label: 'Songs' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/10 bg-ink-900/80 p-5 lg:border-b-0 lg:border-r">
        <div className="mb-8">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-slate-400">Lyric Library</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white">Admin</h1>
        </div>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-accent text-white shadow-panel'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 hidden rounded-2xl border border-white/10 bg-ink-800/70 p-4 lg:block">
          <p className="text-sm font-medium text-white">{admin?.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{admin?.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
