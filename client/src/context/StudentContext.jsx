import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as api from '../services/api';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const { user, loginAsStudent, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);

  // Fetch all students for background switcher/testing
  useEffect(() => {
    api
      .getStudents()
      .then((data) => setStudents(data || []))
      .catch(() => {});
  }, []);

  // Fetch full student profile when user changes
  const fetchStudentProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudent(user.id);
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

  const selectStudent = async (studentId) => {
    await loginAsStudent(studentId);
  };

  return (
    <StudentContext.Provider
      value={{
        selectedStudentId: user?.id || 'student-5',
        setSelectedStudentId: selectStudent,
        currentStudent: profile || user,
        students,
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
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
