import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  ChevronRight,
  Briefcase,
  Target,
  Bot,
  Sparkles,
  Map,
} from 'lucide-react';
import { getCareer, getCareerMatch, getLearningPath, getCareerJobs, setTargetCareer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/LoadingSkeleton';

export default function CareerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [career, setCareer] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingGoal, setSettingGoal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const basePromises = [getCareer(id), getCareerJobs(id)];
    if (user?.id) {
      basePromises.push(
        getCareerMatch(user.id, id).catch(() => null),
        getLearningPath(user.id, id).catch(() => null)
      );
    }

    Promise.all(basePromises)
      .then(([c, j, gap, path]) => {
        setCareer(c);
        setJobs(j || []);
        if (gap) setGapData(gap);
        if (path) setLearningPath(path);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  const handleSetTargetCareer = async () => {
    if (!user?.id || !career) return;
    setSettingGoal(true);
    try {
      await setTargetCareer(user.id, career.id);
      updateUser({ targetCareer: career });
      alert(`Target career updated to ${career.title}!`);
    } catch (err) {
      alert(err.message || 'Failed to update target career');
    } finally {
      setSettingGoal(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!career) return <ErrorState message="Career not found." />;

  const matchPct = gapData?.matchPercentage ?? 0;
  const isTarget = user?.targetCareer?.id === career.id || user?.targetCareer?.title === career.title;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Back Button & Header ────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/careers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Career Explorer
        </button>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Career Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{career.title}</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              {career.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-semibold">Your Match</div>
              <div className="text-2xl font-extrabold text-emerald-400">{matchPct}%</div>
            </div>

            <button
              onClick={handleSetTargetCareer}
              disabled={settingGoal || isTarget}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isTarget
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{isTarget ? 'Current Target Goal' : 'Set as My Target Goal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Required vs Missing Skills Breakdown ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Already Matched */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Verified Skills You Have ({gapData?.matchedSkills?.length || 0})
            </h3>
          </div>

          <div className="space-y-2">
            {(gapData?.matchedSkills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{skill.name}</div>
                  <div className="text-[10px] text-slate-400">{skill.category}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Skills Gap */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Missing Competencies to Learn ({gapData?.missingSkills?.length || 0})
            </h3>
          </div>

          <div className="space-y-2">
            {(gapData?.missingSkills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{skill.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {skill.category} · Priority: {skill.importance || 'High'}
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate('/copilot', {
                      state: { initialPrompt: `How can I learn ${skill.name} for ${career.title}?` },
                    })
                  }
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Bot className="w-3.5 h-3.5" /> Guide
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
