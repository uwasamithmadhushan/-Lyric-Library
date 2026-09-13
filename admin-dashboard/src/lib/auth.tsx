import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type AdminUser, getErrorMessage } from './api';

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ll_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/admin/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('ll_admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        try {
          const res = await api.post('/admin/auth/login', { email, password });
          localStorage.setItem('ll_admin_token', res.data.token);
          setUser(res.data.user);
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Invalid admin credentials.'));
        }
      },
      logout: () => {
        localStorage.removeItem('ll_admin_token');
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
