import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatCard — ATLS Design System
 *
 * Reusable KPI stat card used across Dashboard, Finance, and HR pages.
 * Extracted from Dashboard.jsx to create a single canonical component.
 *
 * Usage:
 *   <StatCard
 *     title="Net Profit"
 *     value="$116,200"
 *     unit="USD"
 *     icon={DollarSign}
 *     iconColor="text-green-600 dark:text-green-400"
 *     iconBg="bg-green-100 dark:bg-green-950/40"
 *     trend="+15% vs last month"
 *     trendDirection="up"    // "up" | "down" | "neutral"
 *   />
 */
const StatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = 'text-green-600 dark:text-green-400',
  iconBg = 'bg-green-100 dark:bg-green-950/40',
  trend,
  trendDirection = 'neutral', // "up" | "down" | "neutral"
  className,
  loading = false,
}) => {
  const TrendIcon =
    trendDirection === 'up' ? TrendingUp :
    trendDirection === 'down' ? TrendingDown :
    Minus;

  const trendTextColor =
    trendDirection === 'up' ? 'text-green-600 dark:text-green-400' :
    trendDirection === 'down' ? 'text-red-600 dark:text-red-400' :
    'text-slate-500 dark:text-slate-400';

  if (loading) {
    return (
      <div className={cn('atls-card p-6 animate-pulse', className)}>
        <div className="flex justify-between items-start mb-5">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-11 h-11 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-6 w-36 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn(
      'atls-card p-6 flex flex-col group relative overflow-hidden',
      className
    )}>
      {/* Subtle decorative gradient */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-slate-50/80 to-transparent dark:from-slate-800/30 rounded-full pointer-events-none" />

      {/* Header row: title + icon */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-snug">
          {title}
        </p>
        {Icon && (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110',
            iconBg,
            iconColor
          )}>
            <Icon className="w-4.5 h-4.5 stroke-[2]" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-3 relative z-10">
        <span className="atls-kpi-value">{value}</span>
        {unit && (
          <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">
            {unit}
          </span>
        )}
      </div>

      {/* Trend badge */}
      {trend && (
        <div className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full w-fit',
          'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700',
          'text-[11px] font-semibold',
          trendTextColor
        )}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
