import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Map,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function LearningRoadmapPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);

  const loadRoadmap = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, matchesData] = await Promise.all([
        api.getStudent(user.id),
        api.getCareerMatch(user.id).catch(() => []),
      ]);

      setProfile(profileData);
      const matches = Array.isArray(matchesData) ? matchesData : [];
      setCareerMatches(matches);

      const targetCareerId = profileData?.targetCareer?.id || matches[0]?.careerRole?.id;

      if (targetCareerId) {
        const path = await api.getLearningPath(user.id, targetCareerId);
        setRoadmapData(path);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate your personalized learning roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Traversing CognoDB prerequisite DAG to generate your roadmap..." />;
  if (error) return <ErrorState message={error} onRetry={loadRoadmap} />;

  const targetRole = profile?.targetCareer || careerMatches[0]?.careerRole;
  const steps = roadmapData?.steps || [];
  const orderedSkills = roadmapData?.orderedSkills || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Map className="w-7 h-7 text-indigo-400" /> Your Personalized Learning Roadmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Topologically ordered prerequisite sequence derived directly from CognoDB for{' '}
            <span className="font-bold text-indigo-300">{targetRole?.title || 'your target career'}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/skill-gap')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          View Skill Gaps
        </button>
      </div>

      {/* ─── Stepper Sequence ────────────────────────────────────────────── */}
      {orderedSkills.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/60">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">All Prerequisites Met!</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You already have all verified prerequisite competencies for this role.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center gap-2"
          >
            Explore Job Opportunities <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isCurrent = idx === 0;
            const skill = step.targetSkill;
            const courses = step.courses || [];
            const prereqs = step.prerequisiteChain || [];

            return (
              <div
                key={skill.id}
                className={`p-6 rounded-3xl border transition shadow-xl ${
                  isCurrent
                    ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/50 shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-lg ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCurrent
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCurrent ? '⚡ Current Focus' : `Step ${idx + 1}`}
                        </span>
                        <span className="text-xs text-slate-400">· {skill.category || 'Skill'}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white mt-1">{skill.name}</h3>

                      {prereqs.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-300">Prerequisites:</span>
                          {prereqs.map((p, i) => (
                            <span key={p.id} className="text-slate-300 font-medium">
                              {p.name}
                              {i < prereqs.length - 1 ? ' → ' : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        navigate('/copilot', {
                          state: { initialPrompt: `How can I learn ${skill.name} step-by-step?` },
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
                      <span>Copilot Guide</span>
                    </button>
                  </div>
                </div>

                {/* Curated Courses from CognoDB */}
                {courses.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Recommended Courses
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/30 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{course.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {course.platform} · {course.duration || '4 weeks'} · {course.difficulty}
                            </div>
                          </div>
                          <span className="text-indigo-400 text-xs font-bold px-2 py-1 rounded bg-indigo-500/10 shrink-0">
                            Course
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
