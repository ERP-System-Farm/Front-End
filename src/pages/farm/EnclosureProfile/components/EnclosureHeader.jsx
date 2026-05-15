import React from 'react'

import {
  Circle as StatusIcon,
  Dashboard as DashboardIcon,
  LocationOn as LocationIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material'
import { Box, Breadcrumbs, Chip, Container, Link, Skeleton, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const EnclosureHeader = ({ profile, loading }) => {
  const navigate = useNavigate()

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'white', pt: 6, pb: 10, borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="xl">
          <Skeleton variant="text" width={200} height={20} />
          <Skeleton variant="text" width={300} height={40} sx={{ mt: 1 }} />
        </Container>
      </Box>
    )
  }

  const { hierarchy } = profile || {}

  return (
    <Box
      sx={{
        bgcolor: 'white',
        pt: 4,
        pb: 8,
        borderBottom: '1px solid #e2e8f0',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Container maxWidth="xl">
        <Breadcrumbs
          separator={<NextIcon fontSize="small" sx={{ color: '#94a3b8' }} />}
          sx={{ mb: 1.5 }}
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/farm/structure')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: '#64748b',
            }}
          >
            <DashboardIcon sx={{ mr: 0.5, fontSize: 14 }} />
            هيكل المزرعة
          </Link>
          {hierarchy?.sector && (
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
              {hierarchy.sector.name}
            </Typography>
          )}
          {hierarchy?.stage && (
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
              {hierarchy.stage.name}
            </Typography>
          )}
        </Breadcrumbs>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}
              >
                {profile?.name}
              </Typography>
              <Chip
                icon={<StatusIcon sx={{ fontSize: '10px !important' }} />}
                label={profile?.is_active ? 'نشط تشغيلياً' : 'متوقف'}
                size="small"
                color={profile?.is_active ? 'success' : 'default'}
                sx={{
                  borderRadius: '4px',
                  fontWeight: 700,
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: profile?.is_active ? '#f0fdf4' : '#f1f5f9',
                  color: profile?.is_active ? '#166534' : '#475569',
                  border: '1px solid',
                  borderColor: profile?.is_active ? '#bcf0da' : '#e2e8f0',
                }}
              />
            </Stack>
            <Typography
              variant="body2"
              sx={{ color: '#64748b', mt: 0.5, display: 'flex', alignItems: 'center' }}
            >
              <LocationIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.7 }} />
              الأصل الزراعي المعرف بالمعرف رقم: {profile?.id}
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default EnclosureHeader
