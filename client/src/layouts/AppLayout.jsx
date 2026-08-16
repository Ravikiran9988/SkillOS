import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home, User, Brain, FolderGit2, Compass, BarChart3, Map, Briefcase,
  Bot, Network, LogOut, Sparkles, Menu, X, Sun, Moon, Bell, Search,
  Settings, Bookmark, TrendingUp, ChevronRight, FileText, Swords,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Career Intelligence',
    items: [
      { name: 'Home',             path: '/',          icon: Home },
      { name: 'My Profile',       path: '/profile',   icon: User },
      { name: 'My Skills',        path: '/skills',    icon: Brain },
      { name: 'My Projects',      path: '/projects',  icon: FolderGit2 },
    ],
  },
  {
    label: 'Explore & Plan',
    items: [
      { name: 'Career Explorer',  path: '/careers',   icon: Compass },
      { name: 'Skill Gap',        path: '/skill-gap', icon: BarChart3 },
      { name: 'Roadmap',          path: '/roadmap',   icon: Map },
      { name: 'Job Matches',      path: '/jobs',      icon: Briefcase },
    ],
  },
  {
    label: 'AI & Insights',
    items: [
      { name: 'AI Copilot',       path: '/copilot',   icon: Bot,     badge: 'AI' },
      { name: 'Career Graph',     path: '/graph',     icon: Network },
      { name: 'Progress',         path: '/progress',  icon: TrendingUp },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Resume Builder',   path: '/resume',    icon: FileText },
      { name: 'Interview Prep',   path: '/interview', icon: Swords },
      { name: 'Saved',            path: '/saved',     icon: Bookmark },
    ],
  },
];

const MOBILE_NAV = [
  { name: 'Home',    path: '/',        icon: Home },
  { name: 'Skills',  path: '/skills',  icon: Brain },
  { name: 'Roadmap', path: '/roadmap', icon: Map },
  { name: 'Jobs',    path: '/jobs',    icon: Briefcase },
  { name: 'Copilot', path: '/copilot', icon: Bot },
];

function isPathActive(path, currentPath) {
  return path === '/'
    ? currentPath === '/' || currentPath === '/dashboard'
    : currentPath.startsWith(path);
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Sample notifications (real impl in NotificationBell component)
  const notifications = [
    { id: 1, title: 'New job match: AI Engineer at Infosys', read: false, time: '2h ago' },
    { id: 2, title: 'Your roadmap has 3 new items', read: false, time: '1d ago' },
    { id: 3, title: 'Weekly career digest is ready', read: true, time: '3d ago' },
  ];
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl transition-all duration-150"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse-soft"
            style={{ background: 'var(--accent)' }} />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl shadow-lg z-50 overflow-hidden animate-scale-in"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
            {unread > 0 && (
              <span className="text-xs font-medium badge-blue badge">{unread} new</span>
            )}
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer"
                style={{ background: n.read ? 'transparent' : 'var(--accent-subtle)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-subtle)'; }}
              >
                {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />}
                {n.read && <div className="w-2 h-2 mt-1.5 shrink-0" />}
                <div>
                  <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Global Search ─────────────────────────────────────────────────────────────
function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-150"
        style={{
          background: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          minWidth: '220px',
        }}
        aria-label="Search (Ctrl+K)"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search careers, skills, jobs…</span>
        <span className="text-xs font-mono rounded px-1 py-0.5" style={{ background: 'var(--surface-active)', color: 'var(--text-disabled)' }}>⌘K</span>
      </button>

      {/* Command palette modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden animate-scale-in"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search careers, skills, jobs, projects…"
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <button onClick={() => setOpen(false)} className="text-xs font-medium rounded px-1.5 py-0.5"
                style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                ESC
              </button>
            </div>

            {!query && (
              <div className="p-4">
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quick access</p>
                <div className="space-y-1">
                  {[
                    { label: 'Career Explorer', path: '/careers', icon: Compass },
                    { label: 'Skill Gap Analysis', path: '/skill-gap', icon: BarChart3 },
                    { label: 'AI Career Copilot', path: '/copilot', icon: Bot },
                    { label: 'Job Matches', path: '/jobs', icon: Briefcase },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <a key={item.path} href={item.path}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {query && (
              <div className="p-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Search functionality coming soon — results for "{query}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
  const targetCareerTitle = user?.targetCareer?.title || user?.targetCareer || null;

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row antialiased"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
    >
      {/* ─── Skip to content (accessibility) ─────────────────────────────── */}
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* ─── Mobile Top Header ──────────────────────────────────────────────── */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>SkillOS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ─── Desktop Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0 transition-all duration-200"
        style={{
          width: sidebarCollapsed ? '64px' : '240px',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: 'var(--shadow-accent)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>SkillOS</div>
              <div className="text-xs font-medium" style={{ color: 'var(--accent)' }}>AI Career Copilot</div>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(item.path, location.pathname);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group"
                      style={{
                        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                        color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                        border: active ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                          e.currentTarget.style.color = 'var(--sidebar-text-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--sidebar-text)';
                        }
                      }}
                      title={sidebarCollapsed ? item.name : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide badge-blue badge">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: User identity + controls */}
        <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          {/* User card */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl mb-3 transition-all duration-150 text-left"
            style={{ border: '1px solid var(--border)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              {userInitial}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || 'Student'}
                </div>
                {targetCareerTitle && (
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {targetCareerTitle}
                  </div>
                )}
              </div>
            )}
          </button>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {!sidebarCollapsed && (isDark ? 'Light' : 'Dark')}
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ border: '1px solid var(--danger-border)', color: 'var(--danger)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              {!sidebarCollapsed && 'Sign out'}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Slide-out Menu ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex flex-col overflow-y-auto"
          style={{ background: 'var(--sidebar-bg)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                {userInitial}
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
                {targetCareerTitle && (
                  <div className="text-xs" style={{ color: 'var(--accent)' }}>{targetCareerTitle}</div>
                )}
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-hover)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 py-4 space-y-4" aria-label="Mobile navigation">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isPathActive(item.path, location.pathname);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                          color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                          border: active ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && <span className="badge badge-blue text-[9px]">{item.badge}</span>}
                        {active && <ChevronRight className="w-4 h-4" />}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex gap-2 mb-3">
              <button onClick={toggleTheme} className="flex-1 btn-secondary py-2 text-xs">
                {isDark ? <><Sun className="w-4 h-4" /> Light mode</> : <><Moon className="w-4 h-4" /> Dark mode</>}
              </button>
              <NavLink to="/settings" className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                <Settings className="w-4 h-4" /> Settings
              </NavLink>
            </div>
            <button onClick={handleLogout} className="btn-danger w-full text-sm">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content Area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Desktop top header bar */}
        <header
          className="hidden md:flex items-center justify-between px-6 py-3 sticky top-0 z-30 backdrop-blur-xl"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
        >
          <GlobalSearchBar />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <NavLink to="/settings"
              className="p-2 rounded-xl transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Settings className="w-4 h-4" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto space-y-6 animate-fade-in"
        >
          <Outlet />
        </main>
      </div>

      {/* ─── Mobile Bottom Tab Bar ────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2 px-1 safe-area-pb"
        style={{ background: 'var(--header-bg)', borderTop: '1px solid var(--header-border)', backdropFilter: 'blur(12px)' }}
        aria-label="Primary navigation"
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(item.path, location.pathname);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all gap-0.5"
              style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
