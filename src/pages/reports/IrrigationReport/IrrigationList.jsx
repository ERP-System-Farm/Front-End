import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  Plus,
  MapPin,
  Users,
  Search,
  FilterX,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Paperclip,
  RefreshCcw,
  Droplets,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  TrendingUp,
  Loader2,
  Sprout,
  AlertCircle,
} from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'

import { reportsApi } from '../../../services/reportsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AttachmentGallery from '../shared/AttachmentGallery'
import IrrigationDetailDrawer from './components/IrrigationDetailDrawer'
import { cn } from '../../../lib/utils'

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.locale('ar')

// ── KPI Cell ─────────────────────────────────────────────────────────────────
const KpiCell = ({ label, value, unit, colorClass = 'text-slate-800 dark:text-slate-100' }) => (
  <div className="flex flex-col items-center justify-center py-3 px-4 border-l border-slate-200 dark:border-slate-700/60 last:border-l-0 first:border-l-0 min-w-0">
    <span className={`text-xl font-black tabular-nums ${colorClass}`}>{value}</span>
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">{label}</span>
    {unit && <span className="text-[9px] text-slate-300 dark:text-slate-600">{unit}</span>}
  </div>
)

const IrrigationList = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [stats, setStats] = useState({ totalReports: 0, totalShifts: 0, totalHours: 0, todayCount: 0, weekCount: 0 })
  const [filterOptions, setFilterOptions] = useState({ engineers: [], stages: [] })

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    engineer: '',
    phase: '',
  })

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const handleReportClick = (id) => { setSelectedReportId(id); setIsDrawerOpen(true) }
  const toggleRow = (id, e) => { e.stopPropagation(); setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] })) }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      params.page = page
      const res = await reportsApi.getIrrigations(params)

      if (res.data.results) {
        const list = res.data.results
        setReports(list)
        setTotalCount(res.data.count || 0)
        setTotalPages(Math.ceil(res.data.count / 10))

        const todayCount = list.filter((r) => dayjs(r.date).isToday()).length
        const startOfWeek = dayjs().startOf('week')
        const weekCount = list.filter((r) => dayjs(r.date).isAfter(startOfWeek)).length
        setStats({
          totalReports: res.data.count || list.length,
          totalShifts: list.reduce((s, r) => s + (parseInt(r.total_shifts) || 0), 0),
          totalHours: list.reduce((s, r) => s + (parseFloat(r.total_hours) || 0), 0).toFixed(1),
          todayCount,
          weekCount,
        })
      } else {
        const list = res.data || []
        setReports(list)
        setTotalCount(list.length)
        setTotalPages(1)
        setStats({
          totalReports: list.length,
          totalShifts: list.reduce((s, r) => s + (parseInt(r.total_shifts) || 0), 0),
          totalHours: list.reduce((s, r) => s + (parseFloat(r.total_hours) || 0), 0).toFixed(1),
          todayCount: list.filter((r) => dayjs(r.date).isToday()).length,
          weekCount: list.filter((r) => dayjs(r.date).isAfter(dayjs().startOf('week'))).length,
        })
      }
    } catch (err) {
      console.error('Error fetching irrigation reports:', err)
      setError('فشل في جلب تقارير الري والتسميد.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير نهائياً؟')) return
    try {
      setDeleteLoading(true)
      await reportsApi.deleteIrrigation(id)
      await fetchReports()
    } catch (err) {
      setError('فشل في حذف تقرير الري.')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [engRes, stageRes] = await Promise.allSettled([
          reportsApi.getEngineers(),
          reportsApi.getLocationNodes('STAGE'),
        ])
        const engineers = engRes.status === 'fulfilled' ? (engRes.value.data.results || engRes.value.data || []) : []
        const stages = stageRes.status === 'fulfilled' ? (stageRes.value.data.results || stageRes.value.data || []) : []
        setFilterOptions({ engineers, stages })
      } catch (err) {
        console.error('Failure initializing filters:', err)
      }
    }
    loadFilters()
  }, [])

  useEffect(() => { fetchReports() }, [filters, page])
  useEffect(() => { setPage(1) }, [filters])

  const handleClearFilters = () => {
    setFilters({ search: '', start_date: '', end_date: '', engineer: '', phase: '' })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== 'all')

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-500 shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              سجل دورات الري والتسميد
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              إدارة ومتابعة دورات الري وإضافة الأسمدة وتوزيع العمالة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="h-9 w-9 p-0 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 rounded-lg"
            title="تحديث"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="new" className="flex-1 sm:flex-none">
            <Button
              size="sm"
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-lg shadow-sm shadow-blue-600/20 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              دورة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ملخص تنفيذي</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
          <KpiCell label="إجمالي الدورات" value={stats.totalReports} colorClass="text-slate-800 dark:text-slate-100" />
          <KpiCell label="إجمالي التحويلات" value={stats.totalShifts} colorClass="text-blue-700 dark:text-blue-400" />
          <KpiCell label="ساعات التشغيل" value={stats.totalHours} unit="ساعة" colorClass="text-emerald-700 dark:text-emerald-400" />
          <KpiCell label="اليوم" value={stats.todayCount} colorClass="text-sky-700 dark:text-sky-400" />
          <KpiCell label="هذا الأسبوع" value={stats.weekCount} colorClass="text-violet-700 dark:text-violet-400" />
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 dark:border-slate-700/60 shadow-sm rounded-xl overflow-hidden">

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 p-3 flex-wrap">
            <div className="relative flex-grow min-w-0 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="بحث في بيانات الري..."
                className="pr-9 h-8 text-xs border-slate-200 dark:border-slate-700 font-medium bg-slate-50/50 dark:bg-slate-800/50 rounded-lg"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              />
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-xs font-bold rounded-lg gap-1.5',
                  filtersOpen
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <FilterX className="w-3.5 h-3.5" />
                فلاتر
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </Button>
              <Button
                size="sm"
                onClick={fetchReports}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-xs gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                بحث
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={filters.engineer || 'all'} onValueChange={(val) => setFilters({ ...filters, engineer: val })}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" dir="rtl">
                    <SelectValue placeholder="المهندس المسؤول" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">كل المهندسين</SelectItem>
                    {filterOptions.engineers.map((eng) => (
                      <SelectItem key={eng.id} value={eng.id.toString()}>{eng.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.phase || 'all'} onValueChange={(val) => setFilters({ ...filters, phase: val })}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" dir="rtl">
                    <SelectValue placeholder="المرحلة التشغيلية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">كل المراحل</SelectItem>
                    {filterOptions.stages.map((stg) => (
                      <SelectItem key={stg.id} value={stg.id.toString()}>{stg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-8 sm:col-span-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    className="h-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none font-medium flex-1 min-w-0"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                  <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                  <input
                    type="date"
                    className="h-full text-xs text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none font-medium flex-1 min-w-0"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold gap-1"
                  >
                    <FilterX className="w-3 h-3" />
                    مسح الفلاتر
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <CardContent className="p-0 bg-white dark:bg-slate-900">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {reports.length === 0 && !loading ? (
              <div className="py-16 text-center">
                <Droplets className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-sm">لا توجد تقارير ري مطابقة</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">جرب تغيير فلاتر البحث</p>
              </div>
            ) : loading && reports.length === 0 ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse" dir="rtl" style={{ minWidth: '700px' }}>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
                      <th className="px-4 py-2.5">التاريخ والمناوبة</th>
                      <th className="px-4 py-2.5 hidden sm:table-cell">المهندس</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">ساعات الري</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">عدد التحويلات</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">مع تسميد</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">العمالة</th>
                      <th className="px-4 py-2.5 hidden xl:table-cell">المرفقات</th>
                      <th className="px-4 py-2.5 text-center w-16">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reports.map((report) => {
                      const isExpanded = !!expandedRows[report.id]
                      const companyLaborCount = report.labor_entries?.filter((e) => e.worker_type === 'COMPANY').length || 0
                      const contractorLaborCount = report.labor_entries?.filter((e) => e.worker_type === 'CONTRACTOR').length || 0
                      const companyWorkers = companyLaborCount > 0 ? companyLaborCount : (report.company_workers || 0)
                      const contractorWorkers = contractorLaborCount > 0 ? contractorLaborCount : (report.contractor_workers || 0)
                      const totalWorkers = companyWorkers + contractorWorkers

                      return (
                        <React.Fragment key={report.id}>
                          <tr
                            className={cn(
                              'hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer',
                              isExpanded && 'bg-slate-50/40 dark:bg-slate-800/20'
                            )}
                            onClick={() => handleReportClick(report.id)}
                          >
                            {/* Date */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <button
                                  className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-500 shrink-0 transition-colors"
                                  onClick={(e) => toggleRow(report.id, e)}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <div>
                                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                    {report.date ? dayjs(report.date).format('DD MMM YYYY') : '—'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {dayjs(report.date || report.created_at).fromNow()}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Engineer */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-6 h-6 border border-slate-200 dark:border-slate-700 shrink-0">
                                  <AvatarFallback className="text-[8px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                                    {report.engineer_name ? report.engineer_name.substring(0, 2) : 'مه'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                  {report.engineer_name || '—'}
                                </span>
                              </div>
                            </td>

                            {/* Hours */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-md px-1.5 py-0.5">
                                <Clock className="w-3 h-3" />
                                {report.total_hours}س
                              </div>
                            </td>

                            {/* Shifts */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md px-1.5 py-0.5">
                                <Sprout className="w-3 h-3" />
                                {report.total_shifts}
                              </div>
                            </td>

                            {/* Fertilized */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className={cn(
                                'inline-flex text-[10px] font-black px-1.5 py-0.5 rounded-md border',
                                report.is_fertilized
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              )}>
                                {report.is_fertilized ? '✓ تسميد' : 'بدون'}
                              </span>
                            </td>

                            {/* Workers */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{totalWorkers}</span>
                              </div>
                            </td>

                            {/* Attachments */}
                            <td className="px-4 py-3 hidden xl:table-cell">
                              {report.attachments && report.attachments.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-md px-1.5 py-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {report.attachments.length}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" dir="rtl" className="min-w-[160px]">
                                  <DropdownMenuItem
                                    className="text-xs font-bold gap-2 cursor-pointer"
                                    onClick={() => handleReportClick(report.id)}
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    عرض التفاصيل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-xs font-bold gap-2 cursor-pointer"
                                    onClick={() => navigate(`/reports/irrigation/${report.id}/edit`)}
                                  >
                                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-xs font-bold gap-2 cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:bg-rose-50"
                                    onClick={(e) => handleDelete(report.id, e)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    حذف التقرير
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30 dark:bg-slate-900/20">
                              <td colSpan={8} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                  <div className="lg:col-span-2 space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                                      تفاصيل التحويلات والمواد المضافة
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {report.details && report.details.length > 0 ? (
                                        report.details.map((detail, idx) => (
                                          <div key={detail.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50/80 dark:bg-slate-850 px-3 py-1.5 border-b border-slate-200 dark:border-slate-750 flex justify-between items-center">
                                              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">
                                                {detail.phase_name || `مرحلة #${detail.phase}`}
                                              </span>
                                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded px-1.5 py-0.5">
                                                {detail.shifts_count} تحويلات
                                              </span>
                                            </div>
                                            <div className="p-3 space-y-1.5">
                                              {detail.fertilizers && detail.fertilizers.length > 0 ? (
                                                detail.fertilizers.map((fert, fIdx) => (
                                                  <div key={fert.id || fIdx} className="flex justify-between text-xs bg-slate-50/40 dark:bg-slate-950 p-1.5 rounded border border-slate-100 dark:border-slate-800/80">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                      {fert.fertilizer_item_name || fert.custom_material_name || 'مادة غير محددة'}
                                                    </span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                      {fert.quantity} {fert.unit || 'كجم'}
                                                    </span>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-xs text-slate-400 italic">لا توجد مواد مضافة.</p>
                                              )}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-slate-400 italic col-span-2">لا توجد تفاصيل للمناوبات.</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">ملاحظات</p>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                        {report.notes ? `"${report.notes}"` : 'لا توجد ملاحظات.'}
                                      </p>
                                    </div>
                                    {report.attachments && report.attachments.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                          <Paperclip className="w-3 h-3 text-violet-500" />
                                          المرفقات ({report.attachments.length})
                                        </p>
                                        <AttachmentGallery attachments={report.attachments} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  عرض {reports.length} من {totalCount} تقرير
                </span>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => page > 1 && setPage((p) => p - 1)}
                        className={cn('cursor-pointer h-8 text-xs', page === 1 && 'pointer-events-none opacity-40')}
                      />
                    </PaginationItem>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setPage(i + 1)}
                          isActive={page === i + 1}
                          className="cursor-pointer font-bold h-8 w-8 text-xs"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => page < totalPages && setPage((p) => p + 1)}
                        className={cn('cursor-pointer h-8 text-xs', page === totalPages && 'pointer-events-none opacity-40')}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <IrrigationDetailDrawer
        reportId={selectedReportId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDeleteSuccess={fetchReports}
      />
    </div>
  )
}

export default IrrigationList
