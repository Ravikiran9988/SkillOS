import React, { useEffect, useState } from 'react';
import { Briefcase, Filter, Building2 } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import { getRecommendedJobs, getJobs } from '../services/api';
import JobCard from '../components/JobCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';

const LEVELS = ['All', 'Entry-Level', 'Mid-Level', 'Senior'];

export default function JobsPage() {
  const { currentStudent } = useStudent();
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [levelFilter, setLevelFilter] = useState('All');
  const [mode, setMode] = useState('recommended'); // 'recommended' | 'all'

  useEffect(() => {
    setLoading(true);
    setError(null);
    const promises = [getJobs()];
    if (currentStudent) {
      promises.push(getRecommendedJobs(currentStudent.id));
    }
    Promise.all(promises)
      .then(([all, rec]) => {
        setAllJobs(all);
        if (rec) {
          setJobs(rec.jobs || []);
          setMessage(rec.message);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentStudent?.id]);

  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;

  const displayJobs = mode === 'recommended' ? jobs : allJobs.map((j) => ({ ...j, matchPercentage: 0, matchedSkills: [], missingSkills: [] }));
  const filtered = levelFilter === 'All'
    ? displayJobs
    : displayJobs.filter((j) => (j.job || j).experienceLevel === levelFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white">Job Opportunities</h1>
        <p className="text-slate-400 text-sm mt-1">
          {mode === 'recommended'
            ? `Jobs matched to ${currentStudent?.name || 'your'}'s skills via graph traversal.`
            : `All ${allJobs.length} available positions.`}
        </p>
      </div>

      {/* Mode + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-surface-700 rounded-xl p-1">
          <button
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'recommended' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('recommended')}
          >
            For Me
          </button>
          <button
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'all' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setMode('all')}
          >
            All Jobs
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex bg-surface-700 rounded-xl p-1 gap-1">
            {LEVELS.map((l) => (
              <button
                key={l}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${levelFilter === l ? 'bg-surface-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setLevelFilter(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className="glass-card p-4 border-amber-700/20 text-amber-300 text-sm">
          {message}
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No jobs found"
          description={mode === 'recommended' ? 'Add more skills to match more jobs.' : 'Try a different filter.'}
          icon={Briefcase}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item, i) => (
            <JobCard
              key={item.job?.id || i}
              data={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
