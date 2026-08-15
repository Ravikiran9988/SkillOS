import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CareerPage from './pages/CareerPage';
import CareerDetailPage from './pages/CareerDetailPage';
import JobsPage from './pages/JobsPage';
import ProjectsPage from './pages/ProjectsPage';
import GraphPage from './pages/GraphPage';

export default function App() {
  return (
    <BrowserRouter>
      <StudentProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/career/:id" element={<CareerDetailPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/graph" element={<GraphPage />} />
          </Route>
        </Routes>
      </StudentProvider>
    </BrowserRouter>
  );
}
