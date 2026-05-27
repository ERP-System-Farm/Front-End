/**
 * AdminPageHeader — ATLS Design System
 *
 * Presentational component extracted from AdminControls.jsx.
 * Replaces the MUI Box/Typography outer header structure
 * with a pure Tailwind equivalent.
 *
 * Props:
 *   title       — string: page title (already translated by caller)
 *   subtitle    — string: page description
 *   actions     — ReactNode: optional action buttons (e.g., export button)
 *
 * SAFE: Pure presentational. No state, no API, no permissions.
 */
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminPageHeader = ({ title, subtitle, actions, className }) => {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8',
      className
    )}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight leading-tight">
          <span className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </span>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 ms-[52px] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default AdminPageHeader;
