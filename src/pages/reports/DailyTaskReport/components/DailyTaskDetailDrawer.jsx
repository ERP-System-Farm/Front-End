import React, { useEffect, useState } from 'react'
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
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { reportsApi } from '../../../../services/reportsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ReportStatusBadge from '../../shared/ReportStatusBadge'
import ReportActionBar from '../../shared/ReportActionBar'
import { useAuth } from '../../../../app/AuthContext'
import { CircularProgress } from '@mui/material'

const DailyTaskDetailDialog = ({ taskId, isOpen, onClose }) => {
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
      setError('فشل في تحميل تفاصيل التقرير')
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
      setError(`فشل في تنفيذ الإجراء: ${actionName}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen) return null

  const isManager = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ADMIN'].includes(user?.role)
  const canEdit = report?.status === 'draft' || isManager

  // Process events (similar to DailyTaskCard)
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

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      dir="rtl"
    >
      {/* Backdrop - darker for better focus */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog Content - Professional Width & Styling */}
      <div
        className={`relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-xl flex flex-col transition-all duration-300 ease-out overflow-hidden max-h-[85vh] border border-slate-200 dark:border-slate-800 ${isOpen ? 'scale-100 opacity-100' : 'scale-98 opacity-0'}`}
      >

        {/* Header - Clean & Corporate */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                تقرير يومي #{taskId}
                {report && <ReportStatusBadge status={report.status} />}
              </h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">مراجعة البيانات الفنية والتشغيلية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content - Structured & Detailed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <CircularProgress size={32} thickness={4} className="text-emerald-600" />
              <p className="text-slate-500 font-medium text-sm">جاري تحميل السجلات...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : report ? (
            <>
              {/* Master Data Header */}
              <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-white dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">تاريخ التقرير</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{report.report_date}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المهندس المسؤول</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{report.engineer_name}</p>
                </div>
              </div>

              {/* Operational Events - Full Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" /> السجلات التشغيلية ({events.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {events.map((event, idx) => (
                    <div key={event.id || idx} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/30 dark:bg-slate-800/10">
                      <div className="bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100">{event.operation_name}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{event.location_path || '-'}</span>
                      </div>

                      <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-6">
                        {/* Productivity */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">الإنتاجية المنفذة</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{event.actual_productivity}</span>
                            <span className="text-[10px] text-slate-500">{event.unit_name}</span>
                            {event.overtime_productivity > 0 && (
                              <span className="text-[10px] text-blue-500 font-bold"> (+{event.overtime_productivity} إضافي)</span>
                            )}
                          </div>
                        </div>

                        {/* Labor */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">إجمالي العمالة</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {(event.company_workers || 0) + (event.contractor_workers || 0)}
                            <span className="text-[10px] font-normal text-slate-500 mr-1">(شركة: {event.company_workers || 0} | مقاول: {event.contractor_workers || 0})</span>
                          </p>
                        </div>

                        {/* Hours */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">ساعات العمل</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {event.work_hours || 0}
                            {event.overtime_hours > 0 && <span className="text-blue-500 text-[10px] mr-1">+{event.overtime_hours} إضافي</span>}
                            <span className="text-[10px] font-normal text-slate-500 mr-1">ساعة</span>
                          </p>
                        </div>

                        {/* Variety */}
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">الصنف / المقاول</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                            {event.variety_name || 'N/A'}
                            <span className="text-[10px] font-normal text-slate-500 mr-1">| {event.contractor_name || 'بدون مقاول'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Notes */}
              {report.notes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> ملاحظات المهندس
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 italic">
                    "{report.notes}"
                  </div>
                </div>
              )}

              {/* Attachments Summary */}
              {report.attachments_count > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3">
                   <Paperclip className="w-4 h-4 text-emerald-600" />
                   <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">يحتوي التقرير على ({report.attachments_count}) مرفقات توثيقية</span>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Sticky Footer with Centered Controls */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center gap-4 backdrop-blur-md">
          
          <div className="w-full flex justify-center">
             {report && report.available_actions && report.available_actions.length > 0 ? (
                <ReportActionBar 
                  availableActions={report.available_actions}
                  onAction={handleAction}
                  disabled={actionLoading}
                />
             ) : (
                <div className="flex items-center gap-2 text-slate-400">
                   <CheckCircle2 className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">لا توجد إجراءات معلقة</span>
                </div>
             )}
          </div>

          <Button 
            variant="outline"
            className="w-full max-w-[200px] h-11 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-100 transition-all text-sm"
            onClick={onClose}
          >
            إغلاق التقرير
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DailyTaskDetailDialog
