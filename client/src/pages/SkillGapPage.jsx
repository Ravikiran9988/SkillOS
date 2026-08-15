import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  BarChart3,
  Target,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Bot,
  Map,
  Sparkles,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function SkillGapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);

  const loadGapData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, matchesData] = await Promise.all([
        api.getStudent(user.id),
        api.getCareerMatch(user.id).catch(() => []),
      ]);

      const matches = Array.isArray(matchesData) ? matchesData : [];
      setCareerMatches(matches);

      const targetCareerId = profileData?.targetCareer?.id || matches[0]?.careerRole?.id;

      if (targetCareerId) {
        const gap = await api.getCareerMatch(user.id, targetCareerId);
        setGapData(gap);
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate your skill gap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGapData();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Calculating your exact skill gap against CognoDB..." />;
  if (error) return <ErrorState message={error} onRetry={loadGapData} />;

  const targetRole = gapData?.career || careerMatches[0]?.careerRole;
  const matchPct = gapData?.matchPercentage ?? 0;
  const matchedSkills = gapData?.matchedSkills || [];
  const missingSkills = gapData?.missingSkills || [];

  const criticalGaps = missingSkills.filter((s) => (s.importance || '').toLowerCase() === 'critical');
  const highGaps = missingSkills.filter((s) => (s.importance || '').toLowerCase() === 'high');
  const mediumGaps = missingSkills.filter(
    (s) => !['critical', 'high'].includes((s.importance || '').toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" /> What's Between You & Your Career Goal?
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Prioritized competency gaps required to reach 100% job-readiness for{' '}
            <span className="font-bold text-indigo-300">{targetRole?.title || 'your target career'}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/roadmap')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Map className="w-4 h-4" /> Open Learning Roadmap
        </button>
      </div>

      {/* ─── Top Target Summary Banner ───────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role</div>
            <div className="text-xl font-extrabold text-white">{targetRole?.title || 'Target Role'}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {gapData?.totalRequired || 0} total competencies required
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-400">Current Match</div>
            <div className="text-3xl font-extrabold text-emerald-400">{matchPct}%</div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-slate-400">Missing Gaps</div>
            <div className="text-3xl font-extrabold text-rose-400">{missingSkills.length}</div>
          </div>
        </div>
      </div>

      {/* ─── Missing Skills by Priority Buckets ───────────────────────────── */}
      <div className="space-y-6">
        {/* 🔴 Critical Priority */}
        {criticalGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" /> 🔴 Critical Priority Gaps ({criticalGaps.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalGaps.map((skill) => (
                <SkillGapCard key={skill.id} skill={skill} targetRole={targetRole} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* 🟠 High Priority */}
        {highGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> 🟠 High Priority Gaps ({highGaps.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highGaps.map((skill) => (
                <SkillGapCard key={skill.id} skill={skill} targetRole={targetRole} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* 🟡 Medium Priority */}
        {mediumGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold uppercase tracking-wider">
              <Info className="w-4 h-4" /> 🟡 Medium Priority Gaps ({mediumGaps.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mediumGaps.map((skill) => (
                <SkillGapCard key={skill.id} skill={skill} targetRole={targetRole} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* 🟢 Already Matched Skills */}
        {matchedSkills.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> 🟢 Skills You Already Have ({matchedSkills.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((s) => (
                <div
                  key={s.id}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillGapCard({ skill, targetRole, navigate }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition shadow-lg flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {skill.category || 'Competency'}
            </span>
            <h3 className="text-base font-bold text-white mt-1.5">{skill.name}</h3>
          </div>
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              (skill.importance || '').toLowerCase() === 'critical'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            {skill.importance || 'High'} Priority
          </span>
        </div>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Required to satisfy <span className="font-semibold text-white">{targetRole?.title}</span> industry requirements.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
        <button
          onClick={() => navigate('/roadmap')}
          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
        >
          <span>View in Roadmap</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        <button
          onClick={() =>
            navigate('/copilot', {
              state: { initialPrompt: `How should I learn ${skill.name} for my ${targetRole?.title} goal?` },
            })
          }
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask Copilot</span>
        </button>
      </div>
    </div>
  );
}
