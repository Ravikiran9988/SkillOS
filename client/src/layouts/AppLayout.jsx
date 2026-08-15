import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, User, Briefcase, Brain,
  FolderGit2, Network, ChevronLeft, ChevronRight,
  Zap
} from 'lucide-react';
import { useStudent } from '../context/StudentContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/career', icon: Brain, label: 'Careers' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/projects', icon: FolderGit2, label: 'Projects' },
  { to: '/graph', icon: Network, label: 'Graph Explorer' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { students, currentStudent, selectStudent } = useStudent();

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`flex flex-col bg-surface-800 border-r border-brand-900/20 transition-all duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-brand-900/20">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in min-w-0">
              <span className="font-black text-white text-base gradient-text">SkillOS</span>
              <p className="text-[10px] text-slate-500 leading-none truncate">Career Intelligence</p>
            </div>
          )}
        </div>

        {/* Student selector */}
        {!collapsed && students.length > 0 && (
          <div className="px-3 py-3 border-b border-brand-900/20 animate-fade-in">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 px-1">Student</p>
            <select
              value={currentStudent?.id || ''}
              onChange={(e) => {
                const s = students.find((st) => st.id === e.target.value);
                if (s) selectStudent(s);
              }}
              className="select-field text-xs py-2"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? 'bg-brand-900/40 text-brand-300 border border-brand-700/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-700'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
              {!collapsed && <span className="animate-fade-in truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center p-3 border-t border-brand-900/20 text-slate-500 hover:text-white hover:bg-surface-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* ─── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-surface-900/90 backdrop-blur-sm border-b border-brand-900/20 px-6 py-4 flex items-center justify-between">
          <div>
            {currentStudent ? (
              <div>
                <h2 className="text-sm font-semibold text-white">{currentStudent.name}</h2>
                <p className="text-xs text-slate-500">
                  {currentStudent.educationLevel}
                  {currentStudent.targetCareer && ` · Targeting ${currentStudent.targetCareer}`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No student selected</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentStudent && (
              <span className="badge-brand text-xs">
                {currentStudent.skillCount || 0} skills
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
