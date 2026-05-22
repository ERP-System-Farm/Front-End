import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Scale,
  Paperclip
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
import { useAuth } from '../../../app/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import AttachmentGallery from '../shared/AttachmentGallery'
import ReportActionBar from '../shared/ReportActionBar'
import { cn } from '../../../lib/utils'

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
  const [expandedRows, setExpandedRows] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const toggleRow = (id, e) => {
    e.stopPropagation()
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleQuickAction = async (reportId, actionName, reason = '') => {
    setActionLoading(true)
    try {
      if (actionName === 'submit') await reportsApi.submitTask(reportId)
      if (actionName === 'review') await reportsApi.reviewTask(reportId)
      if (actionName === 'approve') await reportsApi.approveTask(reportId)
      if (actionName === 'reject') await reportsApi.rejectTask(reportId, reason)

      // Refresh list
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
    const isApproved = report.status === 'approved'
    const canEditOrDelete = ['draft', 'submitted', 'rejected'].includes(report.status)
    const userRole = user?.role || 'ENGINEER'
    const isManager = ['MANAGER', 'SUPER_ADMIN', 'OWNER'].includes(userRole)
    return !isApproved && (canEditOrDelete && (report.engineer === user?.id || isManager))
  }

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
     } catch (e) { /* ignore stats fetch error */ }
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

        <CardContent className="p-0 bg-white dark:bg-slate-900">
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
             {reports.length === 0 ? (
               <div className="py-16 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl m-6">
                 <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                 <h3 className="text-slate-600 dark:text-slate-400 font-bold text-lg">لا توجد تقارير مطابقة</h3>
                 <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1">جرب تغيير فلاتر البحث أو إضافة تقرير جديد</p>
               </div>
             ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-right border-collapse" dir="rtl">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-400 text-xs font-black bg-slate-50 dark:bg-slate-950/60">
                        <th className="p-4 w-12 text-center"></th>
                        <th className="p-4 w-20">المعرف</th>
                        <th className="p-4">التقرير والعملية</th>
                        <th className="p-4">الموقع</th>
                        <th className="p-4">المهندس المسؤول</th>
                        <th className="p-4">العمالة</th>
                        <th className="p-4">الإنتاجية</th>
                        <th className="p-4">المرفقات</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 text-center w-24">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60">
                      {reports.map((report) => {
                        const isExpanded = !!expandedRows[report.id];
                        const totalWorkers = (report.company_workers || 0) + (report.contractor_workers || 0);

                        return (
                          <React.Fragment key={report.id}>
                            <tr
                              className={cn(
                                "hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-850/40",
                                isExpanded && "bg-slate-50/40 dark:bg-slate-950/20"
                              )}
                              onClick={() => handleReportClick(report.id)}
                            >
                              {/* Chevron Expand/Collapse Button */}
                              <td className="p-4 text-center" onClick={(e) => toggleRow(report.id, e)}>
                                <button className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>

                              {/* Report ID */}
                              <td className="p-4 font-mono text-xs font-bold text-slate-450 dark:text-slate-500">
                                #{report.id}
                              </td>

                              {/* Title / Operation */}
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                    {report.operation_summary || report.operation_name || `تقرير #${report.id}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold mt-1">
                                    {report.report_date}
                                  </span>
                                </div>
                              </td>

                              {/* Location Node Path */}
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-650 dark:text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]" title={report.location_path || report.enclosure_name}>
                                    {report.location_path || report.enclosure_name || 'غير محدد'}
                                  </span>
                                </div>
                              </td>

                              {/* Responsible Engineer */}
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6.5 h-6.5 border border-slate-200 dark:border-slate-800">
                                    <AvatarFallback className="text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {report.engineer_name ? report.engineer_name.substring(0, 2) : 'مه'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {report.engineer_name}
                                  </span>
                                </div>
                              </td>

                              {/* Workers count */}
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                    {totalWorkers} عمال
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400 leading-tight">
                                    (شركة: {report.company_workers || 0} | مقاول: {report.contractor_workers || 0})
                                  </span>
                                </div>
                              </td>

                              {/* Productivity */}
                              <td className="p-4">
                                {report.actual_productivity != null ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                                      {report.actual_productivity}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400">{report.unit_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                                )}
                              </td>

                              {/* Attachments indicator */}
                               <td className="p-4">
                                 {(() => {
                                   const attCount = report.attachments?.length ?? report.attachments_count ?? 0;
                                   return attCount > 0 ? (
                                     <Badge variant="outline" className="gap-1 border-purple-250 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-400 text-[10px] font-extrabold py-0.5 px-2 select-none">
                                       <Paperclip className="w-3 h-3" />
                                       {attCount}
                                     </Badge>
                                   ) : (
                                     <span className="text-xs font-bold text-slate-400">-</span>
                                   );
                                 })()
                                 }
                               </td>

                              {/* Status badge */}
                              <td className="p-4">
                                <Badge variant="secondary" className={cn("text-[10px] font-black py-0.5 px-2.5 rounded-lg border-0 shadow-none", statusColors[report.status] || 'bg-slate-100 text-slate-700')}>
                                  {statusLabels[report.status] || report.status}
                                </Badge>
                              </td>

                              {/* Quick Actions */}
                              <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    onClick={() => handleReportClick(report.id)}
                                    title="عرض التفاصيل"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {canEdit(report) && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                                      onClick={() => navigate(`/reports/tasks/${report.id}/edit`)}
                                      title="تعديل"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Row Expansion Panel */}
                            {isExpanded && (
                              <tr className="bg-slate-50/20 dark:bg-slate-950/40">
                                <td colSpan={10} className="p-6 border-b border-slate-200 dark:border-slate-850">
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
                                    {/* Operations logs and general notes */}
                                    <div className="lg:col-span-2 space-y-4">
                                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-emerald-600" />
                                        سجلات العمليات التشغيلية التفصيلية
                                      </h4>

                                      <div className="space-y-3">
                                        {report.operation_logs && report.operation_logs.length > 0 ? (
                                          report.operation_logs.map((log, idx) => (
                                            <div key={log.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                              <div className="bg-slate-50/70 dark:bg-slate-800/40 px-4 py-2 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{log.operation_name}</span>
                                                <span className="text-[10px] font-black text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                  {log.location_path || log.location_name || '-'}
                                                </span>
                                              </div>
                                              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">الإنتاجية</p>
                                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {log.actual_productivity} {log.unit_name}
                                                    {log.overtime_productivity > 0 && (
                                                      <span className="text-[10px] text-blue-500 font-bold ml-1"> (+{log.overtime_productivity} إضافي)</span>
                                                    )}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">العمالة</p>
                                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {(log.company_workers || 0) + (log.contractor_workers || 0)} عامل
                                                    <span className="text-[9px] text-slate-400 block font-normal">(شركة: {log.company_workers || 0} | مقاول: {log.contractor_workers || 0})</span>
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">ساعات العمل</p>
                                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {log.work_hours || 0} ساعة
                                                    {log.overtime_hours > 0 && (
                                                      <span className="text-blue-500 text-[10px] ml-1"> (+{log.overtime_hours} إضافي)</span>
                                                    )}
                                                  </p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">الصنف / المقاول</p>
                                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={log.variety_name}>
                                                    {log.variety_name || '-'}
                                                    <span className="text-[10px] text-slate-450 block font-normal">{log.contractor_name || 'بدون مقاول'}</span>
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 font-bold">
                                             لا توجد سجلات عمليات تفصيلية مسجلة.
                                          </div>
                                        )}
                                      </div>

                                      {report.notes && (
                                        <div className="space-y-1.5">
                                          <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">ملاحظات التقرير</h5>
                                          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm italic">
                                            "{report.notes}"
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Bar & Attachment Gallery */}
                                    <div className="space-y-4 border-r border-slate-250 dark:border-slate-850 pr-6">
                                      <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider">الاعتمادات والإجراءات</h5>
                                        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col gap-3">
                                           <div className="flex items-center justify-between text-xs font-bold">
                                              <span className="text-slate-400">حالة التقرير:</span>
                                              <Badge variant="secondary" className={cn("text-[10px] font-black py-0.5 px-2.5 rounded-lg border-0 shadow-none", statusColors[report.status] || 'bg-slate-100 text-slate-700')}>
                                                {statusLabels[report.status] || report.status}
                                              </Badge>
                                           </div>
                                           <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-center w-full">
                                              {report.available_actions && report.available_actions.length > 0 ? (
                                                 <ReportActionBar
                                                   availableActions={report.available_actions}
                                                   onAction={(action, reason) => handleQuickAction(report.id, action, reason)}
                                                   disabled={actionLoading}
                                                 />
                                              ) : (
                                                 <span className="text-[10px] font-bold text-slate-400">لا توجد إجراءات معلقة</span>
                                              )}
                                           </div>
                                        </div>
                                      </div>

                                      {report.attachments && report.attachments.length > 0 && (
                                        <div className="space-y-2">
                                           <h5 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                              <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                                              مرفقات التقرير ({report.attachments.length})
                                           </h5>
                                           <AttachmentGallery attachments={report.attachments} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
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
