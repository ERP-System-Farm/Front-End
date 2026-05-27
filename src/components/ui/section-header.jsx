import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeader — ATLS Design System
 *
 * In-page section divider with a label and optional right-side action button.
 * Used to divide content into logical groups within a page.
 *
 * Usage:
 *   <SectionHeader title="Recent Activity" action={<Button size="sm">View All</Button>} />
 *   <SectionHeader title="Financial Summary" subtitle="Last 30 days" />
 */
const SectionHeader = ({
  title,
  subtitle,
  action,
  divider = false,   // If true, shows a horizontal rule below
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}

      {/* Divider variant: replace label with a rule */}
      {divider && (
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      )}
    </div>
  );
};

/**
 * SectionDivider — Lightweight horizontal rule with optional centered label
 *
 * Usage:
 *   <SectionDivider />
 *   <SectionDivider label="Performance Metrics" />
 */
export const SectionDivider = ({ label, className }) => {
  if (!label) {
    return <div className={cn('h-px bg-slate-100 dark:bg-slate-800 my-6', className)} />;
  }

  return (
    <div className={cn('flex items-center gap-3 my-6', className)}>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-600 select-none whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
};

export default SectionHeader;
