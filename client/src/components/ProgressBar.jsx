import React from 'react';

const colorMap = {
  brand: 'from-brand-500 to-brand-400',
  emerald: 'from-emerald-500 to-emerald-400',
  amber: 'from-amber-500 to-amber-400',
  rose: 'from-rose-500 to-rose-400',
  accent: 'from-accent-500 to-accent-400',
};

export default function ProgressBar({ value, max = 100, color = 'brand', label, showPct = true }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const gradientClass = colorMap[color] || colorMap.brand;

  return (
    <div className="w-full">
      {(label || showPct) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPct && (
            <span className="text-sm font-bold text-white">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="h-2.5 bg-surface-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
