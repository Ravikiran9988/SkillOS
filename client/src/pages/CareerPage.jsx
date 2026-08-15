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
  Bot,
  Zap,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

export default function CareerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [careerMatches, setCareerMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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
    if (activeFilter === 'strong') return pct >= 70;
    if (activeFilter === 'explore') return pct >= 40 && pct < 70;
    if (activeFilter === 'stretch') return pct < 40;
    return true;
  });

  const strongMatches = careerMatches.filter((c) => (c.matchPercentage || 0) >= 70);
  const exploreMatches = careerMatches.filter((c) => (c.matchPercentage || 0) >= 40 && (c.matchPercentage || 0) < 70);
  const stretchMatches = careerMatches.filter((c) => (c.matchPercentage || 0) < 40);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-indigo-400" /> Career Explorer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover roles that align with your verified skills and explore prerequisite learning paths.
          </p>
        </div>
      </div>

      {/* ─── Search and Tabs ─────────────────────────────────────────────── */}
      <Card className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles (e.g. AI Researcher, Full Stack Engineer)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `All (${careerMatches.length})` },
            { id: 'strong', label: `Strong (${strongMatches.length})` },
            { id: 'explore', label: `Explore (${exploreMatches.length})` },
            { id: 'stretch', label: `Stretch (${stretchMatches.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ─── Career Cards Grid ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching career paths found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Add verified skills to your portfolio to expand career matches.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const role = item.careerRole;
            const matchPct = item.matchPercentage || 0;
            const matchedCount = item.matchedCount || 0;
            const totalReq = item.totalRequired || 0;
            const isTarget = user?.targetCareer?.id === role.id || user?.targetCareer?.title === role.title;

            return (
              <Card
                key={role.id}
                hover
                onClick={() => navigate(`/career/${role.id}`)}
                className="p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                      {role.title}
                    </h3>
                    <Badge
                      variant={matchPct >= 70 ? 'emerald' : matchPct >= 40 ? 'brand' : 'slate'}
                      size="sm"
                    >
                      {matchPct}% Match
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-4">
                    <ProgressBar
                      value={matchPct}
                      label={`${matchedCount} of ${totalReq} required skills`}
                      showLabel
                      size="sm"
                    />
                  </div>

                  {isTarget && (
                    <div className="mt-3">
                      <Badge variant="emerald" size="sm" icon={Target}>
                        Current Target Goal
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
                  <span>View Skill Path</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
