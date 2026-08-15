import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Initialize session or fallback to default student-5 persona
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const savedToken = localStorage.getItem('skillos_token');
      if (savedToken) {
        try {
          const me = await api.getMe();
          if (isMounted && me) {
            setUser(me);
            try {
              localStorage.setItem('skillos_user', JSON.stringify(me));
            } catch (_) {}
            setLoading(false);
            return;
          }
        } catch (_) {
          // Token expired or invalid — clear stale data
          localStorage.removeItem('skillos_token');
          localStorage.removeItem('skillos_user');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      }

      // Auto-initialize demo persona (student-5 Aditya Singh) for frictionless first-time experience
      try {
        const res = await api.login({ studentId: 'student-5' });
        if (isMounted && res?.token && res?.student) {
          setToken(res.token);
          setUser(res.student);
          try {
            localStorage.setItem('skillos_token', res.token);
            localStorage.setItem('skillos_user', JSON.stringify(res.student));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Initial demo auth could not connect to backend:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const loginAsStudent = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.login({ studentId });
      if (res?.token && res?.student) {
        setToken(res.token);
        setUser(res.student);
        try {
          localStorage.setItem('skillos_token', res.token);
          localStorage.setItem('skillos_user', JSON.stringify(res.student));
        } catch (_) {}
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
        try {
          localStorage.setItem('skillos_token', res.token);
          localStorage.setItem('skillos_user', JSON.stringify(res.student));
        } catch (_) {}
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
        try {
          localStorage.setItem('skillos_token', res.token);
          localStorage.setItem('skillos_user', JSON.stringify(res.student));
        } catch (_) {}
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('skillos_token');
      localStorage.removeItem('skillos_user');
    } catch (_) {}
    api.logoutApi().catch(() => {});
  };

  const updateUser = (userData) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...userData };
      try {
        localStorage.setItem('skillos_user', JSON.stringify(updated));
      } catch (_) {}
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
