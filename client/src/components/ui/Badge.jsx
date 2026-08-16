import React from 'react';

const variants = {
  default: 'badge-gray',
  blue:    'badge-blue',
  green:   'badge-green',
  amber:   'badge-amber',
  red:     'badge-red',
  // Legacy aliases
  brand:   'badge-blue',
  emerald: 'badge-green',
  warning: 'badge-amber',
  danger:  'badge-red',
  ai:      'badge-blue',
};

export default function Badge({ children, variant = 'default', icon: Icon, className = '' }) {
  const cls = variants[variant] || variants.default;
  return (
    <span className={`${cls} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}
