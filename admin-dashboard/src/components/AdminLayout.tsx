import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Disc3, LayoutDashboard, LogOut, Music2, RefreshCw, Settings, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/artists', label: 'Artists', icon: Users },
  { to: '/songs', label: 'Songs', icon: Disc3 },
  { to: '/sync', label: 'Sync Music', icon: RefreshCw },
  { to: '/users', label: 'Users', icon: Music2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Lyric Library</p>
            <h1 className="mt-1 text-xl font-bold">Admin Studio</h1>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap ${
                  isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10'
                }`
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 px-5 py-4 lg:block">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <button
            className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
