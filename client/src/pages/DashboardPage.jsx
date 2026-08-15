import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Briefcase, Target, TrendingUp, Zap, ArrowRight, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import { getCareerMatch, getRecommendedJobs, getLearningPath } from '../services/api';
import StatCard from '../components/StatCard';
import SkillBadge from '../components/SkillBadge';
import ProgressBar from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { PageSkeleton } from '../components/LoadingSkeleton';

export default function DashboardPage() {
  const { currentStudent } = useStudent();
  const navigate = useNavigate();

  const [careerData, setCareerData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentStudent) return;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const matchRes = await getCareerMatch(currentStudent.id);
        setCareerData(matchRes);

        const jobRes = await getRecommendedJobs(currentStudent.id);
        setJobs(jobRes.jobs?.slice(0, 3) || []);

        if (matchRes?.matches?.length > 0) {
          const topCareer = matchRes.matches[0].career;
          try {
            const path = await getLearningPath(currentStudent.id, topCareer.id);
            setLearningPath({ career: topCareer, path });
          } catch (_) {}
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentStudent?.id]);

  if (!currentStudent) {
    return (
      <EmptyState
        title="No student selected"
        description="Select a student from the sidebar to see their career intelligence dashboard."
        icon={Brain}
      />
    );
  }

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  const topMatches = careerData?.matches?.slice(0, 3) || [];
  const hasSkills = (careerData?.studentSkillCount || 0) > 0;

  const topCareerMatch = topMatches[0];
  const nextSkills = learningPath?.path?.orderedSkills?.slice(0, 4) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Welcome back, <span className="gradient-text">{currentStudent.name}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Here's your career intelligence snapshot. Graph-powered insights from CognoDB.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Skills"
          value={careerData?.studentSkillCount || 0}
          icon={Zap}
          color="brand"
          sub="In your profile"
        />
        <StatCard
          label="Career Matches"
          value={topMatches.length}
          icon={Target}
          color="accent"
          sub="Based on your skills"
        />
        <StatCard
          label="Top Match"
          value={topCareerMatch ? `${topCareerMatch.matchPercentage}%` : '—'}
          icon={TrendingUp}
          color={topCareerMatch?.matchPercentage >= 70 ? 'emerald' : 'amber'}
          sub={topCareerMatch?.career?.title || 'Add skills to see'}
        />
        <StatCard
          label="Jobs Available"
          value={jobs.length}
          icon={Briefcase}
          color="rose"
          sub="Matched to your skills"
        />
      </div>

      {!hasSkills && (
        <div className="glass-card p-6 border-brand-700/30 text-center">
          <p className="text-slate-300 font-semibold mb-1">Get started — add your skills</p>
          <p className="text-slate-500 text-sm mb-4">
            SkillOS needs at least 3 skills to generate career recommendations.
          </p>
          <button className="btn-primary mx-auto" onClick={() => navigate('/profile')}>
            <Zap className="w-4 h-4" /> Build Your Profile
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Matches */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Brain className="w-4 h-4 text-brand-400" /> Career Matches
            </h2>
            <button
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              onClick={() => navigate('/career')}
            >
              All careers <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {topMatches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description={careerData?.message || 'Add skills to generate career recommendations.'}
              icon={Target}
            />
          ) : (
            <div className="space-y-4">
              {topMatches.map(({ career, matchPercentage, matchedSkillIds, missingSkillIds, totalRequired }) => (
                <div
                  key={career.id}
                  className="p-4 rounded-xl bg-surface-700/50 hover:bg-surface-700 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/career/${career.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">{career.title}</p>
                      <p className="text-xs text-slate-500">{matchedSkillIds.length} of {totalRequired} skills</p>
                    </div>
                    <span className={`text-base font-black ${matchPercentage >= 70 ? 'text-emerald-400' : matchPercentage >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {matchPercentage}%
                    </span>
                  </div>
                  <ProgressBar
                    value={matchPercentage}
                    color={matchPercentage >= 70 ? 'emerald' : matchPercentage >= 40 ? 'amber' : 'rose'}
                    showPct={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next skills to learn */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-400" /> Next to Learn
            </h2>
            {topCareerMatch && (
              <button
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                onClick={() => navigate(`/career/${topCareerMatch.career.id}`)}
              >
                Full path <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {nextSkills.length === 0 ? (
            <EmptyState
              title={hasSkills ? "You're on track!" : "No learning path yet"}
              description={hasSkills ? "Select a target career to generate a learning path." : "Add skills and select a career to see your learning path."}
              icon={BookOpen}
            />
          ) : (
            <div className="space-y-2">
              {nextSkills.map((skill, i) => (
                <div key={skill.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-900/40 border border-brand-700/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-400">{i + 1}</span>
                  </div>
                  <SkillBadge skill={skill} showDifficulty />
                  {i < nextSkills.length - 1 && (
                    <div className="w-0.5 h-4 bg-brand-900/40 absolute left-6 mt-8 hidden" />
                  )}
                </div>
              ))}
              {learningPath?.path?.orderedSkills?.length > 4 && (
                <p className="text-xs text-slate-500 pl-9">
                  +{learningPath.path.orderedSkills.length - 4} more skills in path
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Jobs preview */}
      {jobs.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" /> Top Job Matches
            </h2>
            <button
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              onClick={() => navigate('/jobs')}
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {jobs.map((j) => (
              <div key={j.job.id} className="p-4 rounded-xl bg-surface-700/50 hover:bg-surface-700 transition-colors cursor-pointer" onClick={() => navigate('/jobs')}>
                <p className="font-semibold text-sm text-white truncate">{j.job.title}</p>
                <p className="text-xs text-slate-400 mb-2">{j.company.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${j.matchPercentage >= 70 ? 'text-emerald-400' : j.matchPercentage >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {j.matchPercentage}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
