import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  Plus,
  User,
  MapPin,
  Users,
  Settings,
  History,
  Search,
  FilterX
} from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'

import { reportsApi } from '../../../services/reportsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

dayjs.extend(relativeTime)
dayjs.extend(isToday)
dayjs.locale('ar')

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  submitted: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  approved: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
}

const statusLabels = {
  draft: 'مسودة',
  submitted: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
}

export default function DailyTaskList() {
  const [reports, setReports] = useState([])
  const [filterOptions, setFilterOptions] = useState({
    operations: [],
    engineers: [],
    locations: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
  const listTopRef = useRef(null)

  // Reset page when filters change (except when fetching)
  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    fetchReports()
  }, [filters, page])

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [operationsRes, usersRes, hierarchyRes] = await Promise.all([
          reportsApi.getOperations(),
          reportsApi.getUsers(),
          reportsApi.getFarmHierarchy(),
        ])
        const flattenNodes = (nodes = []) =>
          nodes.flatMap((node) => [node, ...flattenNodes(node.children || [])])
        setFilterOptions({
          operations: operationsRes.data.results || operationsRes.data || [],
          engineers: usersRes.data.results || usersRes.data || [],
          locations: flattenNodes(hierarchyRes.data.location_nodes || []),
        })
      } catch {
        console.error('Failed to load filter options')
      }
    }
    loadFilters()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      params.page = page

      const res = await reportsApi.getTasks(params)

      if (res.data.results) {
        setReports(res.data.results)
        setTotalPages(Math.ceil(res.data.count / 10))
      } else {
        setReports(res.data)
        setTotalPages(1)
      }
    } catch (err) {
      setError('فشل في جلب التقارير اليومية')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      start_date: '',
      end_date: '',
      operation: '',
      engineer: '',
      location: '',
    })
  }

  const getExactTimeDisplay = (dateString) => {
    if (!dateString) return ''
    const d = dayjs(dateString)
    if (d.isToday()) {
      return `اليوم • ${d.format('hh:mm A')}`
    }
    return d.format('DD/MM/YYYY • hh:mm A')
  }

  const getRelativeTimeDisplay = (report) => {
    if (!report.updated_at) {
      return `منذ ${dayjs(report.created_at || report.report_date).fromNow(true)}`
    }
    const created = dayjs(report.created_at)
    const updated = dayjs(report.updated_at)
    if (updated.diff(created, 'minute') < 1) {
      return `منذ ${created.fromNow(true)}`
    }
    return `مُحدث منذ ${updated.fromNow(true)}`
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-700" />
            السجل التشغيلي
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة ومتابعة التقارير التشغيلية اليومية للمزرعة
          </p>
        </div>
        <Link to="new">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-11 px-6 shadow-sm">
            <Plus className="w-5 h-5 ml-2" />
            تقرير جديد
          </Button>
        </Link>
      </div>

      {/* Filters Section (Glassmorphism & Shadcn) */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-xl p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          
          <div className="xl:col-span-2">
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">بحث حر</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ابحث برقم التقرير، المهندس، العملية..."
                className="pl-3 pr-9 h-10 border-slate-200 focus-visible:ring-emerald-600"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">تاريخ البدء</label>
            <Input
              type="date"
              className="h-10 border-slate-200 focus-visible:ring-emerald-600"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">تاريخ الانتهاء</label>
            <Input
              type="date"
              className="h-10 border-slate-200 focus-visible:ring-emerald-600"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">العملية</label>
            <Select value={filters.operation || 'all'} onValueChange={(val) => setFilters({ ...filters, operation: val })}>
              <SelectTrigger className="h-10 border-slate-200 focus:ring-emerald-600" dir="rtl">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">الكل</SelectItem>
                {filterOptions.operations.map((op) => (
                  <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <FilterX className="w-4 h-4 ml-2" />
              مسح
            </Button>
          </div>
        </div>
      </div>

      <div ref={listTopRef} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
          {error}
        </div>
      )}

      {/* List Section */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {reports.length === 0 && !loading ? (
          <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-slate-600 font-semibold">لا توجد تقارير مطابقة</h3>
            <p className="text-slate-400 text-sm mt-1">جرب تغيير فلاتر البحث أو إضافة تقرير جديد</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/tasks/${report.id}`}
                className="group block bg-white border border-slate-200 hover:border-emerald-300 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                  
                  {/* Metadata Column */}
                  <div className="flex-shrink-0 md:w-52 flex flex-col gap-2.5">
                    <div>
                      <Badge variant="secondary" className={`font-semibold px-2.5 py-0.5 text-xs ${statusColors[report.status]}`}>
                        {statusLabels[report.status] || report.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {getExactTimeDisplay(report.updated_at || report.created_at)}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                        {getRelativeTimeDisplay(report)}
                      </div>
                    </div>
                  </div>

                  {/* Core Info Column */}
                  <div className="flex-grow flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <Settings className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                          {report.operation_summary || report.operation_name || `تقرير #${report.id}`}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 mt-1.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {report.location_path || report.enclosure_name || 'موقع غير محدد'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Column */}
                  <div className="flex-shrink-0 md:w-48 flex flex-col gap-2.5 md:border-r md:border-slate-100 md:pr-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <User className="w-4 h-4 text-slate-400" />
                      {report.engineer_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Users className="w-4 h-4 text-slate-400" />
                      إجمالي العمالة: {(report.company_workers || 0) + (report.contractor_workers || 0)}
                    </div>
                    {report.operation_logs?.length > 1 && (
                      <div className="inline-flex">
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {report.operation_logs.length} أحداث تشغيلية
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => page > 1 && setPage(p => p - 1)}
                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink 
                      onClick={() => setPage(i + 1)}
                      isActive={page === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => page < totalPages && setPage(p => p + 1)}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
