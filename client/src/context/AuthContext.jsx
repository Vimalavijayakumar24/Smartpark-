import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  // Verify stored token on initial load
  useEffect(() => {
    async function initAuth() {
      const savedToken = getAuthToken();
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.me();
        if (res?.data?.user) {
          setUser(res.data.user);
          setStoredUser(res.data.user);
        } else if (res?.user) {
          setUser(res.user);
          setStoredUser(res.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out', err.message);
        setAuthToken(null);
        setStoredUser(null);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    // Strictly call backend API - No mock accounts or bypasses!
    const res = await authApi.login({ email: email.trim(), password });
    const receivedToken = res.token || res.data?.token;
    const receivedUser = res.user || res.data?.user;

    if (!receivedToken || !receivedUser) {
      throw new Error('Authentication succeeded but invalid response payload received.');
    }

    setAuthToken(receivedToken);
    setStoredUser(receivedUser);
    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (userData) => {
    // Strictly call backend API - Writes directly into MongoDB Atlas
    const res = await authApi.register(userData);
    const receivedToken = res.token || res.data?.token;
    const receivedUser = res.user || res.data?.user;

    if (receivedToken && receivedUser) {
      setAuthToken(receivedToken);
      setStoredUser(receivedUser);
      setToken(receivedToken);
      setUser(receivedUser);
    }

    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setToken(null);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    setStoredUser(merged);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
