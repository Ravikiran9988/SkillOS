import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');

  const loadJobs = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [recommendedJobs, companiesList] = await Promise.all([
        api.getRecommendedJobs(user.id),
        api.getCompanies().catch(() => []),
      ]);
      setJobs(Array.isArray(recommendedJobs) ? recommendedJobs : []);
      setCompanies(companiesList || []);
    } catch (err) {
      setError(err.message || 'Failed to load matching jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Calculating 3-hop job matching across industry companies..." />;
  if (error) return <ErrorState message={error} onRetry={loadJobs} />;

  const filteredJobs = jobs.filter((job) => {
    const titleMatch =
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(search.toLowerCase());
    if (!titleMatch) return false;
    if (experienceFilter === 'all') return true;
    return (job.experienceLevel || '').toLowerCase().includes(experienceFilter.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" /> Jobs That Fit You
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            3-hop graph traversal matching open roles via your verified skills and hiring companies.
          </p>
        </div>
      </div>

      {/* ─── Search and Filters ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles or companies (e.g. Google, OpenAI)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Levels' },
            { id: 'entry', label: 'Entry Level' },
            { id: 'mid', label: 'Mid Level' },
            { id: 'senior', label: 'Senior' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setExperienceFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                experienceFilter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Jobs Grid ───────────────────────────────────────────────────── */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/60">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching job openings found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Add more verified skills to your portfolio to expand job matches.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const matchPct = job.matchPercentage || 0;
            const matchedSkills = job.matchedSkills || [];
            const missingSkills = job.missingSkills || [];

            return (
              <div
                key={job.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{job.company?.name || 'Top Tech'}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{job.title}</h3>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-xl shrink-0 ${
                        matchPct >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {matchPct}% Match
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 flex-wrap">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {job.location}
                      </span>
                    )}
                    {job.experienceLevel && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                        {job.experienceLevel}
                      </span>
                    )}
                    {job.salaryRange && (
                      <span className="text-emerald-400 font-semibold text-xs">
                        {job.salaryRange}
                      </span>
                    )}
                  </div>

                  {/* Skills Match Overview */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-slate-800/80">
                    {matchedSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">You have:</span>
                        {matchedSkills.map((s) => (
                          <span
                            key={s.id || s}
                            className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold"
                          >
                            ✓ {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}

                    {missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Missing:</span>
                        {missingSkills.map((s) => (
                          <span
                            key={s.id || s}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[10px]"
                          >
                            ○ {s.name || s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Why this matches: <span className="text-indigo-300 font-medium">Overlaps with verified skills</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
