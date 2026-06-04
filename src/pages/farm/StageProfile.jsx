import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

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
  Edit2,
  Paperclip
} from 'lucide-react'

import { useEnclosureProfile } from './EnclosureProfile/hooks/useEnclosureProfile'
import api from '../../services/api'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogActions, CircularProgress, Grid, TextField, Alert } from '@mui/material'
import AttachmentGallery from '../reports/shared/AttachmentGallery'
import { reportsApi } from '../../services/reportsApi'
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

import OperationActionBar from './EnclosureProfile/components/OperationActionBar'
import OperationalAlerts from './EnclosureProfile/components/OperationalAlerts'
import OperationalJournal from './EnclosureProfile/components/OperationalJournal'
import EnclosureHarvestList from './EnclosureProfile/components/EnclosureHarvestList'
import IrrigationDetailDrawer from '../reports/IrrigationReport/components/IrrigationDetailDrawer'
import PestControlDetailDrawer from '../reports/PestControlReport/components/PestControlDetailDrawer'

// EditStageModal for Stage Target Tree Count & Notes updates
const EditStageModal = ({ open, onClose, profile, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    tree_count: '',
    general_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile?.asset_profile) {
      setFormData({
        tree_count: profile.asset_profile.tree_count || '',
        general_notes: profile.asset_profile.general_notes || '',
      })
    }
  }, [profile])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.patch(`/farm/location-nodes/${profile.id}/profile/`, formData)
      onSaveSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1e293b' }}>تعديل مستهدفات المرحلة</DialogTitle>
      <DialogContent dividers dir="rtl">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="المستهدف الكلي لعدد الأشجار (Target Tree Count)"
              name="tree_count"
              type="number"
              value={formData.tree_count}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="مثال: 500"
              helperText="الحد الأقصى المسموح بزراعته وتوزيعه على حوشات هذه المرحلة"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="الملاحظات والتوجيهات العامة للمرحلة"
              name="general_notes"
              value={formData.general_notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              size="small"
              placeholder="سجل أي توجيهات تشغيلية أو ملاحظات ميدانية خاصة بهذه المرحلة..."
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: '6px', fontWeight: 600, px: 3, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'حفظ التعديلات'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Stage reports tabs components
const StageIrrigationTab = ({ stageId, onRowClick }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getIrrigations({ enclosure: stageId, page })
      if (res.data.results) {
        setReports(res.data.results)
        setTotalPages(Math.ceil(res.data.count / 10))
      } else {
        setReports(res.data || [])
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error fetching stage irrigation reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (stageId) fetchReports()
  }, [stageId, page])

  if (loading) return <div className="p-8 text-center"><CircularProgress size={30} className="text-emerald-600" /></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-600" />
          تقارير الري والتسميد للمرحلة (مجمعة)
        </h3>
      </div>

      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right font-bold py-3">المعرف</TableHead>
            <TableHead className="text-right font-bold py-3">تاريخ المناوبة</TableHead>
            <TableHead className="text-right font-bold py-3">المهندس المسؤول</TableHead>
            <TableHead className="text-right font-bold py-3">إجمالي الساعات</TableHead>
            <TableHead className="text-right font-bold py-3">إجمالي التحويلات</TableHead>
            <TableHead className="text-right font-bold py-3">مع تسميد؟</TableHead>
            <TableHead className="text-right font-bold py-3">الأسمدة المضافة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-slate-400 font-bold">
                لا توجد تقارير ري وتسميد مسجلة لهذه المرحلة
              </TableCell>
            </TableRow>
          ) : (
            reports.map(report => {
              const ferts = [];
              report.details?.forEach(detail => {
                detail.fertilizers?.forEach(fert => {
                  const name = fert.fertilizer_item_name || fert.custom_material_name;
                  if (name) {
                    ferts.push(`${name} (${parseFloat(fert.quantity).toLocaleString()} ${fert.unit || 'كجم'})`);
                  }
                });
              });
              const fertilizersStr = ferts.length > 0 ? ferts.join('، ') : '—';

              return (
                <TableRow
                  key={report.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => onRowClick(report.id)}
                >
                  <TableCell className="font-mono text-xs font-bold text-slate-550">#{report.id}</TableCell>
                  <TableCell className="font-bold">{dayjs(report.date).format('DD MMM YYYY')}</TableCell>
                  <TableCell>{report.engineer_name || 'غير مسجل'}</TableCell>
                  <TableCell>{report.total_hours} ساعة</TableCell>
                  <TableCell>{report.total_shifts}</TableCell>
                  <TableCell>
                    {report.is_fertilized ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-bold">نعم</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold">لا</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-semibold max-w-[200px] truncate" title={fertilizersStr}>
                    {fertilizersStr}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center text-sm">
          <span className="text-slate-500 font-bold">صفحة {page} من {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 font-bold">السابق</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 font-bold">التالي</Button>
          </div>
        </div>
      )}
    </div>
  )
}

const StagePestControlTab = ({ stageId, onRowClick }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getPestControls({ enclosure: stageId, page })
      if (res.data.results) {
        setReports(res.data.results)
        setTotalPages(Math.ceil(res.data.count / 10))
      } else {
        setReports(res.data || [])
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Error fetching stage pest control reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (stageId) fetchReports()
  }, [stageId, page])

  if (loading) return <div className="p-8 text-center"><CircularProgress size={30} className="text-emerald-600" /></div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          تقارير المكافحة للمرحلة (مجمعة)
        </h3>
      </div>

      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right font-bold py-3">المعرف</TableHead>
            <TableHead className="text-right font-bold py-3">التاريخ</TableHead>
            <TableHead className="text-right font-bold py-3">المهندس المسؤول</TableHead>
            <TableHead className="text-right font-bold py-3">المبيد المستخدم</TableHead>
            <TableHead className="text-right font-bold py-3">الكمية المستخدمة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold">
                لا توجد تقارير مكافحة مسجلة لهذه المرحلة
              </TableCell>
            </TableRow>
          ) : (
            reports.map(report => (
              <TableRow
                key={report.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => onRowClick(report.id)}
              >
                <TableCell className="font-mono text-xs font-bold text-slate-555">#{report.id}</TableCell>
                <TableCell className="font-bold">{dayjs(report.date).format('DD MMM YYYY')}</TableCell>
                <TableCell>{report.engineer_name || 'غير مسجل'}</TableCell>
                <TableCell>{report.pesticide_item_name || report.custom_pesticide_name || 'غير محدد'}</TableCell>
                <TableCell>{report.quantity} لتر/كجم</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 bg-white flex justify-between items-center text-sm">
          <span className="text-slate-500 font-bold">صفحة {page} من {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 font-bold">السابق</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 font-bold">التالي</Button>
          </div>
        </div>
      )}
    </div>
  )
}

const StageWarehouseConsumptions = ({ stageId }) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 5

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setLoading(true)
        const response = await api.get(`warehouse/movements/?location=${stageId}`)
        setMovements(response.data)
      } catch (err) {
        console.error('Failed to fetch movements', err)
      } finally {
        setLoading(false)
      }
    }
    if (stageId) fetchMovements()
  }, [stageId])

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
          المسحوبات المخزنية للمرحلة (مجمعة)
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
                    <p className="font-bold text-sm">لا توجد مسحوبات مطابقة للبحث في هذه المرحلة</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map(mov => (
                <TableRow key={mov.id} className="hover:bg-slate-50">
                  <TableCell className="font-bold py-2">{mov.item_name}</TableCell>
                  <TableCell className="py-2">
                    {mov.movement_type === 'OUT' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 gap-1"><ArrowUpRight className="w-3 h-3" /> منصرف</Badge>}
                    {mov.movement_type === 'RETURNED' && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><ArrowDownLeft className="w-3 h-3" /> مرتجع</Badge>}
                    {mov.movement_type === 'DAMAGED' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 gap-1"><ArrowUpRight className="w-3 h-3" /> هالك</Badge>}
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

const PremiumStatCard = ({ icon: Icon, label, value, subtext, colorClass, children }) => (
  <Card className="border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden group">
    <CardContent className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider block">{label}</span>
          <h4 className="text-lg font-extrabold text-slate-850 dark:text-slate-150 select-text leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {value || '—'}
          </h4>
        </div>
        <div className={`p-2.5 rounded-xl ${colorClass} shadow-2xs shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtext && (
        <p className="text-[10.5px] font-bold text-slate-450 dark:text-slate-500 select-text border-t border-slate-100 dark:border-slate-850 pt-2 mt-1">
          {subtext}
        </p>
      )}
      {children}
    </CardContent>
  </Card>
)

const StageProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false)
  const [selectedIrrigationId, setSelectedIrrigationId] = useState(null)
  const [isIrrigationDrawerOpen, setIsIrrigationDrawerOpen] = useState(false)
  const [selectedPestControlId, setSelectedPestControlId] = useState(null)
  const [isPestControlDrawerOpen, setIsPestControlDrawerOpen] = useState(false)

  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchStageMedia = async () => {
      try {
        setLoadingAttachments(true)
        const response = await reportsApi.getMediaFeed({ enclosure: id })
        const feedItems = Array.isArray(response.data) ? response.data : (response.data?.results || [])
        const allAttachments = []
        const seenUrls = new Set()

        feedItems.forEach(item => {
          const fileKey = item ? (item.url || item.file_url || item.file) : null;
          if (fileKey && !seenUrls.has(fileKey)) {
            seenUrls.add(fileKey)
            allAttachments.push(item)
          }
        })
        setAttachments(allAttachments)
      } catch (err) {
        console.error("Failed to fetch stage media feed", err)
      } finally {
        setLoadingAttachments(false)
      }
    }
    fetchStageMedia()
  }, [id, refreshKey])

  const { profile, loading, error } = useEnclosureProfile(id, refreshKey)

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-800">خطأ في الوصول إلى بيانات المرحلة</h2>
          <Button onClick={() => navigate('/farm')} variant="outline" className="rounded-xl">
            العودة للهيكل التنظيمي
          </Button>
        </div>
      </div>
    )
  }

  const { asset_profile, summary_metrics, hierarchy } = profile || {}

  // Calculate target progress percentage
  const targetTreeCount = asset_profile?.tree_count || 0
  const actualTreeCount = asset_profile?.actual_tree_count || 0
  const treeProgressPercent = targetTreeCount > 0 ? Math.min(100, Math.round((actualTreeCount / targetTreeCount) * 100)) : 0

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
              <span>مرحلة {profile?.name}</span>
            </div>
          </div>

          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {loading ? <Skeleton className="h-10 w-64" /> : `ملف مرحلة: ${profile?.name}`}
                </h1>
                {!loading && (
                  <Badge className="rounded-lg px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    ملف تعريفي تشغيلي للمرحلة
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-sm font-bold text-slate-500">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 opacity-70" />
                  معرف المرحلة: {id}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-lg text-slate-650 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 h-7"
                >
                  <Edit2 className="w-3.5 h-3.5 ml-1.5" />
                  تعديل مستهدفات المرحلة
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-slate-150 p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/intelligence/?location=${id}`)}
                className="rounded-lg border-emerald-250 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
              >
                <Activity className="w-4 h-4 ml-1.5" />
                ذكاء العمليات للمرحلة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAttachmentsModalOpen(true)}
                className="rounded-lg text-slate-650 hover:bg-slate-50 font-bold text-xs"
              >
                <Paperclip className="w-4 h-4 ml-1.5" />
                المرفقات الميدانية ({attachments.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-6">
        
        {/* Alerts & Notes */}
        {asset_profile?.general_notes && (
          <Card className="border border-amber-150 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/5 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-amber-150/40 dark:border-amber-900/25 bg-amber-50/40 dark:bg-amber-950/15 flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                    توجيهات تشغيلية للمرحلة
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 select-text">
              <div className="relative pl-6 rtl:pr-6 border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-400">
                <p className="text-slate-700 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap font-medium font-serif italic">
                  "{asset_profile.general_notes}"
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <PremiumStatCard
            icon={TreePine}
            label={isRTL ? 'توزيع عدد أشجار المرحلة' : 'Stage Trees Target & Actual'}
            value={targetTreeCount > 0 ? `${actualTreeCount.toLocaleString()} / ${targetTreeCount.toLocaleString()} شجرة` : `${actualTreeCount.toLocaleString()} شجرة`}
            subtext={isRTL ? 'الفعلي الموزع بالحوشات مقابل المستهدف الكلي' : 'Actual enclosures count vs stage target limit'}
            colorClass="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          >
            {targetTreeCount > 0 && (
              <div className="mt-2.5 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <span>سعة التوزيع</span>
                  <span>{treeProgressPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${treeProgressPercent}%` }} />
                </div>
              </div>
            )}
          </PremiumStatCard>
          <PremiumStatCard
            icon={Weight}
            label={isRTL ? 'معدل إنتاج المرحلة الكلي' : 'Total Harvest Performance'}
            value={(() => {
              const kg = summary_metrics?.total_harvested_kg || 0;
              return kg >= 1000 ? `${(kg / 1000).toLocaleString(isRTL ? 'ar-EG' : 'en-US')} طن` : `${kg.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} كجم`;
            })()}
            subtext={isRTL ? 'إجمالي الكميات المحصودة تشغيلياً للموقع' : 'Total harvested actual quantity'}
            colorClass="bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <PremiumStatCard
            icon={Droplet}
            label={isRTL ? 'حالة ري المرحلة وتسميدها' : 'Stage Irrigation Status'}
            value={summary_metrics?.last_irrigation_date ? dayjs(summary_metrics.last_irrigation_date).format('DD MMM YYYY') : (isRTL ? 'لا يوجد ري قريب' : 'No recent irrigation')}
            subtext={summary_metrics?.last_fertilization_date ? (isRTL ? `آخر تسميد: ${dayjs(summary_metrics.last_fertilization_date).format('DD MMM')}` : `Fertilized: ${dayjs(summary_metrics.last_fertilization_date).format('DD MMM')}`) : (isRTL ? 'لم يتم التسميد مؤخراً' : 'No recent fertilization')}
            colorClass="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100/50 dark:border-cyan-900/30 text-cyan-600 dark:text-cyan-400"
          />
          <PremiumStatCard
            icon={Activity}
            label={isRTL ? 'إحصائيات جهد المرحلة الكلي' : 'Total Effort Metrics'}
            value={summary_metrics?.total_work_hours ? `${summary_metrics.total_work_hours.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} ساعة` : '0'}
            subtext={summary_metrics?.total_operations ? (isRTL ? `تواتر العمليات: ${summary_metrics.total_operations} سجل` : `Op frequency: ${summary_metrics.total_operations} logs`) : (isRTL ? 'لا توجد سجلات تشغيل' : 'No activity logs')}
            colorClass="bg-purple-50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Productivity Trend & Tabs */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
            <Tabs defaultValue="journal" className="w-full" dir="rtl">
              <div className="px-4 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl w-max min-w-full justify-start">
                  <TabsTrigger value="journal" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <History className="w-4 h-4 ml-2" /> سجل عمليات المرحلة
                  </TabsTrigger>
                  <TabsTrigger value="harvest" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Leaf className="w-4 h-4 ml-2" /> الإنتاجية
                  </TabsTrigger>
                  <TabsTrigger value="irrigation" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Droplet className="w-4 h-4 ml-2" /> تقارير الري والتسميد
                  </TabsTrigger>
                  <TabsTrigger value="pest_control" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <AlertTriangle className="w-4 h-4 ml-2" /> تقارير المكافحة
                  </TabsTrigger>
                  <TabsTrigger value="warehouse" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Package className="w-4 h-4 ml-2" /> المسحوبات المخزنية
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                    <Paperclip className="w-4 h-4 ml-2" /> معرض المرفقات
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

                <TabsContent value="irrigation" className="mt-0 outline-none">
                  <StageIrrigationTab
                    stageId={id}
                    onRowClick={(reportId) => {
                      setSelectedIrrigationId(reportId)
                      setIsIrrigationDrawerOpen(true)
                    }}
                  />
                </TabsContent>

                <TabsContent value="pest_control" className="mt-0 outline-none">
                  <StagePestControlTab
                    stageId={id}
                    onRowClick={(reportId) => {
                      setSelectedPestControlId(reportId)
                      setIsPestControlDrawerOpen(true)
                    }}
                  />
                </TabsContent>

                <TabsContent value="warehouse" className="mt-0 outline-none">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">سجل استهلاك المخزون للمرحلة</h3>
                    <p className="text-sm text-slate-500">المواد والأصناف التي تم صرفها أو إرجاعها في حوشات هذه المرحلة.</p>
                  </div>
                  <StageWarehouseConsumptions stageId={id} />
                </TabsContent>

                <TabsContent value="attachments" className="mt-0 outline-none">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-800">معرض وسائط التوثيق الميداني للمرحلة</h3>
                      <p className="text-sm text-slate-500">المرفقات والوسائط التي تم رفعها وتوثيقها في تقارير حوشات هذه المرحلة.</p>
                    </div>

                    {loadingAttachments ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <CircularProgress size={32} thickness={4} className="text-emerald-600 dark:text-emerald-400" />
                        <p className="text-slate-500 text-sm font-bold">جاري تحميل المرفقات الميدانية...</p>
                      </div>
                    ) : attachments && attachments.length > 0 ? (
                      <AttachmentGallery attachments={attachments} />
                    ) : (
                      <div className="py-14 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center">
                        <Paperclip className="w-10 h-10 text-slate-355 mb-3" />
                        <h4 className="text-slate-705 font-bold mb-1.5">لا توجد مرفقات في هذه المرحلة</h4>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <EditStageModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSaveSuccess={handleRefresh}
      />

      {/* Attachments Modal */}
      <Dialog open={isAttachmentsModalOpen} onClose={() => setIsAttachmentsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold text-slate-800 border-b border-slate-100 pb-4">
          مرفقات المرحلة المجمعة
        </DialogTitle>
        <DialogContent className="pt-6">
          {loadingAttachments ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <CircularProgress size={32} thickness={4} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-slate-500 text-sm font-bold">جاري تحميل المرفقات...</p>
            </div>
          ) : attachments && attachments.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-2">
                تم العثور على {attachments.length} مرفق مجمع من التقارير التشغيلية للمرحلة.
              </p>
              <AttachmentGallery attachments={attachments} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Paperclip className="w-12 h-12 text-slate-300 mb-4" />
              <h4 className="text-slate-700 font-bold mb-2">لا توجد مرفقات مجمعة</h4>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-4 bg-slate-50">
          <Button onClick={() => setIsAttachmentsModalOpen(false)} variant="outline" className="font-bold">إغلاق</Button>
        </DialogActions>
      </Dialog>

      <IrrigationDetailDrawer
        reportId={selectedIrrigationId}
        isOpen={isIrrigationDrawerOpen}
        onClose={() => setIsIrrigationDrawerOpen(false)}
        onDeleteSuccess={handleRefresh}
      />

      <PestControlDetailDrawer
        reportId={selectedPestControlId}
        isOpen={isPestControlDrawerOpen}
        onClose={() => setIsPestControlDrawerOpen(false)}
        onDeleteSuccess={handleRefresh}
      />
    </div>
  )
}

export default StageProfile
