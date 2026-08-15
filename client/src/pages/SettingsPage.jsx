import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  User,
  Moon,
  Sun,
  Laptop,
  Shield,
  Bell,
  Key,
  LogOut,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifications, setNotifications] = useState({
    jobMatches: true,
    roadmapUpdates: true,
    weeklyDigest: false,
  });
  const [savedMsg, setSavedMsg] = useState('');

  const handleSaveAccount = (e) => {
    e.preventDefault();
    setSavedMsg('Account preferences saved successfully.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-400" /> Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account credentials, theme appearance, notifications, and privacy preferences.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* ─── 1. Appearance / Theme ───────────────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" /> Appearance & Theme
        </h2>
        <p className="text-xs text-slate-400">
          Choose between deep dark workspace or crisp light productivity mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Dark Mode */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Dark Workspace</div>
                <div className="text-[11px] text-slate-400">Deep charcoal & slate AI theme</div>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
          </div>

          {/* Light Mode */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
              theme === 'light'
                ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Light Workspace</div>
                <div className="text-[11px] text-slate-400">Clean neutral white & slate</div>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
          </div>
        </div>
      </Card>

      {/* ─── 2. Account Information ──────────────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" /> Account Details
        </h2>

        <form onSubmit={handleSaveAccount} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Account Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm">
              Save Account Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* ─── 3. Privacy & Security Assurance ─────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" /> Privacy & End-to-End Data Isolation
        </h2>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
          <p>
            🔒 <strong className="text-white">Strict Student Data Privacy:</strong> SkillOS enforces cryptographic JWT session tokens and backend role policies. Your skills, projects, learning roadmap, and career graph are accessible solely by your authenticated account.
          </p>
          <p>
            🛡️ <strong className="text-white">IDOR Protection:</strong> All API requests verify student ownership before traversing CognoDB graph context.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-400">Active session for: <strong className="text-slate-200">{user?.email}</strong></span>
          <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
            Sign Out of SkillOS
          </Button>
        </div>
      </Card>
    </div>
  );
}
