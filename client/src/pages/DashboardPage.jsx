import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Sparkles, Target, TrendingUp, Brain, Briefcase, ArrowRight,
  CheckCircle2, AlertCircle, Clock, Zap, Bot, Map, ChevronRight,
  Sun, Sunset, Moon,
} from 'lucide-react';
import { SkeletonDashboard } from '../components/Skeletons';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function getGreeting(name) {
  const hour = new Date().getHours();
  const firstName = name?.split(' ')[0] || 'there';
  if (hour < 12) return { text: `Good morning, ${firstName} 👋`, icon: Sun };
  if (hour < 17) return { text: `Good afternoon, ${firstName} 👋`, icon: Sunset };
  return { text: `Good evening, ${firstName} 👋`, icon: Moon };
}

function StatCard({ label, value, subtitle, color, icon: Icon, onClick }) {
  return (
    <Card hover onClick={onClick} className="p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-extrabold" style={{ color }}>{value}</div>
        {subtitle && (
          <p className="text-xs mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--accent)' }}>
        <span>View details</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { text: greeting } = getGreeting(user?.name);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);
  const [skillGap, setSkillGap] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [roadmap, setRoadmap] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, matchesData, jobsData] = await Promise.all([
        api.getMyProfile(),
        api.getMyCareerMatch().catch(() => []),
        api.getMyJobs().catch(() => []),
      ]);

      setProfile(profileData);
      const matches = Array.isArray(matchesData) ? matchesData : [];
      setCareerMatches(matches);
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      const targetCareerId = profileData?.targetCareer?.id || matches[0]?.careerRole?.id;
      if (targetCareerId) {
        const [gapData, roadmapData] = await Promise.all([
          api.getMyCareerMatch(targetCareerId).catch(() => null),
          api.getMyLearningPath(targetCareerId).catch(() => null),
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

  useEffect(() => { load(); }, [user?.id]);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const targetRole = profile?.targetCareer || careerMatches[0]?.careerRole;
  const matchPct = skillGap?.matchPercentage ?? careerMatches[0]?.matchPercentage ?? 0;
  const skillsCount = profile?.skills?.length || 0;
  const missingSkills = skillGap?.missingSkills || [];
  const readinessPct = Math.min(100, Math.round(matchPct * 0.9 + Math.min(skillsCount, 6) * 2));
  const roadmapSteps = roadmap?.orderedSkills?.length || 0;
  const completedSteps = roadmap?.completedSkills?.length || 0;
  const roadmapPct = roadmapSteps > 0 ? Math.round((completedSteps / roadmapSteps) * 100) : 0;

  // Next best actions
  const nextActions = [];
  if (missingSkills.length > 0) {
    const top = missingSkills[0];
    nextActions.push({
      id: 'skill',
      title: `Learn ${top.name}`,
      reason: `Required by ${targetRole?.title || 'your target career'} and ${Math.max(1, Math.round(jobs.length * 0.6))} matching jobs`,
      impact: `+${Math.round(100 / Math.max(1, skillGap?.totalRequired || 6))}% career match`,
      time: '2 weeks',
      priority: 'high',
      cta: 'Start Learning',
      action: () => navigate('/roadmap'),
    });
  }
  if (!profile?.targetCareer) {
    nextActions.push({
      id: 'goal',
      title: 'Set your career goal',
      reason: 'Enables tailored roadmap, skill gap analysis, and job matching',
      impact: 'Unlock your roadmap',
      time: '5 minutes',
      priority: 'medium',
      cta: 'Explore Careers',
      action: () => navigate('/careers'),
    });
  }
  if (jobs.length > 0) {
    nextActions.push({
      id: 'jobs',
      title: `Review top job match: ${jobs[0]?.title || 'Job'}`,
      reason: `${jobs[0]?.matchPercentage || 70}% match — you meet most of the requirements`,
      impact: 'Direct opportunity',
      time: '1 day',
      priority: 'low',
      cta: 'View Jobs',
      action: () => navigate('/jobs'),
    });
  }
  nextActions.push({
    id: 'copilot',
    title: 'Ask AI Copilot for a personalized plan',
    reason: 'Get recommendations grounded in your career graph',
    impact: 'Personalized strategy',
    time: 'Instant',
    priority: 'low',
    cta: 'Chat Now',
    action: () => navigate('/copilot'),
  });

  const priorityColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--accent)' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--accent-subtle) 0%, var(--surface) 100%)',
          border: '1px solid var(--accent-muted)',
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="blue" icon={Sparkles}>AI Career Intelligence Active</Badge>
          </div>
          <h1 className="page-title mt-2">{greeting}</h1>
          <p className="text-base mt-2" style={{ color: 'var(--text-muted)' }}>
            {targetRole?.title
              ? <>You're on track to become a <strong style={{ color: 'var(--text-primary)' }}>{targetRole.title}</strong>. Keep going.</>
              : "Set your career goal to unlock personalized roadmap and skill gap analysis."
            }
          </p>
        </div>
        {/* Ambient decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'var(--accent)' }} />
      </div>

      {/* ─── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Career Match" value={`${matchPct}%`}
          subtitle={`${skillGap?.matchedCount || 0} of ${skillGap?.totalRequired || 0} required skills`}
          color="var(--success)" icon={TrendingUp} onClick={() => navigate('/skill-gap')} />
        <StatCard label="Job Readiness" value={`${readinessPct}%`}
          subtitle={`Based on ${jobs.length} open roles`}
          color="var(--accent)" icon={Zap} onClick={() => navigate('/jobs')} />
        <StatCard label="Verified Skills" value={skillsCount}
          subtitle="Competencies in your graph"
          color="#8b5cf6" icon={Brain} onClick={() => navigate('/skills')} />
        <StatCard label="Roadmap" value={`${roadmapPct}%`}
          subtitle={`${completedSteps} of ${roadmapSteps} milestones complete`}
          color="var(--warning)" icon={Map} onClick={() => navigate('/roadmap')} />
      </div>

      {/* ─── Career Journey Stepper ──────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Your Career Journey</h2>
            <p className="section-subtitle">Track your progress from profile to job-ready</p>
          </div>
          {targetRole && <Badge variant="blue">{targetRole.title}</Badge>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: 1, title: 'Profile',      subtitle: profile?.educationLevel || 'Set up',    status: 'done',    path: '/profile' },
            { step: 2, title: 'Skills',       subtitle: `${skillsCount} verified`,               status: skillsCount > 0 ? 'done' : 'current', path: '/skills' },
            { step: 3, title: 'Career Goal',  subtitle: targetRole?.title || 'Not set',          status: targetRole ? 'done' : 'current', path: '/careers' },
            { step: 4, title: 'Skill Gaps',   subtitle: `${missingSkills.length} gaps`,          status: 'current', path: '/skill-gap' },
            { step: 5, title: 'Roadmap',      subtitle: `${roadmapSteps} steps`,                status: 'next',    path: '/roadmap' },
            { step: 6, title: 'Job Ready',    subtitle: `${readinessPct}%`,                     status: 'locked',  path: '/jobs' },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => navigate(item.path)}
              className="p-4 rounded-xl border text-center transition-all duration-200 group"
              style={{
                background: item.status === 'done' ? 'var(--success-bg)' :
                            item.status === 'current' ? 'var(--accent-subtle)' : 'var(--surface-elevated)',
                border: `1px solid ${item.status === 'done' ? 'var(--success-border)' :
                                     item.status === 'current' ? 'var(--accent-muted)' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center justify-center mb-2">
                {item.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                ) : (
                  <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      background: item.status === 'current' ? 'var(--accent)' : 'var(--surface-hover)',
                      color: item.status === 'current' ? 'white' : 'var(--text-muted)',
                    }}>
                    {item.step}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
              <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.subtitle}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* ─── Next Actions + Copilot ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: 'var(--warning)' }} />
              Your Next Best Actions
            </h2>
            <p className="section-subtitle">High-leverage tasks to boost your career readiness</p>
          </div>

          <div className="space-y-3">
            {nextActions.slice(0, 3).map((action, idx) => (
              <Card key={action.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
                    style={{ background: priorityColors[action.priority] || 'var(--accent)' }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{action.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{action.reason}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="badge badge-blue">{action.impact}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {action.time}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={action.action} className="shrink-0">
                  {action.cta} <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Copilot Card */}
        <Card className="p-6 flex flex-col justify-between"
          style={{ background: 'linear-gradient(135deg, var(--accent-subtle), var(--surface))', border: '1px solid var(--accent-muted)' }}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>AI CAREER COPILOT</div>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Ask your copilot anything</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Get personalized guidance grounded in your career graph.
            </p>

            <div className="space-y-2">
              {[
                'What should I learn next?',
                'Am I ready for my target role?',
                'Give me a 30-day career plan.',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => navigate('/copilot', { state: { initialPrompt: prompt } })}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span className="truncate">"{prompt}"</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent)' }} />
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="md" icon={Bot} onClick={() => navigate('/copilot')} className="w-full mt-5">
            Open Career Copilot
          </Button>
        </Card>
      </div>
    </div>
  );
}
