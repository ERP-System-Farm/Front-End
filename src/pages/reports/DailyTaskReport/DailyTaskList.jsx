import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock,
  Plus,
  MapPin,
  Search,
  FilterX,
  ClipboardList,
  FileDown,
  RefreshCcw,
  Eye,
  Edit,
  Paperclip,
  MoreHorizontal,
  ExternalLink,
  TrendingUp,
  Loader2,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isoWeek from 'dayjs/plugin/isoWeek'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'

import { reportsApi } from '../../../services/reportsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import DailyTaskDetailDialog from './components/DailyTaskDetailDrawer'
import { useAuth } from '../../../app/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AttachmentGallery from '../shared/AttachmentGallery'
import ReportActionBar from '../shared/ReportActionBar'
import ReportStatusBadge from '../shared/ReportStatusBadge'
import { cn } from '../../../lib/utils'

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.extend(isoWeek)
dayjs.locale('ar')

// ── KPI helper ────────────────────────────────────────────────────────────────
const KpiCell = ({ label, value, unit, colorClass = 'text-slate-800 dark:text-slate-100' }) => (
  <div className="flex flex-col items-center justify-center py-3 px-4 border-l border-slate-200 dark:border-slate-700/60 last:border-l-0 first:border-l-0 min-w-0">
    <span className={`text-xl font-black tabular-nums ${colorClass}`}>{value}</span>
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">{label}</span>
    {unit && <span className="text-[9px] text-slate-300 dark:text-slate-600">{unit}</span>}
  </div>
)

