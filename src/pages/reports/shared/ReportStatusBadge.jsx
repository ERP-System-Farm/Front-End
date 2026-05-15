import React from 'react'

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import LockIcon from '@mui/icons-material/Lock'
import { Chip } from '@mui/material'

export const STATUS_CONFIG = {
  draft: { label: 'مسودة', color: 'default', bg: '#f1f5f9', text: '#475569' },
  submitted: { label: 'مقدم', color: 'info', bg: '#e0f2fe', text: '#0284c7' },
  under_review: { label: 'قيد المراجعة', color: 'warning', bg: '#fef3c7', text: '#d97706' },
  approved: {
    label: 'معتمد',
    color: 'success',
    bg: '#dcfce7',
    text: '#16a34a',
    icon: <LockIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />,
  },
  rejected: {
    label: 'مرفوض',
    color: 'error',
    bg: '#fee2e2',
    text: '#dc2626',
    icon: <ErrorOutlineIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />,
  },
}

const ReportStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.text,
        fontWeight: 700,
        borderRadius: 1.5,
        '& .MuiChip-icon': {
          color: 'inherit',
          marginLeft: '4px',
          marginRight: '-4px',
        },
      }}
    />
  )
}

export default ReportStatusBadge
