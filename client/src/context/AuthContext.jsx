import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('skillos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('skillos_token'));
  const [loading, setLoading] = useState(true);

  // Initialize session or default to demo student-5 if none set
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('skillos_token');
      if (savedToken) {
        try {
          const me = await api.getMe();
          if (me) {
            setUser(me);
            localStorage.setItem('skillos_user', JSON.stringify(me));
            setLoading(false);
            return;
          }
        } catch (_) {
          // Token expired or invalid
        }
      }

      // Auto-initialize demo persona (student-5 Aditya Singh) for frictionless first-time experience
      try {
        const res = await api.login({ studentId: 'student-5' });
        if (res?.token && res?.student) {
          setToken(res.token);
          setUser(res.student);
          localStorage.setItem('skillos_token', res.token);
          localStorage.setItem('skillos_user', JSON.stringify(res.student));
        }
      } catch (_) {}
      setLoading(false);
    }

    initAuth();
  }, []);

  const loginAsStudent = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.login({ studentId });
      if (res?.token && res?.student) {
        setToken(res.token);
        setUser(res.student);
        localStorage.setItem('skillos_token', res.token);
        localStorage.setItem('skillos_user', JSON.stringify(res.student));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (email) => {
    setLoading(true);
    try {
      const res = await api.login({ email });
      if (res?.token && res?.student) {
        setToken(res.token);
        setUser(res.student);
        localStorage.setItem('skillos_token', res.token);
        localStorage.setItem('skillos_user', JSON.stringify(res.student));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res?.token && res?.student) {
        setToken(res.token);
        setUser(res.student);
        localStorage.setItem('skillos_token', res.token);
        localStorage.setItem('skillos_user', JSON.stringify(res.student));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('skillos_token');
    localStorage.removeItem('skillos_user');
    api.logoutApi().catch(() => {});
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('skillos_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        loginAsStudent,
        loginWithCredentials,
        register: registerUser,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
