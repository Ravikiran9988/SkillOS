import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-400" /> My Profile & Career Goals
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your student identity and primary career aspirations.
        </p>
      </div>

      {/* ─── Profile Details & Goal Form ─────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-xl shadow-indigo-500/20">
            {profile?.name ? profile.name.charAt(0) : 'S'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{profile?.name}</h2>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {profile?.email}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> {profile?.educationLevel}
              </span>
            </div>
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
                Primary Target Career Goal
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

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Career Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
