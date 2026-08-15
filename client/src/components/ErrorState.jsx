import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, onRetry, type = 'generic' }) {
  const isDbError =
    error?.toLowerCase().includes('database') ||
    error?.toLowerCase().includes('connect') ||
    error?.toLowerCase().includes('cognodb');

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-rose-900/20 border border-rose-700/30 flex items-center justify-center mb-5">
        {isDbError ? (
          <WifiOff className="w-8 h-8 text-rose-400" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-2">
        {isDbError ? 'Database Unavailable' : 'Something went wrong'}
      </h3>

      <p className="text-slate-400 max-w-md mb-6 text-sm leading-relaxed">
        {isDbError
          ? 'SkillOS could not connect to the career graph database. Please check your CognoDB connection and try again.'
          : error || 'An unexpected error occurred. Please try again.'}
      </p>

      {onRetry && (
        <button onClick={onRetry} className="btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
