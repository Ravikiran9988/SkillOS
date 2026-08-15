import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Brain,
  FolderGit2,
  Compass,
  BarChart3,
  Map,
  Briefcase,
  Bot,
  Network,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Shield,
  Layers,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: User },
  { name: 'My Skills', path: '/skills', icon: Brain },
  { name: 'My Projects', path: '/projects', icon: FolderGit2 },
  { name: 'Career Explorer', path: '/careers', icon: Compass },
  { name: 'Skill Gap', path: '/skill-gap', icon: BarChart3 },
  { name: 'Learning Roadmap', path: '/roadmap', icon: Map },
  { name: 'Job Matches', path: '/jobs', icon: Briefcase },
  { name: 'AI Career Copilot', path: '/copilot', icon: Bot, badge: 'AI' },
  { name: 'My Career Graph', path: '/graph', icon: Network },
];

export default function AppLayout() {
  const { user, logout, loginAsStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaPickerOpen, setPersonaPickerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchPersona = async (studentId) => {
    await loginAsStudent(studentId);
    setPersonaPickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* ─── Mobile Header ─────────────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">SkillOS</div>
            <div className="text-[10px] text-slate-400 font-medium">AI Career Copilot</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ─── Sidebar (Desktop) ────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 p-5 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-white">SkillOS</div>
            <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
              <span>Your AI Career Copilot</span>
            </div>
          </div>
        </div>

        {/* Student Welcome Card */}
        <div className="mb-5 p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-900/30">
          <div className="text-xs font-semibold text-indigo-300 flex items-center justify-between">
            <span>Welcome back,</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
              Student
            </span>
          </div>
          <div className="text-sm font-bold text-white truncate mt-0.5">
            {user?.name || 'Student'} 👋
          </div>
          {user?.targetCareer && (
            <div className="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">Goal: {user.targetCareer.title || user.targetCareer}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/' || location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Persona quick switch + Logout */}
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
          {/* Quick Persona Drawer for Demo/Grading */}
          <div className="relative">
            <button
              onClick={() => setPersonaPickerOpen(!personaPickerOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Switch Demo Persona
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${personaPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {personaPickerOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black z-50 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Select Persona</div>
                <button
                  onClick={() => handleSwitchPersona('student-5')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 text-slate-200 hover:text-indigo-300 transition"
                >
                  Aditya Singh (AI Researcher)
                </button>
                <button
                  onClick={() => handleSwitchPersona('student-1')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 text-slate-200 hover:text-indigo-300 transition"
                >
                  Aarav Sharma (SWE)
                </button>
                <button
                  onClick={() => handleSwitchPersona('student-3')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 text-slate-200 hover:text-indigo-300 transition"
                >
                  Nisha Kapoor (Data Scientist)
                </button>
                <button
                  onClick={() => handleSwitchPersona('student-20')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800 text-slate-200 hover:text-indigo-300 transition"
                >
                  Mohan Das (0 Skills Clean)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Slide-out Menu ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6 md:hidden overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="text-sm font-bold text-white">Welcome, {user?.name} 👋</div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5 my-6 flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-rose-500/10 text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 border border-rose-500/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}

      {/* ─── Main Content Area ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
