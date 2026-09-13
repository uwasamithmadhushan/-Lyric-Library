import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

export function LoginPage() {
  const { token, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@lyriclibrary.local');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.push('success', 'Welcome back');
      navigate('/');
    } catch (error) {
      let message = 'Login failed';
      if (axios.isAxiosError(error)) {
        message =
          (error.response?.data as { message?: string } | undefined)?.message ||
          (error.code === 'ERR_NETWORK'
            ? 'Cannot reach backend at :4000 — is it running?'
            : error.message);
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.push('error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-900/80 p-8 shadow-panel"
      >
        <p className="font-display text-xs uppercase tracking-[0.24em] text-slate-400">Admin access</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">Manage artists, songs, and music API sync.</p>

        <label className="mt-8 block text-sm text-slate-300">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-accent focus:ring-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            autoComplete="username"
            required
          />
        </label>

        <label className="mt-4 block text-sm text-slate-300">
          Password
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-accent focus:ring-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <p className="mt-3 text-xs text-slate-500">
          Default: <code>admin@lyriclibrary.local</code> / <code>Admin123!</code>
        </p>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
