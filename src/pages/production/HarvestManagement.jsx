import React, { useEffect, useState } from 'react'

import { 
  Add as AddIcon, 
  Agriculture as AgricultureIcon, 
  CheckCircle as CheckCircleIcon, 
  Schedule as ScheduleIcon, 
  Visibility as VisibilityIcon, 
  Warning as WarningIcon 
} from '@mui/icons-material'
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { 
  ArrowUpDown,
  Briefcase,
  Calendar, 
  CheckCircle2, 
  Clock, 
  Edit,
  FileText,
  Filter, 
  FilterX,
  Leaf, 
  MapPin, 
  Scale, 
  Search, 
  TrendingUp,
  UploadCloud,
  UserCheck, 
  Users} from 'lucide-react'

import { useAuth } from '../../app/AuthContext'
import EmptyState from '../../components/EmptyState'
import { finalizeHarvestReport, getEngineers,getHarvestReports, getSeasons, submitHarvestReport } from '../../features/production/services'
import { reportsApi } from '../../services/reportsApi'
import AttachmentGallery from '../reports/shared/AttachmentGallery'

import 'dayjs/locale/ar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const HarvestManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isManagerPlus = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role)

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  
  // Filter Options
  const [filterOptions, setFilterOptions] = useState({
    seasons: [],
    engineers: [],
    locations: []
  })

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    supervisor: 'all',
    location: 'all',
    season: 'all',
    start_date: '',
    end_date: '',
    ordering: '-harvest_date'
  })

  const loadFilterOptions = async () => {
    try {
      const [seasonsData, engineersData, locationData] = await Promise.allSettled([
        getSeasons(),
        getEngineers(),
        reportsApi.getFarmHierarchy()
      ])
      
      // Flatten hierarchy for Select
      const flattenedLocations = []
      if (locationData.status === 'fulfilled') {
        const processNode = (node, level = 0) => {
          flattenedLocations.push({
            id: node.id,
            name: node.name,
            type: node.type,
            displayLabel: '  '.repeat(level) + (node.type === 'SECTOR' ? '📂 ' : node.type === 'STAGE' ? '🌿 ' : '📍 ') + node.name
          })
          if (node.children) node.children.forEach(child => processNode(child, level + 1))
        }
        
        const nodes = locationData.value.results || locationData.value
        if (Array.isArray(nodes)) nodes.forEach(node => processNode(node))
      }

      setFilterOptions({
        seasons: seasonsData.status === 'fulfilled' ? seasonsData.value : [],
        engineers: engineersData.status === 'fulfilled' ? (engineersData.value.results || engineersData.value) : [],
        locations: flattenedLocations
      })
    } catch (err) {
      console.error('Error loading filter options:', err)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all')
      )
      
      // Map frontend filter names to backend expectation if needed
      // Currently backend HarvestFilter expects supervisor, location, start_date, end_date, ordering
      
      const response = await getHarvestReports(params)
      setReports(response.results || response || [])
    } catch (_err) {
      setError('فشل في جلب تقارير الحصاد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFilterOptions()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.supervisor, filters.location, filters.season, filters.ordering, filters.start_date, filters.end_date])

  const handleClearFilters = () => {
    setFilters({
      search: '',
      supervisor: 'all',
      location: 'all',
      season: 'all',
      start_date: '',
      end_date: '',
      ordering: '-harvest_date'
    })
    // fetchReports will be called by the next useEffect if we put fetchReports in a useEffect with [filters]
  }

  // Trigger fetch when filters change (debounced or on explicit search)
  // For consistency with DailyTaskList, let's add a search button but also auto-fetch on dropdown change

  const handleWorkflowAction = async (reportId, action) => {
    setLoading(true)
    try {
      if (action === 'submit') await submitHarvestReport(reportId)
      if (action === 'finalize') await finalizeHarvestReport(reportId)
      fetchReports()
      setSelectedReport(null)
    } catch (_err) {
      setError(t('production.error_workflow', 'فشل في تحديث حالة سير العمل'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold">مسودة</Badge>
      case 'SUBMITTED': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold">بانتظار الاعتماد</Badge>
      case 'APPROVED': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold">معتمد</Badge>
      case 'FINALIZED': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold">مكتمل</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 font-bold">غير معروف</Badge>
    }
  }

  const filteredByTab = React.useMemo(() => {
    let filtered = reports
    if (activeTab === 'pending') filtered = filtered.filter(r => r.status === 'SUBMITTED' || r.status === 'DRAFT')
    else if (activeTab === 'completed') filtered = filtered.filter(r => r.status === 'FINALIZED' || r.status === 'APPROVED')
    return filtered
  }, [reports, activeTab])

  if (loading && reports.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <CircularProgress className="text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <AgricultureIcon fontSize="large" />
            </div>
            إدارة الإنتاج والمحصول
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">
            متابعة إحصائيات المحاصيل، عمليات الحصاد الميدانية، وسير الاعتمادات
          </p>
        </div>
        <Button
          onClick={() => navigate('/production/harvest/new')}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-lg px-6 py-6 rounded-2xl shadow-xl shadow-emerald-700/20 w-full md:w-auto"
        >
          <AddIcon className="ml-2 h-5 w-5" />
          تسجيل تقرير إنتاج جديد
        </Button>
      </div>

      {error && (
        <Alert severity="error" className="rounded-2xl font-bold border-none shadow-sm bg-rose-50 text-rose-700">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-slate-100 shadow-sm rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  إجمالي الحصاد (هذا الموسم)
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {(() => {
                    const totalKg = reports.reduce((acc, curr) => {
                      let qty = parseFloat(curr.quantity) || 0;
                      if (curr.unit_name?.includes('طن') || curr.unit_name?.toLowerCase().includes('ton')) {
                        qty *= 1000;
                      }
                      return acc + qty;
                    }, 0);
                    
                    const isTon = totalKg >= 1000;
                    const displayVal = isTon ? (totalKg / 1000).toLocaleString(undefined, {maximumFractionDigits: 2}) : totalKg.toLocaleString();
                    const displayUnit = isTon ? 'طن' : 'كجم';
                    
                    return (
                      <>
                        {displayVal} <span className="text-lg text-slate-400 font-bold mx-1">{displayUnit}</span>
                      </>
                    );
                  })()}
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  تقارير بانتظار الاعتماد
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-black text-amber-600 tracking-tight">
                  {reports.filter(r => r.status === 'SUBMITTED').length} <span className="text-lg text-amber-400/60 font-bold mx-1">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-3xl bg-white dark:bg-slate-900">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  عدد العمليات المنجزة
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-black text-emerald-600 tracking-tight">
                  {reports.filter(r => r.status === 'FINALIZED' || r.status === 'APPROVED').length} <span className="text-lg text-emerald-400/60 font-bold mx-1">عملية</span>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        {/* Filters Top Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-grow min-w-[280px]">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="البحث عن حوشة، صنف، أو مهندس..."
                className="pl-3 pr-9 h-11 border-slate-200 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-transparent rounded-xl focus:ring-emerald-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              />
            </div>
            
            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={filters.supervisor || 'all'} onValueChange={(val) => setFilters({ ...filters, supervisor: val })}>
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

              <Select value={filters.ordering || '-harvest_date'} onValueChange={(val) => setFilters({ ...filters, ordering: val })}>
                <SelectTrigger className="h-11 border-slate-200 dark:border-slate-700 font-bold bg-transparent rounded-xl w-[170px]" dir="rtl">
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="-harvest_date">الأحدث أولاً</SelectItem>
                  <SelectItem value="harvest_date">الأقدم أولاً</SelectItem>
                  <SelectItem value="-quantity">الأعلى إنتاجية 📈</SelectItem>
                  <SelectItem value="quantity">الأقل إنتاجية 📉</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
            <div className="flex items-center gap-4 lg:col-span-3 bg-slate-50/80 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-black text-slate-400 mr-1 shrink-0 uppercase tracking-tighter">من</span>
                <Input
                  type="date"
                  className="h-9 border-none font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-lg shadow-sm focus:ring-0 px-3 flex-1"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>
              
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

              <div className="flex items-center gap-3 flex-1">
                <span className="text-xs font-black text-slate-400 mr-1 shrink-0 uppercase tracking-tighter">إلى</span>
                <Input
                  type="date"
                  className="h-9 border-none font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 rounded-lg shadow-sm focus:ring-0 px-3 flex-1"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:col-span-2 lg:col-span-3">
              <Select value={filters.season || 'all'} onValueChange={(val) => setFilters({ ...filters, season: val })}>
                <SelectTrigger className="h-12 border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-900 rounded-xl flex-1 shadow-sm" dir="rtl">
                  <SelectValue placeholder="الموسم" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">جميع المواسم</SelectItem>
                  {filterOptions.seasons.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-8 font-black text-xs uppercase data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">جميع التقارير</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-8 font-black text-xs uppercase text-amber-700 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-8 font-black text-xs uppercase text-emerald-700 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">المنجزة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 bg-slate-50/30 dark:bg-transparent">
          {filteredByTab.length === 0 ? (
            <div className="py-12">
               <EmptyState message="لا توجد تقارير حصاد مسجلة في هذا التصنيف حالياً" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredByTab.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                <div 
                  key={report.id} 
                  className={`bg-white dark:bg-slate-900 border ${isSelected ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-slate-200 dark:border-slate-800'} rounded-2xl overflow-hidden transition-all group`}
                >
                  <div className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setSelectedReport(isSelected ? null : report)}>
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                           <AgricultureIcon />
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                             <span className="font-black text-slate-900 dark:text-slate-100 text-lg">{report.location_name}</span>
                             <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-700">{report.season_name}</Badge>
                             {report.is_partial && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none text-[10px] font-black">حصاد جزئي</Badge>}
                           </div>
                           <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {dayjs(report.harvest_date).locale('ar').format('DD MMMM YYYY')}
                           </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex flex-col items-start px-4 border-r border-slate-100 dark:border-slate-800">
                           <span className="text-slate-400 font-bold text-[10px] mb-1">المهندس المسؤول</span>
                           <span className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full text-xs">
                              <UserCheck className="w-3.5 h-3.5" />
                              {report.supervisor_name || 'غير محدد'}
                           </span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-slate-800">
                           <span className="text-slate-400 font-bold text-[10px] mb-1">الكمية</span>
                           <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Scale className="w-4 h-4" />
                              {parseFloat(report.quantity).toLocaleString()} <span className="text-xs">{report.unit_name}</span>
                           </span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-slate-800 hidden md:flex">
                           <span className="text-slate-400 font-bold text-[10px] mb-1">الصنف</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Leaf className="w-4 h-4" />
                              {report.variety_name}
                           </span>
                        </div>
                        <div className="flex items-center gap-4">
                           {getStatusBadge(report.status)}
                           <div className={`text-slate-300 dark:text-slate-600 transition-transform duration-300 ${isSelected ? 'rotate-180 text-emerald-600' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                           </div>
                        </div>
                      </div>
                    </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-6 mt-6">
                        {/* Section 1: Basic Info & Staff */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                          <h4 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            البيانات الأساسية والمسؤولية
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">الحوشة (الموقع)</span>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{report.location_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">المحصول / الصنف</span>
                              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{report.crop_name} - {report.variety_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">الموسم الزراعي</span>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{report.season_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">المهندس المسؤول</span>
                              <span className="text-sm font-black text-blue-700 dark:text-blue-400">{report.supervisor_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">كاتب التقرير</span>
                              <span className="text-sm font-black text-slate-600 dark:text-slate-300">{report.creator_name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">تاريخ الحصاد</span>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{report.harvest_date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Production & Quantities */}
                        <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                          <h4 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-amber-500" />
                            الإنتاج والكميات
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100/50 dark:border-amber-700/30 text-center">
                               <p className="text-[10px] text-amber-600 font-black uppercase mb-1">الكمية المسجلة</p>
                               <p className="text-xl font-black text-amber-700 dark:text-amber-400">{report.quantity} {report.unit_name}</p>
                            </div>
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-700/30 text-center">
                               <p className="text-[10px] text-blue-600 font-black uppercase mb-1">ساعات العمل</p>
                               <p className="text-xl font-black text-blue-700 dark:text-blue-400">{report.labor_hours} ساعة</p>
                            </div>
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-700/30 text-center">
                               <p className="text-[10px] text-emerald-600 font-black uppercase mb-1">الوزن التقريبي</p>
                               <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                                  {(() => {
                                    let qty = parseFloat(report.quantity) || 0;
                                    if (report.unit_name?.includes('طن')) return `${qty} طن`;
                                    if (qty >= 1000) return `${(qty/1000).toFixed(2)} طن`;
                                    return `${qty} كجم`;
                                  })()}
                               </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Labor & Staff */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                          <h4 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            العمالة والطاقم
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-sm text-slate-500 font-bold">المقاول المسئول</span>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{report.contractor_name || '—'}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center shadow-sm">
                                 <span className="text-sm text-slate-500 font-bold">عمال الشركة</span>
                                 <span className="text-lg font-black text-slate-900 dark:text-slate-100">{report.company_workers || 0}</span>
                              </div>
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center shadow-sm">
                                 <span className="text-sm text-slate-500 font-bold">عمال المقاول</span>
                                 <span className="text-lg font-black text-slate-900 dark:text-slate-100">{report.contractor_workers || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Notes & Attachments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Notes */}
                           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                             <h4 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-slate-400" /> ملاحظات ميدانية
                             </h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                {report.notes ? `"${report.notes}"` : 'لا توجد ملاحظات إضافية مسجلة لهذا التقرير.'}
                             </p>
                             {report.transport_method && (
                               <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">اللوجستيات والنقل</p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{report.transport_method}</p>
                               </div>
                             )}
                           </div>

                           {/* Attachments */}
                           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                             <h4 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                                <UploadCloud className="w-4 h-4 text-slate-400" /> المرفقات والوثائق
                             </h4>
                             {report.attachments && report.attachments.length > 0 ? (
                               <AttachmentGallery attachments={report.attachments} />
                             ) : (
                               <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                  <p className="text-xs text-slate-400 font-bold italic">لا توجد مرفقات مرتبطة بهذا التقرير</p>
                               </div>
                             )}
                           </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                        {(report.status === 'DRAFT' || isManagerPlus) && (
                          <Button 
                            variant="outline" 
                            className="rounded-xl font-black gap-2 border-slate-200 dark:border-slate-700 h-12 px-6 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                            onClick={() => navigate(`/production/harvest/edit/${report.id}`)}
                          >
                            <Edit className="w-4 h-4" /> تعديل بيانات التقرير
                          </Button>
                        )}
                        {report.status === 'DRAFT' && (
                          <Button 
                            onClick={() => handleWorkflowAction(report.id, 'submit')}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl px-8 h-12 shadow-lg transition-all"
                          >
                            تقديم للمراجعة والاعتماد
                          </Button>
                        )}
                        {report.status === 'SUBMITTED' && isManagerPlus && (
                          <Button 
                            onClick={() => handleWorkflowAction(report.id, 'finalize')}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8 h-12 shadow-lg shadow-emerald-500/20 transition-all"
                          >
                            اعتماد نهائي وإغلاق
                          </Button>
                        )}
                        {report.status === 'FINALIZED' && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-tight">تم الاعتماد النهائي (مقفلة)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HarvestManagement
