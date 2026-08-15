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
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

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
  if (!career) return <ErrorState message="Career role not found." />;

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

        <Card className="p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="brand" icon={Target}>
              Career Track
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{career.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {career.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-semibold">Your Match</div>
              <div className="text-2xl font-extrabold text-emerald-400">{matchPct}%</div>
            </div>

            <Button
              variant={isTarget ? 'secondary' : 'primary'}
              icon={Target}
              loading={settingGoal}
              disabled={settingGoal || isTarget}
              onClick={handleSetTargetCareer}
            >
              {isTarget ? 'Current Target Goal' : 'Set as My Target Goal'}
            </Button>
          </div>
        </Card>
      </div>

      {/* ─── Matched vs Missing Skills Breakdown ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Skills You Have */}
        <Card className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Verified Skills You Have ({gapData?.matchedSkills?.length || 0})
            </h3>
            <Badge variant="emerald">Matched</Badge>
          </div>

          <div className="space-y-2">
            {(gapData?.matchedSkills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{skill.name}</div>
                  <div className="text-[10px] text-slate-400">{skill.category || 'Skill'}</div>
                </div>
                <Badge variant="emerald" size="sm">
                  Ready
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Missing Competencies to Learn */}
        <Card className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Missing Skills to Acquire ({gapData?.missingSkills?.length || 0})
            </h3>
            <Badge variant="rose">Skill Gap</Badge>
          </div>

          <div className="space-y-2">
            {(gapData?.missingSkills || []).map((skill) => (
              <div
                key={skill.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">{skill.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Priority: {skill.importance || 'High'}
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate('/copilot', {
                      state: { initialPrompt: `How should I learn ${skill.name} for ${career.title}?` },
                    })
                  }
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Bot className="w-3.5 h-3.5" /> Guide
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
