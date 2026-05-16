import React, { useEffect, useState } from 'react'

import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  DynamicFeedOutlined,
  Edit as EditIcon,
  Engineering as EngineerIcon,
  Lock as LockIcon,
  Map as MapIcon,
  People as PeopleIcon,
  PrecisionManufacturing as OperationIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../../app/AuthContext'
import { OPERATION_PROFILES } from '../../../constants/operationProfiles'
import api from '../../../services/api'
import { reportsApi } from '../../../services/reportsApi'
import ReportActionBar from '../shared/ReportActionBar'
import ReportStatusBadge from '../shared/ReportStatusBadge'

const DailyTaskCard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchReportDetails()
  }, [id])

  const fetchReportDetails = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getTask(id)
      setReport(res.data)
    } catch (err) {
      setError('فشل في جلب تفاصيل التقرير')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionName, reason = '') => {
    setActionLoading(true)
    try {
      if (actionName === 'submit') await reportsApi.submitTask(id)
      if (actionName === 'review') await reportsApi.reviewTask(id)
      if (actionName === 'approve') await reportsApi.approveTask(id)
      if (actionName === 'reject') await reportsApi.rejectTask(id, reason)

      await fetchReportDetails()
    } catch (err) {
      setError(`فشل في تنفيذ الإجراء: ${actionName}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await api.delete(`/reports/tasks/${id}/`)
      navigate('/reports/tasks')
    } catch (err) {
      setError('فشل في حذف التقرير')
      setDeleteDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 1 }}>
        {error}
      </Alert>
    )
  }

  if (!report) {
    return (
      <Alert severity="warning" sx={{ m: 3, borderRadius: 1 }}>
        التقرير غير موجود
      </Alert>
    )
  }

  const isApproved = report.status === 'approved'
  const canEditOrDelete = ['draft', 'submitted', 'rejected'].includes(report.status)
  const userRole = user?.role || 'ENGINEER'
  const isManager = ['MANAGER', 'SUPER_ADMIN', 'OWNER'].includes(userRole)
  const isSuperAdmin = ['SUPER_ADMIN', 'OWNER'].includes(userRole)

  const hasEditAccess = canEditOrDelete && (report.engineer === user?.id || isManager)

  // Use operation_logs if available, fallback to legacy container data for older reports
  const events =
    report.operation_logs?.length > 0
      ? report.operation_logs
      : [
          {
            id: 'legacy',
            operation_name: report.operation_name,
            location_path: report.location_path,
            variety_name: report.variety_name,
            unit_name: report.unit_name,
            contractor_name: report.contractor_name,
            company_workers: report.company_workers,
            contractor_workers: report.contractor_workers,
            actual_productivity: report.actual_productivity,
            work_hours: report.work_hours,
            overtime_hours: report.overtime_hours,
            overtime_productivity: report.overtime_productivity,
          },
        ]

  return (
    <div className="pb-32 bg-slate-50 dark:bg-transparent min-h-screen">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-5xl">
        {/* Top Navigation & Actions */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/reports/tasks')}
            sx={{ fontWeight: 600 }}
            className="text-slate-600 dark:text-slate-300"
          >
            العودة لليوميات
          </Button>

          <div className="flex gap-2">
            {hasEditAccess && !isApproved && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                  size="small"
                  sx={{ borderRadius: 1, textTransform: 'none' }}
                >
                  حذف التقرير
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/reports/tasks/${id}/edit`)}
                  size="small"
                  sx={{ borderRadius: 1, textTransform: 'none' }}
                >
                  تعديل التقرير
                </Button>
              </>
            )}
            {isApproved && isSuperAdmin && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => navigate(`/reports/tasks/${id}/edit?override=true`)}
                sx={{ borderRadius: 1, fontWeight: 600, borderStyle: 'dashed' }}
              >
                تعديل استثنائي (SUPER ADMIN)
              </Button>
            )}
          </div>
        </div>

        {isApproved && (
          <Alert
            icon={<LockIcon />}
            severity="info"
            sx={{ mb: 4, borderRadius: 1, border: '1px solid #bae6fd', bgcolor: '#f0f9ff' }}
          >
            <span className="font-semibold">هذا التقرير معتمد ومغلق.</span> لا يمكن تعديله لأنه
            مرتبط ببيانات التكاليف والتحليلات.
          </Alert>
        )}

        {report.status === 'rejected' && report.rejection_reason && (
          <Alert
            severity="error"
            sx={{ mb: 4, borderRadius: 1, border: '1px solid #fca5a5', bgcolor: '#fef2f2' }}
          >
            <span className="font-semibold">سبب الرفض:</span> {report.rejection_reason}
          </Alert>
        )}

        {/* Report Container (Master Data) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm mb-6">
          <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 rounded-t-md">
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
                  تقرير مهام يومي #{report.id}
                  <ReportStatusBadge status={report.status} />
                </h1>
                <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon fontSize="small" /> {report.report_date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <EngineerIcon fontSize="small" /> {report.engineer_name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(report.notes || report.attachments_count > 0) && (
            <div className="p-5 md:p-6">
              {report.notes && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    الملاحظات
                  </h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-100 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                    {report.notes}
                  </div>
                </div>
              )}
              {report.attachments_count > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    المرفقات
                  </h3>
                  <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-3 py-1.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {report.attachments_count} مرفقات مرفوعة
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Operational Events */}
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <AssignmentIcon color="action" /> السجلات التشغيلية ({events.length})
        </h2>

        <div className="flex flex-col gap-3">
          {events.map((event, idx) => (
            <div
              key={event.id || idx}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-sm shadow-sm overflow-hidden"
            >
              {/* PRIMARY HIERARCHY: Operation & Location */}
              <div className="bg-slate-50 dark:bg-slate-800/40 px-4 py-2 border-b border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm tracking-wider">
                    حدث {idx + 1}
                  </span>
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 text-base flex items-center gap-1.5">
                    <OperationIcon fontSize="small" /> {event.operation_name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <MapIcon sx={{ fontSize: 16 }} className="text-slate-500 dark:text-slate-400" />
                  {event.location_path || '-'}
                </div>
              </div>

              <div className="p-0">
                <div className="flex flex-wrap md:flex-nowrap">
                  {/* SECONDARY: Labor & Contractor */}
                  <div className="flex-1 p-3 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 min-w-[200px]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <PeopleIcon fontSize="inherit" /> العمالة والمقاول
                    </span>
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 space-y-1">
                      {event.contractor_name ? (
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800/50">
                          {event.contractor_name}
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500 mb-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800/50 italic">
                          بدون مقاول
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>شركة:</span>{' '}
                        <span className="font-semibold">{event.company_workers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مقاول:</span>{' '}
                        <span className="font-semibold">{event.contractor_workers || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/50 px-1 rounded">
                        <span>إجمالي:</span>{' '}
                        <span>
                          {(event.company_workers || 0) + (event.contractor_workers || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECONDARY: Productivity */}
                  <div className="flex-1 p-3 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 min-w-[200px]">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <AssessmentIcon fontSize="inherit" /> الإنتاجية ({event.unit_name})
                    </span>
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>أساسي:</span>{' '}
                        <span className="font-semibold">{event.actual_productivity || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>إضافي:</span>{' '}
                        <span className="font-semibold">{event.overtime_productivity || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/50 px-1 rounded">
                        <span>إجمالي:</span>{' '}
                        <span>
                          {(event.actual_productivity || 0) + (event.overtime_productivity || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TERTIARY: Hours & Metadata */}
                  <div className="flex-1 p-3 min-w-[150px] bg-slate-50/50 dark:bg-slate-800/20">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <ScheduleIcon fontSize="inherit" /> الساعات والصنف
                    </span>
                    <div className="text-[13px] text-slate-700 dark:text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span>الصنف:</span>{' '}
                        <span
                          className="font-semibold truncate max-w-[80px]"
                          title={event.variety_name}
                        >
                          {event.variety_name || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>س. عمل:</span>{' '}
                        <span className="font-semibold">{event.work_hours || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>س. إضافي:</span>{' '}
                        <span className="font-semibold">{event.overtime_hours || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC PROFILE SECTION */}
                {event.profile_data &&
                  Object.keys(event.profile_data).length > 0 &&
                  event.profile_type &&
                  OPERATION_PROFILES[event.profile_type] && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 p-3 px-4">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <DynamicFeedOutlined fontSize="inherit" /> البيانات التشغيلية
                      </span>
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-700 dark:text-slate-300">
                        {OPERATION_PROFILES[event.profile_type].map((field) => {
                          const val = event.profile_data[field.name]
                          if (val === undefined || val === null || val === '') return null
                          return (
                            <div key={field.name} className="flex items-center gap-2">
                              <span className="text-slate-500 dark:text-slate-400">{field.label}:</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {val}{' '}
                                {field.unit && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                    {field.unit}
                                  </span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Action Bar */}
      {report.available_actions && report.available_actions.length > 0 && (
        <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-300 dark:border-slate-800 p-4 flex justify-end shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <ReportActionBar
            availableActions={report.available_actions}
            onAction={handleAction}
            disabled={actionLoading}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#dc2626' }}>تأكيد حذف التقرير</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف هذا التقرير اليومي؟ لا يمكن التراجع عن هذا الإجراء.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            disabled={actionLoading}
          >
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={actionLoading}>
            حذف نهائي
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default DailyTaskCard
