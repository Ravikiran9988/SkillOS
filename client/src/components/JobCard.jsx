import React from 'react';
import { Building2, MapPin, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';
import SkillBadge from './SkillBadge';

export default function JobCard({ data }) {
  const { job, company, career, matchPercentage, matchedSkills = [], missingSkills = [], jobSkills = [] } = data;

  const matchColor = matchPercentage >= 70 ? 'emerald' : matchPercentage >= 40 ? 'amber' : 'rose';
  const levelColors = {
    'Entry-Level': 'badge-emerald',
    'Mid-Level': 'badge-brand',
    'Senior': 'badge-accent',
  };

  return (
    <div className="glass-card-hover p-5 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base truncate">{job.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{company.name}</span>
            <span className="text-slate-600">•</span>
            <span className={`badge text-xs ${levelColors[job.experienceLevel] || 'badge-slate'}`}>
              {job.experienceLevel}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-xl font-black ${matchColor === 'emerald' ? 'text-emerald-400' : matchColor === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
            {matchPercentage}%
          </span>
          <p className="text-xs text-slate-500">match</p>
        </div>
      </div>

      <ProgressBar value={matchPercentage} color={matchColor} showPct={false} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.location}
          </span>
        )}
        {job.salaryRange && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> {job.salaryRange}
          </span>
        )}
        {career && (
          <span className="badge-slate">{career.title}</span>
        )}
      </div>

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="space-y-2 pt-1">
          {matchedSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="font-medium">You have ({matchedSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.slice(0, 4).map((s) => (
                  <SkillBadge key={s.id} skill={s} size="xs" />
                ))}
                {matchedSkills.length > 4 && (
                  <span className="text-xs text-slate-500">+{matchedSkills.length - 4} more</span>
                )}
              </div>
            </div>
          )}
          {missingSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1.5">
                <XCircle className="w-3.5 h-3.5" />
                <span className="font-medium">Missing ({missingSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.slice(0, 3).map((s) => (
                  <span key={s.id} className="badge badge-rose text-[10px]">{s.name}</span>
                ))}
                {missingSkills.length > 3 && (
                  <span className="text-xs text-slate-500">+{missingSkills.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
