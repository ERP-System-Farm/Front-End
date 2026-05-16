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
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, Paper, Typography } from '@mui/material'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import EmptyState from '../../components/EmptyState'
import HarvestWorkflow from '../../features/production/components/HarvestWorkflow'
import { finalizeHarvestReport, getHarvestReports, submitHarvestReport } from '../../features/production/services'

const HarvestManagement = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const r = await getHarvestReports()
      setReports(r.results || r)
    } catch (err) {
      setError(t('production.error_fetch', 'خطأ في تحميل البيانات التشغيلية'))
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
    if (activeTab === 'all') return reports
    if (activeTab === 'pending') return reports.filter(r => r.status === 'SUBMITTED' || r.status === 'DRAFT')
    if (activeTab === 'completed') return reports.filter(r => r.status === 'FINALIZED' || r.status === 'APPROVED')
    return reports
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
                  {reports.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0).toLocaleString()} <span className="text-base text-slate-400 font-bold">كجم</span>
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

      {/* Main Content Area */}
      <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-200/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold">جميع التقارير</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg px-6 font-bold text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-800">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg px-6 font-bold text-emerald-700 data-[state=active]:bg-white data-[state=active]:text-emerald-800">المنجزة</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <CardContent className="p-6 bg-slate-50/30">
          {filteredReports.length === 0 ? (
            <div className="py-12">
               <EmptyState message="لا توجد تقارير حصاد مسجلة في هذا التصنيف حالياً" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div 
                  key={report.id} 
                  onClick={() => setSelectedReport(report)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all cursor-pointer flex flex-col group"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="font-black text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">{report.location_name}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1">{report.season_name}</p>
                     </div>
                     {getStatusBadge(report.status)}
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-6">
                     <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-slate-500 font-bold text-sm">الصنف</span>
                        <span className="font-bold text-slate-800">{report.variety_name}</span>
                     </div>
                     <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <span className="text-slate-500 font-bold text-sm">الكمية</span>
                        <span className="font-black text-lg text-emerald-600">{parseFloat(report.quantity).toLocaleString()} <span className="text-sm text-emerald-600/70">{report.unit_name}</span></span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold text-sm">تاريخ الحصاد</span>
                        <span className="font-bold text-slate-700">{dayjs(report.harvest_date).locale('ar').format('DD MMMM YYYY')}</span>
                     </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                     <span className="text-slate-400 font-bold flex items-center gap-1">
                        <VisibilityIcon fontSize="small" /> عرض التفاصيل
                     </span>
                     {report.status === 'SUBMITTED' && (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                           <WarningIcon fontSize="small" /> يتطلب اعتماد
                        </span>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail & Workflow Dialog */}
      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#0f172a', bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', p: 3 }}>
          تقرير حصاد: {selectedReport?.location_name} - {selectedReport?.harvest_date}
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <HarvestWorkflow
            status={selectedReport?.status}
            onAction={(action) => handleWorkflowAction(selectedReport.id, action)}
            loading={loading}
          />

          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                تفاصيل الكميات والصنف
              </Typography>
              <Box sx={{ p: 3, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span className="text-slate-500 font-bold">الصنف المقطوف:</span>
                  <span className="font-black text-slate-800">{selectedReport?.variety_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">الكمية المسجلة:</span>
                  <span className="font-black text-xl text-emerald-700">
                    {selectedReport?.quantity} <span className="text-sm">{selectedReport?.unit_name}</span>
                  </span>
                </div>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                العمالة التشغيلية
              </Typography>
              <Box sx={{ p: 3, borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                  <span className="text-slate-500 font-bold">عدد العمال:</span>
                  <span className="font-black text-slate-800">{selectedReport?.labor_count} عامل</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">إجمالي ساعات العمل:</span>
                  <span className="font-black text-slate-800">{selectedReport?.labor_hours} ساعة</span>
                </div>
              </Box>
            </Grid>
          </Grid>
          <div className="mt-8 flex justify-end">
             <Button onClick={() => setSelectedReport(null)} variant="outline" className="font-bold px-8 rounded-xl">إغلاق التقرير</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HarvestManagement
