import React from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export const STATUS_CONFIG = {
  draft: { 
    label: 'مسودة', 
    bg: 'bg-slate-100', 
    text: 'text-slate-600', 
    borderColor: 'border-slate-200' 
  },
  submitted: { 
    label: 'مقدم', 
    bg: 'bg-sky-50', 
    text: 'text-sky-700', 
    borderColor: 'border-sky-100' 
  },
  under_review: { 
    label: 'قيد المراجعة', 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    borderColor: 'border-amber-100' 
  },
  approved: {
    label: 'معتمد',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    borderColor: 'border-emerald-100',
    icon: <Lock className="h-3 w-3 text-emerald-600" />
  },
  rejected: {
    label: 'مرفوض',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    borderColor: 'border-rose-100',
    icon: <AlertTriangle className="h-3 w-3 text-rose-600" />
  }
};

const ReportStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${config.bg} ${config.text} ${config.borderColor || 'border-transparent'}`}>
      {config.icon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

export default ReportStatusBadge;
