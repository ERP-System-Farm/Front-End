import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * TableToolbar — Presentational, Tailwind-based table filter/search toolbar.
 * Restored with identical props for drop-in compatibility.
 * 
 * Props:
 *  - searchValue: string — current search text
 *  - onSearchChange: (value) => void
 *  - filters: [{ key, label, value, options: [{value, label}] }]
 *  - onFilterChange: (key, value) => void
 *  - onClear: () => void
 */
const TableToolbar = ({ searchValue, onSearchChange, filters = [], onFilterChange, onClear }) => {
  const { t } = useTranslation();

  // Dynamic grid column spanning based on filter count
  const filterCount = filters.length;
  const searchSpan = filterCount > 0 ? "md:col-span-4" : "md:col-span-10";

  return (
    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 mb-6 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end" dir="rtl">
        
        {/* Search Field */}
        <div className={`col-span-12 ${searchSpan}`}>
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('common.search_title', 'البحث')}
            </span>
            <div className="relative">
              <input
                type="text"
                placeholder={t('common.search', 'بحث...')}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl ps-9 pe-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
              <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <div className="col-span-6 md:col-span-3" key={filter.key}>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {filter.label}
              </span>
              <select
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold cursor-pointer"
              >
                <option value="ALL">{t('common.all', 'الكل')}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {/* Clear Action Button */}
        <div className="col-span-12 md:col-span-2">
          <button
            onClick={onClear}
            type="button"
            className="flex items-center justify-center gap-1.5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm h-[38px] rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 dark:ring-slate-700"
          >
            <X className="h-4 w-4" />
            {t('common.clear', 'مسح')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableToolbar;
