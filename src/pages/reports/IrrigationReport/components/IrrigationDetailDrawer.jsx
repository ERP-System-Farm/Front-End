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
  Droplets,
  Sprout
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { reportsApi } from '../../../../services/reportsApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AttachmentGallery from '../../shared/AttachmentGallery'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../../../lib/utils'

const IrrigationDetailDrawer = ({ reportId, isOpen, onClose, onDeleteSuccess }) => {
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
      const res = await reportsApi.getIrrigation(reportId)
      setReport(res.data)
      setError(null)
    } catch (err) {
      setError(isRTL ? 'فشل في تحميل تفاصيل تقرير الري والتسميد' : 'Failed to load irrigation report details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا التقرير نهائياً؟' : 'Are you sure you want to delete this report permanently?')) return
    
    try {
      setDeleteLoading(true)
      await reportsApi.deleteIrrigation(reportId)
      onClose()
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (err) {
      setError(isRTL ? 'فشل في حذف تقرير الري.' : 'Failed to delete irrigation report.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!isOpen) return null

  const totalWorkers = (report?.company_workers || 0) + (report?.contractor_workers || 0)

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
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shadow-sm text-blue-600 dark:text-blue-400">
              <Droplets className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-455 dark:text-slate-500">
                  {isRTL ? 'تقرير دورة ري وتسميد' : 'Irrigation & Fertilization Report'}
                </span>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                  #{reportId}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] font-black py-0.5 px-2.5 rounded-lg border-0 shadow-none", 
                    report?.is_fertilized 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450" 
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {report?.is_fertilized ? (isRTL ? 'مع تسميد' : 'With Fertilizer') : (isRTL ? 'بدون تسميد' : 'Without Fertilizer')}
                </Badge>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {isRTL ? `دورة ري بتاريخ ${report?.date || ''}` : `Irrigation Cycle on ${report?.date || ''}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <Loader2 className="w-9 h-9 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{isRTL ? 'جاري تحميل تفاصيل الدورة...' : 'Loading cycle details...'}</p>
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
                    {isRTL ? 'مقاييس المناوبة العامة' : 'Core Cycle Metrics'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Workers Count */}
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
                          {isRTL ? `شركة: ${report.company_workers || 0} | مقاول: ${report.contractor_workers || 0}` : `Staff: ${report.company_workers || 0} | Contract: ${report.contractor_workers || 0}`}
                        </div>
                      </div>
                    </div>

                    {/* Operational Hours */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'ساعات التشغيل' : 'Operational Hours'}</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{report.total_hours} <span className="text-xs font-normal text-slate-500">{isRTL ? 'س' : 'hrs'}</span></span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1">
                          {isRTL ? 'إجمالي ساعات دورة الري' : 'Total cycle operating hours'}
                        </div>
                      </div>
                    </div>

                    {/* Shifts Count */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'عدد التحويلات' : 'Total Shifts'}</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Sprout className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{report.total_shifts}</span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-1">
                          {isRTL ? 'تحويلة ري منفذة' : 'Irrigation shifts executed'}
                        </div>
                      </div>
                    </div>

                    {/* Fertilized State */}
                    <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500">{isRTL ? 'التسميد' : 'Fertilization'}</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Droplets className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200">
                          {report.is_fertilized ? (isRTL ? 'مع تسميد' : 'Fertilized') : (isRTL ? 'بدون تسميد' : 'No Fertilizer')}
                        </span>
                        <div className="text-[10px] font-bold text-slate-455 dark:text-slate-500 mt-2">
                          {isRTL ? 'برامج التغذية المضافة' : 'Nutritional program additions'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Shift Details & Fertilizers */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'تفاصيل التحويلات والمواد المضافة' : 'Shifts & Applied Materials'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {report.details && report.details.length > 0 ? (
                      report.details.map((detail, idx) => (
                        <div key={detail.id || idx} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 overflow-hidden shadow-xs">
                          {/* Shift Card Header */}
                          <div className="bg-slate-50/50 dark:bg-slate-850/20 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {isRTL ? `القطاع / المرحلة: ${detail.phase_name || `مرحلة #${detail.phase}`}` : `Phase/Sector: ${detail.phase_name || `#${detail.phase}`}`}
                            </span>
                            <Badge className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/30 border-none font-bold text-[10px] py-0.5 px-2">
                              {detail.shifts_count} {isRTL ? 'تحويلات' : 'shifts'} • {detail.hours_per_shift} {isRTL ? 'س' : 'hrs'}
                            </Badge>
                          </div>
                          
                          {/* Applied Materials inside this shift */}
                          <div className="p-4 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'المواد والأسمدة المضافة' : 'Applied Fertilizers / Chemicals'}</p>
                            {detail.fertilizers && detail.fertilizers.length > 0 ? (
                              <div className="space-y-1.5">
                                {detail.fertilizers.map((fert, fIdx) => (
                                  <div key={fert.id || fIdx} className="flex justify-between items-center text-xs bg-slate-50/40 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                                      {fert.fertilizer_item_name || fert.custom_material_name || (isRTL ? "مادة غير محددة" : "Unspecified Material")}
                                    </span>
                                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                      {fert.quantity} {fert.unit || (isRTL ? "كجم" : "kg")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">{isRTL ? 'لا توجد مواد مضافة في هذه التحويلة' : 'No materials added in this shift'}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400 font-bold col-span-2">
                        {isRTL ? 'لا توجد تفاصيل للمناوبات مسجلة.' : 'No shift details recorded.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Labor logs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider">
                    {isRTL ? 'سجل حركة العمالة الفردية لهذه النوبة' : 'Individual labor logs'}
                  </h3>
                  {report.labor_entries && report.labor_entries.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3 font-bold">{isRTL ? 'اسم العامل' : 'Worker Name'}</th>
                              <th className="p-3 font-bold">{isRTL ? 'نوع العامل' : 'Type'}</th>
                              <th className="p-3 font-bold">{isRTL ? 'ساعات العمل القياسية' : 'Regular Hours'}</th>
                              <th className="p-3 font-bold">{isRTL ? 'ساعات الإضافي' : 'Overtime'}</th>
                              <th className="p-3 font-bold">{isRTL ? 'ملاحظات / سبب الإضافي أو الخصم' : 'Notes / Remarks'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {report.labor_entries.map((entry, eIdx) => (
                              <tr key={entry.id || eIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                                <td className="p-3 font-bold text-slate-900 dark:text-white">{entry.worker_name}</td>
                                <td className="p-3">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    entry.worker_type === "COMPANY" 
                                      ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" 
                                      : "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                                  )}>
                                    {entry.worker_type === "COMPANY" ? (isRTL ? "عمالة شركة" : "Company") : (isRTL ? "عمالة مقاول" : "Contractor")}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-bold">{entry.hours} {isRTL ? 'ساعة' : 'hrs'}</td>
                                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">+{entry.overtime || 0}س</td>
                                <td className="p-3 text-slate-500 dark:text-slate-450 italic">{entry.note || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-center text-xs text-slate-400 font-bold">
                      {isRTL ? 'لم يتم إضافة تفاصيل فردية للعمالة. تم الاكتفاء بالأعداد الإجمالية.' : 'No individual labor details. Summary counts were used.'}
                    </div>
                  )}
                </div>

                {/* Section 4: Notes */}
                {report.notes && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-xs">
                    <h4 className="text-xs font-black text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{isRTL ? 'الملاحظات والمشاهدات الميدانية' : 'Notes & Observations'}</span>
                    </h4>
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-lg border border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium italic select-text">
                      "{report.notes}"
                    </div>
                  </div>
                )}

                {/* Section 5: Attachments */}
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
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          {(report.engineer_name || 'E')[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{report.engineer_name}</span>
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
                    <span className="font-extrabold block">{isRTL ? 'توزيع التكلفة والأجور' : 'ERP Cost Allocation'}</span>
                    <p className="font-semibold text-slate-550 dark:text-slate-400 leading-relaxed">
                      {isRTL ? 'تترجم بيانات العمالة وتفاصيل الأسمدة المستخدمة في الري والتسميد مباشرة إلى تكاليف في الحسابات والأجور عند حفظ التقرير.' : 'Labor hours and fertilizer materials used in irrigation cycles are translated to ERP financial wages and ledger balances automatically upon report persistence.'}
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
            <Button
              className="h-9.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all text-xs cursor-pointer flex items-center gap-1.5"
              onClick={() => navigate(`/reports/irrigation/${report?.id}/edit`)}
            >
              <Edit className="w-3.5 h-3.5" />
              {isRTL ? 'تعديل التقرير' : 'Edit Report'}
            </Button>
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

export default IrrigationDetailDrawer
