import React from 'react';

export default function Card({ children, className = '', hover = false, onClick, style = {} }) {
  const base = hover
    ? 'card-hover'
    : 'card';

  return (
    <div
      className={`${base} ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
    >
      {children}
    </div>
  );
}
