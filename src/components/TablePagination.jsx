import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * TablePagination — Presentational pagination component for all tables.
 * Restored with identical props for drop-in compatibility.
 * 
 * Props:
 *  - count: number — total number of items
 *  - page: number — current page (0-indexed)
 *  - rowsPerPage: number — items per page
 *  - onPageChange: (newPage) => void
 *  - onRowsPerPageChange: (newRowsPerPage) => void
 */
const TablePagination = ({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(count / rowsPerPage);
  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl transition-colors" dir="rtl">
      
      {/* Showing Results Label */}
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
        {t('pagination.showing', 'عرض')} {from}–{to} {t('pagination.of', 'من')} {count} {t('pagination.results', 'نتيجة')}
      </span>

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        
        {/* Rows per page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {t('pagination.per_page', 'صفوف/صفحة')}:
          </span>
          <select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold cursor-pointer h-8"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Page navigator controls (Enforced LTR layout direction to keep chevron symbols aligned) */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1 select-none">
            {page + 1} / {totalPages || 1}
          </span>
          
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-700"
            aria-label="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default TablePagination;
