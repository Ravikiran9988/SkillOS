import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Briefcase,
  Building,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
  Bot,
  ExternalLink,
  Filter,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

export default function JobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');

  const loadJobs = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecommendedJobs(user.id);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load recommended jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Evaluating 3-hop graph matches across hiring companies..." />;
  if (error) return <ErrorState message={error} onRetry={loadJobs} />;

  const filteredJobs = jobs.filter((job) => {
    const term = search.toLowerCase();
    const titleMatch = job.title?.toLowerCase().includes(term);
    const companyMatch = job.company?.name?.toLowerCase().includes(term);
    const matchesSearch = titleMatch || companyMatch;

    if (!matchesSearch) return false;
    if (experienceFilter !== 'all' && job.experienceLevel?.toLowerCase() !== experienceFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" /> Jobs That Fit You
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Open industry opportunities ranked by multi-hop graph compatibility with your verified skills.
          </p>
        </div>
      </div>

      {/* ─── Search and Filters ──────────────────────────────────────────── */}
      <Card className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role or company (e.g. AI Engineer, Google)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Experience Levels</option>
            <option value="Entry">Entry Level</option>
            <option value="Mid">Mid Level</option>
            <option value="Senior">Senior Level</option>
          </select>
        </div>
      </Card>

      {/* ─── Jobs List ───────────────────────────────────────────────────── */}
      {filteredJobs.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching job openings</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Add more verified skills to your profile to match active job requisitions.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const matchPct = job.matchPercentage || 70;
            const matchedSkills = job.matchedSkills || [];
            const missingSkills = job.missingSkills || [];

            return (
              <Card
                key={job.id}
                className="p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        {job.company?.name || 'Top Employer'}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{job.title}</h3>
                    </div>

                    <Badge
                      variant={matchPct >= 70 ? 'emerald' : matchPct >= 50 ? 'brand' : 'amber'}
                      size="sm"
                    >
                      {matchPct}% Match
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {job.location || 'Remote'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-500" /> {job.salary || '$120k - $150k'}
                    </span>
                    <span>·</span>
                    <span>Level: <strong className="text-slate-300">{job.experienceLevel || 'Entry'}</strong></span>
                  </div>

                  {/* Matched vs Missing Skills breakdown */}
                  <div className="mt-4 space-y-2">
                    {matchedSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> You have:
                        </span>
                        {matchedSkills.slice(0, 4).map((s) => (
                          <span
                            key={s.id || s}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-medium"
                          >
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}

                    {missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Missing:
                        </span>
                        {missingSkills.slice(0, 3).map((s) => (
                          <span
                            key={s.id || s}
                            className="px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300 font-medium"
                          >
                            {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() =>
                      navigate('/copilot', {
                        state: { initialPrompt: `How should I prepare for the ${job.title} role at ${job.company?.name}?` },
                      })
                    }
                    className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ask Copilot</span>
                  </button>

                  <Button
                    size="sm"
                    onClick={() =>
                      navigate('/copilot', {
                        state: { initialPrompt: `Create an application strategy for ${job.title} at ${job.company?.name}` },
                      })
                    }
                  >
                    Prepare for Role
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
