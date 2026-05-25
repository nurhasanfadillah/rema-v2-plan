import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

type SafeUser = Omit<User, 'passwordHash'>;

interface AuthContextType {
  user: SafeUser | null;
  login: (user: SafeUser) => void;
  logout: () => void;
  updateUser: (user: SafeUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);

  useEffect(() => {
    const token = api.auth.getToken();
    if (!token) return;
    api.auth.me()
      .then(({ user: u }) => setUser(u))
      .catch(() => api.auth.clearToken());
  }, []);

  const login = (u: SafeUser) => {
    setUser(u);
  };

  const logout = () => {
    api.auth.clearToken();
    setUser(null);
  };

  const updateUser = (u: SafeUser) => {
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