export default function DailyTaskList() {
  const [reports, setReports] = useState([])
  const [allReportsForStats, setAllReportsForStats] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    operations: [],
    engineers: [],
    locations: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    operation: '',
    engineer: '',
    location: '',
  })

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const toggleRow = (id, e) => {
    e.stopPropagation()
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleQuickAction = async (reportId, actionName, reason = '') => {
    setActionLoading(true)
    try {
      if (actionName === 'submit') await reportsApi.submitTask(reportId)
      if (actionName === 'review') await reportsApi.reviewTask(reportId)
      if (actionName === 'approve') await reportsApi.approveTask(reportId)
      if (actionName === 'reject') await reportsApi.rejectTask(reportId, reason)
      await fetchReports()
      await fetchAllForStats()
    } catch (err) {
      console.error(`Failed to execute quick action ${actionName}:`, err)
      setError(`فشل في تنفيذ الإجراء: ${actionName}`)
    } finally {
      setActionLoading(false)
    }
  }

  const canEdit = (report) => {
    const canEditOrDelete = ['draft', 'submitted', 'rejected'].includes(report.status)
    const userRole = user?.role || 'ENGINEER'
    const isManager = ['MANAGER', 'SUPER_ADMIN', 'OWNER'].includes(userRole)
    return report.status !== 'approved' && (canEditOrDelete && (report.engineer === user?.id || isManager))
  }

  // Reset page when filters or tab changes
  useEffect(() => { setPage(1) }, [filters, activeTab])

  useEffect(() => {
    fetchReports()
    fetchAllForStats()
  }, [filters, activeTab, page])

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [opsRes, engRes, treeRes] = await Promise.allSettled([
          reportsApi.getOperations(),
          reportsApi.getEngineers(),
          reportsApi.getFarmHierarchy(),
        ])
        const operations = opsRes.status === 'fulfilled' ? (opsRes.value.data.results || opsRes.value.data || []) : []
        const engineers = engRes.status === 'fulfilled' ? (engRes.value.data.results || engRes.value.data || []) : []
        const treeData = treeRes.status === 'fulfilled' ? (treeRes.value.data.tree || (Array.isArray(treeRes.value.data) ? treeRes.value.data : [])) : []

        const flattenNodes = (nodes = [], parentLabel = '') =>
          nodes.flatMap((node) => {
            const currentLabel = parentLabel ? `${parentLabel} > ${node.name}` : node.name
            return [{ ...node, displayLabel: currentLabel }, ...flattenNodes(node.children || [], currentLabel)]
          })

        setFilterOptions({ operations, engineers, locations: flattenNodes(treeData) })
      } catch (err) {
        console.error('Critical failure in filter initialization:', err)
      }
    }
    loadFilters()
  }, [])

  const fetchAllForStats = async () => {
    try {
      const res = await reportsApi.getTasks({ page: 1, page_size: 100 })
      const list = res.data.results || res.data || []
      setAllReportsForStats(list)
    } catch (e) { /* ignore */ }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      params.page = page

      if (activeTab === 'pending') params.status = 'submitted'
      else if (activeTab === 'completed') params.status = 'approved'

      const res = await reportsApi.getTasks(params)

      if (res.data.results) {
        setReports(res.data.results)
        setTotalCount(res.data.count || 0)
        setTotalPages(Math.ceil(res.data.count / 10))
      } else {
        let filtered = res.data || []
        if (activeTab === 'pending') filtered = filtered.filter((r) => r.status === 'submitted' || r.status === 'draft')
        if (activeTab === 'completed') filtered = filtered.filter((r) => r.status === 'approved' || r.status === 'finalized')
        setReports(filtered)
        setTotalCount(filtered.length)
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('فشل في جلب التقارير اليومية.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      const response = await reportsApi.exportTasks(params)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `operational_reports_${dayjs().format('YYYY-MM-DD')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleClearFilters = () => {
    setFilters({ search: '', start_date: '', end_date: '', operation: '', engineer: '', location: '' })
  }

  const handleReportClick = (id) => {
    setSelectedTaskId(id)
    setIsDrawerOpen(true)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== 'all')

  // ── KPI computations ──────────────────────────────────────────────────────
  const statsData = allReportsForStats
  const kpiTotal = totalCount || statsData.length
  const kpiApproved = statsData.filter((r) => r.status === 'approved' || r.status === 'finalized').length
  const kpiPending = statsData.filter((r) => r.status === 'submitted' || r.status === 'under_review').length
  const kpiRejected = statsData.filter((r) => r.status === 'rejected').length
  const kpiToday = statsData.filter((r) => dayjs(r.report_date || r.created_at).isToday()).length
  const kpiWeek = statsData.filter((r) => {
    const d = dayjs(r.report_date || r.created_at)
    const startOfWeek = dayjs().startOf('isoWeek')
    const endOfWeek = dayjs().endOf('isoWeek')
    return d.isAfter(startOfWeek.subtract(1, 'ms')) && d.isBefore(endOfWeek.add(1, 'ms'))
  }).length

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-4" dir="rtl">
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-500 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              السجل التشغيلي
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              إدارة ومتابعة التقارير التشغيلية اليومية وسير الاعتمادات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="h-9 w-9 p-0 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 rounded-lg"
            title="تحديث"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold gap-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </Button>
          <Link to="new" className="flex-1 sm:flex-none">
            <Button
              size="sm"
              className="w-full h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 rounded-lg shadow-sm shadow-emerald-700/20 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              تقرير جديد
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 px-3 py-2 rounded-lg text-xs font-bold">
          {error}
        </div>
      )}

      {/* ── Executive KPI Bar ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ملخص تنفيذي</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
          <KpiCell label="إجمالي التقارير" value={kpiTotal} colorClass="text-slate-800 dark:text-slate-100" />
          <KpiCell label="معتمدة" value={kpiApproved} colorClass="text-emerald-700 dark:text-emerald-400" />
          <KpiCell label="قيد المراجعة" value={kpiPending} colorClass="text-amber-700 dark:text-amber-400" />
          <KpiCell label="مرفوضة" value={kpiRejected} colorClass="text-rose-700 dark:text-rose-400" />
          <KpiCell label="اليوم" value={kpiToday} colorClass="text-sky-700 dark:text-sky-400" />
          <KpiCell label="هذا الأسبوع" value={kpiWeek} colorClass="text-violet-700 dark:text-violet-400" />
        </div>
      </div>

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-slate-700/60 shadow-sm rounded-xl overflow-hidden">

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          {/* Primary filter row */}
          <div className="flex items-center gap-2 p-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-grow min-w-0 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="بحث بالعملية أو المهندس..."
                className="pr-9 h-8 text-xs border-slate-200 dark:border-slate-700 font-medium bg-slate-50/50 dark:bg-slate-800/50 rounded-lg"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              />
            </div>

            {/* Quick status tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
              <TabsList className="h-8 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg gap-0.5">
                <TabsTrigger value="all" className="h-7 px-3 text-xs font-bold rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  الكل
                </TabsTrigger>
                <TabsTrigger value="pending" className="h-7 px-3 text-xs font-bold rounded-md text-amber-700 dark:text-amber-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  قيد المراجعة
                </TabsTrigger>
                <TabsTrigger value="completed" className="h-7 px-3 text-xs font-bold rounded-md text-emerald-700 dark:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  المعتمدة
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 mr-auto">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-xs font-bold rounded-lg gap-1.5',
                  filtersOpen
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <FilterX className="w-3.5 h-3.5" />
                فلاتر متقدمة
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={fetchReports}
                className="h-8 px-4 bg-emerald-700 hover:bg-emerald-800 font-bold rounded-lg text-xs gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                بحث
              </Button>
            </div>
          </div>

          {/* Advanced filter panel (collapsible) */}
          {filtersOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={filters.operation || 'all'} onValueChange={(val) => setFilters({ ...filters, operation: val })}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" dir="rtl">
                    <SelectValue placeholder="نوع العملية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">كل العمليات</SelectItem>
                    {filterOptions.operations.map((op) => (
                      <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.engineer || 'all'} onValueChange={(val) => setFilters({ ...filters, engineer: val })}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" dir="rtl">
                    <SelectValue placeholder="المهندس" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">كل المهندسين</SelectItem>
                    {filterOptions.engineers.map((eng) => (
                      <SelectItem key={eng.id} value={eng.id.toString()}>{eng.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.location || 'all'} onValueChange={(val) => setFilters({ ...filters, location: val })}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" dir="rtl">
                    <SelectValue placeholder="الموقع" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-72 overflow-y-auto">
                    <SelectItem value="all">كل المواقع</SelectItem>
                    {filterOptions.locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        <div className="flex flex-col py-0.5">
                          <span className="text-[9px] text-slate-400 font-black uppercase leading-none">{loc.type}</span>
                          <span className="text-xs font-medium">{loc.displayLabel || loc.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date range */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-8">
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
                    مسح كل الفلاتر
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
                <ClipboardList className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-sm">لا توجد تقارير مطابقة</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">جرب تغيير فلاتر البحث</p>
              </div>
            ) : loading && reports.length === 0 ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse" dir="rtl" style={{ minWidth: '760px' }}>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
                      <th className="px-4 py-2.5">التقرير والعملية</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">الموقع</th>
                      <th className="px-4 py-2.5 hidden sm:table-cell">المهندس</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">التاريخ</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">الإنتاجية</th>
                      <th className="px-4 py-2.5 hidden xl:table-cell">المرفقات</th>
                      <th className="px-4 py-2.5">الحالة</th>
                      <th className="px-4 py-2.5 text-center w-16">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reports.map((report) => {
                      const isExpanded = !!expandedRows[report.id]
                      const totalWorkers = (report.company_workers || 0) + (report.contractor_workers || 0)

                      return (
                        <React.Fragment key={report.id}>
                          <tr
                            className={cn(
                              'hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer',
                              isExpanded && 'bg-slate-50/40 dark:bg-slate-800/20'
                            )}
                            onClick={() => handleReportClick(report.id)}
                          >
                            {/* Report + Operation */}
                            <td className="px-4 py-3">
                              <div className="flex items-start gap-2">
                                <button
                                  className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-500 shrink-0 transition-colors"
                                  onClick={(e) => toggleRow(report.id, e)}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug truncate max-w-[220px]">
                                    {report.operation_summary || report.operation_name || 'تقرير تشغيلي'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    {dayjs(report.report_date || report.created_at).fromNow()}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Location */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[150px]" title={report.location_path || report.enclosure_name}>
                                  {report.location_path || report.enclosure_name || '—'}
                                </span>
                              </div>
                            </td>

                            {/* Engineer */}
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Avatar className="w-6 h-6 border border-slate-200 dark:border-slate-700 shrink-0">
                                  <AvatarFallback className="text-[8px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                                    {report.engineer_name ? report.engineer_name.substring(0, 2) : 'مه'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                  {report.engineer_name || '—'}
                                </span>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                {report.report_date
                                  ? dayjs(report.report_date).format('DD MMM YYYY')
                                  : '—'}
                              </div>
                            </td>

                            {/* Productivity */}
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {report.actual_productivity != null ? (
                                <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-md px-1.5 py-0.5">
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                                    {report.actual_productivity}
                                  </span>
                                  <span className="text-[9px] text-emerald-600/60 dark:text-emerald-500/60 font-medium">
                                    {report.unit_name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>

                            {/* Attachments */}
                            <td className="px-4 py-3 hidden xl:table-cell">
                              {(() => {
                                const attCount = report.attachments?.length ?? report.attachments_count ?? 0
                                return attCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-md px-1.5 py-0.5">
                                    <Paperclip className="w-2.5 h-2.5" />
                                    {attCount}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                                )
                              })()}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <ReportStatusBadge status={report.status} size="sm" />
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
                                  {canEdit(report) && (
                                    <DropdownMenuItem
                                      className="text-xs font-bold gap-2 cursor-pointer"
                                      onClick={() => navigate(`/reports/tasks/${report.id}/edit`)}
                                    >
                                      <Edit className="w-3.5 h-3.5 text-amber-500" />
                                      تعديل التقرير
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-xs font-bold gap-2 cursor-pointer"
                                    onClick={() => navigate(`/reports/tasks/${report.id}`)}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    فتح الصفحة الكاملة
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>

                          {/* Expanded Row Panel */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30 dark:bg-slate-900/20">
                              <td colSpan={8} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                  {/* Operation Logs */}
                                  <div className="lg:col-span-2 space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                                      سجلات العمليات التفصيلية
                                    </h4>
                                    <div className="space-y-2">
                                      {report.operation_logs && report.operation_logs.length > 0 ? (
                                        report.operation_logs.map((log, idx) => (
                                          <div key={log.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50/70 dark:bg-slate-800/40 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">{log.operation_name}</span>
                                              <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                {log.location_path || log.location_name || '—'}
                                              </span>
                                            </div>
                                            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                              <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">الإنتاجية</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.actual_productivity} {log.unit_name}</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">العمالة</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{(log.company_workers || 0) + (log.contractor_workers || 0)} عامل</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">ساعات العمل</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.work_hours || 0}س</p>
                                              </div>
                                              <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">الصنف</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{log.variety_name || '—'}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center text-xs text-slate-400 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                          لا توجد سجلات عمليات تفصيلية.
                                        </div>
                                      )}
                                    </div>
                                    {report.notes && (
                                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                        "{report.notes}"
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions & Attachments */}
                                  <div className="space-y-3">
                                    {report.available_actions && report.available_actions.length > 0 && (
                                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">الإجراءات المتاحة</p>
                                        <ReportActionBar
                                          availableActions={report.available_actions}
                                          onAction={(action, reason) => handleQuickAction(report.id, action, reason)}
                                          disabled={actionLoading}
                                        />
                                      </div>
                                    )}
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

      <DailyTaskDetailDialog
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
