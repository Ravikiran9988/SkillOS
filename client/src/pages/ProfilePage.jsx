import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  User,
  Mail,
  GraduationCap,
  Target,
  Brain,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [careers, setCareers] = useState([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [educationLevel, setEducationLevel] = useState("Bachelor's");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, careersData] = await Promise.all([
        api.getStudent(user.id),
        api.getCareers().catch(() => []),
      ]);
      setProfile(profileData);
      setCareers(careersData || []);
      setEducationLevel(profileData?.educationLevel || "Bachelor's");
      if (profileData?.targetCareer?.id) {
        setSelectedCareerId(profileData.targetCareer.id);
      } else if (careersData?.length > 0) {
        setSelectedCareerId(careersData[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedCareerId || !user?.id) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.setTargetCareer(user.id, selectedCareerId);
      const chosenCareer = careers.find((c) => c.id === selectedCareerId);
      updateUser({ targetCareer: chosenCareer, educationLevel });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await loadProfile();
    } catch (err) {
      alert(err.message || 'Failed to update career goal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your student profile from CognoDB..." />;
  if (error) return <ErrorState message={error} onRetry={loadProfile} />;

  const skillsCount = profile?.skills?.length || 0;
  const projectsCount = profile?.projects?.length || 2;
  const completionItems = [
    { label: 'Basic Student Identity', done: !!profile?.name },
    { label: 'Education Level', done: !!profile?.educationLevel },
    { label: 'Primary Target Goal', done: !!profile?.targetCareer },
    { label: 'Verified Technical Skills', done: skillsCount >= 3 },
    { label: 'Portfolio Projects', done: projectsCount >= 1 },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* ─── Header Profile Hero ─────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-xl shadow-indigo-500/25 shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{profile?.name}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {profile?.email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> {profile?.educationLevel}
                </span>
              </div>
              {profile?.targetCareer && (
                <div className="mt-2.5">
                  <Badge variant="brand" icon={Target}>
                    Goal: {profile.targetCareer.title || profile.targetCareer}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-800">
            <div className="text-xs font-semibold text-slate-400">Verified Skills</div>
            <div className="text-2xl font-extrabold text-indigo-400">{skillsCount}</div>
          </div>
        </div>
      </Card>

      {/* ─── Profile Completion & Readiness ──────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Profile Strength</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Completing your portfolio strengthens skill inference and job matching
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {completionPercentage}% Complete
          </span>
        </div>

        <ProgressBar value={completionPercentage} color="emerald" size="md" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {completionItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-slate-300 p-2 rounded-xl bg-slate-950/40 border border-slate-800/80"
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

      {/* ─── Target Career Goal Form ─────────────────────────────────────── */}
      <Card className="p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Primary Career Goal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your aspiration to configure real-time prerequisite DAG traversal
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Target career goal successfully updated and synchronized across SkillOS!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Target Role
              </label>
              <select
                value={selectedCareerId}
                onChange={(e) => setSelectedCareerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Education Level
              </label>
              <input
                type="text"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} icon={Save}>
              Save Career Goal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
