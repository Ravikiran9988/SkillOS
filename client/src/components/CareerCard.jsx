import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import ProgressBar from './ProgressBar';

export default function CareerCard({ career, matchPercentage, matchedCount, totalRequired, onClick }) {
  const matchColor = matchPercentage >= 70 ? 'emerald' : matchPercentage >= 40 ? 'amber' : 'rose';

  return (
    <div
      className="glass-card-hover p-5 cursor-pointer animate-fade-in group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-700/20 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-brand-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{career.title}</h3>
            {career.description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{career.description}</p>
            )}
          </div>
        </div>
        {matchPercentage !== undefined && (
          <div className="text-right flex-shrink-0">
            <span className={`text-lg font-black ${matchColor === 'emerald' ? 'text-emerald-400' : matchColor === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
              {matchPercentage}%
            </span>
          </div>
        )}
      </div>

      {matchPercentage !== undefined && (
        <div className="mb-3">
          <ProgressBar value={matchPercentage} color={matchColor} showPct={false} />
          <p className="text-xs text-slate-500 mt-1">
            {matchedCount} of {totalRequired} required skills
          </p>
        </div>
      )}

      {career.requiredSkillCount !== undefined && (
        <p className="text-xs text-slate-500">{career.requiredSkillCount} required skills</p>
      )}

      <div className="mt-3 flex justify-end">
        <span className="text-xs text-brand-400 group-hover:text-brand-300 flex items-center gap-1 transition-colors">
          View details <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
