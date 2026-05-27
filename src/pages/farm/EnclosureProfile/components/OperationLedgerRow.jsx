import React, { useRef, useState, useEffect } from 'react'

import dayjs from 'dayjs'
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  HardHat,
  Paperclip,
  StickyNote,
  Timer,
  TrendingUp,
  User,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'

import AttachmentGallery from '../../../reports/shared/AttachmentGallery'
import { reportsApi } from '../../../../services/reportsApi'

import 'dayjs/locale/ar'

// Helper: render a fallback when value is empty/null/undefined
const Val = ({ value, unit = '', fallback = 'غير مسجل' }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic text-xs">{fallback}</span>
  }
  return <span>{value}{unit ? ` ${unit}` : ''}</span>
}

// Initials helper
const getInitials = (name) => {
  if (!name) return '—'
  const cleanName = name.replace(/^(مهندس|مهندسة|م\.|د\.)\s+/i, '').trim()
  const parts = cleanName.split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0)
  return (parts[0].charAt(0) + (parts[parts.length - 1]?.charAt(0) || '')).substring(0, 2)
}

// Avatar color generator based on HSL for harmonious palette
const getAvatarColor = (name) => {
  if (!name) return 'hsl(200, 30%, 50%)'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `hsl(${h}, 45%, 43%)`
}

// Status config mapping
const STATUS_CONFIG = {
  COMPLETED: {
    label: 'مكتملة',
    dot: 'bg-emerald-500 ring-emerald-500/25',
    badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-450 border-emerald-250 dark:border-emerald-800/50',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'قيد التنفيذ',
    dot: 'bg-amber-500 ring-amber-500/25',
    badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-750 dark:text-amber-455 border-amber-250 dark:border-amber-800/50',
    icon: Timer,
  },
  APPROVED: {
    label: 'معتمدة',
    dot: 'bg-blue-500 ring-blue-500/25',
    badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-750 dark:text-blue-450 border-blue-250 dark:border-blue-800/50',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'مرفوضة',
    dot: 'bg-red-500 ring-red-500/25',
    badge: 'bg-red-50 dark:bg-red-950/40 text-red-750 dark:text-red-450 border-red-250 dark:border-red-800/50',
    icon: AlertCircle,
  },
}

function getStatusConfig(status) {
  const upperStatus = String(status || '').toUpperCase()
  return STATUS_CONFIG[upperStatus] || STATUS_CONFIG[status] || {
    label: status || 'غير محدد',
    dot: 'bg-slate-400 ring-slate-400/25',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border-slate-200 dark:border-slate-700',
    icon: AlertCircle,
  }
}

