import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, Input } from '../components/ui';
import { useToast } from '../lib/toast';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [email, setEmail] = useState('admin@lyriclibrary.local');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      notify('Email and password are required.', 'error');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Lyric Library</p>
        <h1 className="mt-2 text-3xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Manage artists, songs, and music API sync.</p>
        <div className="mt-6 space-y-4">
          <Input label="Email" value={email} onChange={setEmail} type="email" />
          <Input label="Password" value={password} onChange={setPassword} type="password" />
        </div>
        <Button type="submit" disabled={loading} className="mt-6 w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
