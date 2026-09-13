export function UsersPage() {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Access</p>
      <h2 className="font-display text-3xl font-semibold text-white">Users</h2>
      <p className="max-w-2xl text-sm text-slate-400">
        Admin authentication is enabled. End-user accounts can be extended here later. Current admin credentials are
        configured via backend environment variables.
      </p>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">System</p>
      <h2 className="font-display text-3xl font-semibold text-white">Settings</h2>
      <div className="rounded-2xl border border-white/10 bg-ink-800/70 p-5 text-sm text-slate-300">
        <p>Music API: Deezer (via backend proxy)</p>
        <p className="mt-2">API secrets stay on the backend only.</p>
        <p className="mt-2">Configure `backend/.env` for JWT, admin login, and database URL.</p>
      </div>
    </div>
  );
}
