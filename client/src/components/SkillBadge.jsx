import React from 'react';

const categoryColors = {
  'Programming': 'bg-blue-900/40 text-blue-300 border-blue-700/30',
  'Frontend': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
  'Backend': 'bg-indigo-900/40 text-indigo-300 border-indigo-700/30',
  'Database': 'bg-violet-900/40 text-violet-300 border-violet-700/30',
  'Data Science': 'bg-emerald-900/40 text-emerald-300 border-emerald-700/30',
  'Machine Learning': 'bg-amber-900/40 text-amber-300 border-amber-700/30',
  'AI': 'bg-orange-900/40 text-orange-300 border-orange-700/30',
  'Cloud': 'bg-sky-900/40 text-sky-300 border-sky-700/30',
  'DevOps': 'bg-teal-900/40 text-teal-300 border-teal-700/30',
  'Data Engineering': 'bg-lime-900/40 text-lime-300 border-lime-700/30',
  'Testing': 'bg-rose-900/40 text-rose-300 border-rose-700/30',
  'Architecture': 'bg-purple-900/40 text-purple-300 border-purple-700/30',
  'Analytics': 'bg-yellow-900/40 text-yellow-300 border-yellow-700/30',
  'Mobile': 'bg-pink-900/40 text-pink-300 border-pink-700/30',
  'Security': 'bg-red-900/40 text-red-300 border-red-700/30',
  'Soft Skills': 'bg-slate-800/60 text-slate-300 border-slate-700/30',
};

const difficultyColors = {
  'Beginner': 'text-emerald-400',
  'Intermediate': 'text-amber-400',
  'Advanced': 'text-rose-400',
};

export default function SkillBadge({ skill, showDifficulty = false, size = 'sm' }) {
  const colorClass = categoryColors[skill.category] || 'bg-brand-900/40 text-brand-300 border-brand-700/30';
  const sizeClass = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200 ${colorClass} ${sizeClass}`}>
      {skill.name}
      {showDifficulty && skill.difficulty && (
        <span className={`text-[10px] font-bold ${difficultyColors[skill.difficulty] || 'text-slate-400'}`}>
          {skill.difficulty[0]}
        </span>
      )}
    </span>
  );
}

export { categoryColors, difficultyColors };
