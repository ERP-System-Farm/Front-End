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
  Edit,
  Trash2,
  Info,
  FileSpreadsheet,
  CalendarDays,
  ShieldAlert,
  Beaker
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../../../services/api'
import { reportsApi } from '../../../../services/reportsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AttachmentGallery from '../../shared/AttachmentGallery'
import { CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../../lib/utils'

const PestControlDetailDrawer = ({ reportId, isOpen, onClose, onDeleteSuccess }) => {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && reportId) {
      fetchDetails()
    }
  }, [isOpen, reportId])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await api.get(`/reports/pest-control/${reportId}/`, config)
      setReport(res.data)
      setError(null)
    } catch (err) {
      setError(isRTL ? 'فشل في تحميل تفاصيل تقرير المكافحة والوقاية' : 'Failed to load pest control report details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا التقرير نهائياً؟' : 'Are you sure you want to delete this report permanently?')) return
    
    try {
      setDeleteLoading(true)
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await api.delete(`/reports/pest-control/${reportId}/`, config)
      onClose()
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err) {
      setError(isRTL ? 'فشل في حذف تقرير المكافحة.' : 'Failed to delete pest control report.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!isOpen) return null

  // Calculate total workers from allocations
  const totalCompanyWorkers = report?.allocations?.reduce((sum, a) => sum + (parseInt(a.allocated_workers_company) || 0), 0) || 0
  const totalContractorWorkers = report?.allocations?.reduce((sum, a) => sum + (parseInt(a.allocated_workers_contractor_a) || 0) + (parseInt(a.allocated_workers_contractor_b) || 0), 0) || 0
  const totalWorkers = totalCompanyWorkers + totalContractorWorkers
  const pesticideName = report?.pesticide_item_name || report?.custom_pesticide_name || (isRTL ? 'غير محدد' : 'Unspecified')

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

      {/* Dialog Content */}
      <div
        className={`relative w-full max-w-6xl bg-white dark:bg-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.4)] rounded-2xl flex flex-col transition-all duration-300 ease-out overflow-hidden h-[92vh] border border-slate-200 dark:border-slate-800 ${isOpen ? 'scale-100 opacity-100' : 'scale-98 opacity-0'}`}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-sm sticky top-0 z-10 gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center shadow-sm text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-455 dark:text-slate-500">
                  {isRTL ? 'تقرير مكافحة ووقاية نبات' : 'Pest Control & Plant Protection Report'}
                </span>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                  #{reportId}
                </Badge>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {isRTL ? `عملية مكافحة بتاريخ ${report?.date || ''}` : `Pest Control Operation on ${report?.date || ''}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350 flex items-center justify-center border border-slate-250/60 dark:border-slate-880 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col lg:flex-row">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
              <CircularProgress size={36} thickness={4} className="text-amber-650 dark:text-amber-505" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{isRTL ? 'جاري تحميل تفاصيل التقرير...' : 'Loading report details...'}</p>
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
                
                {/* Section 1: Core Metrics Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'المقاييس والإنتاجية العامة' : 'Core Metrics & Productivity'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Worker Metric */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'إجمالي العمالة' : 'Total Workers'}</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{totalWorkers}</span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1">
                          {isRTL ? `شركة: ${totalCompanyWorkers} | مقاول: ${totalContractorWorkers}` : `Staff: ${totalCompanyWorkers} | Contract: ${totalContractorWorkers}`}
                        </div>
                      </div>
                    </div>

                    {/* Pesticide used */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'المبيد المستهلك' : 'Pesticide Consumed'}</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Beaker className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-200 truncate block max-w-full" title={pesticideName}>
                          {pesticideName}
                        </span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1">
                          {isRTL ? `الجرعة الإجمالية: ${report.quantity} لتر/كجم` : `Total Dose: ${report.quantity} L/kg`}
                        </div>
                      </div>
                    </div>

                    {/* Target Locations */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'المواقع المستهدفة' : 'Target Locations'}</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                          {report.allocations?.length || 0}
                        </span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1">
                          {isRTL ? 'أحواش مستهدفة بالرش' : 'Enclosures targeted'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Enclosure Allocations & Details */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'تفاصيل توزيع العمليات على الأحواش' : 'Enclosure Allocations & Productivity'}
                  </h3>
                  <div className="space-y-4">
                    {report.allocations && report.allocations.length > 0 ? (
                      report.allocations.map((alloc, idx) => {
                        const allocWorkers = (alloc.allocated_workers_company || 0) + (alloc.allocated_workers_contractor_a || 0) + (alloc.allocated_workers_contractor_b || 0)
                        return (
                          <div key={alloc.id || idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 overflow-hidden shadow-xs">
                            <div className="bg-slate-50/50 dark:bg-slate-850/20 px-4.5 py-2.5 border-b border-slate-200/80 dark:border-slate-850 flex items-center justify-between gap-3 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                                <span className="w-5.5 h-5.5 rounded-lg bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-black flex items-center justify-center shadow-xs">
                                  {idx + 1}
                                </span>
                                {alloc.enclosure_name || (isRTL ? `حوشة #${alloc.enclosure}` : `Enclosure #${alloc.enclosure}`)}
                              </span>
                              <Badge className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border-none font-bold text-[10px] py-0.5 px-2">
                                {allocWorkers} {isRTL ? 'عمال' : 'workers'}
                              </Badge>
                            </div>
                            
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'الإنتاجية المنفذة' : 'Productivity'}</span>
                                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {alloc.productivity_value || 0} <span className="text-xs text-slate-500 font-semibold">{isRTL ? 'وحدة' : 'units'}</span>
                                </div>
                              </div>
                              <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                                <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'توزيع العمالة' : 'Labor Allocation'}</span>
                                <span className="text-[11px] text-slate-650 dark:text-slate-350 block leading-tight font-bold">
                                  {isRTL 
                                    ? `شركة: ${alloc.allocated_workers_company || 0} | مقاول أ: ${alloc.allocated_workers_contractor_a || 0} | مقاول ب: ${alloc.allocated_workers_contractor_b || 0}`
                                    : `Staff: ${alloc.allocated_workers_company || 0} | Cont A: ${alloc.allocated_workers_contractor_a || 0} | Cont B: ${alloc.allocated_workers_contractor_b || 0}`}
                                </span>
                              </div>
                              {alloc.notes && (
                                <div className="bg-slate-50/30 dark:bg-slate-950/5 p-3 rounded-lg border border-slate-100 dark:border-slate-850 col-span-2 sm:col-span-1">
                                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">{isRTL ? 'ملاحظة الموقع' : 'Location Note'}</span>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{alloc.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400 font-bold">
                        {isRTL ? 'لا توجد مواقع مستهدفة مسجلة.' : 'No target locations recorded.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Notes & Observations */}
                {report.notes && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs">
                    <h4 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{isRTL ? 'الملاحظات وتشخيص الإصابة' : 'Notes & Diagnostic Observations'}</span>
                    </h4>
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium italic select-text">
                      "{report.notes}"
                    </div>
                  </div>
                )}

                {/* Section 4: Attachments */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs">
                  <h4 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
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
                
                {/* Report Metadata list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-850 rounded-xl p-4.5 shadow-2xs space-y-4.5">
                  <h4 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>{isRTL ? 'معلومات التقرير' : 'Report Meta Properties'}</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'المهندس المسؤول' : 'Supervisor / Engineer'}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          {(report.engineer_name || 'E')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{report.engineer_name || (isRTL ? "مهندس ميداني" : "Field Engineer")}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-0.5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{isRTL ? 'تاريخ التشغيل الفعلي' : 'Operational Date'}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {report.date}
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
                    </div>
                  </div>
                </div>

                {/* Additional Info Box */}
                <div className="p-4.5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/20 rounded-xl flex gap-3 text-xs text-blue-700 dark:text-blue-400">
                  <Info className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold block">{isRTL ? 'وقاية المحاصيل والوقاية الفنية' : 'Crop Protection Controls'}</span>
                    <p className="font-semibold text-slate-555 dark:text-slate-400 leading-relaxed">
                      {isRTL ? 'يخضع استهلاك المبيدات وقوائم الحضور للمراجعة المباشرة للتكاليف وتأثير فترات الأمان (PHI) لضمان مطابقة معايير التصدير العالمية.' : 'Pesticide rates and PHI parameters are checked against crop export standards automatically upon report persistence.'}
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
            {/* Omit status actions since not modeled, but keep edit */}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9.5 rounded-lg font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-xs cursor-pointer flex items-center gap-1.5"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isRTL ? 'حذف التقرير' : 'Delete'}
            </Button>
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

export default PestControlDetailDrawer
