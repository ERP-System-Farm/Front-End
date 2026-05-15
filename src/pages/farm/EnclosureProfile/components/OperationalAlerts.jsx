import React from 'react'

import { Close as CloseIcon } from '@mui/icons-material'
import { Alert, AlertTitle, Collapse, IconButton, Stack } from '@mui/material'
import dayjs from 'dayjs'

const OperationalAlerts = ({ profile }) => {
  const [closedAlerts, setClosedAlerts] = React.useState(new Set())

  if (!profile) return null

  const { asset_profile, summary_metrics } = profile
  const alerts = []

  // 1. Inactivity Alert (Warning)
  const lastOpDate = summary_metrics?.last_operation_date
  if (lastOpDate) {
    const daysSince = dayjs().diff(dayjs(lastOpDate), 'day')
    if (daysSince > 30) {
      alerts.push({
        id: 'inactivity',
        severity: 'warning',
        title: 'ركود تشغيلي',
        message: `لم تشهد هذه الحوشة أي نشاط تشغيلي منذ أكثر من ${daysSince} يوماً.`,
      })
    }
  }

  // 2. Missing Data Alert (Info)
  if (!asset_profile?.expected_yield || asset_profile?.expected_yield === 0) {
    alerts.push({
      id: 'missing_yield',
      severity: 'info',
      title: 'بيانات غير مكتملة',
      message: 'الملف الزراعي غير مكتمل: يرجى تحديد الإنتاجية المستهدفة لهذا الموسم.',
    })
  }

  const handleClose = (id) => {
    setClosedAlerts((prev) => new Set(prev).add(id))
  }

  const visibleAlerts = alerts.filter((alert) => !closedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) return null

  return (
    <Stack spacing={1}>
      {visibleAlerts.map((alert) => (
        <Collapse key={alert.id} in={true}>
          <Alert
            severity={alert.severity}
            sx={{
              borderRadius: '6px',
              py: 0,
              '& .MuiAlert-message': { py: 1 },
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => handleClose(alert.id)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            <AlertTitle sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0 }}>
              {alert.title}
            </AlertTitle>
            <span style={{ fontSize: '0.8rem' }}>{alert.message}</span>
          </Alert>
        </Collapse>
      ))}
    </Stack>
  )
}

export default OperationalAlerts
