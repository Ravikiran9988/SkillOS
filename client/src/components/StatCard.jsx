import React from 'react';

export default function StatCard({ label, value, sub, icon: Icon, color = 'brand' }) {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-900/20 border-brand-700/20',
    emerald: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/20',
    amber: 'text-amber-400 bg-amber-900/20 border-amber-700/20',
    accent: 'text-accent-400 bg-accent-900/20 border-accent-700/20',
    rose: 'text-rose-400 bg-rose-900/20 border-rose-700/20',
  };
  const iconClass = colorMap[color] || colorMap.brand;

  return (
    <div className="glass-card p-5 flex items-start gap-4">
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${iconClass} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}
