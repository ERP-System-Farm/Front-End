import React from 'react'

import {
  AccessTime as TimeIcon,
  DateRange as DateIcon,
  Grass as CropIcon,
  Inventory as YieldIcon,
  Park as TreeIcon,
  Spa as FertilizerIcon,
  TaskAlt as OpIcon,
  WaterDrop as WaterIcon,
} from '@mui/icons-material'
import { Box, Divider, Grid, Paper, Typography } from '@mui/material'
import dayjs from 'dayjs'

import { renderValue } from '../../../../utils/renderFallback'

const OperationalSnapshot = ({ profile, loading }) => {
  const DataPoint = ({ label, value, icon: Icon, color = '#64748b' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '6px',
          bgcolor: `${color}15`,
          color: color,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.5 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )

  const { asset_profile, summary_metrics } = profile || {}

  if (loading) return null

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        bgcolor: 'white',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <Grid container spacing={0}>
        {/* Specs Group */}
        <Grid
          item
          xs={12}
          lg={7}
          sx={{
            borderBottom: { xs: '1px solid #e2e8f0', lg: 'none' },
            borderRight: { lg: '1px solid #e2e8f0' },
          }}
        >
          <Grid container spacing={0}>
            <Grid
              item
              xs={6}
              sm={3}
              sx={{
                borderRight: '1px solid #f1f5f9',
                borderBottom: { xs: '1px solid #f1f5f9', sm: 'none' },
                p: 1,
              }}
            >
              <DataPoint
                label="المحصول"
                value={renderValue(asset_profile?.crop_type)}
                icon={CropIcon}
                color="#10b981"
              />
            </Grid>
            <Grid
              item
              xs={6}
              sm={3}
              sx={{
                borderRight: { xs: 'none', sm: '1px solid #f1f5f9' },
                borderBottom: { xs: '1px solid #f1f5f9', sm: 'none' },
                p: 1,
              }}
            >
              <DataPoint
                label="سنة الزراعة"
                value={renderValue(asset_profile?.planting_year)}
                icon={DateIcon}
                color="#3b82f6"
              />
            </Grid>
            <Grid item xs={6} sm={3} sx={{ borderRight: '1px solid #f1f5f9', p: 1 }}>
              <DataPoint
                label="الأشجار"
                value={renderValue(asset_profile?.tree_count, 'شجرة')}
                icon={TreeIcon}
                color="#0f172a"
              />
            </Grid>
            <Grid item xs={6} sm={3} sx={{ p: 1 }}>
              <DataPoint
                label="الإنتاج المستهدف"
                value={renderValue(asset_profile?.expected_yield, 'طن')}
                icon={YieldIcon}
                color="#f59e0b"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Live State Group */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={0}>
            <Grid
              item
              xs={6}
              sm={4}
              sx={{
                borderRight: '1px solid #f1f5f9',
                borderBottom: { xs: '1px solid #f1f5f9', sm: 'none' },
                p: 1,
              }}
            >
              <DataPoint
                label="آخر ري"
                value={
                  summary_metrics?.last_irrigation_date
                    ? dayjs(summary_metrics.last_irrigation_date).format('DD MMM')
                    : renderValue(null)
                }
                icon={WaterIcon}
                color="#3b82f6"
              />
            </Grid>
            <Grid
              item
              xs={6}
              sm={4}
              sx={{
                borderRight: { xs: 'none', sm: '1px solid #f1f5f9' },
                borderBottom: { xs: '1px solid #f1f5f9', sm: 'none' },
                p: 1,
              }}
            >
              <DataPoint
                label="آخر تسميد"
                value={
                  summary_metrics?.last_fertilization_date
                    ? dayjs(summary_metrics.last_fertilization_date).format('DD MMM')
                    : renderValue(null)
                }
                icon={FertilizerIcon}
                color="#10b981"
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ p: 1 }}>
              <DataPoint
                label="ساعات العمل"
                value={renderValue(summary_metrics?.total_work_hours, 'ساعة')}
                icon={TimeIcon}
                color="#64748b"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default OperationalSnapshot
