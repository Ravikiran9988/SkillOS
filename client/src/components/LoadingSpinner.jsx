import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading career intelligence…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="relative">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-muted)' }}
        >
          <Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        </div>
        <Loader2 className="w-6 h-6 animate-spin absolute -top-1 -right-1" style={{ color: 'var(--accent)' }} />
      </div>
      <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
