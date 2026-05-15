import React, { useState } from 'react'

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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { useEnclosureTimeline } from '../hooks/useEnclosureProfile'

import OperationalDetailsDrawer from './OperationalDetailsDrawer'
import OperationLedgerRow from './OperationLedgerRow'

const OperationalJournal = ({ enclosureId }) => {
  const [filters, setFilters] = useState({ search: '', type: 'all', status: 'all' })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { events, loading, hasMore, loadMore, error } = useEnclosureTimeline(enclosureId)

  const handleRowClick = (event) => {
    setSelectedEvent(event)
    setDrawerOpen(true)
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
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                sx={{ bgcolor: 'white', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <MenuItem value="all">كل العمليات</MenuItem>
                <MenuItem value="irrigation">الري</MenuItem>
                <MenuItem value="fertilization">التسميد</MenuItem>
                <MenuItem value="spraying">المكافحة</MenuItem>
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
              لم يتم تسجيل أي نشاط تشغيلي لهذه الحوشة حتى الآن.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              sx={{ borderRadius: '6px', bgcolor: '#0f172a' }}
            >
              بدء تسجيل أول عملية
            </Button>
          </Box>
        ) : (
          /* Ledger Table */
          <Box>
            <Box
              sx={{
                bgcolor: '#f1f5f9',
                px: 2,
                py: 1,
                display: { xs: 'none', md: 'flex' },
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Typography
                variant="caption"
                sx={{ width: '15%', fontWeight: 700, color: '#475569' }}
              >
                التاريخ
              </Typography>
              <Typography
                variant="caption"
                sx={{ width: '25%', fontWeight: 700, color: '#475569' }}
              >
                العملية
              </Typography>
              <Typography
                variant="caption"
                sx={{ width: '20%', fontWeight: 700, color: '#475569' }}
              >
                المسؤول
              </Typography>
              <Typography
                variant="caption"
                sx={{ width: '20%', fontWeight: 700, color: '#475569' }}
              >
                المؤشرات
              </Typography>
              <Typography
                variant="caption"
                sx={{ width: '20%', fontWeight: 700, color: '#475569', textAlign: 'right' }}
              >
                الحالة
              </Typography>
            </Box>

            <Box>
              {events.map((event) => (
                <OperationLedgerRow
                  key={event.id}
                  event={event}
                  onClick={() => handleRowClick(event)}
                />
              ))}

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
