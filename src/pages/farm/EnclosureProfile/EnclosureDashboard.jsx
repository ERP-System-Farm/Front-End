import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

import { 
  Leaf, 
  Droplet, 
  CalendarDays, 
  TreePine, 
  Weight, 
  Clock, 
  Activity,
  AlertTriangle,
  History,
  Package,
  Plus,
  MapPin,
  ChevronLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Edit2
} from 'lucide-react'

import { useEnclosureProfile, useEnclosureTimeline } from './hooks/useEnclosureProfile'
import api from '../../../services/api' // Assuming this is how we call API

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogActions } from '@mui/material'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import OperationActionBar from './components/OperationActionBar'
import OperationalAlerts from './components/OperationalAlerts'
import OperationalJournal from './components/OperationalJournal'
import EnclosureHarvestList from './components/EnclosureHarvestList'
import EditEnclosureModal from './components/EditEnclosureModal'

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <Card className="border-slate-100 shadow-sm">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <h4 className="text-lg font-bold text-slate-800">{value || '-'}</h4>
      </div>
    </CardContent>
  </Card>
)

const ProductivityTrend = ({ enclosureId }) => {
  const { events, loading } = useEnclosureTimeline(enclosureId, { type: 'all' })
  
  const chartData = React.useMemo(() => {
    if (!events || events.length === 0) return []
    const grouped = {}
    events.forEach(ev => {
      const date = dayjs(ev.date).format('MM-DD')
      grouped[date] = (grouped[date] || 0) + parseFloat(ev.actual_productivity || 0)
    })
    return Object.entries(grouped).map(([date, val]) => ({ date, value: val })).reverse().slice(0, 7)
  }, [events])

  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
         <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" /> مسار الإنتاجية (آخر 7 أيام)
         </CardTitle>
      </CardHeader>
      <CardContent className="p-6 h-64">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
             لا توجد بيانات إنتاجية كافية للرسم البياني
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#059669', fontWeight: 'bold' }}
                formatter={(val) => [val, 'الإنتاجية']}
                labelFormatter={(label) => `التاريخ: ${label}`}
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

const WarehouseConsumptions = ({ enclosureId }) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 5

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true)
        const response = await api.get(`warehouse/movements/?location=${enclosureId}`)
        setMovements(response.data)
      } catch (err) {
        console.error('Failed to fetch movements', err)
      } finally {
        setLoading(false)
      }
    }
    if (enclosureId) fetchMovements()
  }, [enclosureId])

  const filteredMovements = movements.filter(m => 
    m.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.movement_type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedMovements = filteredMovements.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)

  if (loading) return <div className="p-8 text-center"><Skeleton className="h-48 w-full rounded-2xl" /></div>

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
         <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            السحوبات المخزنية
         </h3>
         <input 
            type="text" 
            placeholder="بحث بصنف السحب..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-emerald-500 font-bold bg-white"
         />
      </div>
      
      <div className="flex-1 overflow-auto">
        <Table dir="rtl">
          <TableHeader className="bg-white sticky top-0 shadow-sm">
            <TableRow>
              <TableHead className="text-right font-bold py-3">الصنف</TableHead>
              <TableHead className="text-right font-bold py-3">النوع</TableHead>
              <TableHead className="text-right font-bold py-3">الكمية</TableHead>
              <TableHead className="text-right font-bold py-3">المهندس المسؤول</TableHead>
              <TableHead className="text-right font-bold py-3">التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                   <div className="flex flex-col items-center justify-center text-slate-400">
                      <p className="font-bold text-sm">لا توجد مسحوبات مطابقة للبحث</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map(mov => (
                <TableRow key={mov.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold py-2">{mov.item_name}</TableCell>
                  <TableCell className="py-2">
                     {mov.movement_type === 'OUT' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 gap-1"><ArrowUpRight className="w-3 h-3"/> منصرف</Badge>}
                     {mov.movement_type === 'RETURNED' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><ArrowDownLeft className="w-3 h-3"/> مرتجع</Badge>}
                     {mov.movement_type === 'DAMAGED' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 gap-1"><ArrowUpRight className="w-3 h-3"/> هالك</Badge>}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className={`font-black ${mov.movement_type === 'RETURNED' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {parseFloat(mov.quantity).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-sm font-bold text-slate-700">
                      {mov.engineer_name || mov.responsible_user_name || mov.user_name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 font-bold py-2">
                    {new Date(mov.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
         <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center text-sm">
            <span className="text-slate-500 font-bold">صفحة {page} من {totalPages}</span>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8">السابق</Button>
               <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8">التالي</Button>
            </div>
         </div>
      )}
    </Card>
  )
}

const EnclosureDashboard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false)

  const { profile, loading, error } = useEnclosureProfile(id, refreshKey)

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-800">خطأ في الوصول إلى بيانات الحوشة</h2>
          <Button onClick={() => navigate('/farm')} variant="outline" className="rounded-xl">
            العودة للهيكل التنظيمي
          </Button>
        </div>
      </div>
    )
  }

  const { asset_profile, summary_metrics, hierarchy } = profile || {}

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate('/farm')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
              <button onClick={() => navigate('/farm')} className="hover:text-emerald-700 transition-colors flex items-center gap-1">
                <MapPin className="w-4 h-4" /> هيكل المزرعة
              </button>
              <ChevronLeft className="w-4 h-4 opacity-50" />
              <span>{hierarchy?.sector?.name || 'قطاع'}</span>
              <ChevronLeft className="w-4 h-4 opacity-50" />
              <span>{hierarchy?.stage?.name || 'مرحلة'}</span>
            </div>
          </div>

          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? <Skeleton className="h-10 w-64" /> : profile?.name}
                </h1>
                {!loading && (
                  <Badge variant={profile?.is_active ? 'default' : 'secondary'} className={`rounded-lg px-3 py-1 ${profile?.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}`}>
                    {profile?.is_active ? 'نشط تشغيلياً' : 'متوقف'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 opacity-70" />
                  المعرف الفريد: {id}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-lg text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <Edit2 className="w-4 h-4 ml-2" />
                  تعديل البيانات الأساسية
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2">
               <OperationActionBar 
                  enclosureId={id} 
                  onAction={handleRefresh} 
                  onClickAttachments={() => setIsAttachmentsModalOpen(true)}
               />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-6">
        
        {/* Alerts & Notes */}
        {profile && <OperationalAlerts profile={profile} />}
        {asset_profile?.general_notes && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl shadow-sm px-5 py-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="font-bold whitespace-pre-wrap leading-relaxed">{asset_profile.general_notes}</p>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Leaf} 
            label="المحصول" 
            value={asset_profile?.crop_type} 
            colorClass="bg-emerald-100 text-emerald-600" 
          />
          <StatCard 
            icon={TreePine} 
            label="عدد الأشجار" 
            value={asset_profile?.tree_count ? `${asset_profile.tree_count} شجرة` : null} 
            colorClass="bg-blue-100 text-blue-600" 
          />
          <StatCard 
            icon={Droplet} 
            label="آخر ري" 
            value={summary_metrics?.last_irrigation_date ? dayjs(summary_metrics.last_irrigation_date).format('DD MMM YYYY') : null} 
            colorClass="bg-cyan-100 text-cyan-600" 
          />
          <StatCard 
            icon={Activity} 
            label="ساعات العمل" 
            value={summary_metrics?.total_work_hours ? `${summary_metrics.total_work_hours} ساعة` : null} 
            colorClass="bg-purple-100 text-purple-600" 
          />
        </div>

        {/* Productivity Trend & Tabs */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <Tabs defaultValue="journal" className="w-full" dir="rtl">
              <div className="px-4 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl w-max min-w-full justify-start">
                  <TabsTrigger value="journal" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <History className="w-4 h-4 ml-2" /> سجل العمليات
                  </TabsTrigger>
                  <TabsTrigger value="harvest" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Leaf className="w-4 h-4 ml-2" /> إنتاجية الحوشة
                  </TabsTrigger>
                  <TabsTrigger value="warehouse" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Package className="w-4 h-4 ml-2" /> المسحوبات المخزنية
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Activity className="w-4 h-4 ml-2" /> التحليل والمؤشرات
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6 bg-slate-50/30 rounded-b-2xl">
                <TabsContent value="journal" className="mt-0 outline-none">
                   <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                      <OperationalJournal enclosureId={id} profile={profile} />
                   </div>
                </TabsContent>

                <TabsContent value="harvest" className="mt-0 outline-none">
                   <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                      <EnclosureHarvestList enclosureId={id} />
                   </div>
                </TabsContent>
                
                <TabsContent value="warehouse" className="mt-0 outline-none">
                   <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-800">سجل استهلاك المخزون</h3>
                      <p className="text-sm text-slate-500">المواد والأصناف التي تم صرفها أو إرجاعها من هذه الحوشة.</p>
                   </div>
                   <WarehouseConsumptions enclosureId={id} />
                </TabsContent>

                <TabsContent value="analysis" className="mt-0 outline-none">
                   <ProductivityTrend enclosureId={id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <EditEnclosureModal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profile={profile}
        onSaveSuccess={handleRefresh}
      />

      {/* Notes Modal */}
      <Dialog open={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} maxWidth="sm" fullWidth>
         <DialogTitle className="font-bold text-slate-800 border-b border-slate-100 pb-4">ملاحظات الحوشة العامة</DialogTitle>
         <DialogContent className="pt-6">
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
               {profile?.asset_profile?.general_notes || 'لا توجد ملاحظات عامة مسجلة لهذه الحوشة.'}
            </p>
         </DialogContent>
         <DialogActions className="p-4 bg-slate-50">
            <Button onClick={() => setIsNotesModalOpen(false)} variant="outline" className="font-bold">إغلاق</Button>
         </DialogActions>
      </Dialog>

      {/* Attachments Modal */}
      <Dialog open={isAttachmentsModalOpen} onClose={() => setIsAttachmentsModalOpen(false)} maxWidth="sm" fullWidth>
         <DialogTitle className="font-bold text-slate-800 border-b border-slate-100 pb-4">مرفقات الحوشة</DialogTitle>
         <DialogContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <Package className="w-12 h-12 text-slate-300 mb-4" />
               <h4 className="text-slate-700 font-bold mb-2">جاري تطوير معرض المرفقات المجمعة</h4>
               <p className="text-slate-500 text-sm">سيتم عرض جميع المرفقات المرتبطة بتقارير هذه الحوشة هنا قريباً.</p>
            </div>
         </DialogContent>
         <DialogActions className="p-4 bg-slate-50">
            <Button onClick={() => setIsAttachmentsModalOpen(false)} variant="outline" className="font-bold">إغلاق</Button>
         </DialogActions>
      </Dialog>

    </div>
  )
}

export default EnclosureDashboard
