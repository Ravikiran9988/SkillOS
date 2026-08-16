import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, message, onRetry }) {
  const msg = message || error;
  const isDbError =
    typeof msg === 'string' && (
      msg.toLowerCase().includes('database') ||
      msg.toLowerCase().includes('connect') ||
      msg.toLowerCase().includes('cognodb')
    );

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)' }}
      >
        {isDbError ? (
          <WifiOff className="w-8 h-8" style={{ color: 'var(--danger)' }} />
        ) : (
          <AlertTriangle className="w-8 h-8" style={{ color: 'var(--danger)' }} />
        )}
      </div>

      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {isDbError ? 'Database Unavailable' : 'Something went wrong'}
      </h3>

      <p className="max-w-md mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {isDbError
          ? 'SkillOS could not connect to the career graph database. Please check your Neo4j connection and try again.'
          : msg || 'An unexpected error occurred. Please try again.'}
      </p>

      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
