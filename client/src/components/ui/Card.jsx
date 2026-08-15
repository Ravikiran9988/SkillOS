import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  onClick,
  ...props
}) {
  const baseClasses =
    'rounded-2xl border transition-all duration-200 bg-slate-900/80 dark:bg-slate-900/80 light:bg-white border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-sm text-slate-100 dark:text-slate-100 light:text-slate-900';

  const hoverClasses = hover
    ? 'hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer group'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
