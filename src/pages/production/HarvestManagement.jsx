import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/ar'

import { 
  Agriculture as AgricultureIcon, 
  Add as AddIcon, 
  Visibility as VisibilityIcon, 
  CheckCircle as CheckCircleIcon, 
  Schedule as ScheduleIcon, 
  Warning as WarningIcon 
} from '@mui/icons-material'
import { 
  Search, 
  CheckCircle2, 
  Filter, 
  MapPin, 
  Leaf, 
  Calendar, 
  Scale, 
  Users, 
  Clock, 
  UserCheck, 
  Briefcase,
  TrendingUp,
  FileText,
  UploadCloud,
  Edit
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Alert, Box, CircularProgress, Grid, Paper, Typography } from '@mui/material'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import EmptyState from '../../components/EmptyState'
import { finalizeHarvestReport, getHarvestReports, submitHarvestReport, getSeasons } from '../../features/production/services'
import { useAuth } from '../../app/AuthContext'

const HarvestManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const isManagerPlus = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role)

  const [reports, setReports] = useState([])
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [varietyFilter, setVarietyFilter] = useState('all')
  const [seasonFilter, setSeasonFilter] = useState('all')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [reportsData, seasonsData] = await Promise.all([
        getHarvestReports(),
        getSeasons()
      ])
      setReports(reportsData.results || reportsData || [])
      setSeasons(seasonsData || [])
    } catch (err) {
      setError('فشل في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkflowAction = async (reportId, action) => {
    setLoading(true)
    try {
      if (action === 'submit') await submitHarvestReport(reportId)
      if (action === 'finalize') await finalizeHarvestReport(reportId)
      fetchInitialData()
      setSelectedReport(null)
    } catch (err) {
      setError(t('production.error_workflow', 'فشل في تحديث حالة سير العمل'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">مسودة</Badge>
      case 'SUBMITTED': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">بانتظار الاعتماد</Badge>
      case 'APPROVED': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">معتمد</Badge>
      case 'FINALIZED': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">مكتمل</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700">غير معروف</Badge>
    }
  }

  const filteredReports = React.useMemo(() => {
    let filtered = reports
    
    // Tab Filter
    if (activeTab === 'pending') filtered = filtered.filter(r => r.status === 'SUBMITTED' || r.status === 'DRAFT')
    else if (activeTab === 'completed') filtered = filtered.filter(r => r.status === 'FINALIZED' || r.status === 'APPROVED')
    
    // Search Filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.location_name?.toLowerCase().includes(lowSearch) || 
        r.variety_name?.toLowerCase().includes(lowSearch) ||
        r.supervisor_name?.toLowerCase().includes(lowSearch)
      )
    }

    // Variety Filter
    if (varietyFilter !== 'all') {
      filtered = filtered.filter(r => r.variety_name === varietyFilter)
    }

    // Season Filter
    if (seasonFilter !== 'all') {
      filtered = filtered.filter(r => r.season_name === seasonFilter)
    }

    return filtered
  }, [reports, activeTab, searchTerm, varietyFilter, seasonFilter])

  const varieties = React.useMemo(() => {
    const v = new Set(reports.map(r => r.variety_name))
    return Array.from(v).filter(Boolean)
  }, [reports])

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
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-lg px-6 py-6 rounded-2xl shadow-xl shadow-emerald-700/20 w-full md:w-auto"
        >
          <AddIcon className="mr-2 h-5 w-5" />
          تسجيل تقرير إنتاج جديد
        </Button>
      </div>

      {error && (
        <Alert severity="error" className="rounded-xl font-bold">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">إجمالي الحصاد (هذا الموسم)</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-slate-800">
                  {(() => {
                    const totalKg = reports.reduce((acc, curr) => {
                      let qty = parseFloat(curr.quantity) || 0;
                      // Normalize to KG based on unit name (common unit names for ton: طن, Ton, tons)
                      if (curr.unit_name?.includes('طن') || curr.unit_name?.toLowerCase().includes('ton')) {
                        qty *= 1000;
                      }
                      return acc + qty;
                    }, 0);
                    
                    const isTon = totalKg >= 1000;
                    const displayVal = isTon ? (totalKg / 1000).toLocaleString() : totalKg.toLocaleString();
                    const displayUnit = isTon ? 'طن' : 'كجم';
                    
                    return (
                      <>
                        {displayVal} <span className="text-base text-slate-400 font-bold">{displayUnit}</span>
                      </>
                    );
                  })()}
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">تقارير بانتظار الاعتماد</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-amber-600">
                  {reports.filter(r => r.status === 'SUBMITTED').length} <span className="text-base text-amber-400 font-bold">تقرير</span>
               </div>
            </CardContent>
         </Card>
         <Card className="border-slate-100 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-bold text-slate-500">عدد العمليات المنجزة</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-3xl font-black text-emerald-600">
                  {reports.filter(r => r.status === 'FINALIZED' || r.status === 'APPROVED').length} <span className="text-base text-emerald-400 font-bold">عملية حصاد</span>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                placeholder="البحث عن حوشة، صنف، أو مهندس..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 rounded-xl border-slate-200 focus:ring-emerald-500 font-bold"
              />
           </div>
           <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-40">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={varietyFilter}
                  onChange={(e) => setVarietyFilter(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="all">كل الأصناف</option>
                  {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="relative w-full md:w-40">
                <ScheduleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="all">جميع المواسم</option>
                  {seasons.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              {(searchTerm || varietyFilter !== 'all' || seasonFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearchTerm('');
                    setVarietyFilter('all');
                    setSeasonFilter('all');
                  }}
                  className="h-12 px-4 rounded-xl text-slate-500 hover:text-rose-600 font-bold"
                >
                  مسح الفلاتر
                </Button>
              )}
           </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold dark:text-slate-300 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">جميع التقارير</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 font-bold text-amber-700 dark:text-amber-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-400">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6 font-bold text-emerald-700 dark:text-emerald-500 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-emerald-800 dark:data-[state=active]:text-emerald-400">المنجزة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 bg-slate-50/30 dark:bg-transparent">
          {filteredReports.length === 0 ? (
            <div className="py-12">
               <EmptyState message="لا توجد تقارير حصاد مسجلة في هذا التصنيف حالياً" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredReports.map((report) => {
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
                             <div className="space-y-2">
                                {report.attachments && report.attachments.length > 0 ? (
                                  report.attachments.map((file) => (
                                    <a 
                                      key={file.id} 
                                      href={file.file} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-colors group"
                                    >
                                      <div className="flex items-center gap-3">
                                         <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 group-hover:text-emerald-500">
                                            <FileText className="w-4 h-4" />
                                         </div>
                                         <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{file.file_name || 'ملحق حصاد'}</span>
                                      </div>
                                      <Button size="sm" variant="ghost" className="text-emerald-600 font-bold text-[10px]">عرض</Button>
                                    </a>
                                  ))
                                ) : (
                                  <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                     <p className="text-xs text-slate-400 font-bold italic">لا توجد مرفقات مرتبطة بهذا التقرير</p>
                                  </div>
                                )}
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                        {(report.status === 'DRAFT' || isManagerPlus) && report.status !== 'FINALIZED' && (
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
