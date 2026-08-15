import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, BookOpen,
  ChevronRight, Briefcase, Building2, ArrowDown, Brain
} from 'lucide-react';
import { getCareer, getCareerMatch, getLearningPath, getCareerJobs } from '../services/api';
import { useStudent } from '../context/StudentContext';
import SkillBadge from '../components/SkillBadge';
import ProgressBar from '../components/ProgressBar';
import ErrorState from '../components/ErrorState';
import { PageSkeleton } from '../components/LoadingSkeleton';

const importanceColors = {
  critical: 'text-rose-400',
  high: 'text-amber-400',
  medium: 'text-slate-400',
};

export default function CareerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStudent } = useStudent();

  const [career, setCareer] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const basePromises = [getCareer(id), getCareerJobs(id)];
    if (currentStudent) {
      basePromises.push(
        getCareerMatch(currentStudent.id, id),
        getLearningPath(currentStudent.id, id)
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
  }, [id, currentStudent?.id]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!career) return <ErrorState error="Career not found." />;

  const matchedIds = new Set((gapData?.matchedSkills || []).map((s) => s.id));
  const missingIds = new Set((gapData?.missingSkills || []).map((s) => s.id));
  const matchPct = gapData?.matchPercentage ?? null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{career.title}</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">{career.description}</p>
          </div>
          {matchPct !== null && (
            <div className="text-center flex-shrink-0">
              <div className={`text-4xl font-black ${matchPct >= 70 ? 'text-emerald-400' : matchPct >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                {matchPct}%
              </div>
              <p className="text-xs text-slate-500 mt-1">skill match</p>
            </div>
          )}
        </div>

        {matchPct !== null && (
          <div className="mt-4">
            <ProgressBar
              value={matchPct}
              color={matchPct >= 70 ? 'emerald' : matchPct >= 40 ? 'amber' : 'rose'}
              label={`${gapData.matchedCount} of ${gapData.totalRequired} required skills`}
            />
          </div>
        )}

        {/* Career progression */}
        {(career.comesFrom?.length > 0 || career.leadsTo?.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {career.comesFrom?.map((prev) => (
              <React.Fragment key={prev.id}>
                <button
                  className="px-3 py-1 rounded-lg bg-surface-700 text-slate-400 hover:text-white transition-colors text-xs"
                  onClick={() => navigate(`/career/${prev.id}`)}
                >
                  {prev.title}
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </React.Fragment>
            ))}
            <span className="px-3 py-1 rounded-lg bg-brand-900/40 text-brand-300 border border-brand-700/30 font-semibold text-xs">
              {career.title}
            </span>
            {career.leadsTo?.map((next) => (
              <React.Fragment key={next.id}>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <button
                  className="px-3 py-1 rounded-lg bg-surface-700 text-slate-400 hover:text-white transition-colors text-xs"
                  onClick={() => navigate(`/career/${next.id}`)}
                >
                  {next.title}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Required skills */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Required Skills</h2>
          {career.requiredSkills.length === 0 ? (
            <p className="text-slate-500 text-sm">No required skills defined.</p>
          ) : (
            <div className="space-y-2">
              {career.requiredSkills.map((skill) => {
                const hasIt = matchedIds.has(skill.id);
                const isMissing = missingIds.has(skill.id);
                return (
                  <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-700/40 hover:bg-surface-700 transition-colors">
                    <div className="flex items-center gap-2">
                      {currentStudent && (
                        hasIt ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )
                      )}
                      <SkillBadge skill={skill} />
                    </div>
                    <span className={`text-xs font-medium ${importanceColors[skill.importance] || 'text-slate-500'}`}>
                      {skill.importance || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Missing skills */}
        {currentStudent && gapData?.missingSkills?.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="section-title mb-1">Skill Gap</h2>
            <p className="text-slate-500 text-xs mb-4">
              {gapData.missingSkills.length} skills to acquire for {career.title}
            </p>
            <div className="space-y-2">
              {gapData.missingSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-2.5 rounded-lg bg-rose-900/10 border border-rose-900/20">
                  <SkillBadge skill={skill} showDifficulty />
                  <span className={`text-xs font-medium ${importanceColors[skill.importance] || 'text-slate-500'}`}>
                    {skill.importance || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Learning Path */}
      {currentStudent && learningPath?.orderedSkills?.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="section-title flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-accent-400" /> Prerequisite Learning Path
          </h2>
          <p className="text-slate-500 text-xs mb-5">
            Graph-traversed prerequisite chain — skills ordered by dependency.
          </p>
          <div className="flex flex-col items-start gap-0">
            {learningPath.orderedSkills.map((skill, i) => {
              const step = learningPath.steps?.find((s) => s.targetSkill.id === skill.id);
              const courses = step?.courses || [];
              return (
                <div key={skill.id} className="flex items-start gap-3 w-full">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-brand-900/40 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-400">{i + 1}</span>
                    </div>
                    {i < learningPath.orderedSkills.length - 1 && (
                      <div className="w-0.5 h-6 bg-gradient-to-b from-brand-700/60 to-transparent mt-1" />
                    )}
                  </div>
                  <div className="pb-3 flex-1">
                    <SkillBadge skill={skill} showDifficulty />
                    {courses.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {courses.map((c) => (
                          <span key={c.id} className="text-xs text-slate-400 flex items-center gap-1 bg-surface-700/40 px-2 py-0.5 rounded-md">
                            <BookOpen className="w-3 h-3" /> {c.title} · {c.platform}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Jobs */}
      {jobs.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-emerald-400" /> Related Jobs ({jobs.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {jobs.map(({ job, company }) => (
              <div key={job.id} className="p-4 bg-surface-700/40 rounded-xl hover:bg-surface-700 transition-colors">
                <p className="font-semibold text-white text-sm">{job.title}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3" /> {company.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge-slate text-xs">{job.experienceLevel}</span>
                  <span className="text-xs text-slate-500">{job.salaryRange}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
