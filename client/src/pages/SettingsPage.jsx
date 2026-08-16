import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';
import {
  User, Shield, Bell, Palette, Lock, Database, Eye, EyeOff,
  Sun, Moon, Monitor, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const SECTIONS = [
  { id: 'account',       label: 'Account',        icon: User },
  { id: 'security',      label: 'Security',        icon: Shield },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'appearance',    label: 'Appearance',      icon: Palette },
  { id: 'data',          label: 'Data & Privacy',  icon: Database },
];

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full transition-all duration-200 relative shrink-0"
        style={{ background: checked ? 'var(--accent)' : 'var(--surface-active)' }}
      >
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? '1.25rem' : '0.125rem' }} />
      </button>
    </div>
  );
}

function SaveFeedback({ status }) {
  if (!status) return null;
  return (
    <div className="flex items-center gap-2 text-sm font-medium mt-3"
      style={{ color: status === 'success' ? 'var(--success)' : status === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}>
      {status === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
      {status === 'error' && <AlertCircle className="w-4 h-4" />}
      {status === 'saving' ? 'Saving…' : status === 'success' ? 'Saved successfully' : 'Failed to save'}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('account');

  // Account state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [accountStatus, setAccountStatus] = useState(null);

  // Security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwStatus, setPwStatus] = useState(null);

  // Notifications state
  const [notifs, setNotifs] = useState({
    jobMatches: true,
    roadmapUpdates: true,
    skillProgress: true,
    weeklyDigest: false,
    aiRecommendations: true,
  });

  const saveAccount = async () => {
    setAccountStatus('saving');
    try {
      await api.updateMyProfile({ name, email });
      updateUser({ name, email });
      setAccountStatus('success');
    } catch {
      setAccountStatus('error');
    } finally {
      setTimeout(() => setAccountStatus(null), 3000);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwStatus('error'); return; }
    if (newPw.length < 8) { setPwStatus('error'); return; }
    setPwStatus('saving');
    try {
      // In production: POST /api/auth/change-password with currentPw + newPw
      await new Promise((r) => setTimeout(r, 800));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwStatus('success');
    } catch {
      setPwStatus('error');
    } finally {
      setTimeout(() => setPwStatus(null), 3000);
    }
  };

  const renderAccount = () => (
    <div>
      <SectionHeader title="Account" subtitle="Manage your personal information" />
      <Card className="p-6 space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your full name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="your@email.com" />
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={saveAccount} disabled={accountStatus === 'saving'}>Save Changes</Button>
          <SaveFeedback status={accountStatus} />
        </div>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div>
      <SectionHeader title="Security" subtitle="Manage your password and sessions" />
      <Card className="p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                className="input" placeholder="Current password" style={{ paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="input" placeholder="8+ characters" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="input" placeholder="Repeat password" />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={pwStatus === 'saving'}>Update Password</Button>
            <SaveFeedback status={pwStatus} />
          </div>
        </form>
      </Card>

      <Card className="p-6 mt-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sessions</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Sign out of all devices to revoke all active sessions.
        </p>
        <Button variant="danger" onClick={logout}>Sign Out All Devices</Button>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <SectionHeader title="Notifications" subtitle="Choose what updates you receive" />
      <Card className="px-6 pt-2">
        <ToggleRow label="Job Matches" desc="Get notified when new jobs match your skills"
          checked={notifs.jobMatches} onChange={(v) => setNotifs((p) => ({ ...p, jobMatches: v }))} />
        <ToggleRow label="Roadmap Updates" desc="Updates when your roadmap is modified"
          checked={notifs.roadmapUpdates} onChange={(v) => setNotifs((p) => ({ ...p, roadmapUpdates: v }))} />
        <ToggleRow label="Skill Progress" desc="When you hit skill proficiency milestones"
          checked={notifs.skillProgress} onChange={(v) => setNotifs((p) => ({ ...p, skillProgress: v }))} />
        <ToggleRow label="Weekly Digest" desc="A weekly summary of your career progress"
          checked={notifs.weeklyDigest} onChange={(v) => setNotifs((p) => ({ ...p, weeklyDigest: v }))} />
        <ToggleRow label="AI Recommendations" desc="Personalized suggestions from your AI Copilot"
          checked={notifs.aiRecommendations} onChange={(v) => setNotifs((p) => ({ ...p, aiRecommendations: v }))} />
      </Card>
    </div>
  );

  const renderAppearance = () => (
    <div>
      <SectionHeader title="Appearance" subtitle="Customize how SkillOS looks" />
      <Card className="p-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark',  label: 'Dark',  icon: Moon },
            { id: 'system',label: 'System',icon: Monitor },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = id === (isDark ? 'dark' : 'light');
            return (
              <button key={id} onClick={toggleTheme}
                className="p-4 rounded-xl text-center transition-all"
                style={{
                  background: isActive ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                  border: `1px solid ${isActive ? 'var(--accent-muted)' : 'var(--border)'}`,
                }}>
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} />
                <div className="text-xs font-semibold" style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>{label}</div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderData = () => (
    <div>
      <SectionHeader title="Data & Privacy" subtitle="Control your data and account" />
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Export Your Data</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Download all your SkillOS data as a JSON file.</p>
          <Button variant="secondary">Export My Data</Button>
        </div>
        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--danger)' }}>Delete Account</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button variant="danger">Delete Account</Button>
        </div>
      </Card>
    </div>
  );

  const contentMap = {
    account: renderAccount,
    security: renderSecurity,
    notifications: renderNotifications,
    appearance: renderAppearance,
    data: renderData,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="section-subtitle mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <Card className="p-3 h-fit">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: activeSection === id ? 'var(--accent-subtle)' : 'transparent',
                color: activeSection === id ? 'var(--accent)' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => { if (activeSection !== id) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { if (activeSection !== id) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {(contentMap[activeSection] || (() => null))()}
        </div>
      </div>
    </div>
  );
}
