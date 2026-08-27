import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('coop_admin_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setToken(parsed.token);
    }
    setLoading(false);
  }, []);

  async function login(phone, password) {
    const data = await api.login({ phone, password });
    if (!['society_admin', 'federation_admin'].includes(data.user.role)) {
      throw new Error('This account is not an admin account.');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('coop_admin_auth', JSON.stringify(data));
    return data.user;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('coop_admin_auth');
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
