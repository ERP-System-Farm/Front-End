import React, { useEffect,useState } from 'react'

import {
  EventBusy as EmptyIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { reportsApi } from '../../../../services/reportsApi'
import { useEnclosureTimeline } from '../hooks/useEnclosureProfile'

import OperationalDetailsDrawer from './OperationalDetailsDrawer'
import OperationLedgerRow from './OperationLedgerRow'

const OperationalJournal = ({ enclosureId, profile }) => {
  const [filters, setFilters] = useState({ search: '', operation_id: 'all' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [operations, setOperations] = useState([])

  // The hook will pass operation_id properly if we send it
  const { events, loading, hasMore, loadMore } = useEnclosureTimeline(enclosureId, filters)

  useEffect(() => {
    reportsApi.getOperations().then(res => {
      setOperations(res.data.results || res.data)
    }).catch(err => console.error(err))
  }, [])

  const handleRowClick = (event) => {
    setSelectedEvent(event)
    setDrawerOpen(true)
  }

  // ── Completion % Calculation ──────────────────────────────────────────────
  const isOperationFiltered = filters.operation_id !== 'all'

  // عدد النخيل / الأشجار في الحوشة (من asset_profile)
  const totalTreeCount = (
    profile?.asset_profile?.tree_count ||
    profile?.asset_profile?.palm_count ||
    profile?.asset_profile?.seedling_count ||
    profile?.asset_profile?.plant_count ||
    0
  )

  // مجموع الإنتاجية الفعلية من جميع عمليات الصفحة الحالية
  let totalProductivity = 0
  if (isOperationFiltered && events.length > 0) {
    events.forEach(ev => {
      // أولوية: actual_productivity مباشرة من الـ model، ثم profile_data
      const val = parseFloat(
        ev.actual_productivity ??
        ev.profile_data?.productivity_quantity ??
        ev.profile_data?.quantity ??
        ev.profile_data?.amount ??
        0
      )
      if (!isNaN(val)) totalProductivity += val
    })
  }

  // نسبة الإكمال: إذا لم يكن هناك عدد نخيل، نعتمد على عدد الأحداث التي حالتها COMPLETED
  const completedCount = isOperationFiltered
    ? events.filter(ev => ev.report_status === 'approved' || ev.report_status === 'finalized' || ev.execution_status === 'COMPLETED').length
    : 0

  let percentage = 0
  if (totalTreeCount > 0) {
    // نسبة بناءً على الإنتاجية مقابل العدد الفعلي
    percentage = Math.min(100, Math.round((totalProductivity / totalTreeCount) * 100))
  } else if (isOperationFiltered && events.length > 0) {
    // fallback: نسبة بناءً على عدد التقارير المعتمدة
    percentage = Math.min(100, Math.round((completedCount / events.length) * 100))
  }

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 1. Sticky Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: '8px 8px 0 0',
          border: '1px solid #e2e8f0',
          borderBottom: 'none',
          bgcolor: '#f8fafc',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} flexGrow={1}>
            <TextField
              size="small"
              placeholder="البحث في السجل..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              sx={{
                width: 300,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={filters.operation_id}
                onChange={(e) => setFilters({ ...filters, operation_id: e.target.value })}
                sx={{ bgcolor: 'white', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <MenuItem value="all">كل العمليات</MenuItem>
                {operations.map(op => (
                   <MenuItem key={op.id} value={op.id}>{op.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Button
            variant="text"
            startIcon={<DownloadIcon />}
            sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}
          >
            تصدير PDF
          </Button>
        </Stack>

        {/* Aggregation Summary Indicator */}
        {isOperationFiltered && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
             <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
               <Stack spacing={0.25}>
                 <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                   نسبة إكمال العملية
                 </Typography>
                 <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                   إجمالي الإنجاز:{' '}
                   <span style={{ color: '#10b981', fontWeight: 900 }}>
                     {totalProductivity.toLocaleString()}
                   </span>
                   {totalTreeCount > 0 && (
                     <span style={{ color: '#94a3b8', fontWeight: 600 }}> من {totalTreeCount.toLocaleString()} {profile?.asset_profile?.unit_label || 'نخلة'}</span>
                   )}
                 </Typography>
               </Stack>
               <Box sx={{
                 px: 2, py: 0.75, borderRadius: '20px', fontWeight: 900, fontSize: '1rem',
                 bgcolor: percentage >= 100 ? '#f0fdf4' : percentage >= 60 ? '#fffbeb' : '#fff1f2',
                 color: percentage >= 100 ? '#15803d' : percentage >= 60 ? '#b45309' : '#be123c',
                 border: `2px solid ${percentage >= 100 ? '#bbf7d0' : percentage >= 60 ? '#fde68a' : '#fecdd3'}`,
               }}>
                 {percentage}%
               </Box>
             </Stack>
             <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: percentage >= 100 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#f43f5e',
                    borderRadius: 5,
                    transition: 'width 0.8s ease-in-out'
                  }
                }}
             />
             {totalTreeCount === 0 && (
               <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.75, fontStyle: 'italic' }}>
                 * لم يُسجَّل عدد النخيل للحوشة — النسبة محسوبة من عدد التقارير المعتمدة
               </Typography>
             )}
          </Box>
        )}
      </Paper>

      {/* 2. Journal Ledger (The List) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '0 0 8px 8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          flexGrow: 1,
        }}
      >
        {events.length === 0 && !loading ? (
          /* Empty State */
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'white' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <EmptyIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              لا توجد عمليات زراعية
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              لم يتم تسجيل أي نشاط تشغيلي.
            </Typography>
          </Box>
        ) : (
          /* Ledger Table */
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ overflowX: 'auto', width: '100%', maxHeight: '650px', overflowY: 'auto' }}>
              <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'right' }} dir="rtl">
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', width: '40px', padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}></th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>التاريخ</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>النشاط / العملية</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>المهندس المسؤول</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>الإنتاجية</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>العمالة</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ساعات العمل</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>المرفقات</th>
                    <th style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <OperationLedgerRow
                      key={event.id}
                      event={event}
                      onOpenDrawer={handleRowClick}
                    />
                  ))}
                </tbody>
              </table>
            </Box>

            {hasMore && (
              <Box
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderTop: '1px solid #f1f5f9',
                  bgcolor: 'white',
                }}
              >
                <Button
                  size="small"
                  onClick={loadMore}
                  disabled={loading}
                  sx={{ color: '#3b82f6', fontWeight: 700 }}
                >
                  {loading ? 'جاري التحميل...' : 'عرض المزيد من العمليات التاريخية'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* 3. Details Drawer */}
      <OperationalDetailsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        event={selectedEvent}
      />
    </Box>
  )
}

export default OperationalJournal
