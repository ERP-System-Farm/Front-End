import React from 'react';

/**
 * LoadingSpinner — Standard loader component with custom message.
 * Ported to Tailwind CSS. Removes legacy MUI CircularProgress.
 */
export default function LoadingSpinner({ message = 'جاري التحميل...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <svg
        className="animate-spin h-10 w-10 text-emerald-600 dark:text-emerald-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
        {message}
      </span>
    </div>
  );
}

/**
 * TableSkeleton — Lightweight tabular loaders.
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full p-2 space-y-3 animate-pulse">
      {Array.from(new Array(rows)).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from(new Array(cols)).map((_, j) => (
            <div
              key={j}
              className="h-12 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg flex-grow"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * CardSkeleton — Lightweight card loaders.
 */
export function CardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl animate-pulse space-y-3 shadow-sm">
      <div className="rounded-full bg-slate-200/80 dark:bg-slate-800/80 h-10 w-10" />
      <div className="h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded-md w-3/5" />
      <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-md w-2/5" />
    </div>
  );
}
