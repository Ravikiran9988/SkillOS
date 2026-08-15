import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import {
  Compass,
  Sparkles,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function CareerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'strong' | 'explore' | 'stretch'

  const loadCareers = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCareerMatch(user.id);
      setCareerMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to match career tracks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareers();
  }, [user?.id]);

  if (loading) return <LoadingSpinner message="Evaluating your 2-hop match across 15 career tracks..." />;
  if (error) return <ErrorState message={error} onRetry={loadCareers} />;

  const filtered = careerMatches.filter((item) => {
    const title = item.careerRole?.title?.toLowerCase() || '';
    const matchesSearch = title.includes(search.toLowerCase());
    const pct = item.matchPercentage || 0;

    if (!matchesSearch) return false;
    if (filter === 'strong') return pct >= 70;
    if (filter === 'explore') return pct >= 40 && pct < 70;
    if (filter === 'stretch') return pct < 40;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-indigo-400" /> Find Your Best Career Path
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            2-hop graph matching algorithm computing real-time compatibility for{' '}
            <span className="font-semibold text-white">{user?.name}</span>.
          </p>
        </div>
      </div>

      {/* ─── Filters & Search ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles (e.g. AI Researcher, Software Engineer)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'strong', label: 'Strong Match (≥70%)' },
            { id: 'explore', label: 'Explore (40-69%)' },
            { id: 'stretch', label: 'Stretch (<40%)' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Careers Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => {
          const role = item.careerRole;
          const matchPct = item.matchPercentage || 0;
          const matchedCount = item.matchedCount || 0;
          const totalReq = item.totalRequired || 0;

          return (
            <div
              key={role.id}
              onClick={() => navigate(`/career/${role.id}`)}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                    {role.title}
                  </h3>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-xl shrink-0 ${
                      matchPct >= 70
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : matchPct >= 40
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {matchPct}% Match
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {role.description}
                </p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Skill Overlap</span>
                    <span className="font-semibold text-slate-200">
                      {matchedCount} / {totalReq} skills
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        matchPct >= 70
                          ? 'bg-emerald-400'
                          : matchPct >= 40
                          ? 'bg-indigo-500'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${matchPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                <span>View Career Path & Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
