import React, { useEffect, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import HarvestWorkflow from '../../features/production/components/HarvestWorkflow'
import {
  finalizeHarvestReport,
  getHarvestReports,
  getSeasons,
  submitHarvestReport,
} from '../../features/production/services'

const HarvestManagement = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const r = await getHarvestReports()
      setReports(r.results || r)
    } catch (err) {
      setError(t('production.error_fetch', 'خطأ في تحميل البيانات التشغيلية'))
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowAction = async (reportId, action) => {
    setLoading(true)
    try {
      if (action === 'submit') await submitHarvestReport(reportId)
      if (action === 'finalize') await finalizeHarvestReport(reportId)
      fetchInitialData()
      setSelectedReport(null)
    } catch (err) {
      setError(t('production.error_workflow', 'فشل في تحديث حالة سير العمل'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusChip = (status) => {
    const configs = {
      DRAFT: { label: t('production.state_draft'), color: 'default' },
      SUBMITTED: { label: t('production.state_submitted'), color: 'warning' },
      APPROVED: { label: t('production.state_approved'), color: 'info' },
      FINALIZED: { label: t('production.state_finalized'), color: 'success' },
    }
    const config = configs[status] || configs['DRAFT']
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 800, borderRadius: 1.5 }}
      />
    )
  }

  if (loading && reports.length === 0) return <LoadingSpinner />

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1600px', mx: 'auto' }}>
      {/* Header Section */}
      <Box className="flex justify-between items-center mb-8">
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: '#0f172a',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <AgricultureIcon fontSize="large" />
            </div>
            {t('production.harvest_title', 'إدارة عمليات الحصاد')}
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 600 }}>
            {t(
              'production.harvest_subtitle',
              'متابعة المحاصيل، توريدات الإنتاج، وسير العمل الميداني'
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/production/harvest/new')}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 800,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' },
            boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)',
          }}
        >
          {t('production.new_harvest', 'تسجيل حصاد جديد')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Operational Table */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('production.col_location', 'الموقع')}
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('production.col_date', 'التاريخ')}
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('production.col_variety', 'الصنف')}
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('production.col_quantity', 'الكمية')}
                </TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('production.col_status', 'الحالة')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#64748b' }}>
                  {t('common.actions', 'إجراءات')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 10 }}>
                    <EmptyState
                      message={t('production.no_harvests', 'لا توجد تقارير حصاد مسجلة حالياً')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    sx={{ '&:hover': { bgcolor: '#f1f5f9' }, transition: 'all 0.2s' }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {report.location_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {report.season_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{report.harvest_date}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{report.variety_name}</TableCell>
                    <TableCell sx={{ fontWeight: 900, color: '#1e293b' }}>
                      {report.quantity}{' '}
                      <span className="text-[0.7rem] text-slate-400">{report.unit_name}</span>
                    </TableCell>
                    <TableCell>{getStatusChip(report.status)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => setSelectedReport(report)}
                        sx={{ bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Detail & Workflow Dialog */}
      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#0f172a' }}>
          {selectedReport?.location_name} - {selectedReport?.harvest_date}
        </DialogTitle>
        <DialogContent>
          <HarvestWorkflow
            status={selectedReport?.status}
            onAction={(action) => handleWorkflowAction(selectedReport.id, action)}
            loading={loading}
          />

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {t('production.harvest_details')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 font-bold">{t('reports.variety')}:</span>
                  <span className="font-black">{selectedReport?.variety_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 font-bold">{t('reports.quantity')}:</span>
                  <span className="font-black text-indigo-600">
                    {selectedReport?.quantity} {selectedReport?.unit_name}
                  </span>
                </div>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {t('production.labor_logistics')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 font-bold">{t('production.labor_count')}:</span>
                  <span className="font-black">{selectedReport?.labor_count}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500 font-bold">{t('production.labor_hours')}:</span>
                  <span className="font-black">{selectedReport?.labor_hours}</span>
                </div>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default HarvestManagement
