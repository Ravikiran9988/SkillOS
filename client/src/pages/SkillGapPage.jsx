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
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

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

  if (loading) return <LoadingSpinner message="Calculating your skill gap against CognoDB..." />;
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
            <BarChart3 className="w-7 h-7 text-indigo-400" /> Your Skill Gap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here's what stands between you and your goal of becoming a{' '}
            <span className="font-bold text-indigo-300">{targetRole?.title || 'Target Role'}</span>.
          </p>
        </div>

        <Button icon={Map} onClick={() => navigate('/roadmap')}>
          Open Learning Roadmap
        </Button>
      </div>

      {/* ─── Top Target Summary Banner ───────────────────────────────────── */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role</span>
            <div className="text-xl font-extrabold text-white">{targetRole?.title || 'Target Role'}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {gapData?.totalRequired || 0} total required competencies
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
      </Card>

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
                <Badge key={s.id} variant="emerald" icon={CheckCircle2}>
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillGapCard({ skill, targetRole, navigate }) {
  const isCritical = (skill.importance || '').toLowerCase() === 'critical';

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="slate" size="sm">
              {skill.category || 'Competency'}
            </Badge>
            <h3 className="text-base font-bold text-white mt-1.5">{skill.name}</h3>
          </div>
          <Badge variant={isCritical ? 'rose' : 'amber'} size="sm">
            {skill.importance || 'High'} Priority
          </Badge>
        </div>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          Required to satisfy <strong className="text-white">{targetRole?.title}</strong> industry requirements.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/roadmap')}
        >
          Add to Roadmap
        </Button>

        <button
          onClick={() =>
            navigate('/copilot', {
              state: { initialPrompt: `How should I learn ${skill.name} for my ${targetRole?.title} goal?` },
            })
          }
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
        >
          <Bot className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ask Copilot</span>
        </button>
      </div>
    </Card>
  );
}
