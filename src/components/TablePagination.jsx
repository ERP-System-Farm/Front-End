import React from 'react';
import { Box, Typography, Select, MenuItem, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';

/**
 * Reusable pagination component for all data tables.
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
  const from = page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, count);

  return (
    <Box className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 p-4 bg-white border border-slate-100 rounded-xl">
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
        {t('pagination.showing', 'عرض')} {from}–{to} {t('pagination.of', 'من')} {count} {t('pagination.results', 'نتيجة')}
      </Typography>

      <Box className="flex items-center gap-3">
        <Box className="flex items-center gap-1">
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            {t('pagination.per_page', 'صفوف/صفحة')}:
          </Typography>
          <Select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            size="small"
            sx={{ fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', height: 32 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Box>

        <Box className="flex items-center gap-1">
          <IconButton
            size="small"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
            sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', px: 1 }}>
            {page + 1} / {totalPages || 1}
          </Typography>
          <IconButton
            size="small"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
            sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default TablePagination;
