import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, type User } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('panic_token'),
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('panic_token');
    if (!token) {
      setState(s => ({ ...s, isLoading: false, isAuthenticated: false }));
      return;
    }
    try {
      const { user } = await authApi.me();
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      // Token invalid — try refresh
      const refreshToken = localStorage.getItem('panic_refresh_token');
      if (refreshToken) {
        try {
          const { token: newToken, refreshToken: newRefresh } = await authApi.refresh(refreshToken);
          localStorage.setItem('panic_token', newToken);
          localStorage.setItem('panic_refresh_token', newRefresh);
          const { user } = await authApi.me();
          setState({ user, token: newToken, isLoading: false, isAuthenticated: true });
        } catch {
          localStorage.removeItem('panic_token');
          localStorage.removeItem('panic_refresh_token');
          setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        }
      } else {
        localStorage.removeItem('panic_token');
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { user, token, refreshToken } = await authApi.login({ email, password });
    localStorage.setItem('panic_token', token);
    localStorage.setItem('panic_refresh_token', refreshToken);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  };

  const signup = async (data: { email: string; password: string; fullName: string; phone: string }) => {
    const { user, token, refreshToken } = await authApi.signup(data);
    localStorage.setItem('panic_token', token);
    localStorage.setItem('panic_refresh_token', refreshToken);
    setState({ user, token, isLoading: false, isAuthenticated: true });
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('panic_token');
    localStorage.removeItem('panic_refresh_token');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
