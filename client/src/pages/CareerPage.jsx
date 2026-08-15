import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Search, ArrowRight, ChevronRight } from 'lucide-react';
import { getCareers, getCareerExploration } from '../services/api';
import { useStudent } from '../context/StudentContext';
import { getCareerMatch } from '../services/api';
import CareerCard from '../components/CareerCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

export default function CareerPage() {
  const navigate = useNavigate();
  const { currentStudent } = useStudent();

  const [careers, setCareers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [exploration, setExploration] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const promises = [getCareers(), getCareerExploration()];
    if (currentStudent) {
      promises.push(getCareerMatch(currentStudent.id));
    }
    Promise.all(promises)
      .then(([c, e, m]) => {
        setCareers(c);
        setExploration(e);
        if (m) setMatches(m.matches || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentStudent?.id]);

  const matchMap = {};
  matches.forEach((m) => {
    matchMap[m.career.id] = m;
  });

  const filtered = careers.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  // Build career path chains for exploration
  const careerChains = [];
  const sourceIds = new Set(exploration.filter((e) => e.leadsTo.length > 0).map((e) => e.career.id));
  const targetIds = new Set(exploration.flatMap((e) => e.leadsTo.map((r) => r.id)));
  const roots = exploration.filter((e) => !targetIds.has(e.career.id) && e.leadsTo.length > 0);

  for (const root of roots.slice(0, 4)) {
    const chain = [root.career];
    let current = root;
    for (let i = 0; i < 3 && current.leadsTo.length > 0; i++) {
      const next = exploration.find((e) => e.career.id === current.leadsTo[0]?.id);
      if (!next) break;
      chain.push(next.career);
      current = next;
    }
    if (chain.length > 1) careerChains.push(chain);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white">Career Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore {careers.length} career paths. Graph traversal shows progression routes.
        </p>
      </div>

      {/* Career Path Chains */}
      {!loading && careerChains.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Career Progression Paths</h2>
          <div className="space-y-3">
            {careerChains.map((chain, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1">
                {chain.map((role, j) => (
                  <React.Fragment key={role.id}>
                    <button
                      onClick={() => navigate(`/career/${role.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-brand-900/40 text-sm font-medium text-slate-300 hover:text-brand-300 transition-all border border-transparent hover:border-brand-700/30"
                    >
                      {role.title}
                    </button>
                    {j < chain.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            These paths are derived from LEADS_TO graph relationships, not hardcoded.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search careers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Career grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No careers found" description="Try a different search term." icon={Brain} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((career) => {
            const match = matchMap[career.id];
            return (
              <CareerCard
                key={career.id}
                career={career}
                matchPercentage={match?.matchPercentage}
                matchedCount={match?.matchedSkillIds?.length}
                totalRequired={match?.totalRequired}
                onClick={() => navigate(`/career/${career.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
