import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — Reusable feedback component for empty views or tables.
 * Ported to Tailwind CSS. API matches original exactly.
 * 
 * Props:
 *  - title: string
 *  - description: string
 *  - actionText: string — CTA button label
 *  - onAction: () => void
 *  - icon: Component — Lucide icon component override
 */
export default function EmptyState({ 
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي نتائج في الوقت الحالي.',
  actionText,
  onAction,
  icon: Icon = Inbox
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 rounded-2xl max-w-sm mx-auto gap-4 transition-colors">
      
      {/* Icon Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-full border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 shadow-sm flex items-center justify-center">
        <Icon className="h-9 w-9 stroke-[1.5]" />
      </div>

      {/* Text Area */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionText && onAction && (
        <button 
          onClick={onAction}
          type="button"
          className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
