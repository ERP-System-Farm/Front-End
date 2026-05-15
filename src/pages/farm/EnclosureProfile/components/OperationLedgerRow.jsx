import React, { useState } from 'react'

import {
  Assignment as NoteIcon,
  CheckCircle as SuccessIcon,
  Error as AlertIcon,
  History as HistoryIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Person as SupervisorIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'

import { renderValue } from '../../../../utils/renderFallback'

const OperationLedgerRow = ({ event, onOpenDetails }) => {
  const [expanded, setExpanded] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const getStatusConfig = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { color: '#10b981', bg: '#ecfdf5', icon: SuccessIcon, text: '#065f46' }
      case 'PENDING':
        return { color: '#f59e0b', bg: '#fffbeb', icon: TimeIcon, text: '#92400e' }
      default:
        return { color: '#64748b', bg: '#f1f5f9', icon: AlertIcon, text: '#1e293b' }
    }
  }

  const statusStyle = getStatusConfig(event.status)
  const StatusIcon = statusStyle.icon

  return (
    <Box
      sx={{
        borderBottom: '1px solid #f1f5f9',
        bgcolor: expanded ? '#f8fafc' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      {/* Main Row Content */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: { xs: 1.5, md: 2 },
          cursor: 'pointer',
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
      >
        {/* 1. Date & Time */}
        <Box sx={{ width: { xs: '25%', md: '15%' } }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
            {dayjs(event.operation_date).format('DD MMM')}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <TimeIcon sx={{ fontSize: 12 }} /> {dayjs(event.operation_date).format('HH:mm')}
          </Typography>
        </Box>

        {/* 2. Operation Name */}
        <Box sx={{ width: { xs: '45%', md: '25%' } }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {event.operation_name}
          </Typography>
          {!isMobile && (
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {event.location_name}
            </Typography>
          )}
        </Box>

        {/* 3. Supervisor (Desktop Only) */}
        {!isMobile && (
          <Box sx={{ width: '20%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupervisorIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
            <Typography variant="body2" sx={{ color: '#475569' }}>
              {renderValue(event.engineer_name)}
            </Typography>
          </Box>
        )}

        {/* 4. Indicators/Metrics (Desktop Only) */}
        {!isMobile && (
          <Box sx={{ width: '20%' }}>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`${event.metrics?.worker_count || 0} عمال`}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', fontWeight: 600 }}
              />
              <Chip
                label={`${event.metrics?.total_hours || 0} س`}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', fontWeight: 600 }}
              />
            </Stack>
          </Box>
        )}

        {/* 5. Status & Actions */}
        <Box
          sx={{
            width: { xs: '30%', md: '20%' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <Chip
            icon={
              <StatusIcon
                sx={{ fontSize: '14px !important', color: `${statusStyle.color} !important` }}
              />
            }
            label={isMobile ? '' : event.status === 'COMPLETED' ? 'تم' : 'قيد'}
            size="small"
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.text,
              fontWeight: 800,
              height: 24,
              '& .MuiChip-label': { px: isMobile ? 0 : 1 },
            }}
          />
          <IconButton size="small">
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>

      {/* Expanded Quick View */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{ p: { xs: 2, md: 3 }, pt: 1, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ width: '100%', alignItems: 'stretch' }}
          >
            {/* 1. Stats Box */}
            <Box
              sx={{
                width: { xs: '100%', md: '320px' },
                p: 2.5,
                bgcolor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 2,
                }}
              >
                إحصائيات التنفيذ
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    ساعات العمل
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      px: 1,
                      py: 0.5,
                      bgcolor: '#f1f5f9',
                      borderRadius: '4px',
                    }}
                  >
                    {event.metrics?.total_hours || 0} ساعة
                  </Typography>
                </Box>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    إجمالي العمال
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      px: 1,
                      py: 0.5,
                      bgcolor: '#f1f5f9',
                      borderRadius: '4px',
                    }}
                  >
                    {event.metrics?.worker_count || 0}
                  </Typography>
                </Box>
                {event.variety_name && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      الصنف
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {event.variety_name}
                    </Typography>
                  </Box>
                )}
                {event.unit_name && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      الوحدة
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {event.unit_name}
                    </Typography>
                  </Box>
                )}
                {isMobile && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        المسؤول
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {renderValue(event.engineer_name)}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </Box>

            {/* 2. Notes Box - Flex 1 to fill all space */}
            <Box
              sx={{
                flex: 1,
                p: 2.5,
                bgcolor: 'white',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  mb: 2,
                  display: 'block',
                }}
              >
                الملاحظات الفنية
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: event.notes ? '#334155' : '#94a3b8',
                  fontStyle: event.notes ? 'normal' : 'italic',
                  lineHeight: 1.8,
                }}
              >
                {event.notes || 'لا توجد ملاحظات مسجلة لهذه العملية.'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}

export default OperationLedgerRow
