import React, { useState } from 'react'

import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import EnclosureHeader from './components/EnclosureHeader'
import OperationActionBar from './components/OperationActionBar'
import OperationalAlerts from './components/OperationalAlerts'
import OperationalJournal from './components/OperationalJournal'
import OperationalSnapshot from './components/OperationalSnapshot'
import { useEnclosureProfile } from './hooks/useEnclosureProfile'

/**
 * Enclosure Dashboard (ERP Operational Workspace)
 * The central command and history ledger for a single enclosure asset.
 */
const EnclosureDashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)

  const { profile, loading, error } = useEnclosureProfile(id, refreshKey)

  const handleRefresh = () => setRefreshKey((prev) => prev + 1)

  if (error) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          خطأ في الوصول إلى بيانات الأصل
        </Typography>
        <Button variant="contained" onClick={() => navigate('/farm/structure')}>
          العودة للهيكل التنظيمي
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      {/* 1. Identity & Context Header */}
      <EnclosureHeader profile={profile} loading={loading} />

      <Container maxWidth="xl">
        <Stack spacing={2} sx={{ mt: -3 }}>
          {/* 2. Operational Action Bar */}
          <OperationActionBar enclosureId={id} onAction={handleRefresh} />

          {/* 3. Priority Alerts */}
          <OperationalAlerts profile={profile} />

          {/* 4. Live Operational Snapshot (Dense Row) */}
          <OperationalSnapshot profile={profile} loading={loading} />

          {/* 5. The Core: Operational Journal (The Ledger) */}
          <Box sx={{ mt: 1, flexGrow: 1 }}>
            <OperationalJournal enclosureId={id} />
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default EnclosureDashboard
