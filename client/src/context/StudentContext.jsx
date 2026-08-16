import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the authenticated user's own profile
  const fetchStudentProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyProfile();
      setProfile(data);
      if (data?.targetCareer) {
        updateUser({ targetCareer: data.targetCareer });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [user?.id]);

  return (
    <StudentContext.Provider
      value={{
        currentStudent: profile || user,
        profile,
        loading,
        error,
        refreshStudent: fetchStudentProfile,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) throw new Error('useStudent must be used within a StudentProvider');
  return context;
}
