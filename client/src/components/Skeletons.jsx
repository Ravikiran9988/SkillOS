import React from 'react';

function SkeletonBlock({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className="h-3" style={{ width: `${60 + Math.random() * 35}%` }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4 animate-pulse">
          <SkeletonBlock className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-2/5" />
            <SkeletonBlock className="h-3 w-3/5" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero */}
      <div className="card p-8 space-y-3">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-9 w-2/3" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 space-y-3">
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-10 w-1/3" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        ))}
      </div>

      {/* Journey */}
      <div className="card p-6 space-y-4">
        <SkeletonBlock className="h-5 w-48" />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-4 space-y-2">
              <SkeletonBlock className="w-6 h-6 rounded-full mx-auto" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 flex gap-4">
              <SkeletonBlock className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-2/3" />
                <SkeletonBlock className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-4">
          <SkeletonBlock className="h-5 w-1/2" />
          <SkeletonBlock className="h-4 w-full" />
          {[1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-10 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
