import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentProvider } from './context/StudentContext';
import ErrorBoundary from './components/ErrorBoundary';

import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SkillsPage from './pages/SkillsPage';
import ProjectsPage from './pages/ProjectsPage';
import CareerPage from './pages/CareerPage';
import CareerDetailPage from './pages/CareerDetailPage';
import SkillGapPage from './pages/SkillGapPage';
import LearningRoadmapPage from './pages/LearningRoadmapPage';
import JobsPage from './pages/JobsPage';
import CareerCopilotPage from './pages/CareerCopilotPage';
import GraphPage from './pages/GraphPage';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Authenticating your SkillOS session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <StudentProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Student-First Experience */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/careers" element={<CareerPage />} />
                <Route path="/career" element={<Navigate to="/careers" replace />} />
                <Route path="/career/:id" element={<CareerDetailPage />} />
                <Route path="/skill-gap" element={<SkillGapPage />} />
                <Route path="/roadmap" element={<LearningRoadmapPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/copilot" element={<CareerCopilotPage />} />
                <Route path="/graph" element={<GraphPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </StudentProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
