import React from 'react'

import {
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import { Box, Card, CardContent, Divider, Grid, Skeleton, Typography } from '@mui/material'

/**
 * Overview Widget for Enclosure Profile
 * Displays high-level asset metadata and summary metrics.
 */
const OverviewWidget = ({ profile, loading }) => {
  if (loading) {
    return (
      <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
          <Divider sx={{ mb: 3 }} />
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ display: 'flex', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ width: '100%' }}>
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="50%" />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!profile) return null

  const { hierarchy, summary_metrics } = profile

  const MetricItem = ({ icon: Icon, label, value, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: `${color}.50`,
          color: `${color}.main`,
          mr: 2,
          display: 'flex',
        }}
      >
        <Icon />
      </Box>
      <Box>
        <Typography variant="caption" color="textSecondary" display="block">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {profile.name}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {hierarchy.sector?.name || '---'} / {hierarchy.stage?.name || '---'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <MetricItem
              icon={AssignmentIcon}
              label="إجمالي العمليات المنفذة"
              value={summary_metrics.total_operations}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MetricItem
              icon={TimerIcon}
              label="إجمالي ساعات العمل"
              value={`${summary_metrics.total_work_hours} ساعة`}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MetricItem
              icon={HistoryIcon}
              label="تاريخ آخر عملية"
              value={summary_metrics.last_operation_date || 'لا يوجد سجلات'}
              color="warning"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default OverviewWidget
