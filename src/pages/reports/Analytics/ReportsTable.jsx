import React from 'react'

import {
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

import { reportsApi } from '../../../services/reportsApi'
import ReportStatusBadge from '../shared/ReportStatusBadge'

const ReportsTable = ({
  data,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  filters,
  onFilterChange,
  operations,
  locations,
  t,
  onRefresh,
}) => {
  const navigate = useNavigate()
  const fieldSx = { flex: '1 1 150px', minWidth: 0 }
  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 1 }, width: '100%' }

  const handleExport = async () => {
    try {
      const response = await reportsApi.exportTasks(filters)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reports_export_${dayjs().format('YYYY-MM-DD')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Export failed:', err)
      alert('فشل تصدير البيانات. يرجى المحاولة مرة أخرى.')
    }
  }

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="700">
            {t('reports.list_title', 'سجل العمليات التشغيلية')}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => onRefresh()}
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
            >
              تحديث
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: '#16a34a' }}
            >
              تصدير البيانات
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          {/* Search */}
          <Box sx={{ flex: '1 1 300px' }}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              {t('filters.search', 'البحث')}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ابحث برقم التقرير، المهندس، أو العملية..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Box>

          {/* العملية */}
          <Box sx={fieldSx}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              {t('filters.operation', 'العملية')}
            </Typography>
            <TextField
              fullWidth
              select
              size="small"
              value={filters.operation || ''}
              onChange={(e) => onFilterChange('operation', e.target.value)}
              displayEmpty
              sx={inputSx}
            >
              <MenuItem value="">{t('filters.all', 'كل العمليات')}</MenuItem>
              {operations?.map((op) => (
                <MenuItem key={op.id} value={op.id}>
                  {op.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* الموقع */}
          <Box sx={fieldSx}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              {t('filters.location', 'الموقع')}
            </Typography>
            <TextField
              fullWidth
              select
              size="small"
              value={filters.location || ''}
              onChange={(e) => onFilterChange('location', e.target.value)}
              displayEmpty
              sx={inputSx}
            >
              <MenuItem value="">{t('filters.all', 'كل المواقع')}</MenuItem>
              {locations?.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* التاريخ */}
          <Box sx={fieldSx}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              {t('filters.date', 'التاريخ')}
            </Typography>
            <TextField
              fullWidth
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.report_date || ''}
              onChange={(e) => onFilterChange('report_date', e.target.value)}
              sx={inputSx}
            />
          </Box>
        </Box>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, py: 2 }}>{t('reports.id', 'ID')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reports.date', 'التاريخ')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reports.status', 'الحالة')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reports.operation', 'العملية')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reports.location', 'الموقع')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('reports.engineer', 'المهندس')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                إجراءات
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((row) => (
              <TableRow
                key={row.id}
                hover
                onClick={() => navigate(`/reports/tasks/${row.id}`)}
                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{row.id}</TableCell>
                <TableCell>{dayjs(row.report_date).format('DD/MM/YYYY')}</TableCell>
                <TableCell>
                  <ReportStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="600">
                    {row.operation_name}
                  </Typography>
                </TableCell>
                <TableCell>{row.location_name || row.enclosure_name}</TableCell>
                <TableCell>{row.engineer_name}</TableCell>
                <TableCell align="center">
                  <Tooltip title="عرض التفاصيل">
                    <IconButton size="small" color="primary">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary" fontWeight="600">
                    لا توجد تقارير مطابقة لخيارات البحث.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={t('table.rows_per_page', 'صفوف لكل صفحة')}
      />
    </Card>
  )
}

export default ReportsTable
