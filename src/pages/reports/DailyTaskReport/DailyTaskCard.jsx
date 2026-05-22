import React, { useEffect, useState } from 'react'
import {
  ArrowLeft,
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
  Edit,
  Trash2,
  Lock,
  TrendingUp,
  Activity,
  Info
} from 'lucide-react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../../../app/AuthContext'
import { OPERATION_PROFILES } from '../../../constants/operationProfiles'
import api from '../../../services/api'
import { reportsApi } from '../../../services/reportsApi'
import ReportActionBar from '../shared/ReportActionBar'
import ReportStatusBadge from '../shared/ReportStatusBadge'
import AttachmentGallery from '../shared/AttachmentGallery'

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
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <CircularProgress size={40} thickness={4} className="text-emerald-600 dark:text-emerald-400" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">جاري تحميل سجلات التقرير...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 'bold' }}>
          {error}
        </Alert>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 'bold' }}>
          التقرير غير موجود
        </Alert>
      </div>
    )
  }

  const isApproved = report.status === 'approved'
  const canEditOrDelete = ['draft', 'submitted', 'rejected'].includes(report.status)
  const userRole = user?.role || 'ENGINEER'
  const isManager = ['MANAGER', 'SUPER_ADMIN', 'OWNER'].includes(userRole)
  const isSuperAdmin = ['SUPER_ADMIN', 'OWNER'].includes(userRole)

  const hasEditAccess = canEditOrDelete && (report.engineer === user?.id || isManager)

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

  // Calculations for dashboard summary cards
  const totalWorkers = events.reduce((acc, curr) => acc + (curr.company_workers || 0) + (curr.contractor_workers || 0), 0)
  const totalHours = events.reduce((acc, curr) => acc + (curr.work_hours || 0) + (curr.overtime_hours || 0), 0)
  const totalProductivity = events.reduce((acc, curr) => acc + (curr.actual_productivity || 0) + (curr.overtime_productivity || 0), 0)

  // Status mapping for timeline visual tracker
  const statusSteps = [
    { key: 'draft', label: 'مسودة', desc: 'تم إنشاء التقرير وحفظه' },
    { key: 'submitted', label: 'مقدم للمراجعة', desc: 'في انتظار مراجعة المهندس' },
    { key: 'reviewed', label: 'تمت المراجعة', desc: 'تم التدقيق وفي انتظار الاعتماد' },
    { key: 'approved', label: 'معتمد', desc: 'تم الاعتماد وإرسال التكاليف للتحليلات' }
  ]

  const activeStepIndex = statusSteps.findIndex(s => s.key === report.status)
  const isRejected = report.status === 'rejected'

  return (
    <div className="pb-32 bg-slate-50/50 dark:bg-transparent min-h-screen" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-5xl space-y-6">
        
        {/* Navigation & Secondary Actions */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <button
            onClick={() => navigate('/reports/tasks')}
            className="flex items-center gap-2 text-sm font-bold text-slate-655 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 ml-1.5" />
            <span>العودة لليوميات</span>
          </button>

          <div className="flex gap-2.5">
            {hasEditAccess && !isApproved && (
              <>
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-9 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف التقرير</span>
                </button>
                <button
                  onClick={() => navigate(`/reports/tasks/${id}/edit`)}
                  className="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Edit className="w-4 h-4" />
                  <span>تعديل التقرير</span>
                </button>
              </>
            )}
            {isApproved && isManager && (
              <button
                onClick={() => navigate(`/reports/tasks/${id}/edit?override=true`)}
                className="h-9 px-4 rounded-xl border-2 border-dashed border-rose-455 text-rose-600 dark:text-rose-400 text-xs font-bold bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
              >
                تعديل استثنائي
              </button>
            )}
          </div>
        </div>

        {/* Informative banners */}
        {isApproved && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/30 rounded-2xl flex gap-3 text-sm text-blue-800 dark:text-blue-400 shadow-2xs">
            <Lock className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <div>
              <span className="font-extrabold block mb-0.5">هذا التقرير معتمد ومغلق.</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لا يمكن تعديله لأنه مرتبط ببيانات التكاليف والرواتب والتحليلات المالية والتشغيلية المتقدمة.
              </p>
            </div>
          </div>
        )}

        {isRejected && report.rejection_reason && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 rounded-2xl flex gap-3 text-sm text-rose-800 dark:text-rose-400 shadow-2xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <div>
              <span className="font-extrabold block mb-0.5">سبب رفض التقرير:</span>
              <p className="text-xs font-semibold italic text-rose-700 dark:text-rose-450">
                "{report.rejection_reason}"
              </p>
            </div>
          </div>
        )}

        {/* Master Details Header / Hero Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-850/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3.5 flex-wrap">
                  تقرير مهام يومي #{report.id}
                  <ReportStatusBadge status={report.status} />
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">تتبع وتحليل البيانات الفنية والتشغيلية للمزرعة</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">تاريخ التقرير</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{report.report_date}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">المهندس المسؤول</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[140px] inline-block">{report.engineer_name}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3">
              <Users className="w-5 h-5 text-amber-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">إجمالي العمالة</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{totalWorkers} عمال</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3">
              <Scale className="w-5 h-5 text-emerald-500" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">الإنتاجية المنفذة</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{totalProductivity} وحدة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations Logs List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-md font-black text-slate-850 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>السجلات التشغيلية للمهام ({events.length})</span>
            </h2>

            <div className="space-y-4">
              {events.map((event, idx) => (
                <div
                  key={event.id || idx}
                  className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl shadow-xs overflow-hidden"
                >
                  {/* Event Header */}
                  <div className="bg-slate-50/70 dark:bg-slate-850/30 px-5 py-3.5 border-b border-slate-150 dark:border-slate-850 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                        {event.operation_name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shadow-3xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {event.location_path || 'غير محدد'}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                    {/* Labor */}
                    <div className="space-y-1 bg-slate-50/40 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 block uppercase flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> العمالة والمقاول
                      </span>
                      <div className="text-[13px] text-slate-700 dark:text-slate-350 space-y-1 pt-1.5">
                        {event.contractor_name ? (
                          <div className="font-extrabold text-slate-850 dark:text-slate-200 pb-1.5 border-b border-slate-100 dark:border-slate-800 truncate">
                            {event.contractor_name}
                          </div>
                        ) : (
                          <div className="text-slate-400 pb-1.5 border-b border-slate-100 dark:border-slate-800 italic">
                            بدون مقاول مخصص
                          </div>
                        )}
                        <div className="flex justify-between pt-1 text-xs">
                          <span>عمال شركة:</span>
                          <span className="font-extrabold">{event.company_workers || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>عمال مقاول:</span>
                          <span className="font-extrabold">{event.contractor_workers || 0}</span>
                        </div>
                        <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-450 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg mt-1 text-xs">
                          <span>الإجمالي:</span>
                          <span>{(event.company_workers || 0) + (event.contractor_workers || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Productivity */}
                    <div className="space-y-1 bg-slate-50/40 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 block uppercase flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400" /> الإنتاجية والمخرجات
                      </span>
                      <div className="text-[13px] text-slate-700 dark:text-slate-350 space-y-1 pt-1.5">
                        <div className="text-xs pb-1.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                          <span>وحدة القياس:</span>
                          <span className="font-extrabold text-slate-850 dark:text-slate-200">{event.unit_name}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-xs">
                          <span>إنتاجية أساسية:</span>
                          <span className="font-extrabold">{event.actual_productivity || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>إنتاجية إضافية:</span>
                          <span className="font-extrabold">{event.overtime_productivity || 0}</span>
                        </div>
                        <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-450 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg mt-1 text-xs">
                          <span>الإجمالي:</span>
                          <span>{(event.actual_productivity || 0) + (event.overtime_productivity || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="space-y-1 bg-slate-50/40 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 block uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> الفترات والزمن
                      </span>
                      <div className="text-[13px] text-slate-700 dark:text-slate-350 space-y-1.5 pt-1.5">
                        <div className="text-xs pb-1.5 border-b border-slate-100 dark:border-slate-800 flex justify-between">
                          <span>الصنف المشمول:</span>
                          <span className="font-extrabold text-slate-850 dark:text-slate-200 truncate max-w-[80px]">{event.variety_name || '-'}</span>
                        </div>
                        <div className="flex justify-between pt-1 text-xs">
                          <span>ساعات أساسية:</span>
                          <span className="font-extrabold">{event.work_hours || 0} ساعة</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>ساعات إضافية:</span>
                          <span className="font-extrabold">{event.overtime_hours || 0} ساعة</span>
                        </div>
                        <div className="flex justify-between font-black text-blue-600 dark:text-blue-450 bg-blue-50/50 dark:bg-blue-950/20 px-2 py-0.5 rounded-lg mt-1 text-xs">
                          <span>المجموع الكلي:</span>
                          <span>{(event.work_hours || 0) + (event.overtime_hours || 0)} ساعة</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operation Dynamic Profile Data */}
                  {event.profile_data &&
                    Object.keys(event.profile_data).length > 0 &&
                    event.profile_type &&
                    OPERATION_PROFILES[event.profile_type] && (
                      <div className="bg-slate-50/30 dark:bg-slate-950/20 border-t border-slate-150 dark:border-slate-850 p-4.5 px-5">
                        <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 block uppercase mb-2.5">
                          تفاصيل وملامح العملية التشغيلية
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {OPERATION_PROFILES[event.profile_type].map((field) => {
                            const val = event.profile_data[field.name]
                            if (val === undefined || val === null || val === '') return null
                            return (
                              <div key={field.name} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-3xs">
                                <span className="text-slate-400 font-bold">{field.label}:</span>
                                <span className="font-black text-slate-850 dark:text-slate-200">
                                  {val} {field.unit}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Timeline, notes */}
          <div className="space-y-6">
            {/* Report Status Tracker */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                <span>مراحل تقدم التقرير</span>
              </h3>

              <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-2.5 space-y-4.5 py-1">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= activeStepIndex && !isRejected
                  const isCurrent = idx === activeStepIndex && !isRejected
                  return (
                    <div key={step.key} className="relative pr-6">
                      <div className={`absolute right-[-7px] top-1 w-3 h-3 rounded-full border-2 bg-white dark:bg-slate-900 transition-colors duration-300 ${
                        isCurrent
                          ? 'border-amber-500 ring-4 ring-amber-500/10'
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
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {isRejected && (
                  <div className="relative pr-6">
                    <div className="absolute right-[-7px] top-1 w-3 h-3 rounded-full border-2 bg-rose-600 border-rose-600" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold text-rose-600 block">تم رفض التقرير والتعديل مطلوب</span>
                      <span className="text-[10px] font-semibold text-slate-400 block">يرجى المراجعة وتعديل البيانات المعارضة</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Engineer Notes */}
            {report.notes && (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-slate-400" />
                  <span>ملاحظات المهندس</span>
                </h3>
                <div className="bg-slate-50 dark:bg-slate-850/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 text-xs font-medium text-slate-655 dark:text-slate-400 italic leading-relaxed whitespace-pre-wrap">
                  "{report.notes}"
                </div>
              </div>
            )}

            {/* Operational Info helper */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-2xl flex gap-3 text-xs text-blue-750 dark:text-blue-400">
              <Info className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold block">مراجعة التكاليف والرواتب</span>
                <p className="font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                  تلقائياً عند اعتماد هذا التقرير، تترجم بيانات العمالة وإنتاجية المقاولين إلى سندات مالية في لوحة المراقبة التشغيلية.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Media & Attachments Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-200 flex items-center gap-2">
              <Paperclip className="w-4.5 h-4.5 text-purple-600" />
              <span>مرفقات التقرير والتوثيق الميداني ({report.attachments?.length || 0})</span>
            </h3>
          </div>

          {report.attachments && report.attachments.length > 0 ? (
            <AttachmentGallery attachments={report.attachments} />
          ) : (
            <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/30">
              <Paperclip className="w-8 h-8 text-slate-350 dark:text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-400">لا توجد مرفقات أو صور مرفوعة مع هذا التقرير</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions Bar for Decisions */}
      {report.available_actions && report.available_actions.length > 0 && (
        <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 p-4.5 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="container max-w-5xl mx-auto flex justify-end">
            <ReportActionBar
              availableActions={report.available_actions}
              onAction={handleAction}
              disabled={actionLoading}
            />
          </div>
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
