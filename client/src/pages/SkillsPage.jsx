import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Brain,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  Search,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const PROFICIENCY_SCORES = {
  Beginner: 40,
  Intermediate: 70,
  Advanced: 100,
};

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [allAvailableSkills, setAllAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('Intermediate');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSkills = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [studentSkills, allSkillsList] = await Promise.all([
        api.getStudentSkills(user.id),
        api.getAllSkills().catch(() => []),
      ]);
      setSkills(studentSkills || []);
      setAllAvailableSkills(allSkillsList || []);
      if (allSkillsList?.length > 0) {
        setSelectedSkillId(allSkillsList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [user?.id]);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setActionLoading(true);
    try {
      await api.addStudentSkill(user.id, selectedSkillId, selectedProficiency);
      setIsAdding(false);
      await loadSkills();
    } catch (err) {
      alert(err.message || 'Failed to add skill');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    if (!confirm('Are you sure you want to remove this skill from your verified portfolio?')) return;
    try {
      await api.removeStudentSkill(user.id, skillId);
      await loadSkills();
    } catch (err) {
      alert(err.message || 'Failed to remove skill');
    }
  };

  if (loading) return <LoadingSpinner message="Loading your verified skills from CognoDB..." />;
  if (error) return <ErrorState message={error} onRetry={loadSkills} />;

  const filteredSkills = skills.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.toLowerCase().includes(search.toLowerCase())
  );

  const unaddedSkills = allAvailableSkills.filter(
    (as) => !skills.some((s) => s.id === as.id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-indigo-400" /> My Skills Portfolio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verified technical competencies tracked in your personal SkillOS knowledge graph.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Verified Skill
        </button>
      </div>

      {/* ─── Search & Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified skills or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-2">
          <span>Total Skills:</span>
          <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded-md">
            {skills.length}
          </span>
        </div>
      </div>

      {/* ─── Add Skill Modal ─────────────────────────────────────────────── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" /> Add Verified Skill
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Competency
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {unaddedSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category || 'Skill'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={selectedProficiency}
                  onChange={(e) => setSelectedProficiency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Project-Ready)</option>
                  <option value="Advanced">Advanced (Production-Grade)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Add to Portfolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Skills Grid ─────────────────────────────────────────────────── */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/60">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No skills in portfolio</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No skills matched your search query.' : 'Add your first technical skill to generate career matches.'}
          </p>
          {!search && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Skill
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const score = PROFICIENCY_SCORES[skill.proficiency] || 60;
            const isReady = score >= 70;

            return (
              <div
                key={skill.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {skill.category || 'Competency'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{skill.name}</h3>
                    </div>

                    <button
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Visual Progress Indicator */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Proficiency Mastery</span>
                      <span className="font-bold text-indigo-300">{score}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score === 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : score >= 70
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Level:</span>
                    <span className="font-semibold text-slate-200">{skill.proficiency || 'Intermediate'}</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isReady
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {isReady ? 'Job Ready' : 'In Progress'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
