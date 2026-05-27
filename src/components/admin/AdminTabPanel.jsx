/**
 * AdminTabPanel — ATLS Design System
 *
 * Presentational container for each admin tab panel.
 * Provides consistent padding, page-entry animation, and ARIA attributes.
 *
 * Props:
 *   id       — string: tab key (used for aria-labelledby)
 *   active   — boolean: whether this panel is visible
 *   children — ReactNode
 *
 * SAFE: Pure presentational. No state, no API, no business logic.
 */
import React from 'react';
import { cn } from '@/lib/utils';

const AdminTabPanel = ({ id, active, children, className }) => {
  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={cn(
        'space-y-6',
        active ? 'block atls-page-enter' : 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
};

export default AdminTabPanel;
