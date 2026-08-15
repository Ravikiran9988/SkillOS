import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStudents } from '../services/api';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [students, setStudents] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudents();
        setStudents(data);
        // Default to first student
        if (data.length > 0 && !currentStudent) {
          setCurrentStudent(data[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectStudent = (student) => setCurrentStudent(student);

  const refreshStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
      // Update currentStudent if it changed
      if (currentStudent) {
        const updated = data.find((s) => s.id === currentStudent.id);
        if (updated) setCurrentStudent(updated);
      }
    } catch (err) {
      console.error('Failed to refresh students:', err.message);
    }
  };

  return (
    <StudentContext.Provider value={{ students, currentStudent, selectStudent, loading, error, refreshStudents }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudent must be used inside StudentProvider');
  return ctx;
}
