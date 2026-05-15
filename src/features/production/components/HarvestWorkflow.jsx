import React from 'react'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'
import PendingIcon from '@mui/icons-material/Pending'
import { Box, Button, Chip, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

const HarvestWorkflow = ({ status, onAction, loading }) => {
  const { t } = useTranslation()

  const steps = [
    { key: 'DRAFT', label: t('production.state_draft', 'مسودة') },
    { key: 'SUBMITTED', label: t('production.state_submitted', 'تم التقديم') },
    { key: 'APPROVED', label: t('production.state_approved', 'تم الاعتماد') },
    { key: 'FINALIZED', label: t('production.state_finalized', 'نهائي') },
  ]

  const activeStep = steps.findIndex((s) => s.key === status)

  const getStatusColor = (key) => {
    switch (key) {
      case 'FINALIZED':
        return 'success'
      case 'APPROVED':
        return 'info'
      case 'SUBMITTED':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 4, mb: 4, bgcolor: '#f8fafc' }}
    >
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {t('production.workflow_status', 'حالة سير العمل الميداني')}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
            {t('production.workflow_desc', 'إدارة دورة حياة تقرير الحصاد والاعتمادات الرسمية')}
          </Typography>
        </Box>
        <Chip
          label={steps[activeStep]?.label}
          color={getStatusColor(status)}
          icon={
            status === 'FINALIZED' ? (
              <LockIcon fontSize="small" />
            ) : (
              <PendingIcon fontSize="small" />
            )
          }
          sx={{ fontWeight: 800, borderRadius: 2, px: 1 }}
        />
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step) => (
          <Step key={step.key}>
            <StepLabel
              StepIconProps={{ sx: { fontSize: 24 } }}
              optional={
                step.key === status && (
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                    {t('production.current_state', 'الحالة الحالية')}
                  </Typography>
                )
              }
            >
              <span className="font-bold text-[0.8rem]">{step.label}</span>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {status === 'DRAFT' && (
          <Button
            variant="contained"
            onClick={() => onAction('submit')}
            disabled={loading}
            sx={{ bgcolor: '#0f172a', borderRadius: 2, fontWeight: 700 }}
          >
            {t('production.action_submit', 'تقديم للمراجعة')}
          </Button>
        )}
        {status === 'SUBMITTED' && (
          <Button
            variant="contained"
            color="success"
            onClick={() => onAction('finalize')}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {t('production.action_finalize', 'اعتماد نهائي وإغلاق')}
          </Button>
        )}
        {status === 'FINALIZED' && (
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CheckCircleIcon color="success" fontSize="small" />
            {t('production.record_locked', 'هذا السجل مقفل ولا يمكن تعديله')}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default HarvestWorkflow
