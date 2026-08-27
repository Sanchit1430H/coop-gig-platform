import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(user, token) {
    setUser(user);
    setToken(token);
    await AsyncStorage.setItem('auth', JSON.stringify({ user, token }));
  }

  async function login(phone, password) {
    const data = await api.login({ phone, password });
    await persist(data.user, data.token);
    return data.user;
  }

  async function register(payload) {
    const data = await api.register(payload);
    await persist(data.user, data.token);
    return data.user;
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('auth');
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
