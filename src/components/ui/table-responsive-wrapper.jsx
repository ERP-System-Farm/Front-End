import React from 'react';
import { cn } from '@/lib/utils';

/**
 * TableResponsiveWrapper — Presentational wrapper for table tags.
 * Ensures consistent horizontal scroll overflow styling on mobile viewports.
 */
const TableResponsiveWrapper = ({ children, className }) => {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-thin border border-slate-100 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 transition-colors shadow-sm", className)}>
      {children}
    </div>
  );
};

export default TableResponsiveWrapper;
export { TableResponsiveWrapper };
