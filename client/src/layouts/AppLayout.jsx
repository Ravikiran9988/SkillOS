import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
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
  Sun,
  Moon,
  Bell,
  Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home', path: '/', icon: Home },
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

const MOBILE_PRIMARY_NAV = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Skills', path: '/skills', icon: Brain },
  { name: 'Roadmap', path: '/roadmap', icon: Map },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Copilot', path: '/copilot', icon: Bot },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
  const targetCareerTitle = user?.targetCareer?.title || user?.targetCareer || 'Career Explorer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* ─── Mobile Top Header ─────────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">SkillOS</div>
            <div className="text-[10px] text-indigo-400 font-medium">AI Career Copilot</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── Desktop Left Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 p-5 shrink-0 sticky top-0 h-screen overflow-y-auto justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white">SkillOS</div>
              <div className="text-xs text-indigo-400 font-medium">AI Career Copilot</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
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
        </div>

        {/* User Profile & Footer Controls */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          {/* Authenticated Student Identity Card */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-sm text-white shrink-0 shadow-md shadow-indigo-500/20">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition">
                {user?.name || 'Student'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="truncate">{targetCareerTitle}</span>
              </div>
            </div>
          </div>

          {/* Theme Toggle & Sign Out */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 transition"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Slide-out Drawer Menu ──────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col p-6 md:hidden overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                {userInitial}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{user?.name}</div>
                <div className="text-xs text-indigo-400">{targetCareerTitle}</div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
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

      {/* ─── Main Content Container ────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0 overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation Bar (Primary Destinations) ─────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-2 px-1">
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
