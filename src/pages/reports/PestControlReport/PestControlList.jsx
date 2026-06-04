import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  ShieldAlert,
  Loader2,
  Search,
  FilterX,
  RefreshCcw,
  Calendar,
  MapPin,
  Paperclip,
  Eye,
  Trash2,
  AlertCircle,
  MoreHorizontal,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'

import { reportsApi } from '../../../services/reportsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import PestControlDetailDrawer from './components/PestControlDetailDrawer'
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

export default function PestControlList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Open drawer if ?id= is in URL
  useEffect(() => {
    const reportId = searchParams.get('id')
    if (reportId) { setSelectedReportId(Number(reportId)); setIsDrawerOpen(true) }
  }, [searchParams])

  const [stats, setStats] = useState({ totalReports: 0, totalQuantity: 0, totalLocations: 0, todayCount: 0, weekCount: 0 })
  const [filterOptions, setFilterOptions] = useState({ engineers: [] })

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
    engineer: '',
  })

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      params.page = page

      const res = await reportsApi.getPestControls(params)

      if (res.data.results) {
        const list = res.data.results
        setReports(list)
        setTotalCount(res.data.count || 0)
        setTotalPages(Math.ceil(res.data.count / 10))

        const sumQty = list.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0)
        const sumLocs = list.reduce((s, r) => s + (r.allocations?.length || 0), 0)
        const todayCount = list.filter((r) => dayjs(r.date).isToday()).length
        const weekCount = list.filter((r) => dayjs(r.date).isAfter(dayjs().startOf('week'))).length
        setStats({
          totalReports: res.data.count || list.length,
          totalQuantity: sumQty.toFixed(1),
          totalLocations: sumLocs,
          todayCount,
          weekCount,
        })
      } else {
        const list = res.data || []
        setReports(list)
        setTotalCount(list.length)
        setTotalPages(1)
        const sumQty = list.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0)
        setStats({
          totalReports: list.length,
          totalQuantity: sumQty.toFixed(1),
          totalLocations: list.reduce((s, r) => s + (r.allocations?.length || 0), 0),
          todayCount: list.filter((r) => dayjs(r.date).isToday()).length,
          weekCount: list.filter((r) => dayjs(r.date).isAfter(dayjs().startOf('week'))).length,
        })
      }
    } catch (err) {
      console.error('Error fetching pest control reports:', err)
      setError('فشل في جلب تقارير المكافحة.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('هل أنت متأكد من حذف هذا التقرير نهائياً؟')) return
    try {
      setDeleteLoading(true)
      await reportsApi.deletePestControl(id)
      await fetchReports()
    } catch (err) {
      setError('فشل في حذف تقرير المكافحة.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleReportClick = (id) => { setSelectedReportId(id); setIsDrawerOpen(true) }

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const engRes = await reportsApi.getEngineers()
        const engineers = engRes.data.results || engRes.data || []
        setFilterOptions({ engineers })
      } catch (err) { console.error('Failure initializing filters:', err) }
    }
    loadFilters()
  }, [])

  useEffect(() => { fetchReports() }, [filters, page])
  useEffect(() => { setPage(1) }, [filters])

  const handleClearFilters = () => {
    setFilters({ search: '', start_date: '', end_date: '', engineer: '' })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== 'all')

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-4 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-500 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
              سجل تقارير وقاية النبات والمكافحة
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              متابعة رش المبيدات ومكافحة الآفات وتوزيع عمالة المكافحة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            className="h-9 w-9 p-0 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600 rounded-lg"
            title="تحديث"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="new" className="flex-1 sm:flex-none">
            <Button
              size="sm"
              className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-lg shadow-sm shadow-amber-600/20 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              عملية مكافحة جديدة
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
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">ملخص تنفيذي</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
          <KpiCell label="إجمالي عمليات الرش" value={stats.totalReports} colorClass="text-slate-800 dark:text-slate-100" />
          <KpiCell label="إجمالي المبيدات" value={stats.totalQuantity} unit="لتر / كجم" colorClass="text-amber-700 dark:text-amber-400" />
          <KpiCell label="المواقع المعالجة" value={stats.totalLocations} colorClass="text-emerald-700 dark:text-emerald-400" />
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
                placeholder="بحث بنوع المبيد أو ملاحظات..."
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
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <FilterX className="w-3.5 h-3.5" />
                فلاتر
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </Button>
              <Button
                size="sm"
                onClick={fetchReports}
                className="h-8 px-4 bg-amber-600 hover:bg-amber-700 font-bold rounded-lg text-xs gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                بحث
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 h-8 sm:col-span-2 md:col-span-1">
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
                <ShieldAlert className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-slate-600 dark:text-slate-400 font-bold text-sm">لا توجد تقارير مكافحة مطابقة</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">جرب تغيير فلاتر البحث</p>
              </div>
            ) : loading && reports.length === 0 ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-right border-collapse" dir="rtl" style={{ minWidth: '640px' }}>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider bg-slate-50/80 dark:bg-slate-900/80 sticky top-0 z-10">
                      <th className="px-4 py-2.5">التاريخ والعملية</th>
                      <th className="px-4 py-2.5 hidden sm:table-cell">المبيد المستخدم</th>
                      <th className="px-4 py-2.5 hidden md:table-cell">الكمية</th>
                      <th className="px-4 py-2.5 hidden sm:table-cell">المهندس</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">العمالة</th>
                      <th className="px-4 py-2.5 hidden lg:table-cell">المواقع</th>
                      <th className="px-4 py-2.5 hidden xl:table-cell">المرفقات</th>
                      <th className="px-4 py-2.5 text-center w-16">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {reports.map((report) => {
                      const reportCompanyWorkers = report.allocations?.reduce((sum, a) => sum + (parseInt(a.allocated_workers_company) || 0), 0) || 0
                      const reportContractorWorkers = report.allocations?.reduce((sum, a) => sum + (parseInt(a.contractor_workers) || 0), 0) || 0
                      const totalWorkers = reportCompanyWorkers + reportContractorWorkers

                      const pesticideNames = report.applied_pesticides && report.applied_pesticides.length > 0
                        ? report.applied_pesticides.map((ap) => ap.pesticide_item_name || ap.custom_pesticide_name || 'غير محدد')
                        : [report.pesticide_item_name || report.custom_pesticide_name || 'غير محدد']

                      return (
                        <tr
                          key={report.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                          onClick={() => handleReportClick(report.id)}
                        >
                          {/* Date */}
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                {report.date ? dayjs(report.date).format('DD MMM YYYY') : '—'}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {dayjs(report.date || report.created_at).fromNow()}
                              </div>
                            </div>
                          </td>

                          {/* Pesticide */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="space-y-0.5">
                              {pesticideNames.slice(0, 2).map((name, i) => (
                                <div key={i} className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                  {name}
                                </div>
                              ))}
                              {pesticideNames.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{pesticideNames.length - 2} أخرى</span>
                              )}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            {report.applied_pesticides && report.applied_pesticides.length > 0 ? (
                              <div className="space-y-0.5">
                                {report.applied_pesticides.slice(0, 2).map((ap, i) => (
                                  <div key={i} className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                    {ap.quantity} <span className="text-[10px] font-normal text-slate-400">لتر/كجم</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                {report.quantity || 0} <span className="text-[10px] font-normal text-slate-400">لتر/كجم</span>
                              </span>
                            )}
                          </td>

                          {/* Engineer */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="w-6 h-6 border border-slate-200 dark:border-slate-700 shrink-0">
                                <AvatarFallback className="text-[8px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                  {report.engineer_name ? report.engineer_name.substring(0, 2) : 'مه'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                {report.engineer_name || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Workers */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{totalWorkers}</span>
                            </div>
                          </td>

                          {/* Locations */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{report.allocations?.length || 0} مواقع</span>
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  عرض {reports.length} من {totalCount} تقرير
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => page > 1 && setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="h-7 px-2.5 text-xs rounded-lg font-bold"
                  >
                    السابق
                  </Button>
                  <span className="flex items-center px-2 text-xs text-slate-500 font-medium">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => page < totalPages && setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    className="h-7 px-2.5 text-xs rounded-lg font-bold"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PestControlDetailDrawer
        reportId={selectedReportId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDeleteSuccess={fetchReports}
      />
    </div>
  )
}
