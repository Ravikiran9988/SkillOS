import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudentProvider } from './context/StudentContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
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
import SettingsPage from './pages/SettingsPage';
import SavedPage from './pages/SavedPage';
import ProgressPage from './pages/ProgressPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import CareerComparisonPage from './pages/CareerComparisonPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <LoadingSpinner message="Loading your career intelligence…" />
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
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <StudentProvider>
              <Routes>
                {/* ── Public Auth Routes ──────────────────────────────────── */}
                <Route path="/login"          element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
                <Route path="/verify-email"    element={<VerifyEmailPage />} />

                {/* ── Protected Student Routes ────────────────────────────── */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/"             element={<DashboardPage />} />
                  <Route path="/dashboard"    element={<Navigate to="/" replace />} />
                  <Route path="/profile"      element={<ProfilePage />} />
                  <Route path="/skills"       element={<SkillsPage />} />
                  <Route path="/projects"     element={<ProjectsPage />} />
                  <Route path="/careers"      element={<CareerPage />} />
                  <Route path="/career"       element={<Navigate to="/careers" replace />} />
                  <Route path="/career/:id"   element={<CareerDetailPage />} />
                  <Route path="/compare"      element={<CareerComparisonPage />} />
                  <Route path="/skill-gap"    element={<SkillGapPage />} />
                  <Route path="/roadmap"      element={<LearningRoadmapPage />} />
                  <Route path="/jobs"         element={<JobsPage />} />
                  <Route path="/copilot"      element={<CareerCopilotPage />} />
                  <Route path="/graph"        element={<GraphPage />} />
                  <Route path="/progress"     element={<ProgressPage />} />
                  <Route path="/saved"        element={<SavedPage />} />
                  <Route path="/resume"       element={<ResumeBuilderPage />} />
                  <Route path="/interview"    element={<InterviewPrepPage />} />
                  <Route path="/settings"     element={<SettingsPage />} />
                </Route>

                {/* ── Catch-all ──────────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </StudentProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
