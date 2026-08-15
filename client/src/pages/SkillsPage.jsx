import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Brain,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  Search,
  ArrowRight,
  Target,
  Zap,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

const PROFICIENCY_SCORES = {
  Beginner: 40,
  Intermediate: 75,
  Advanced: 100,
};

export default function SkillsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [allAvailableSkills, setAllAvailableSkills] = useState([]);
  const [gapData, setGapData] = useState(null);
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
      const [studentSkills, allSkillsList, profileData] = await Promise.all([
        api.getStudentSkills(user.id),
        api.getAllSkills().catch(() => []),
        api.getStudent(user.id).catch(() => null),
      ]);
      setSkills(studentSkills || []);
      setAllAvailableSkills(allSkillsList || []);
      if (allSkillsList?.length > 0) {
        setSelectedSkillId(allSkillsList[0].id);
      }

      const targetCareerId = profileData?.targetCareer?.id;
      if (targetCareerId) {
        const gap = await api.getCareerMatch(user.id, targetCareerId).catch(() => null);
        setGapData(gap);
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

  const missingSkills = gapData?.missingSkills || [];
  const criticalHoldingBack = missingSkills.filter((s) => (s.importance || '').toLowerCase() === 'critical').slice(0, 3);
  const topStrengths = skills.filter((s) => s.proficiency === 'Advanced' || s.proficiency === 'Intermediate').slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-indigo-400" /> My Skills Portfolio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Personal competency command center connecting your skills to career benchmarks.
          </p>
        </div>

        <Button icon={Plus} onClick={() => setIsAdding(true)}>
          Add Verified Skill
        </Button>
      </div>

      {/* ─── Top Highlights (Top Skills vs Skills Holding You Back) ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Top Strengths in Your Stack
            </div>
            <Badge variant="emerald">{topStrengths.length} Verified</Badge>
          </div>

          <div className="space-y-2.5">
            {topStrengths.length > 0 ? (
              topStrengths.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-400">{s.category || 'Skill'}</div>
                  </div>
                  <Badge variant="emerald" size="sm">
                    {s.proficiency || 'Intermediate'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Add skills to highlight top strengths.</p>
            )}
          </div>
        </Card>

        {/* Skills Holding You Back */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertOctagon className="w-4 h-4" /> Critical Competencies Needed
            </div>
            <Badge variant="rose">{criticalHoldingBack.length} Blockers</Badge>
          </div>

          <div className="space-y-2.5">
            {criticalHoldingBack.length > 0 ? (
              criticalHoldingBack.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-rose-400 font-medium">Critical Requirement</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/roadmap')}
                  >
                    View in Roadmap
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No critical blockers identified for this role.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Search and Filters ──────────────────────────────────────────── */}
      <Card className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified skills by name or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="text-xs font-semibold text-slate-400 px-3 flex items-center gap-2">
          <span>Total Skills:</span>
          <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded-md">
            {skills.length}
          </span>
        </div>
      </Card>

      {/* ─── Add Skill Modal ─────────────────────────────────────────────── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full shadow-2xl space-y-4 bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" /> Add Verified Skill
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white text-sm">
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
                <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={actionLoading}>
                  Add to Portfolio
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── Verified Skills Grid ────────────────────────────────────────── */}
      {filteredSkills.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No skills in portfolio</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No skills matched your search query.' : 'Add your first technical skill to start matching career paths.'}
          </p>
          {!search && (
            <Button icon={Plus} onClick={() => setIsAdding(true)} className="mt-4">
              Add Skill
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const score = PROFICIENCY_SCORES[skill.proficiency] || 70;
            const isReady = score >= 75;

            return (
              <Card
                key={skill.id}
                className="p-5 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="brand" size="sm">
                        {skill.category || 'Competency'}
                      </Badge>
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

                  {/* Progress Indicator */}
                  <div className="mt-4 space-y-1">
                    <ProgressBar
                      value={score}
                      label="Proficiency Mastery"
                      showLabel
                      size="sm"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Level: <strong className="text-slate-200">{skill.proficiency || 'Intermediate'}</strong>
                  </span>
                  <Badge variant={isReady ? 'emerald' : 'amber'} size="sm">
                    {isReady ? 'Ready' : 'Improving'}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
