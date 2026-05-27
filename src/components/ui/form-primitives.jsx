import React from 'react';
import { cn } from '@/lib/utils';

/**
 * FormSection — Presentational wrapper for form sections.
 * Displays title, subtitle description, and standard spacing.
 */
export const FormSection = ({ title, description, children, className }) => {
  return (
    <div className={cn("space-y-4 border-b border-slate-100 dark:border-slate-800/60 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
};

/**
 * FormFieldWrapper — Presentational container for individual form fields.
 * Manages label typography, description placement, and validation error styling.
 */
export const FormFieldWrapper = ({ label, description, error, required, children, className }) => {
  return (
    <div className={cn("space-y-1.5 w-full text-right", className)} dir="rtl">
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">{children}</div>
      {error && (
        <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1 transition-all">
          {error}
        </p>
      )}
      {description && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

/**
 * FormGrid — Responsive grid container for form layouts.
 * Aligns inputs evenly without hardcoded grid classes on pages.
 */
export const FormGrid = ({ cols = 2, children, className }) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-4 sm:gap-6", colClasses[cols] || colClasses[2], className)}>
      {children}
    </div>
  );
};

/**
 * InlineActionRow — Presentational container for buttons.
 * Renders at the bottom of forms, aligned properly with spacing.
 */
export const InlineActionRow = ({ children, className }) => {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6", className)}>
      {children}
    </div>
  );
};
