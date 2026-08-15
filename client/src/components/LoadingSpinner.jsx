import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading career intelligence...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin absolute -top-1 -right-1" />
      </div>
      <p className="text-xs font-semibold text-slate-400 animate-pulse">{message}</p>
    </div>
  );
}
