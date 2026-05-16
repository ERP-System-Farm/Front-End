import React, { useEffect, useState } from 'react'
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
  AlertTriangle,
  FileDown,
  RefreshCcw
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
import DailyTaskDetailDialog from './components/DailyTaskDetailDrawer'

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
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

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
            const currentLabel = parentLabel ? `${parentLabel} > ${node.name}` : node.name;
            const flattenedNode = { ...node, displayLabel: currentLabel };
            return [flattenedNode, ...flattenNodes(node.children || [], currentLabel)];
          });

        const locations = flattenNodes(treeData)

        console.log('Filters Processed:', { operations, engineers, locations })
        setFilterOptions({ operations, engineers, locations })
      } catch (err) {
        console.error('Critical failure in filter initialization:', err)
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
      console.error('Error fetching reports:', err)
      setError('فشل في جلب التقارير اليومية. يرجى التحقق من اتصالك بالإنترنت.')
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
      link.setAttribute('download', `daily_tasks_export_${dayjs().format('YYYY-MM-DD')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Export failed:', err)
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

  const handleReportClick = (id) => {
    setSelectedTaskId(id)
    setIsDrawerOpen(true)
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-500">
              <ClipboardList className="w-8 h-8" />
            </div>
            السجل التشغيلي
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg">
            إدارة ومتابعة التقارير التشغيلية اليومية للمزرعة وسير الاعتمادات
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchReports} 
            className="rounded-2xl h-14 w-14 p-0 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 transition-all bg-white dark:bg-slate-900"
          >
            <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="rounded-2xl h-14 px-6 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900"
          >
            <FileDown className="w-5 h-5 text-emerald-600" />
            تصدير
          </Button>
          <Link to="new">
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-lg px-8 h-14 rounded-2xl shadow-xl shadow-emerald-700/20">
              <Plus className="mr-2 h-6 w-6" />
              تسجيل تقرير جديد
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-bold">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي التقارير المرفوعة</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-slate-800 dark:text-slate-100">
                  {allReportsForStats.length || reports.length} <span className="text-base text-slate-400 dark:text-slate-500 font-bold">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">تقارير بانتظار الاعتماد</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
                  {allReportsForStats.filter(r => r.status === 'submitted' || r.status === 'draft').length || 0} <span className="text-base text-amber-400 dark:text-amber-500/70 font-bold">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 dark:text-slate-400">عدد العمليات المنجزة</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                  {allReportsForStats.filter(r => r.status === 'approved' || r.status === 'finalized').length || 0} <span className="text-base text-emerald-400 dark:text-emerald-500/70 font-bold">عملية</span>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        
        {/* Filters Top Bar */}
         <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
           <div className="flex flex-wrap items-center gap-3">
             {/* Search */}
             <div className="relative flex-grow min-w-[280px]">
               <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
               <Input
                 placeholder="رقم التقرير، العملية، اسم المهندس..."
                 className="pl-3 pr-9 h-11 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-transparent rounded-xl focus:ring-emerald-500"
                 value={filters.search}
                 onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                 onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
               />
             </div>
             
             {/* Dropdowns */}
             <div className="flex flex-wrap items-center gap-3">
                <Select value={filters.operation || 'all'} onValueChange={(val) => setFilters({ ...filters, operation: val })}>
                  <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[150px]" dir="rtl">
                    <SelectValue placeholder="العملية" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">كل العمليات</SelectItem>
                    {filterOptions.operations.map((op) => (
                      <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.engineer || 'all'} onValueChange={(val) => setFilters({ ...filters, engineer: val })}>
                  <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[150px]" dir="rtl">
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
                  <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[150px]" dir="rtl">
                    <SelectValue placeholder="الموقع" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="max-h-80 overflow-y-auto">
                    <SelectItem value="all">كل المواقع</SelectItem>
                    {filterOptions.locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-1">{loc.type}</span>
                          <span className="text-xs font-bold leading-tight">{loc.displayLabel || loc.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

             {/* Actions */}
             <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="h-11 border-rose-100 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-4 font-bold"
                >
                  <FilterX className="w-4 h-4 ml-2" />
                  مسح
                </Button>
                <Button
                   onClick={fetchReports}
                   className="h-11 bg-emerald-700 hover:bg-emerald-800 font-black shadow-lg shadow-emerald-700/10 px-8 rounded-xl gap-2"
                >
                   <Search className="w-4 h-4" />
                   بحث
                </Button>
             </div>
           </div>
           
           {/* Date filter row */}
           <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
              <div className="flex items-center gap-2 lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 mr-2 shrink-0">من:</span>
                <Input
                  type="date"
                  className="h-8 border-none font-bold text-slate-600 dark:text-slate-300 bg-transparent shadow-none"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
                <span className="text-xs font-bold text-slate-500 mx-2 shrink-0">إلى:</span>
                <Input
                  type="date"
                  className="h-8 border-none font-bold text-slate-600 dark:text-slate-300 bg-transparent shadow-none"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
           </div>
        </div>

        {/* Tabs Area */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold dark:text-slate-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">جميع التقارير</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 font-bold text-amber-700 dark:text-amber-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-400">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6 font-bold text-emerald-700 dark:text-emerald-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-400">المنجزة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 bg-slate-50/30 dark:bg-transparent">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
             {reports.length === 0 ? (
               <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                 <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                 <h3 className="text-slate-600 dark:text-slate-400 font-bold text-lg">لا توجد تقارير مطابقة</h3>
                 <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1">جرب تغيير فلاتر البحث أو إضافة تقرير جديد</p>
               </div>
             ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all hover:shadow-lg cursor-pointer relative overflow-hidden"
                    >
                      {/* Status Accent Bar */}
                      <div className={`absolute top-0 right-0 w-1.5 h-full opacity-70 ${statusColors[report.status] || 'bg-slate-300'}`} />

                      <div className="flex flex-col gap-4">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`font-black px-2.5 py-0.5 text-[10px] rounded-lg ${statusColors[report.status] || 'bg-slate-100 text-slate-700'}`}>
                                 {statusLabels[report.status] || report.status}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400">#{report.id}</span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {getExactTimeDisplay(report.updated_at || report.created_at)}
                           </span>
                        </div>

                        {/* Content Area */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex-grow">
                              <h3 className="font-black text-slate-800 dark:text-slate-100 text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                 {report.operation_summary || report.operation_name || `تقرير #${report.id}`}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                 <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                 <span className="text-xs font-bold text-slate-500 truncate">{report.location_path || report.enclosure_name}</span>
                              </div>
                           </div>

                           <div className="flex items-center gap-6 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                              <div className="text-right">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">المهندس</p>
                                 <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {report.engineer_name}
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">العمالة</p>
                                 <p className="text-base font-black text-emerald-700 dark:text-emerald-400">
                                    {(report.company_workers || 0) + (report.contractor_workers || 0)}
                                    <span className="text-[10px] font-bold ml-1 text-slate-400">عامل</span>
                                 </p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
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

      <DailyTaskDetailDialog 
        taskId={selectedTaskId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
