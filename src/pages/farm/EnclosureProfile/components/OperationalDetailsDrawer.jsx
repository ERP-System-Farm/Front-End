import React from 'react'

import {
  AttachFile as AttachIcon,
  Close as CloseIcon,
  Description as NoteIcon,
  Edit as EditIcon,
  Inventory2 as MaterialIcon,
  Person as UserIcon,
  Print as PrintIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'

import { getCloudinaryUrl } from '../../../../utils/cloudinary'

import AttachmentGallery from '../../../reports/shared/AttachmentGallery'

const OperationalDetailsDrawer = ({ open, onClose, event }) => {
  if (!event) return null

  const renderSection = (title, content) => (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ width: 4, height: 16, bgcolor: '#3b82f6', borderRadius: '2px' }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Typography>
      </Stack>
      {content}
    </Box>
  )

  return (
    <Drawer
      anchor="left" // "left" in RTL acts as right-side slide-in
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 }, bgcolor: '#f8fafc' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: 'white',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
            {event.operation_name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            معرف العملية: {String(event.id).split('-')[0]} •{' '}
            {dayjs(event.report_date).format('DD MMMM YYYY')} •{' '}
            {dayjs(event.created_at).format('HH:mm')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Action Strip */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          variant="outlined"
          sx={{ borderRadius: '6px', color: '#475569', borderColor: '#cbd5e1' }}
        >
          تعديل
        </Button>
        <Button
          size="small"
          startIcon={<PrintIcon />}
          variant="outlined"
          sx={{ borderRadius: '6px', color: '#475569', borderColor: '#cbd5e1' }}
        >
          طباعة تقرير
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto' }}>
        {renderSection(
          'تفاصيل التنفيذ',
          <Paper
            elevation={0}
            sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: '8px', bgcolor: 'white' }}
          >
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  المشرف المسؤول
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {event.engineer_name || 'غير مسجل'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  ساعات العمل
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {event.metrics?.total_hours || 0} ساعة
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  حالة التنفيذ
                </Typography>
                <Chip
                  label={event.execution_status || event.status}
                  size="small"
                  sx={{
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: event.execution_status === 'COMPLETED' ? '#f0fdf4' : '#fffbeb',
                    color: event.execution_status === 'COMPLETED' ? '#166534' : '#92400e',
                    border: '1px solid',
                    borderColor: event.execution_status === 'COMPLETED' ? '#bcf0da' : '#fde68a',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography
                  variant="caption"
                  sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  حالة التقرير
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                  {event.report_status}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {renderSection(
          'الملاحظات الفنية',
          <Paper
            elevation={0}
            sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '6px', bgcolor: 'white' }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <NoteIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  color: event.notes ? '#334155' : '#94a3b8',
                  fontStyle: event.notes ? 'normal' : 'italic',
                  lineHeight: 1.6,
                }}
              >
                {event.notes || 'لا توجد ملاحظات إضافية مسجلة لهذه العملية.'}
              </Typography>
            </Box>
          </Paper>
        )}

        {renderSection(
          'تفاصيل التقرير الديناميكية',
          <Stack spacing={1}>
            {event.profile_data && Object.keys(event.profile_data).length > 0 ? (
              Object.entries(event.profile_data).map(([key, value]) => (
                <Paper
                  key={key}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Chip
                icon={<MaterialIcon sx={{ fontSize: '16px !important' }} />}
                label="لا توجد بيانات تفصيلية إضافية"
                variant="outlined"
                sx={{ borderRadius: '6px', color: '#64748b', justifyContent: 'flex-start', p: 1 }}
              />
            )}
          </Stack>
        )}

        {renderSection(
          'العمالة والمهام',
          <Stack spacing={1}>
            {event.labor_entries && event.labor_entries.length > 0 ? (
              event.labor_entries.map((labor, idx) => (
                <Paper
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    bgcolor: 'white',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {labor.worker_name}
                    </Typography>
                    <Chip
                      label={labor.worker_type === 'COMPANY' ? 'موظف' : 'مقاول'}
                      size="small"
                      color={labor.worker_type === 'COMPANY' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ساعات العمل: {labor.hours} • إضافي: {labor.overtime || 0}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '6px', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  إجمالي العمالة: {event.metrics?.worker_count || 0} (بيانات ملخصة)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  لم يتم تسجيل تفاصيل أسماء العمال لهذه العملية.
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        {renderSection(
          'المرفقات والوسائط الميدانية',
          <Box sx={{ mt: 1 }}>
            {event.attachments && event.attachments.length > 0 ? (
              <AttachmentGallery attachments={event.attachments} />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                لا توجد مرفقات تشغيلية لهذه العملية.
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default OperationalDetailsDrawer
