import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — ATLS Design System
 *
 * Reusable top-of-page section used across all dashboard pages.
 * Provides consistent title, description, and optional action slot.
 *
 * Usage:
 *   <PageHeader
 *     title="Fleet Manager"
 *     description="Manage vehicles, maintenance, and operational logs."
 *     actions={<Button>Add Vehicle</Button>}
 *   />
 */
const PageHeader = ({
  title,
  description,
  actions,
  breadcrumb,   // Optional: array of { label, href? } for breadcrumb trail
  className,
  compact = false,
}) => {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6',
      compact && 'mb-4',
      className
    )}>
      <div className="min-w-0 flex-1">
        {/* Breadcrumb trail */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 mb-1.5" aria-label="Breadcrumb">
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-600 select-none">/</span>
                )}
                <span className={cn(
                  'text-[11px] font-medium',
                  index === breadcrumb.length - 1
                    ? 'text-slate-500 dark:text-slate-400'
                    : 'text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-400 cursor-pointer'
                )}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className={cn(
          'font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight',
          compact ? 'text-xl' : 'text-2xl'
        )}>
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className={cn(
            'text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1',
            compact ? 'text-[13px]' : 'text-sm'
          )}>
            {description}
          </p>
        )}
      </div>

      {/* Actions slot */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
