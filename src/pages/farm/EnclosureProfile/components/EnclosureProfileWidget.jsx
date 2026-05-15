import React from 'react'

import {
  Analytics as YieldIcon,
  Event as YearIcon,
  Grass as CropIcon,
  Park as TreesIcon,
} from '@mui/icons-material'
import { Avatar, Box, Card, CardContent, Chip, Divider, Grid, Typography } from '@mui/material'

/**
 * Enclosure Profile Widget
 * Displays agricultural master data for the specific enclosure.
 */
const EnclosureProfileWidget = ({ assetProfile, loading }) => {
  if (loading) return null // Parent handled loading
  if (!assetProfile) {
    return (
      <Card
        sx={{ borderRadius: 4, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}
      >
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            لم يتم إعداد الملف الزراعي لهذه الحوشة بعد.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const DetailRow = ({ icon: Icon, label, value, unit }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value} {unit}
      </Typography>
    </Box>
  )

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'success.50',
          borderBottom: '1px solid',
          borderColor: 'success.100',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
          <CropIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.dark' }}>
          الملف الزراعي للأصل
        </Typography>
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <DetailRow icon={CropIcon} label="نوع المحصول" value={assetProfile.crop_type || 'نخيل'} />
        <DetailRow
          icon={YearIcon}
          label="سنة الزراعة"
          value={assetProfile.planting_year || '---'}
        />
        <DetailRow
          icon={TreesIcon}
          label="عدد الأشجار"
          value={assetProfile.tree_count || 0}
          unit="شجرة"
        />
        <DetailRow
          icon={TreesIcon}
          label="عدد الشتلات"
          value={assetProfile.seedling_count || 0}
          unit="شتلة"
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            الإنتاجية المستهدفة
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {assetProfile.expected_yield || 0}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              طن / موسم
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EnclosureProfileWidget
