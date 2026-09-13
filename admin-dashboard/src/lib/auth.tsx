import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { api } from './api';

type Admin = { id: string; email: string; name: string };

type AuthContextValue = {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ll_admin_token'));
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const raw = localStorage.getItem('ll_admin_user');
    return raw ? (JSON.parse(raw) as Admin) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      token,
      async login(email, password) {
        try {
          const { data } = await api.post('/api/auth/login', { email, password });
          if (!data.success) throw new Error(data.message || 'Login failed');
          localStorage.setItem('ll_admin_token', data.token);
          localStorage.setItem('ll_admin_user', JSON.stringify(data.admin));
          setToken(data.token);
          setAdmin(data.admin);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.data?.message) {
            throw new Error(String(error.response.data.message));
          }
          throw error;
        }
      },
      logout() {
        localStorage.removeItem('ll_admin_token');
        localStorage.removeItem('ll_admin_user');
        setToken(null);
        setAdmin(null);
      },
    }),
    [admin, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
