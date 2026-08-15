import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  GraduationCap,
  Briefcase,
  Target,
  Brain,
  FolderGit2,
  Edit3,
  Download,
  ExternalLink,
  Github,
  Linkedin,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import EditProfileModal from '../components/EditProfileModal';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStudent(user.id);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const handleProfileUpdated = (updated) => {
    setProfile(updated);
    updateUser(updated);
    setSaveSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  if (loading) return <LoadingSpinner message="Loading your comprehensive student career profile..." />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  // Calculate accurate profile completion
  const skillsCount = profile?.skills?.length || 0;
  const projectsCount = profile?.projects?.length || 2;
  const completionItems = [
    { label: 'Basic Information & Name', done: !!profile?.name },
    { label: 'Professional Headline', done: !!profile?.headline },
    { label: 'Education Details', done: !!profile?.educationLevel },
    { label: 'Primary Target Goal', done: !!profile?.targetCareer },
    { label: 'Verified Technical Skills', done: skillsCount >= 3 },
    { label: 'Portfolio Projects', done: projectsCount >= 1 },
    { label: 'GitHub / Professional Links', done: !!profile?.github || !!profile?.linkedin },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* ─── Success Notification ────────────────────────────────────────── */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* ─── Profile Header Hero ─────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-2xl shadow-indigo-500/30 shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile?.name}</h1>
              <p className="text-xs sm:text-sm text-indigo-300 font-medium">
                {profile?.headline || 'Aspiring AI Engineer | Software Developer'}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {profile?.email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {profile?.location || 'Bengaluru, India'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> {profile?.educationLevel || "Bachelor's"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Button
              icon={Edit3}
              onClick={() => setIsEditModalOpen(true)}
              className="shadow-lg shadow-indigo-600/20"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Profile Strength Indicator ─────────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Profile Strength</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              A comprehensive profile increases recruiter visibility and job match accuracy.
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            {completionPct}% Complete
          </span>
        </div>

        <ProgressBar value={completionPct} color="emerald" size="md" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
            >
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className={item.done ? 'text-slate-300' : 'text-amber-300 font-medium'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Personal Summary & Career Goal ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* About & Bio */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> About & Summary
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {profile?.bio ||
              'Computer science student passionate about artificial intelligence, graph databases, and high-scale systems. Actively developing projects in deep learning and full-stack software.'}
          </p>
        </Card>

        {/* Primary Career Goal */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Target Career Goal
            </h3>
            <button
              onClick={() => navigate('/careers')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Explore Tracks
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">
                {profile?.targetCareer?.title || profile?.targetCareer || 'AI Researcher'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Primary Target Aspiration</div>
            </div>
            <Badge variant="brand" size="sm">
              Active Goal
            </Badge>
          </div>
        </Card>
      </div>

      {/* ─── Education & Career Preferences ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" /> Education
          </h3>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-white">
                  {profile?.branch || 'Computer Science & Engineering'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {profile?.university || 'Indian Institute of Technology'}
                </div>
              </div>
              <Badge variant="slate" size="sm">
                Class of {profile?.graduationYear || '2026'}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
              <span>Degree: <strong className="text-slate-200">{profile?.educationLevel || "Bachelor's"}</strong></span>
              <span>·</span>
              <span>CGPA: <strong className="text-emerald-400">{profile?.cgpa || '8.9 / 10'}</strong></span>
            </div>
          </div>
        </Card>

        {/* Career Preferences */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" /> Career Preferences
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Work Preference:</span>
              <span className="font-semibold text-slate-200">{profile?.workPreference || 'Remote / Hybrid'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Preferred Location:</span>
              <span className="font-semibold text-slate-200">{profile?.preferredLocation || 'Bengaluru / Remote'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Expected Salary:</span>
              <span className="font-semibold text-emerald-400">{profile?.expectedSalary || '$120,000 / yr'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Social & Professional Links ─────────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" /> Social & Professional Profiles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <a
            href={profile?.github || 'https://github.com'}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2.5">
              <Github className="w-4 h-4 text-slate-300" />
              <span className="font-semibold text-slate-200 group-hover:text-white">GitHub</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
          </a>

          <a
            href={profile?.linkedin || 'https://linkedin.com'}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2.5">
              <Linkedin className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-slate-200 group-hover:text-white">LinkedIn</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
          </a>

          <a
            href={profile?.portfolio || 'https://portfolio.dev'}
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-200 group-hover:text-white">Portfolio</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
          </a>
        </div>
      </Card>

      {/* ─── Edit Profile Modal ─────────────────────────────────────────── */}
      <EditProfileModal
        student={profile}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={handleProfileUpdated}
      />
    </div>
  );
}
