import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Calendar,
  User,
  MapPin,
  ClipboardCheck,
  Users,
  Clock,
  Scale,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  UserCheck,
  Eye,
  Info,
  DollarSign,
  Briefcase,
  History,
  FileSpreadsheet,
  CalendarDays
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { reportsApi } from '../../../../services/reportsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ReportStatusBadge from '../../shared/ReportStatusBadge'
import ReportActionBar from '../../shared/ReportActionBar'
import AttachmentGallery from '../../shared/AttachmentGallery'
import { useAuth } from '../../../../app/AuthContext'
import { CircularProgress } from '@mui/material'
import { OPERATION_PROFILES } from '../../../../constants/operationProfiles'
import { useTranslation } from 'react-i18next'

const DailyTaskDetailDialog = ({ taskId, isOpen, onClose }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && taskId) {
      fetchDetails()
    }
  }, [isOpen, taskId])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getTask(taskId)
      setReport(res.data)
      setError(null)
    } catch (err) {
      setError(isRTL ? 'فشل في تحميل تفاصيل التقرير' : 'Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (actionName, reason = '') => {
    setActionLoading(true)
    try {
      if (actionName === 'submit') await reportsApi.submitTask(taskId)
      if (actionName === 'review') await reportsApi.reviewTask(taskId)
      if (actionName === 'approve') await reportsApi.approveTask(taskId)
      if (actionName === 'reject') await reportsApi.rejectTask(taskId, reason)

      await fetchDetails()
    } catch (err) {
      setError(isRTL ? `فشل في تنفيذ الإجراء: ${actionName}` : `Failed to execute action: ${actionName}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen) return null

  const isManager = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ADMIN'].includes(user?.role)
  const canEdit = report?.status === 'draft' || isManager

  // Process events
  const events = report ? (
    report.operation_logs?.length > 0
      ? report.operation_logs
      : [{
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
      }]
  ) : []

  // Calculations for dashboard summary cards
  const totalWorkers = events.reduce((acc, curr) => acc + (curr.company_workers || 0) + (curr.contractor_workers || 0), 0)
  const totalCompanyWorkers = events.reduce((acc, curr) => acc + (curr.company_workers || 0), 0)
  const totalContractorWorkers = events.reduce((acc, curr) => acc + (curr.contractor_workers || 0), 0)
  const totalWorkHours = events.reduce((acc, curr) => acc + (curr.work_hours || 0), 0)
  const totalOvertimeHours = events.reduce((acc, curr) => acc + (curr.overtime_hours || 0), 0)
  const totalHours = totalWorkHours + totalOvertimeHours
  const totalProductivity = events.reduce((acc, curr) => acc + (curr.actual_productivity || 0) + (curr.overtime_productivity || 0), 0)

  // Status mapping for timeline visual tracker
  const statusSteps = [
    { key: 'draft', label: isRTL ? 'مسودة' : 'Draft', desc: isRTL ? 'تم إنشاء التقرير وحفظه' : 'Report created & saved' },
    { key: 'submitted', label: isRTL ? 'مقدم للمراجعة' : 'Submitted', desc: isRTL ? 'في انتظار مراجعة الإدارة' : 'Awaiting management review' },
    { key: 'under_review', label: isRTL ? 'تحت المراجعة' : 'Under Review', desc: isRTL ? 'يجري مراجعة التفاصيل' : 'Details being audited' },
    { key: 'approved', label: isRTL ? 'معتمد' : 'Approved', desc: isRTL ? 'تم الاعتماد النهائي للتكاليف' : 'Final costs approved' }
  ]

  const activeStepIndex = report ? statusSteps.findIndex(s => s.key === report.status) : 0
  const isRejected = report?.status === 'rejected'

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(
      isRTL ? 'ar-EG' : 'en-GB',
      { dateStyle: 'medium', timeStyle: 'short' }
    );
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[1300] flex items-center justify-center p-4 md:p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Content - ClickUp/Jira Style */}
      <div
        className={`relative w-full max-w-6xl bg-white dark:bg-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.4)] rounded-2xl flex flex-col transition-all duration-300 ease-out overflow-hidden h-[92vh] border border-slate-200 dark:border-slate-800 ${isOpen ? 'scale-100 opacity-100' : 'scale-98 opacity-0'}`}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10 gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center shadow-sm text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-450 dark:text-slate-500">
                  {isRTL ? 'تقرير مهام يومي' : 'Daily Task Report'}
                </span>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                  #{taskId}
                </Badge>
                <ReportStatusBadge status={report?.status} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {report?.operation_summary || (isRTL ? 'تفاصيل التقرير التشغيلي' : 'Operational Report Details')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-lg gap-1.5 font-semibold text-slate-650 hover:text-foreground cursor-pointer"
                onClick={() => navigate(`/reports/tasks/${taskId}`)}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{isRTL ? 'عرض الصفحة الكاملة' : 'Full Page'}</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 flex items-center justify-center border border-slate-250/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col lg:flex-row">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
              <CircularProgress size={36} thickness={4} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{isRTL ? 'جاري تحميل سجلات التقرير...' : 'Loading report records...'}</p>
            </div>
          ) : error ? (
            <div className="flex-1 p-6">
              <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-450 flex items-center gap-3 text-sm font-bold shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Main Column */}
              <div className="flex-1 p-6 space-y-6 lg:border-r border-slate-100 dark:border-slate-850 overflow-y-auto">
                
                {/* Section 1: Operational Metrics Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'المقاييس والإنتاجية العامة' : 'Core Metrics & Productivity'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Worker Metric */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">{isRTL ? 'إجمالي العمالة' : 'Total Workers'}</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{totalWorkers}</span>
                        <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1">
                          {isRTL ? `شركة: ${totalCompanyWorkers} | مقاول: ${totalContractorWorkers}` : `Staff: ${totalCompanyWorkers} | Contract: ${totalContractorWorkers}`}
                        </div>
                      </div>
                    </div>

                    {/* Duration Metric */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">{isRTL ? 'ساعات العمل' : 'Duration'}</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{totalHours} <span className="text-xs font-normal text-slate-500">{isRTL ? 'س' : 'hrs'}</span></span>
                        <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1">
                          {isRTL ? `أساسي: ${totalWorkHours}س | إضافي: ${totalOvertimeHours}س` : `Regular: ${totalWorkHours}h | OT: ${totalOvertimeHours}h`}
                        </div>
                      </div>
                    </div>

                    {/* Output/Production Metric */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">{isRTL ? 'إجمالي الإنتاجية' : 'Production Output'}</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Scale className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{totalProductivity}</span>
                        <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 truncate">
                          {events[0]?.unit_name || (isRTL ? 'وحدات قياس' : 'Units')}
                        </div>
                      </div>
                    </div>

                    {/* Estimated Cost Metric */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500">{isRTL ? 'تقدير التكاليف' : 'Labor Allocation'}</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Briefcase className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200">
                          {events.length} <span className="text-xs text-slate-550 font-semibold">{isRTL ? 'عمليات' : 'ops'}</span>
                        </span>
                        <div className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-2">
                          {isRTL ? 'تم التدقيق الفني ✓' : 'Technical verified ✓'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Operational Logs & Logs Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'تفاصيل سجلات العمليات الميدانية' : 'Operational Activity Details'}
                  </h3>
                  <div className="space-y-4">
                    {events.map((event, idx) => (
                      <div key={event.id || idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 overflow-hidden shadow-xs">
                        {/* Event Header Banner */}
                        <div className="bg-slate-50/50 dark:bg-slate-850/20 px-4.5 py-2.5 border-b border-slate-200/80 dark:border-slate-850 flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-5.5 h-5.5 rounded-lg bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-black flex items-center justify-center shadow-xs">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {event.operation_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-bold bg-white dark:bg-slate-900 border-slate-250 text-slate-650 py-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {event.location_path || '—'}
                            </Badge>
                            {event.variety_name && (
                              <Badge className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-purple-650 dark:text-purple-400 py-0.5 px-2">
                                {event.variety_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Event Stats grid */}
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'الإنتاجية المنفذة' : 'Productivity'}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{event.actual_productivity || 0}</span>
                              <span className="text-xs text-slate-500 font-semibold">{event.unit_name}</span>
                            </div>
                            {event.overtime_productivity > 0 && (
                              <span className="text-[9px] text-blue-500 font-bold block mt-0.5">
                                (+ {event.overtime_productivity} {isRTL ? 'إضافي' : 'OT'})
                              </span>
                            )}
                          </div>

                          <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'العمالة المخصصة' : 'Allocated Labor'}</span>
                            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                              {(event.company_workers || 0) + (event.contractor_workers || 0)} <span className="text-xs font-normal text-slate-500">{isRTL ? 'عمال' : 'workers'}</span>
                            </div>
                            <span className="text-[9px] text-slate-450 dark:text-slate-500 block leading-tight mt-0.5">
                              {isRTL ? `شركة: ${event.company_workers || 0} | مقاول: ${event.contractor_workers || 0}` : `Staff: ${event.company_workers || 0} | Cont: ${event.contractor_workers || 0}`}
                            </span>
                          </div>

                          <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'ساعات العمل' : 'Duration'}</span>
                            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                              {event.work_hours || 0} <span className="text-xs font-normal text-slate-500">{isRTL ? 'ساعة' : 'hours'}</span>
                            </div>
                            {event.overtime_hours > 0 && (
                              <span className="text-[9px] text-blue-500 font-bold block mt-0.5">
                                (+ {event.overtime_hours} {isRTL ? 'ساعة إضافي' : 'OT h'})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Extra profile metrics */}
                        {event.profile_data &&
                          Object.keys(event.profile_data).length > 0 &&
                          event.profile_type &&
                          OPERATION_PROFILES[event.profile_type] && (
                            <div className="bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-150 dark:border-slate-850 p-4">
                              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 block uppercase mb-2">
                                {isRTL ? 'المعطيات الفنية المتخصصة' : 'Operational Schema Inputs'}
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {OPERATION_PROFILES[event.profile_type].map((field) => {
                                  const val = event.profile_data[field.name]
                                  if (val === undefined || val === null || val === '') return null
                                  return (
                                    <div key={field.name} className="flex items-center gap-1.5 text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                                      <span className="text-slate-450 dark:text-slate-500 font-bold">{field.label}:</span>
                                      <span className="font-black text-slate-850 dark:text-slate-200">
                                        {val} <span className="text-[10px] font-semibold text-slate-400">{field.unit}</span>
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                        )}

                        {/* Labor entries details */}
                        {event.labor_entries && event.labor_entries.length > 0 && (
                          <div className="border-t border-slate-100 dark:border-slate-850 p-4 bg-slate-50/20 dark:bg-slate-900/20">
                            <span className="text-[10px] font-black text-slate-450 block uppercase mb-2">
                              {isRTL ? 'كشف الحضور والرواتب للمجموعة' : 'Assigned Workers Attendance'}
                            </span>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-right dark:text-left select-text">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                                    <th className="pb-1.5 font-bold">{isRTL ? 'اسم العامل' : 'Worker Name'}</th>
                                    <th className="pb-1.5 font-bold">{isRTL ? 'الفئة' : 'Type'}</th>
                                    <th className="pb-1.5 font-bold">{isRTL ? 'الساعات' : 'Hours'}</th>
                                    <th className="pb-1.5 font-bold">{isRTL ? 'إضافي' : 'OT'}</th>
                                    <th className="pb-1.5 font-bold">{isRTL ? 'المعدل' : 'Rate'}</th>
                                    <th className="pb-1.5 font-bold text-left rtl:text-right">{isRTL ? 'الإجمالي' : 'Total'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                  {event.labor_entries.map((entry) => (
                                    <tr key={entry.id} className="text-slate-700 dark:text-slate-350">
                                      <td className="py-2 font-black">{entry.worker_name}</td>
                                      <td className="py-2">
                                        <Badge variant="secondary" className="text-[9px] font-bold py-0">
                                          {entry.worker_type === 'COMPANY' ? (isRTL ? 'شركة' : 'Staff') : (isRTL ? 'مقاول' : 'Cont.')}
                                        </Badge>
                                      </td>
                                      <td className="py-2 font-mono">{entry.hours || 0}</td>
                                      <td className="py-2 font-mono text-blue-500">{entry.overtime || 0}</td>
                                      <td className="py-2 font-mono">{entry.worker_rate || 0}</td>
                                      <td className="py-2 font-mono text-slate-900 dark:text-white font-bold text-left rtl:text-right">
                                        {((entry.hours || 0) + (entry.overtime || 0)) * (entry.worker_rate || 0)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Notes & Observations Doc */}
                {report.notes && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs">
                    <h4 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{isRTL ? 'الملاحظات والمشاهدات الميدانية' : 'Notes & Observations'}</span>
                    </h4>
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium italic select-text">
                      "{report.notes}"
                    </div>
                  </div>
                )}

                {/* Section 4: Attachments Gallery */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs">
                  <h4 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-purple-600" />
                    <span>{isRTL ? `المرفقات وميديا التوثيق الميداني (${report.attachments?.length || 0})` : `Attachments Gallery (${report.attachments?.length || 0})`}</span>
                  </h4>
                  {report.attachments && report.attachments.length > 0 ? (
                    <AttachmentGallery attachments={report.attachments} />
                  ) : (
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/20">
                      <Paperclip className="w-7 h-7 text-slate-300 dark:text-slate-650 mb-1.5" />
                      <p className="text-xs font-semibold text-slate-400">
                        {isRTL ? 'لم يتم إرفاق صور أو وسائط فنية مع هذا التقرير' : 'No field media attached with this report'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="w-full lg:w-[320px] bg-slate-50/50 dark:bg-slate-900/30 p-6 space-y-6 overflow-y-auto shrink-0">
                
                {/* Status Timeline Tracking Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-xl p-4.5 shadow-2xs space-y-4">
                  <h4 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-500" />
                    <span>{isRTL ? 'مسار الاعتمادات والتدقيق' : 'Status & Approval Track'}</span>
                  </h4>

                  {isRejected && report.rejection_reason && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-1 text-red-800 dark:text-red-300">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{isRTL ? 'تقرير مرفوض:' : 'Rejected:'}</span>
                      </div>
                      <p className="font-semibold italic pl-1 leading-normal">"{report.rejection_reason}"</p>
                    </div>
                  )}

                  <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-2.5 space-y-4 py-1">
                    {statusSteps.map((step, idx) => {
                      const isDone = idx <= activeStepIndex && !isRejected
                      const isCurrent = idx === activeStepIndex && !isRejected
                      return (
                        <div key={step.key} className="relative pr-6 select-none">
                          {/* Bullet indicator */}
                          <div className={`absolute right-[-7px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-900 transition-all duration-300 ${
                            isCurrent
                              ? 'border-amber-500 ring-4 ring-amber-500/15'
                              : isDone
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-slate-300 dark:border-slate-700'
                          }`} />
                          
                          <div className="space-y-0.5">
                            <span className={`text-xs font-extrabold block transition-colors ${
                              isCurrent
                                ? 'text-amber-600 dark:text-amber-400'
                                : isDone
                                ? 'text-emerald-700 dark:text-emerald-450'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {step.label}
                            </span>
                            <span className="text-[9.5px] font-medium text-slate-400 block leading-tight">
                              {step.desc}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {isRejected && (
                      <div className="relative pr-6">
                        <div className="absolute right-[-7px] top-1 w-3 h-3 rounded-full border-2 bg-red-600 border-red-600" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold text-red-600 block">{isRTL ? 'مرفوض وتعديل مطلوب' : 'Rejected'}</span>
                          <span className="text-[9.5px] font-medium text-slate-400 block leading-tight">{isRTL ? 'يجب إعادة تحرير الحقول التالفة' : 'Fix invalid inputs and resubmit'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Metadata list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-xl p-4.5 shadow-2xs space-y-4.5">
                  <h4 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>{isRTL ? 'معلومات التقرير' : 'Report Meta Properties'}</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'المهندس المسؤول' : 'Supervisor / Engineer'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          {(report.engineer_name || 'E')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{report.engineer_name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'الحوشة / الموقع الرئيسي' : 'Main Enclosure / Block'}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {report.location_name || '—'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'تاريخ التشغيل الفعلي' : 'Operational Date'}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {report.report_date}
                      </span>
                    </div>

                    {/* Timestamps */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-[10.5px]">
                        <span className="text-slate-400 font-semibold">{isRTL ? 'تاريخ الإنشاء' : 'Created At'}</span>
                        <span className="text-slate-500 font-mono">{formatDateTime(report.created_at)}</span>
                      </div>
                      <div className="flex justify-between text-[10.5px]">
                        <span className="text-slate-400 font-semibold">{isRTL ? 'آخر تعديل' : 'Updated At'}</span>
                        <span className="text-slate-500 font-mono">{formatDateTime(report.updated_at)}</span>
                      </div>
                      {report.submitted_at && (
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-400 font-semibold">{isRTL ? 'تاريخ التقديم' : 'Submitted At'}</span>
                          <span className="text-slate-500 font-mono">{formatDateTime(report.submitted_at)}</span>
                        </div>
                      )}
                      {report.approved_at && (
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-400 font-semibold">{isRTL ? 'تاريخ الاعتماد' : 'Approved At'}</span>
                          <span className="text-emerald-600 dark:text-emerald-450 font-mono">{formatDateTime(report.approved_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info Box */}
                <div className="p-4.5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-xl flex gap-3 text-xs text-blue-700 dark:text-blue-400">
                  <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold block">{isRTL ? 'إجراءات التدقيق المالي' : 'ERP Financial Audit'}</span>
                    <p className="font-semibold text-slate-550 leading-relaxed">
                      {isRTL ? 'عند اعتماد التقرير، تترجم بيانات العمالة وإنتاجية المقاولين مباشرة إلى تكاليف في الحسابات والأجور.' : 'Approved reports translate workforce inputs to accounting wages and contractor balances automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center">
            {report && report.available_actions && report.available_actions.length > 0 ? (
              <ReportActionBar
                availableActions={report.available_actions}
                onAction={handleAction}
                disabled={actionLoading}
              />
            ) : report ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">{isRTL ? 'التقرير معتمد ومغلق' : 'Report is Approved & Locked'}</span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            {canEdit && report && (
              <Button
                className="h-9.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all text-xs cursor-pointer"
                onClick={() => navigate(`/reports/tasks/${report.id}/edit`)}
              >
                {isRTL ? 'تعديل التقرير' : 'Edit Report'}
              </Button>
            )}
            <Button
              variant="outline"
              className="h-9.5 rounded-lg font-bold text-slate-500 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all text-xs cursor-pointer"
              onClick={onClose}
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DailyTaskDetailDialog
