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
  AttachFile as AttachIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Collapse,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import dayjs from 'dayjs'
import { getCloudinaryUrl } from '../../../../utils/cloudinary'
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

  const statusStyle = getStatusConfig(event.report_status || event.status)
  const StatusIcon = statusStyle.icon

  // Read directly from OperationLog fields (now sent by backend serializer)
  const companyWorkers = parseInt(event.company_workers ?? event.metrics?.company_workers ?? 0)
  const contractorWorkers = parseInt(event.contractor_workers ?? event.metrics?.contractor_workers ?? 0)
  const totalWorkers = companyWorkers + contractorWorkers
  const workHours = parseFloat(event.work_hours ?? event.metrics?.total_hours ?? 0)
  const productivity = event.actual_productivity != null ? parseFloat(event.actual_productivity) : null
  // operation_date comes from report.report_date (no timestamp), fallback to created_at
  const displayDate = event.operation_date || event.report_date || event.created_at

  return (
    <Box sx={{ borderBottom: '1px solid #f1f5f9', bgcolor: expanded ? '#f8fafc' : 'transparent', transition: 'background-color 0.2s' }}>

      {/* ── Collapsed Row ── */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{ display: 'flex', alignItems: 'center', p: { xs: 1.5, md: 2 }, cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' } }}
      >
        {/* 1. Date & Time */}
        <Box sx={{ width: { xs: '25%', md: '15%' } }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
            {dayjs(displayDate).format('DD MMM')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon sx={{ fontSize: 12 }} /> {dayjs(displayDate).isValid() ? dayjs(displayDate).format('HH:mm') : ''}
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

        {/* 4. Quick Stats (Desktop Only) */}
        {!isMobile && (
          <Box sx={{ width: '20%' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              {productivity != null && (
                <Chip
                  label={`${productivity} ${event.unit_name || ''}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700 }}
                />
              )}
              <Chip
                label={`${totalWorkers} عمال`}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', fontWeight: 600 }}
              />
              <Chip
                label={`${workHours} س`}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9', fontWeight: 600 }}
              />
            </Stack>
          </Box>
        )}

        {/* 5. Status & Toggle */}
        <Box sx={{ width: { xs: '30%', md: '20%' }, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <Chip
            icon={<StatusIcon sx={{ fontSize: '14px !important', color: `${statusStyle.color} !important` }} />}
            label={isMobile ? '' : event.status === 'COMPLETED' ? 'تم' : 'قيد'}
            size="small"
            sx={{ bgcolor: statusStyle.bg, color: statusStyle.text, fontWeight: 800, height: 24, '& .MuiChip-label': { px: isMobile ? 0 : 1 } }}
          />
          <Box sx={{ color: '#94a3b8' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Box>
        </Box>
      </Box>

      {/* ── Expanded Details Panel ── */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: { xs: 2, md: 3 }, pt: 1.5, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>

          {/* Quick KPI Chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1, mb: 2.5 }}>
            <Chip label={`${companyWorkers} عمال الشركة`} size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 800, border: '1px solid #bbf7d0' }} />
            <Chip label={`${contractorWorkers} عمال المقاول`} size="small"
              sx={{ bgcolor: '#fffbeb', color: '#b45309', fontWeight: 800, border: '1px solid #fde68a' }} />
            <Chip label={`${workHours} ساعة عمل`} size="small"
              sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800, border: '1px solid #bfdbfe' }} />
            {productivity != null && (
              <Chip label={`إنجاز: ${productivity} ${event.unit_name || ''}`} size="small"
                sx={{ bgcolor: '#ecfdf5', color: '#065f46', fontWeight: 800, border: '1px solid #6ee7b7' }} />
            )}
            {event.overtime_hours > 0 && (
              <Chip label={`وقت إضافي: ${event.overtime_hours} ساعة`} size="small"
                sx={{ bgcolor: '#fdf4ff', color: '#7e22ce', fontWeight: 800, border: '1px solid #e9d5ff' }} />
            )}
          </Stack>

          {/* 3-Column Cards */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>

            {/* Card 1: Labor */}
            <Box sx={{ flex: 1, p: 2.5, bgcolor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 900, textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.05em' }}>
                تفاصيل العمالة
              </Typography>
              <Stack spacing={1.5}>
                {/* Worker counts */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1, p: 1.5, bgcolor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block' }}>عمال الشركة</Typography>
                    <Typography variant="h5" sx={{ color: '#14532d', fontWeight: 900, lineHeight: 1.2 }}>{companyWorkers}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 1.5, bgcolor: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700, display: 'block' }}>عمال المقاول</Typography>
                    <Typography variant="h5" sx={{ color: '#78350f', fontWeight: 900, lineHeight: 1.2 }}>{contractorWorkers}</Typography>
                  </Box>
                </Box>
                {/* Contractor name */}
                {(event.contractor_name || event.profile_data?.contractor_name) && (
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>اسم المقاول</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {event.contractor_name || event.profile_data?.contractor_name}
                    </Typography>
                  </Box>
                )}
                {/* Work hours */}
                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>ساعات العمل</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{workHours} ساعة</Typography>
                </Box>
                {event.overtime_hours > 0 && (
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>وقت إضافي</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#7e22ce' }}>{event.overtime_hours} ساعة</Typography>
                  </Box>
                )}
                {/* Individual labor entries */}
                {event.labor_entries?.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, mb: 1, display: 'block' }}>أسماء العمال</Typography>
                    <Stack spacing={0.5}>
                      {event.labor_entries.map((labor, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 1, bgcolor: '#f8fafc', borderRadius: '6px' }}>
                          <Typography variant="body2" fontWeight={700}>{labor.worker_name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">{labor.hours}س</Typography>
                            <Chip label={labor.worker_type === 'COMPANY' ? 'موظف' : 'مقاول'} size="small"
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                                bgcolor: labor.worker_type === 'COMPANY' ? '#eff6ff' : '#fffbeb',
                                color: labor.worker_type === 'COMPANY' ? '#1d4ed8' : '#b45309' }} />
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Card 2: Production & Progress */}
            <Box sx={{ flex: 1, p: 2.5, bgcolor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 900, textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.05em' }}>
                الإنجاز والإنتاجية
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>الإنتاجية الفعلية</Typography>
                  <Typography variant="h4" sx={{ color: '#15803d', fontWeight: 900, mt: 0.5 }}>
                    {productivity ?? 0}
                    <Typography component="span" variant="body2" sx={{ color: '#4ade80', fontWeight: 700, ml: 1 }}>
                      {event.unit_name || ''}
                    </Typography>
                  </Typography>
                </Box>
                {event.completion_percentage != null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>نسبة الإكمال</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>{event.completion_percentage}%</Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${event.completion_percentage}%`, bgcolor: event.completion_percentage >= 100 ? '#10b981' : '#3b82f6', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                    </Box>
                  </Box>
                )}
                {event.variety_name && (
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>الصنف</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{event.variety_name}</Typography>
                  </Box>
                )}
                {event.unit_name && (
                  <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>الوحدة</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{event.unit_name}</Typography>
                  </Box>
                )}
                {/* Profile data extras */}
                {event.profile_data && Object.entries(event.profile_data)
                  .filter(([k]) => !['company_workers','contractor_workers','contractor_name','contractor'].includes(k))
                  .map(([key, value]) => (
                    <Box key={key} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{key.replace(/_/g, ' ')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Typography>
                    </Box>
                  ))
                }
              </Stack>
            </Box>

            {/* Card 3: Notes */}
            <Box sx={{ flex: 1, p: 2.5, bgcolor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 900, textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.05em' }}>
                الملاحظات الميدانية
              </Typography>
              <Typography variant="body2" sx={{
                color: event.notes ? '#334155' : '#94a3b8',
                fontStyle: event.notes ? 'normal' : 'italic',
                lineHeight: 1.9, flex: 1,
                p: event.notes ? 1.5 : 0,
                bgcolor: event.notes ? '#f8fafc' : 'transparent',
                borderRadius: '8px',
                border: event.notes ? '1px solid #e2e8f0' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {event.notes || 'لا توجد ملاحظات مسجلة لهذه العملية.'}
              </Typography>
              {event.engineer_name && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>المهندس المسؤول</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{event.engineer_name}</Typography>
                </Box>
              )}
            </Box>

          </Stack>

          {/* Attachments */}
          {event.attachments?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, mb: 1, display: 'block' }}>المرفقات</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                {event.attachments.map((url, idx) => (
                  <Button key={idx} startIcon={<AttachIcon />} variant="outlined" size="small"
                    onClick={(e) => { e.stopPropagation(); window.open(getCloudinaryUrl(url), '_blank') }}
                    sx={{ borderRadius: '8px', color: '#0f172a', borderColor: '#cbd5e1', bgcolor: 'white', fontWeight: 700 }}>
                    مرفق {idx + 1}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

        </Box>
      </Collapse>
    </Box>
  )
}

export default OperationLedgerRow
