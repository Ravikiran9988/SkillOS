import React from 'react';

export default function Badge({
  children,
  variant = 'brand', // 'brand' | 'emerald' | 'amber' | 'rose' | 'slate' | 'ai'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
}) {
  const base = 'inline-flex items-center font-bold tracking-wide rounded-full select-none';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantClasses = {
    brand: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700/80',
    ai: 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-300 border border-purple-500/30',
  };

  return (
    <span className={`${base} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.brand} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
