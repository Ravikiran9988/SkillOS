import React from 'react';

function CardSkeleton({ className = '' }) {
  return (
    <div className={`glass-card p-6 animate-pulse ${className}`}>
      <div className="skeleton h-4 w-2/3 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-3/4 mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-4 w-1/3 mb-2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="skeleton h-4 w-1/2 mb-3" />
      <div className="skeleton h-8 w-1/3 mb-1" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="animate-pulse">
        <div className="skeleton h-8 w-1/3 mb-2" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export { CardSkeleton, ListSkeleton, StatSkeleton, PageSkeleton };
export default PageSkeleton;
