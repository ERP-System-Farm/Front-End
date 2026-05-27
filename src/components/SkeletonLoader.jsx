import React from 'react';

/**
 * SkeletonLoader — Reusable loading placeholder component.
 * Ported to Tailwind CSS. Maintains same layout API parameters.
 * 
 * Props:
 *  - type: 'card' | 'table' | 'list' | 'text'
 *  - count: number — number of skeletons to render
 *  - height: number/string — custom height override for 'text' type
 *  - width: number/string — custom width override for 'text' type
 *  - className: string — Tailwind class overrides
 */
export default function SkeletonLoader({ 
  type = 'card',
  count = 1,
  height,
  width,
  className = ''
}) {
  const renderCardSkeleton = () => (
    <div className={`p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl animate-pulse space-y-4 shadow-sm w-full ${className}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-10 w-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/5" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/5" />
        </div>
      </div>
      <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      <div className="flex gap-2.5">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" />
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden animate-pulse shadow-sm w-full ${className}`}>
      <div className="flex p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`th-${i}`} className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-[15%] mx-auto" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={`tr-${row}`} className="flex p-4 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
          {[1, 2, 3, 4, 5].map((cell) => (
            <div key={`td-${row}-${cell}`} className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-[15%] mx-auto" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-3 w-full ${className}`}>
      {Array.from(new Array(count)).map((_, i) => (
        <div key={`list-${i}`} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl animate-pulse shadow-sm">
          <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-9 w-9 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-[30%]" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md w-[20%]" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTextSkeleton = () => (
    <div className={`space-y-2 animate-pulse w-full ${className}`}>
      {Array.from(new Array(count)).map((_, i) => (
        <div 
          key={`text-${i}`} 
          className="bg-slate-200 dark:bg-slate-800 rounded-md" 
          style={{ 
            width: width || (i % 2 === 0 ? '100%' : '80%'), 
            height: height || 16 
          }} 
        />
      ))}
    </div>
  );

  switch (type) {
    case 'card':
      return (
        <div className="flex flex-col gap-4 w-full">
          {Array.from(new Array(count)).map((_, i) => (
            <React.Fragment key={i}>{renderCardSkeleton()}</React.Fragment>
          ))}
        </div>
      );
    case 'table':
      return renderTableSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'text':
    default:
      return renderTextSkeleton();
  }
}
