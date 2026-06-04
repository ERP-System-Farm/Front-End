import React from 'react'
import { Lock, AlertTriangle, Clock, FileEdit, CheckCircle2, Eye } from 'lucide-react'

export const STATUS_CONFIG = {
  draft: {
    label: 'مسودة',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700/60',
    dot: 'bg-slate-400',
    icon: <FileEdit className="h-3 w-3" />,
  },
  submitted: {
    label: 'بانتظار الاعتماد',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/50',
    dot: 'bg-amber-500',
    icon: <Clock className="h-3 w-3" />,
  },
  under_review: {
    label: 'قيد المراجعة',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800/50',
    dot: 'bg-sky-500',
    icon: <Eye className="h-3 w-3" />,
  },
  approved: {
    label: 'معتمد',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  finalized: {
    label: 'مكتمل',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800/50',
    dot: 'bg-teal-500',
    icon: <Lock className="h-3 w-3" />,
  },
  rejected: {
    label: 'مرفوض',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/50',
    dot: 'bg-rose-500',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
}

const ReportStatusBadge = ({ status, size = 'default' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-1.5 py-0.5 gap-1'
      : 'text-xs px-2 py-0.5 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  )
}

export default ReportStatusBadge