const MetricPill = ({ icon: Icon, label, value, color = 'slate' }) => {
  const colors = {
    slate:   'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    blue:    'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
    amber:   'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    purple:  'bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border shadow-sm transition-all duration-200 hover:scale-[1.02] ${colors[color] || colors.slate}`}>
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{label}</span>
      {value !== undefined && value !== null && <span className="font-black">{value}</span>}
    </span>
  )
}

const OperationLedgerRow = ({ event, onOpenDrawer }) => {
  const [expanded, setExpanded] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [hydratedDetails, setHydratedDetails] = useState(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    if (expanded && !hydratedDetails) {
      const sourceId = event.source_id || event.report_id || event.id
      const sourceType = event.source_type || 'DAILY_TASK'
      
      if (sourceId) {
        setLoadingDetails(true)
        const fetchDetails = async () => {
          try {
            let response
            if (sourceType === 'HARVEST') {
              response = await reportsApi.getHarvestReport(sourceId)
            } else {
              response = await reportsApi.getTask(sourceId)
            }
            setHydratedDetails(response.data)
          } catch (err) {
            console.error("Failed to hydrate operational ledger row details:", err)
          } finally {
            setLoadingDetails(false)
          }
        }
        fetchDetails()
      }
    }
  }, [expanded, hydratedDetails, event.source_id, event.report_id, event.id, event.source_type])

  const mergedEvent = {
    ...event,
    ...(hydratedDetails || {}),
    labor_entries: hydratedDetails?.labor_entries || event.labor_entries || [],
    attachments: hydratedDetails?.attachments || event.attachments || [],
    notes: hydratedDetails?.notes || hydratedDetails?.general_notes || event.notes,
  }

  // --- Data extraction ---
  const companyWorkers = parseInt(mergedEvent.company_workers ?? mergedEvent.metrics?.company_workers ?? 0)
  const contractorWorkers = parseInt(mergedEvent.contractor_workers ?? mergedEvent.metrics?.contractor_workers ?? 0)
  const totalWorkers = companyWorkers + contractorWorkers
  const workHours = parseFloat(mergedEvent.work_hours ?? mergedEvent.metrics?.total_hours ?? 0)
  const overtimeHours = parseFloat(mergedEvent.overtime_hours ?? 0)
  const productivity = mergedEvent.actual_productivity != null 
    ? parseFloat(mergedEvent.actual_productivity) 
    : (mergedEvent.quantity != null ? parseFloat(mergedEvent.quantity) : null)

  // Date: prefer operation_date, fall back to report_date, then created_at
  const displayDate = mergedEvent.operation_date || mergedEvent.report_date || mergedEvent.created_at
  const formattedDate = displayDate && dayjs(displayDate).isValid()
    ? dayjs(displayDate).locale('ar').format('DD MMM YYYY')
    : '—'
  const formattedTime = displayDate && dayjs(displayDate).isValid() && displayDate.includes('T')
    ? dayjs(displayDate).format('HH:mm')
    : ''

  const status = mergedEvent.report_status || mergedEvent.status || ''
  const statusCfg = getStatusConfig(status)
  const StatusIcon = statusCfg.icon

  const attachmentCount = mergedEvent.attachments?.length 
    ?? mergedEvent.attachments_count 
    ?? 0

  const handleOpenGallery = () => {
    galleryRef.current?.open(0)
  }

  const triggerOpenDrawer = (e) => {
    e.stopPropagation()
    if (onOpenDrawer) {
      onOpenDrawer(mergedEvent)
    }
  }

  return (
    <>
      {/* ─── Collapsed Summary Row ─── */}
      <tr
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer border-b border-slate-100 dark:border-slate-800/60 transition-all duration-300 ${
          expanded 
            ? 'bg-slate-50/80 dark:bg-slate-900/35 shadow-inner' 
            : 'bg-white dark:bg-transparent hover:bg-slate-50/45 dark:hover:bg-slate-900/20'
        }`}
      >
        {/* Toggle Chevron */}
        <td className="w-10 px-4 py-4 text-center">
          <button
            type="button"
            className="text-slate-450 hover:text-slate-650 transition-colors focus:outline-none"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>

        {/* Date / Time */}
        <td className="px-4 py-4 text-right">
          <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">{formattedDate}</p>
          {formattedTime && <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-550 leading-tight mt-1">{formattedTime}</p>}
        </td>

        {/* Operation & Location */}
        <td className="px-4 py-4 text-start">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-black text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
              {mergedEvent.operation_name || 'عملية غير محددة'}
            </span>
            {mergedEvent.source_type === 'HARVEST' ? (
              <span className="inline-flex text-[9px] font-black bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/30">
                حصاد
              </span>
            ) : (
              <span className="inline-flex text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-900/30">
                مهمة
              </span>
            )}
          </div>
          {mergedEvent.location_name && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              {mergedEvent.location_name}
            </div>
          )}
        </td>

        {/* Engineer */}
        <td className="px-4 py-4 text-start">
          {mergedEvent.engineer_name ? (
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 border border-white dark:border-slate-900 shadow-sm"
                style={{ backgroundColor: getAvatarColor(mergedEvent.engineer_name) }}
              >
                {getInitials(mergedEvent.engineer_name)}
              </div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-350 truncate">{mergedEvent.engineer_name}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic text-xs">غير مسجل</span>
          )}
        </td>

        {/* Productivity */}
        <td className="px-4 py-4 text-left">
          {productivity != null ? (
            <MetricPill icon={Zap} label="" value={`${productivity} ${mergedEvent.unit_name || ''}`} color="emerald" />
          ) : (
            <span className="text-slate-400 italic text-xs">—</span>
          )}
        </td>

        {/* Total Workers */}
        <td className="px-4 py-4 text-left">
          {mergedEvent.is_shared_labor ? (
            <MetricPill icon={Users} label="عامل مشترك" color="slate" />
          ) : totalWorkers > 0 ? (
            <MetricPill icon={Users} label="" value={`${totalWorkers} عمال`} color="slate" />
          ) : (
            <span className="text-slate-400 italic text-xs">—</span>
          )}
        </td>

        {/* Work Hours */}
        <td className="px-4 py-4 text-left">
          {workHours > 0 ? (
            <MetricPill icon={Clock} label="" value={`${workHours}س`} color="blue" />
          ) : (
            <span className="text-slate-400 italic text-xs">—</span>
          )}
        </td>

        {/* Attachment count */}
        <td className="px-4 py-4 text-center">
          {attachmentCount > 0 ? (
            <div className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-505 font-black">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic text-xs">—</span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-4 text-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border ${statusCfg.badge}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusCfg.label}</span>
          </span>
        </td>
      </tr>

      {/* ─── Expanded Detail Panel Row ─── */}
      {expanded && (
        <tr className="bg-slate-50/50 dark:bg-slate-900/10">
          <td colSpan={9} className="px-6 py-6 text-right">
            {loadingDetails ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">جاري تحميل كامل تفاصيل التقرير والعمالة...</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-250">
                {/* Upper grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Panel 1: Report Summary */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-500" />
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">تفاصيل العملية والتقرير</h4>
                      </div>
                      
                      {/* Drawer Trigger Button */}
                      <button
                        type="button"
                        onClick={triggerOpenDrawer}
                        className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        عرض جانبي كامل
                      </button>
                    </div>
                    
                    <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">نوع التقرير</span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${
                          mergedEvent.source_type === 'HARVEST'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/50'
                        }`}>
                          {mergedEvent.source_type === 'HARVEST' ? 'تقرير حصاد محاصيل' : 'تقرير مهمة عمل يومية'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">المهندس المسؤول</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                            style={{ backgroundColor: getAvatarColor(mergedEvent.engineer_name) }}
                          >
                            {getInitials(mergedEvent.engineer_name)}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{mergedEvent.engineer_name || 'غير مسجل'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تاريخ التقرير</span>
                        <span className="font-bold text-slate-850 dark:text-slate-200">{formattedDate}</span>
                      </div>

                      {formattedTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">وقت تسجيل التقرير</span>
                          <span className="font-bold text-slate-850 dark:text-slate-200">{formattedTime}</span>
                        </div>
                      )}

                      {mergedEvent.location_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">الموقع / الحوشة</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{mergedEvent.location_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel 2: Operational Metrics */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">المؤشرات والإنتاجية</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">الإنتاجية الفعلية</span>
                        <span className="text-lg font-black text-slate-850 dark:text-slate-200 block truncate">
                          {productivity ?? 0}
                          {mergedEvent.unit_name && <span className="text-[10px] text-slate-400 font-bold mr-1">({mergedEvent.unit_name})</span>}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mb-1">تكلفة العمالة</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block truncate">
                          {mergedEvent.metrics?.total_cost ? `${mergedEvent.metrics.total_cost.toFixed(2)} ج.م` : '0.00 ج.م'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">إجمالي عمال التشغيل</span>
                        <span className="text-slate-855 dark:text-slate-200">
                          {mergedEvent.is_shared_labor ? (
                            <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-lg border border-amber-200/30">عامل مشترك</span>
                          ) : (
                            `${totalWorkers} عمال (${companyWorkers} شركة / ${contractorWorkers} مقاول)`
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ساعات العمل الفعلية</span>
                        <span className="text-slate-855 dark:text-slate-200">{workHours} ساعة</span>
                      </div>

                      {overtimeHours > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ساعات العمل الإضافية</span>
                          <span className="text-purple-600 dark:text-purple-400">{overtimeHours} ساعة</span>
                        </div>
                      )}

                      {mergedEvent.contractor_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">المقاول المعتمد</span>
                          <span className="text-slate-855 dark:text-slate-200">{mergedEvent.contractor_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Panel 3: Production & Progress */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <Zap className="w-5 h-5 text-purple-500" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">الإنتاج ونسبة الإكمال</h4>
                    </div>

                    <div className="space-y-4">
                      {mergedEvent.completion_percentage != null && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5 text-xs">
                            <span className="text-slate-400 font-medium">نسبة إكمال العملية</span>
                            <span className="font-black text-slate-850 dark:text-slate-200">{mergedEvent.completion_percentage}%</span>
                          </div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                            <div
                              className={`h-full rounded-full transition-all duration-750 relative ${
                                mergedEvent.completion_percentage >= 100 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse' 
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min(mergedEvent.completion_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 text-xs pt-1 font-semibold text-slate-700 dark:text-slate-300">
                        {mergedEvent.variety_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">الصنف / الصنف الفرعي</span>
                            <span className="text-slate-850 dark:text-slate-200">{mergedEvent.variety_name}</span>
                          </div>
                        )}
                        
                        {mergedEvent.unit_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">وحدة القياس المتبعة</span>
                            <span className="text-slate-850 dark:text-slate-200">{mergedEvent.unit_name}</span>
                          </div>
                        )}
                        
                        {mergedEvent.overtime_productivity > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">إنتاجية الوقت الإضافي</span>
                            <span className="text-purple-600 dark:text-purple-400">{mergedEvent.overtime_productivity} {mergedEvent.unit_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Panel 4: Notes & Observations */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <StickyNote className="w-5 h-5 text-amber-500" />
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">الملاحظات والتوصيات الفنية</h4>
                    </div>

                    {mergedEvent.notes ? (
                      <div className="bg-amber-50/40 dark:bg-amber-950/10 border-r-4 border-amber-500 dark:border-amber-600 rounded-l-xl p-4 text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold whitespace-pre-wrap max-h-44 overflow-y-auto">
                        {mergedEvent.notes}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-2 py-6">
                        <StickyNote className="w-10 h-10 stroke-[1.5]" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">لا توجد ملاحظات أو توصيات مسجلة</p>
                      </div>
                    )}
                  </div>

                  {/* Panel 5: Attachments & Gallery */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">مرفقات التقرير</h4>
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-900/30">
                          {attachmentCount}
                        </span>
                      </div>
                      
                      {attachmentCount > 0 && (
                        <button
                          type="button"
                          onClick={handleOpenGallery}
                          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض المرفقات
                        </button>
                      )}
                    </div>

                    {attachmentCount > 0 ? (
                      <AttachmentGallery ref={galleryRef} attachments={mergedEvent.attachments} />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-2 py-6">
                        <Paperclip className="w-10 h-10 stroke-[1.5]" />
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">لا توجد مرفقات أو صور مسجلة</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel 6: Labor Details Table (Full Width) */}
                {mergedEvent.labor_entries?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-slate-500" />
                        <span className="text-sm font-black text-slate-800 dark:text-slate-200">سجل تشغيل العمالة بالتفصيل</span>
                      </div>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-2.5 py-1 rounded-full font-bold">
                        {mergedEvent.labor_entries.length} عمال
                      </span>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/55 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/80">
                          <tr>
                            <th className="px-4 py-3 text-right">العامل</th>
                            <th className="px-4 py-3 text-center">النوع</th>
                            <th className="px-4 py-3 text-left">أجر الساعة</th>
                            <th className="px-4 py-3 text-left">ساعات العمل</th>
                            <th className="px-4 py-3 text-left">وقت إضافي</th>
                            <th className="px-4 py-3 text-left">التكلفة الإجمالية</th>
                            <th className="px-4 py-3 text-right">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {mergedEvent.labor_entries.map((labor, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-850 dark:text-slate-200">{labor.worker_name}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  labor.worker_type === 'COMPANY'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                }`}>
                                  {labor.worker_type === 'COMPANY' ? 'موظف شركة' : 'عمالة مقاول'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-left font-semibold text-slate-650 dark:text-slate-350">{labor.worker_rate} ج.م</td>
                              <td className="px-4 py-3 text-left font-semibold text-slate-650 dark:text-slate-350">{labor.hours} س</td>
                              <td className="px-4 py-3 text-left font-semibold text-purple-600 dark:text-purple-400">{labor.overtime > 0 ? `${labor.overtime} س` : '—'}</td>
                              <td className="px-4 py-3 text-left font-black text-emerald-600 dark:text-emerald-400">{labor.line_cost || ((parseFloat(labor.hours) + parseFloat(labor.overtime || 0)) * parseFloat(labor.worker_rate)).toFixed(2)} ج.م</td>
                              <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={labor.note}>{labor.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Metadata Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {mergedEvent.id && <span>الرقم المرجعي للعملية: #{mergedEvent.id}</span>}
                  {mergedEvent.created_at && (
                    <span>تاريخ الإضافة بالنظام: {dayjs(mergedEvent.created_at).locale('ar').format('YYYY-MM-DD HH:mm:ss')}</span>
                  )}
                  {mergedEvent.updated_at && (
                    <span>آخر تحديث: {dayjs(mergedEvent.updated_at).locale('ar').format('YYYY-MM-DD HH:mm:ss')}</span>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default OperationLedgerRow
