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
  AlertOctagon,
  Clock,
  Zap,
  Bot,
  Map,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

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
      setError(err.message || 'Failed to load career intelligence.');
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
      title: `Master ${topMissing.name}`,
      reason: `Directly required by ${targetRole?.title || 'your goal'} and ${Math.max(1, Math.round(jobs.length * 0.6))} matched jobs`,
      impact: `+${Math.round(100 / Math.max(1, skillGap?.totalRequired || 6))}% career match`,
      difficulty: 'Intermediate',
      estimatedTime: '2 weeks',
      action: () => navigate('/roadmap'),
      cta: 'Start Learning',
    });
  }
  if (!profile?.targetCareer) {
    nextActions.push({
      id: 'action-goal',
      title: 'Set your primary career goal',
      reason: 'Enables tailored prerequisite DAG traversal and curated learning milestones',
      impact: 'Unlocks Roadmap',
      difficulty: 'Foundational',
      estimatedTime: '5 mins',
      action: () => navigate('/careers'),
      cta: 'Explore Careers',
    });
  }
  if (jobs.length > 0) {
    nextActions.push({
      id: 'action-jobs',
      title: `Prepare for ${jobs[0]?.title || 'top matched job'}`,
      reason: `You match ${jobs[0]?.matchPercentage || 70}% of requirements for ${jobs[0]?.company?.name || 'this company'}`,
      impact: 'Immediate Opportunity',
      difficulty: 'Ready to Apply',
      estimatedTime: '1 day',
      action: () => navigate('/jobs'),
      cta: 'View Job Details',
    });
  }
  nextActions.push({
    id: 'action-copilot',
    title: 'Consult AI Career Copilot',
    reason: 'Get structured recommendations grounded in your live CognoDB portfolio',
    impact: 'Personalized Strategy',
    difficulty: 'Interactive',
    estimatedTime: 'Instant',
    action: () => navigate('/copilot'),
    cta: 'Chat with Copilot',
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero Welcome Section ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/30 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-2">
          <Badge variant="ai" icon={Sparkles}>
            AI Career Copilot Active
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Student'} 👋
          </h1>
          <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed">
            Let's get you closer to your goal of becoming a{' '}
            <span className="font-bold text-indigo-300">
              {targetRole?.title || 'your target career'}
            </span>
            .
          </p>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ─── Compact Career Readiness Summary (4 Cards) ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Career Match */}
        <Card
          hover
          onClick={() => navigate('/skill-gap')}
          className="p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Career Match</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">{matchPct}%</div>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">
              {skillGap?.matchedCount || 0} of {skillGap?.totalRequired || 0} required skills matched.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>Diagnose gap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Job Readiness */}
        <Card
          hover
          onClick={() => navigate('/jobs')}
          className="p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Job Readiness</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-purple-400">{readinessPct}%</div>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">
              Based on {jobs.length} open industry roles matching your verified stack.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>Explore openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Verified Skills */}
        <Card
          hover
          onClick={() => navigate('/skills')}
          className="p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Verified Skills</span>
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold text-blue-400">{skillsCount}</div>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">
              Competencies verified in your portfolio graph.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>Manage skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        {/* Skill Gaps */}
        <Card
          hover
          onClick={() => navigate('/skill-gap')}
          className="p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Skill Gaps</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400">{missingSkills.length}</div>
            <p className="text-xs text-slate-300 mt-1.5 leading-snug">
              Missing competencies standing between you & target career.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold">
            <span>View roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>
      </div>

      {/* ─── Visual Career Journey Stepper ───────────────────────────────── */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Your Personal Career Journey</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live progression derived from your CognoDB knowledge graph
            </p>
          </div>
          <Badge variant="brand">Phase 3: Active Gap Closure</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'Current Level', subtitle: profile?.educationLevel || "Bachelor's", status: 'completed', path: '/profile' },
            { step: '2', title: 'Your Skills', subtitle: `${skillsCount} Verified`, status: skillsCount > 0 ? 'completed' : 'current', path: '/skills' },
            { step: '3', title: 'Target Goal', subtitle: targetRole?.title || 'Selected', status: targetRole ? 'completed' : 'current', path: '/careers' },
            { step: '4', title: 'Skill Gaps', subtitle: `${missingSkills.length} Missing`, status: 'current', path: '/skill-gap' },
            { step: '5', title: 'Roadmap', subtitle: `${roadmap?.orderedSkills?.length || 0} Steps`, status: 'next', path: '/roadmap' },
            { step: '6', title: 'Job Ready', subtitle: `${readinessPct}% Ready`, status: 'locked', path: '/jobs' },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => navigate(item.path)}
              className={`p-3.5 rounded-2xl border transition text-center cursor-pointer group ${
                item.status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200 hover:border-emerald-500/50'
                  : item.status === 'current'
                  ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {item.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      item.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.step}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold truncate group-hover:text-indigo-300 transition">
                {item.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtitle}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Next Best Actions & Copilot Shortcut ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Your Next Best Actions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-leverage tasks calculated to boost your job readiness
            </p>
          </div>

          <div className="space-y-3">
            {nextActions.map((action, idx) => (
              <Card
                key={action.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{action.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{action.reason}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>Difficulty: <strong className="text-slate-300">{action.difficulty}</strong></span>
                      <span>·</span>
                      <span>Est: <strong className="text-slate-300">{action.estimatedTime}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                  <Badge variant="emerald">{action.impact}</Badge>
                  <Button size="sm" onClick={action.action}>
                    {action.cta}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Copilot Quick Assistant (1 col) */}
        <Card className="p-6 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border-indigo-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4 text-indigo-400" /> AI Career Copilot
            </div>
            <h3 className="text-lg font-bold text-white">Ask your copilot anything</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Personalized career guidance grounded in your live CognoDB knowledge graph.
            </p>

            <div className="mt-4 space-y-2">
              {[
                'What should I learn next?',
                'Am I ready for my target role?',
                'Which projects should I build?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => navigate('/copilot', { state: { initialPrompt: prompt } })}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-200 hover:text-white transition flex items-center justify-between group"
                >
                  <span className="truncate">"{prompt}"</span>
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="ai"
            size="md"
            icon={Bot}
            onClick={() => navigate('/copilot')}
            className="w-full mt-6"
          >
            Open Full Copilot Chat
          </Button>
        </Card>
      </div>
    </div>
  );
}
