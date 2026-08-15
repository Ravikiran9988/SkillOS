import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Sparkles,
  Target,
  TrendingUp,
  Brain,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Bot,
  Compass,
  Zap,
  BookOpen,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);
  const [skillGap, setSkillGap] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [roadmap, setRoadmap] = useState(null);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const [profileData, matchesData, jobsData] = await Promise.all([
        api.getStudent(user.id),
        api.getCareerMatch(user.id).catch(() => []),
        api.getRecommendedJobs(user.id).catch(() => []),
      ]);

      setProfile(profileData);
      const matches = Array.isArray(matchesData) ? matchesData : [];
      setCareerMatches(matches);
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      const targetCareerId = profileData?.targetCareer?.id || matches[0]?.careerRole?.id;

      if (targetCareerId) {
        const [gapData, roadmapData] = await Promise.all([
          api.getCareerMatch(user.id, targetCareerId).catch(() => null),
          api.getLearningPath(user.id, targetCareerId).catch(() => null),
        ]);
        setSkillGap(gapData);
        setRoadmap(roadmapData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load career dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Assembling your personal career intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboardData} />;

  const targetRole = profile?.targetCareer || careerMatches[0]?.careerRole;
  const matchPct = skillGap?.matchPercentage ?? careerMatches[0]?.matchPercentage ?? 0;
  const skillsCount = profile?.skills?.length || 0;
  const missingSkills = skillGap?.missingSkills || [];
  const readinessPct = Math.min(100, Math.round(matchPct * 0.9 + Math.min(skillsCount, 6) * 2));

  // Compute realistic next actions
  const nextActions = [];
  if (missingSkills.length > 0) {
    const topMissing = missingSkills[0];
    nextActions.push({
      id: 'action-skill',
      title: `Learn ${topMissing.name}`,
      reason: `Required by ${targetRole?.title || 'your goal'} and ${Math.round(jobs.length * 0.6) || 3} matched jobs`,
      impact: `+${Math.round(100 / Math.max(1, (skillGap?.totalRequired || 6)))}% career match`,
      action: () => navigate('/roadmap'),
      cta: 'View in Roadmap',
    });
  }
  if (!profile?.targetCareer) {
    nextActions.push({
      id: 'action-goal',
      title: 'Set your primary career goal',
      reason: 'Unlocks tailored prerequisite DAG traversal and curated learning roadmap',
      impact: 'Personalized Roadmap',
      action: () => navigate('/careers'),
      cta: 'Explore Careers',
    });
  }
  if (jobs.length > 0) {
    nextActions.push({
      id: 'action-jobs',
      title: `Apply to ${jobs[0]?.title || 'top matched job'}`,
      reason: `You match ${jobs[0]?.matchPercentage || 70}% of requirements for ${jobs[0]?.company?.name || 'this company'}`,
      impact: 'Immediate Opportunity',
      action: () => navigate('/jobs'),
      cta: 'View Job Match',
    });
  }
  nextActions.push({
    id: 'action-copilot',
    title: 'Consult AI Career Copilot',
    reason: 'Get structured recommendations grounded in your live CognoDB portfolio',
    impact: 'AI Career Advice',
    action: () => navigate('/copilot'),
    cta: 'Chat with Copilot',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero Welcome Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Career Copilot Active
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-normal leading-relaxed">
            Let's get you closer to your dream career. Here is your live graph-powered readiness analysis for{' '}
            <span className="font-bold text-indigo-300">{targetRole?.title || 'your target career'}</span>.
          </p>
        </div>

        {/* Ambient background shape */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── 4 Core Metric Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Target Career */}
        <div
          onClick={() => navigate('/careers')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Target Goal</span>
            <Target className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-white truncate">
            {targetRole?.title || 'Set Target Goal'}
          </div>
          <div className="text-xs text-indigo-400 mt-1 flex items-center gap-1 font-medium">
            <span>Change goal</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Career Match */}
        <div
          onClick={() => navigate('/skill-gap')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Career Match</span>
            <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {matchPct}%
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            {skillGap?.matchedCount || 0} of {skillGap?.totalRequired || 0} required skills
          </div>
        </div>

        {/* Job Readiness */}
        <div
          onClick={() => navigate('/jobs')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-purple-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Job Readiness</span>
            <Zap className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">
            {readinessPct}%
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            {jobs.length} matched industry jobs
          </div>
        </div>

        {/* Skills Portfolio */}
        <div
          onClick={() => navigate('/skills')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-blue-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">My Skills</span>
            <Brain className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">
            {skillsCount}
          </div>
          <div className="text-xs text-slate-400 mt-1 truncate">
            Verified in portfolio
          </div>
        </div>
      </div>

      {/* ─── Visual Personal Career Journey Stepper ──────────────────────── */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Your Personal Career Journey</h2>
            <p className="text-xs text-slate-400 mt-0.5">Step-by-step progression towards job-readiness</p>
          </div>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Phase 3: Active Gap Closure
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'Current Level', status: profile?.educationLevel || "Bachelor's", complete: true },
            { step: '2', title: 'Your Skills', status: `${skillsCount} Verified`, complete: skillsCount > 0 },
            { step: '3', title: 'Target Goal', status: targetRole?.title || 'Selected', complete: !!targetRole },
            { step: '4', title: 'Skill Gaps', status: `${missingSkills.length} Missing`, complete: false, current: true },
            { step: '5', title: 'Roadmap', status: `${roadmap?.orderedSkills?.length || 0} Steps`, complete: false },
            { step: '6', title: 'Job Ready', status: `${readinessPct}% Ready`, complete: false },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-3.5 rounded-2xl border transition text-center ${
                item.complete
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                  : item.current
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 text-white'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center mb-1.5">
                {item.complete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                      item.current ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.step}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold truncate">{item.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{item.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Next Best Actions & Copilot ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Your Next Best Actions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">High-leverage tasks calculated to boost your job readiness</p>
            </div>
          </div>

          <div className="space-y-3">
            {nextActions.map((action, idx) => (
              <div
                key={action.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                      {action.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{action.reason}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {action.impact}
                  </span>
                  <button
                    onClick={action.action}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-semibold text-white transition flex items-center gap-1.5"
                  >
                    <span>{action.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Copilot Quick Prompt (1 col) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4 text-indigo-400" /> AI Career Copilot
            </div>
            <h3 className="text-lg font-bold text-white">Ask your copilot anything</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Get personalized career strategy grounded in your live CognoDB knowledge graph.
            </p>

            <div className="mt-4 space-y-2">
              {[
                'What should I learn next?',
                'Am I ready for an AI Engineer role?',
                'Which projects should I build?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => navigate('/copilot', { state: { initialPrompt: prompt } })}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-900/50 border border-slate-800/80 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition flex items-center justify-between"
                >
                  <span>"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/copilot')}
            className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4" /> Open Full Copilot Chat
          </button>
        </div>
      </div>
    </div>
  );
}
