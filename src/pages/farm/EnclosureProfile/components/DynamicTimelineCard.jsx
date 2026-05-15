import React from 'react'

import {
  AccountCircle as UserIcon,
  Attachment as AttachIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { Box, Card, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import dayjs from 'dayjs'

import { SafeProfileRenderer } from './timelineRegistry'

/**
 * Dynamic Timeline Card
 * Renders a single OperationLog event with specialized data.
 */
const DynamicTimelineCard = ({ event, isBulkGroup, itemsCount }) => {
  if (!event) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'FAILED':
        return 'error'
      case 'SKIPPED':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'تم التنفيذ'
      case 'PENDING':
        return 'قيد الانتظار'
      case 'FAILED':
        return 'فشل'
      case 'SKIPPED':
        return 'تخطى'
      default:
        return status
    }
  }

  return (
    <Card
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        display: 'flex',
        gap: 2,
        border: '1px solid',
        borderColor: isBulkGroup ? 'primary.light' : 'divider',
        boxShadow: isBulkGroup ? '0 4px 12px rgba(25, 118, 210, 0.08)' : 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
          transform: 'translateX(-4px)',
        },
      }}
    >
      {isBulkGroup && (
        <Box
          sx={{
            position: 'absolute',
            left: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '60%',
            bgcolor: 'primary.main',
            borderRadius: 2,
          }}
        />
      )}

      {/* Date Indicator */}
      <Box
        sx={{
          minWidth: 80,
          textAlign: 'center',
          borderRight: '1px solid',
          borderColor: 'divider',
          pr: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {dayjs(event.report_date).format('DD')}
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ textTransform: 'uppercase', fontWeight: 600 }}
        >
          {dayjs(event.report_date).format('MMM YYYY')}
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {event.operation_name}
              </Typography>
              <Chip
                label={getStatusLabel(event.status)}
                size="small"
                color={getStatusColor(event.status)}
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
            >
              <UserIcon sx={{ fontSize: 14, mr: 0.5 }} />
              بواسطة: {event.engineer_name}
            </Typography>
          </Box>
          <Chip
            label={event.operation_category}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 1, height: 20, fontSize: '0.7rem' }}
          />
        </Box>

        {/* Dynamic Profile Data - The Core of Entity-Centric View */}
        <Box sx={{ mt: 1.5, mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
          <SafeProfileRenderer
            type={event.profile_type}
            data={event.profile_data}
            uiSchema={event.ui_schema}
          />
        </Box>

        {/* Footer Metrics Summary */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1,
            borderTop: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>
              💰 {event.metrics.total_cost.toLocaleString()} ج.م
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
              👷 {event.metrics.worker_count} عمال
            </Typography>
            {event.attachments_count > 0 && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <AttachIcon sx={{ fontSize: 14, mr: 0.5 }} />
                {event.attachments_count}
              </Typography>
            )}
          </Box>
          <Tooltip title="عرض التقرير الكامل">
            <IconButton size="small" color="primary">
              <ViewIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  )
}

export default DynamicTimelineCard
