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
  FilterX,
  ClipboardList,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ar'

import { reportsApi } from '../../../services/reportsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  submitted: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  approved: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  rejected: 'bg-rose-100 text-rose-800 hover:bg-rose-200',
  finalized: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
}

const statusLabels = {
  draft: 'مسودة',
  submitted: 'بانتظار الاعتماد',
  approved: 'مقبول',
  rejected: 'مرفوض',
  finalized: 'مكتمل',
}

export default function DailyTaskList() {
  const [reports, setReports] = useState([])
  const [allReportsForStats, setAllReportsForStats] = useState([]) // For KPIs
  const [filterOptions, setFilterOptions] = useState({
    operations: [],
    engineers: [],
    locations: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

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

  // Reset page when filters or tab changes
  useEffect(() => {
    setPage(1)
  }, [filters, activeTab])

  useEffect(() => {
    fetchReports()
    fetchAllForStats()
  }, [filters, activeTab, page])

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

  // Fetch only first page to get stats count easily
  const fetchAllForStats = async () => {
     try {
        const res = await reportsApi.getTasks({ page: 1 })
        if (res.data.results) {
           // If pagination is used in backend, we might not have all statuses easily without a specific stats endpoint.
           // We will just use the current page or a generic count if the API supports it.
           // For now, we'll store the local page items or a large chunk to estimate.
           setAllReportsForStats(res.data.results)
        } else {
           setAllReportsForStats(res.data)
        }
     } catch (e) {}
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all'))
      params.page = page
      
      // Inject tab filter logic
      if (activeTab === 'pending') {
         params.status = 'submitted'
      } else if (activeTab === 'completed') {
         params.status = 'approved' // or finalized
      }

      const res = await reportsApi.getTasks(params)

      if (res.data.results) {
        setReports(res.data.results)
        setTotalPages(Math.ceil(res.data.count / 10))
      } else {
        // Local filtering if no pagination from backend
        let filtered = res.data
        if (activeTab === 'pending') filtered = filtered.filter(r => r.status === 'submitted' || r.status === 'draft')
        if (activeTab === 'completed') filtered = filtered.filter(r => r.status === 'approved' || r.status === 'finalized')
        
        setReports(filtered)
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
    if (d.isToday()) return `اليوم • ${d.format('hh:mm A')}`
    return `${d.format('DD MMM')} • ${d.format('hh:mm A')}`
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <ClipboardList className="w-8 h-8" />
            </div>
            السجل التشغيلي
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">
            إدارة ومتابعة التقارير التشغيلية اليومية للمزرعة وسير الاعتمادات
          </p>
        </div>
        <Link to="new">
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-lg px-6 py-6 rounded-2xl shadow-xl shadow-emerald-700/20 w-full md:w-auto">
            <Plus className="mr-2 h-5 w-5" />
            تسجيل تقرير جديد
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-bold">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">إجمالي التقارير المرفوعة</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-slate-800">
                  {allReportsForStats.length || reports.length} <span className="text-base text-slate-400 font-bold">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">تقارير بانتظار الاعتماد</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-amber-600">
                  {allReportsForStats.filter(r => r.status === 'submitted' || r.status === 'draft').length || 0} <span className="text-base text-amber-400 font-bold">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">عدد العمليات المنجزة</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-emerald-600">
                  {allReportsForStats.filter(r => r.status === 'approved' || r.status === 'finalized').length || 0} <span className="text-base text-emerald-400 font-bold">عملية</span>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        
        {/* Filters Top Bar */}
        <div className="bg-white border-b border-slate-100 p-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
             <div className="lg:col-span-2 relative">
               <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
               <Input
                 placeholder="ابحث برقم التقرير، العملية..."
                 className="pl-3 pr-9 h-10 border-slate-200 font-bold"
                 value={filters.search}
                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
               />
             </div>
             <div>
               <Select value={filters.operation || 'all'} onValueChange={(val) => setFilters({ ...filters, operation: val })}>
                 <SelectTrigger className="h-10 border-slate-200 font-bold" dir="rtl">
                   <SelectValue placeholder="حسب العملية" />
                 </SelectTrigger>
                 <SelectContent dir="rtl">
                   <SelectItem value="all">كل العمليات</SelectItem>
                   {filterOptions.operations.map((op) => (
                     <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Input
                 type="date"
                 className="h-10 border-slate-200 font-bold text-slate-500"
                 value={filters.start_date}
                 onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
               />
             </div>
             <div>
               <Button
                 variant="outline"
                 onClick={handleClearFilters}
                 className="w-full h-10 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
               >
                 <FilterX className="w-4 h-4 ml-2" />
                 مسح الفلاتر
               </Button>
             </div>
           </div>
        </div>

        {/* Tabs Area */}
        <div className="bg-slate-50 p-4 border-b border-slate-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-200/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold">جميع التقارير</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 font-bold text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-800">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6 font-bold text-emerald-700 data-[state=active]:bg-white data-[state=active]:text-emerald-800">المنجزة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 bg-slate-50/30">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
             {reports.length === 0 ? (
               <div className="py-16 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
                 <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <h3 className="text-slate-600 font-bold text-lg">لا توجد تقارير مطابقة</h3>
                 <p className="text-slate-400 font-bold text-sm mt-1">جرب تغيير فلاتر البحث أو إضافة تقرير جديد</p>
               </div>
             ) : (
               <div className="flex flex-col divide-y divide-slate-100">
                 {reports.map((report) => (
                   <Link
                     key={report.id}
                     to={`/reports/tasks/${report.id}`}
                     className="group flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-white transition-all hover:shadow-sm"
                   >
                     {/* Left: Status + Date */}
                     <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 md:w-40">
                        <Badge variant="secondary" className={`font-bold px-2.5 py-0.5 text-xs ${statusColors[report.status] || 'bg-slate-100 text-slate-700'}`}>
                           {statusLabels[report.status] || report.status}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                           <Clock className="w-3.5 h-3.5" />
                           {getExactTimeDisplay(report.updated_at || report.created_at)}
                        </span>
                     </div>

                     {/* Center: Main Info */}
                     <div className="flex-grow">
                        <h3 className="font-black text-slate-800 text-base group-hover:text-emerald-700 transition-colors leading-tight">
                           {report.operation_summary || report.operation_name || `تقرير #${report.id}`}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                           <MapPin className="w-3.5 h-3.5" />
                           {report.location_path || report.enclosure_name || 'موقع غير محدد'}
                        </p>
                     </div>

                     {/* Right: Stats */}
                     <div className="flex-shrink-0 flex items-center gap-6 md:border-r md:border-slate-100 md:pr-6">
                        <div className="text-center">
                           <p className="text-xs font-bold text-slate-400 mb-0.5">المهندس</p>
                           <p className="text-sm font-black text-slate-700 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {report.engineer_name}
                           </p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs font-bold text-slate-400 mb-0.5">إجمالي العمالة</p>
                           <p className="text-lg font-black text-emerald-700">
                              {(report.company_workers || 0) + (report.contractor_workers || 0)}
                              <span className="text-xs text-emerald-400 font-bold ml-1">عامل</span>
                           </p>
                        </div>
                        {report.status === 'submitted' && (
                           <div className="hidden md:flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg">
                              <AlertTriangle className="w-3.5 h-3.5" /> يتطلب اعتماد
                           </div>
                        )}
                     </div>
                   </Link>
                 ))}
               </div>
             )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 border-t border-slate-100 pt-6">
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
                        className="cursor-pointer font-bold"
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
        </CardContent>
      </Card>
    </div>
  )
}
