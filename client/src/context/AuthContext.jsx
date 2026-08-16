import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('skillos_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('skillos_token') || null;
    } catch (_) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persistSession = (accessToken, student, refreshToken) => {
    try {
      localStorage.setItem('skillos_token', accessToken);
      localStorage.setItem('skillos_user', JSON.stringify(student));
      if (refreshToken) localStorage.setItem('skillos_refresh_token', refreshToken);
    } catch (_) {}
  };

  const clearSession = () => {
    try {
      localStorage.removeItem('skillos_token');
      localStorage.removeItem('skillos_user');
      localStorage.removeItem('skillos_refresh_token');
    } catch (_) {}
  };

  // ── Initialize session on mount ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const savedToken = localStorage.getItem('skillos_token');

      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (isMounted && me) {
          setUser(me);
          setToken(savedToken);
          try { localStorage.setItem('skillos_user', JSON.stringify(me)); } catch (_) {}
        }
      } catch (err) {
        // Token expired — try refresh
        const refreshToken = localStorage.getItem('skillos_refresh_token');
        if (refreshToken) {
          try {
            const res = await api.refreshToken(refreshToken);
            if (isMounted && res?.accessToken) {
              setToken(res.accessToken);
              setUser(res.student);
              persistSession(res.accessToken, res.student, res.refreshToken);
              if (isMounted) setLoading(false);
              return;
            }
          } catch (_) {}
        }
        // Refresh failed — clear stale data
        clearSession();
        if (isMounted) { setToken(null); setUser(null); }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();
    return () => { isMounted = false; };
  }, []);

  // ── Auth Actions ───────────────────────────────────────────────────────────

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res?.accessToken && res?.student) {
        setToken(res.accessToken);
        setUser(res.student);
        persistSession(res.accessToken, res.student, res.refreshToken);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Development-only: login by studentId without password.
   * Hidden from production UI.
   */
  const loginAsStudent = async (studentId) => {
    if (import.meta.env.PROD) throw new Error('Demo login not available in production.');
    setLoading(true);
    try {
      const res = await api.login({ studentId });
      if (res?.accessToken && res?.student) {
        setToken(res.accessToken);
        setUser(res.student);
        persistSession(res.accessToken, res.student, res.refreshToken);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res?.accessToken && res?.student) {
        setToken(res.accessToken);
        setUser(res.student);
        persistSession(res.accessToken, res.student, res.refreshToken);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('skillos_refresh_token');
    setToken(null);
    setUser(null);
    clearSession();
    api.logoutApi(refreshToken).catch(() => {});
  }, []);

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...userData };
      try { localStorage.setItem('skillos_user', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const forgotPassword = (email) => api.forgotPassword(email);

  const resetPassword = (data) => api.resetPassword(data);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        loginAsStudent, // dev-only; not shown in prod UI
        register,
        logout,
        updateUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
