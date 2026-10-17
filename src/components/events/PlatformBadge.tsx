import React from 'react';

interface PlatformBadgeProps {
  source: 'District' | 'BookMyShow' | 'Luma';
  size?: 'sm' | 'md';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ source, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (source) {
    case 'District':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          District
        </span>
      );
    case 'BookMyShow':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-red-600/15 text-red-300 border border-red-500/30 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          BookMyShow
        </span>
      );
    case 'Luma':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Luma Events
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}
        >
          {source}
        </span>
      );
  }
};
