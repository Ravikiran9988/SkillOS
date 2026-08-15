import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  label = '',
  color = 'auto', // 'auto' | 'brand' | 'emerald' | 'amber' | 'rose'
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const getColorClass = () => {
    if (color === 'brand') return 'bg-gradient-to-r from-indigo-500 to-purple-500';
    if (color === 'emerald') return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (color === 'amber') return 'bg-gradient-to-r from-amber-500 to-orange-400';
    if (color === 'rose') return 'bg-gradient-to-r from-rose-500 to-red-500';

    // Auto based on percentage
    if (percentage >= 70) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (percentage >= 40) return 'bg-gradient-to-r from-indigo-500 to-blue-400';
    return 'bg-gradient-to-r from-amber-500 to-orange-400';
  };

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{label}</span>
          <span className="font-bold text-slate-200">{percentage}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses[size] || sizeClasses.md} rounded-full bg-slate-800/80 overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
