import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, Plus, Edit, Trash2, Eye, Map, Layers, Box as BoxIcon, TreePine, FolderOpen, Home, ArrowRight,
  Activity, TrendingUp, Clock, CalendarDays
} from 'lucide-react'

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  CircularProgress,
  Button as MuiButton
} from '@mui/material'

import ConfirmDialog from '../../components/ConfirmDialog'
import { useSnackbar } from '../../contexts/SnackbarContext'
import {
  createLocationNode,
  deleteLocationNode,
  getLocationTree,
  updateLocationNode,
  getLocationNodeProfile,
} from '../../features/farm/services'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import dayjs from 'dayjs'
import 'dayjs/locale/ar'

const NT = { SECTOR: 'SECTOR', STAGE: 'STAGE', ENCLOSURE: 'ENCLOSURE' }

const UI_ALLOWED_CHILDREN = {
  [NT.SECTOR]: [NT.STAGE, NT.ENCLOSURE],
  [NT.STAGE]: [NT.ENCLOSURE],
  [NT.ENCLOSURE]: [],
}

const NodeIcon = ({ type, className }) => {
  if (type === NT.SECTOR) return <Map className={className} />
  if (type === NT.STAGE) return <Layers className={className} />
  if (type === NT.ENCLOSURE) return <BoxIcon className={className} />
  return <TreePine className={className} />
}

const FarmStructure = () => {
  const { t } = useTranslation()
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  
  const [tree, setTree] = useState([])
  const [farmInfo, setFarmInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [path, setPath] = useState([]) 
  
  const [headerExpanded, setHeaderExpanded] = useState(false)
  const [nodeMetrics, setNodeMetrics] = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentNode, setCurrentNode] = useState(null)
  const [form, setForm] = useState({ name: '', type: NT.SECTOR })
  const [formLoading, setFormLoading] = useState(false)
  
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteNode, setPendingDeleteNode] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLocationTree()
      setTree(data.tree || [])
      setFarmInfo(data.farm)
    } catch {
      showSnackbar(t('farm.error_fetch', 'فشل تحميل هيكل المزرعة'), 'error')
    } finally {
      setLoading(false)
    }
  }, [t, showSnackbar])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const currentParent = path.length > 0 ? path[path.length - 1] : null

  // Fetch metrics when entering a new parent node (Stage/Sector)
  useEffect(() => {
    if (!currentParent) {
      setNodeMetrics(null)
      return
    }

    const fetchMetrics = async () => {
      setMetricsLoading(true)
      setNodeMetrics(null) // Reset old metrics
      try {
        const data = await getLocationNodeProfile(currentParent.id)
        setNodeMetrics(data)
      } catch (err) {
        console.error("Error fetching node metrics", err)
      } finally {
        setMetricsLoading(false)
      }
    }
    fetchMetrics()
  }, [currentParent])

  const currentLevelNodes = useMemo(() => {
    if (path.length === 0) return tree
    const currentParentId = path[path.length - 1].id
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(node.children, id)
          if (found) return found
        }
      }
      return null
    }
    const parentNode = findNode(tree, currentParentId)
    return parentNode ? (parentNode.children || []) : []
  }, [tree, path])

  const handleNodeClick = (node) => {
    if (node.type === NT.ENCLOSURE) {
      navigate(`/farm/enclosure/${node.id}`)
    } else {
      setPath([...path, node])
      setHeaderExpanded(false) // Reset expansion on navigation
    }
  }

  const navigateToLevel = (index) => {
    if (index === -1) {
      setPath([])
    } else {
      setPath(path.slice(0, index + 1))
    }
    setHeaderExpanded(false)
  }

  const handleOpenAdd = () => {
    setEditMode(false)
    const defaultType = currentParent ? UI_ALLOWED_CHILDREN[currentParent.type][0] : NT.SECTOR
    setForm({ name: '', type: defaultType })
    setModalOpen(true)
  }

  const handleOpenEdit = (node, e) => {
    e.stopPropagation()
    setEditMode(true)
    setCurrentNode(node)
    setForm({ name: node.name, type: node.type })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormLoading(true)
    try {
      if (editMode) {
        await updateLocationNode(currentNode.id, { name: form.name })
      } else {
        const parentId = currentParent ? currentParent.id : null
        await createLocationNode({ name: form.name, type: form.type, parent: parentId })
      }
      setModalOpen(false)
      showSnackbar(editMode ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح', 'success')
      fetchData()
    } catch (err) {
      showSnackbar('فشل الحفظ', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteClick = (node, e) => {
    e.stopPropagation()
    setPendingDeleteNode(node)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteNode) return
    try {
      await deleteLocationNode(pendingDeleteNode.id)
      showSnackbar('تم الحذف بنجاح', 'success')
      fetchData()
    } catch {
      showSnackbar('فشل الحذف', 'error')
    } finally {
      setConfirmOpen(false)
      setPendingDeleteNode(null)
    }
  }

  const getTypeLabel = (type) => {
    if (type === NT.SECTOR) return 'قطاع'
    if (type === NT.STAGE) return 'مرحلة'
    return 'حوشة'
  }

  if (loading && !tree.length) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col" dir="rtl">
      
      {/* ── Breadcrumbs & Header ── */}
      <div className="mb-8 transition-all duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          {/* Subtle Background Pattern */}
          <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-emerald-50/20 to-transparent pointer-events-none" />
          
          <div className="flex items-start gap-4 z-10">
            {path.length > 0 && (
              <button 
                onClick={() => navigateToLevel(path.length - 2)}
                className="mt-1 p-2 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 rounded-xl transition-all"
                title="رجوع للمستوى السابق"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <div>
              <nav className="flex flex-wrap items-center gap-1 text-sm font-bold text-slate-500 mb-2">
                <button 
                  onClick={() => navigateToLevel(-1)}
                  className={`flex items-center gap-1.5 hover:text-emerald-600 transition-colors ${path.length === 0 ? 'text-slate-800 underline decoration-emerald-500 decoration-2 underline-offset-4' : ''}`}
                >
                  <Home className="w-4 h-4" /> 
                  <span>{farmInfo?.name || 'المزرعة'}</span>
                </button>
                
                {path.map((node, index) => (
                  <React.Fragment key={node.id}>
                    <ChevronLeft className="w-4 h-4 opacity-50" />
                    <button 
                      onClick={() => navigateToLevel(index)}
                      className={`flex items-center gap-1.5 hover:text-emerald-600 transition-colors ${index === path.length - 1 ? 'text-slate-800' : ''}`}
                    >
                      <NodeIcon type={node.type} className="w-4 h-4" />
                      <span>{node.name}</span>
                    </button>
                  </React.Fragment>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                 <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                   {currentParent ? currentParent.name : 'الهيكل الهرمي'}
                 </h1>
                 {currentParent && (
                   <button 
                    onClick={() => setHeaderExpanded(!headerExpanded)}
                    className={`p-1.5 rounded-full transition-all ${headerExpanded ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 rotate-180' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                   </button>
                 )}
              </div>
              <p className="text-slate-500 text-sm mt-1 font-bold">
                {currentParent 
                  ? `إدارة عناصر ${getTypeLabel(currentParent.type)} ${currentParent.name}` 
                  : 'قم بتنظيم القطاعات، المراحل، والحوشات'}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-lg rounded-xl gap-2 font-black h-12 px-6 w-full sm:w-auto z-10 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5" /> 
            إضافة {currentParent ? (UI_ALLOWED_CHILDREN[currentParent.type][0] === NT.ENCLOSURE ? 'حوشة' : 'مرحلة') : 'قطاع'}
          </Button>
        </div>

        {/* ── Expanded Analytics Section ── */}
        {headerExpanded && currentParent && (
          <div className="mt-4 bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative">
             <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
             
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                         <Activity className="w-6 h-6" />
                      </div>
                      <div>
                         <h2 className="text-xl font-black">إحصائيات {getTypeLabel(currentParent.type)}</h2>
                         <p className="text-xs text-slate-400 font-bold">بيانات تراكمية لجميع الحوشات التابعة لهذه المرحلة</p>
                      </div>
                   </div>
                   <Badge className="bg-emerald-500 text-white border-none font-black px-4 py-1.5 rounded-lg text-sm">
                      سجل الإنتاجية الكلي
                   </Badge>
                </div>

                {metricsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {[1,2,3].map(i => <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl border border-white/5" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Harvest Metric */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors group">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">إجمالي الحصاد</span>
                          <TrendingUp className="w-5 h-5 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <p className="text-3xl font-black text-white">
                          {nodeMetrics?.summary_metrics?.total_harvested_kg >= 1000 
                            ? (nodeMetrics?.summary_metrics?.total_harvested_kg / 1000).toLocaleString() 
                            : (nodeMetrics?.summary_metrics?.total_harvested_kg || 0).toLocaleString()}
                          <span className="text-sm font-bold text-slate-400 mr-2">
                             {nodeMetrics?.summary_metrics?.total_harvested_kg >= 1000 ? 'طن' : 'كجم'}
                          </span>
                       </p>
                       <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[65%]" />
                       </div>
                    </div>

                    {/* Operations Count */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">عدد العمليات</span>
                          <Layers className="w-5 h-5 text-blue-400 opacity-50" />
                       </div>
                       <p className="text-3xl font-black text-white">
                          {nodeMetrics?.summary_metrics?.total_operations || 0}
                          <span className="text-sm font-bold text-slate-400 mr-2">عملية</span>
                       </p>
                       <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> تم تحديثه اليوم
                       </p>
                    </div>

                    {/* Work Hours */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ساعات العمل</span>
                          <Clock className="w-5 h-5 text-amber-400 opacity-50" />
                       </div>
                       <p className="text-3xl font-black text-white">
                          {nodeMetrics?.summary_metrics?.total_work_hours || 0}
                          <span className="text-sm font-bold text-slate-400 mr-2">ساعة</span>
                       </p>
                       <p className="text-[10px] text-slate-500 font-bold mt-2 italic">موزعة على الحوشات التابعة</p>
                    </div>

                    {/* Last Activity */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">آخر نشاط</span>
                          <CalendarDays className="w-5 h-5 text-purple-400 opacity-50" />
                       </div>
                       <p className="text-lg font-black text-white">
                          {nodeMetrics?.summary_metrics?.last_operation_date 
                            ? dayjs(nodeMetrics.summary_metrics.last_operation_date).locale('ar').format('DD MMMM') 
                            : 'لا يوجد'}
                       </p>
                       <p className="text-[10px] text-slate-500 font-bold mt-2">
                          {nodeMetrics?.summary_metrics?.last_operation_date ? 'منذ أيام قليلة' : 'لم يتم تسجيل نشاط بعد'}
                       </p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 flex-1">
        {currentLevelNodes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-600">لا توجد عناصر هنا</h3>
            <p className="text-sm mt-1 text-center max-w-sm">
              يمكنك إضافة عناصر جديدة بالضغط على زر الإضافة في الأعلى.
            </p>
            <Button 
              variant="outline" 
              onClick={handleOpenAdd}
              className="mt-6 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold"
            >
              <Plus className="w-4 h-4 ml-2" /> إضافة عنصر
            </Button>
          </div>
        ) : (
          currentLevelNodes.map(node => (
            <Card 
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className="group cursor-pointer border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 rounded-3xl overflow-hidden bg-white flex flex-col relative"
            >
              <CardContent className="p-6 flex-1 flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl transition-colors ${
                    node.type === NT.SECTOR ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' :
                    node.type === NT.STAGE ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' :
                    'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}>
                    <NodeIcon type={node.type} className="w-7 h-7" />
                  </div>
                  
                  {/* Quick Actions overlay */}
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                    <button 
                      onClick={(e) => handleOpenEdit(node, e)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(node, e)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">
                    {node.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 rounded-lg font-black text-[10px]">
                      {getTypeLabel(node.type)}
                    </Badge>
                    {node.type !== NT.ENCLOSURE && (
                      <span className="text-xs font-bold text-slate-400">
                        {node.children?.length || 0} عناصر
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
              
              {/* Bottom Quick Action Bar for Enclosure */}
              {node.type === NT.ENCLOSURE && (
                <div className="bg-emerald-50/50 border-t border-emerald-100 px-6 py-3 flex items-center justify-between group-hover:bg-emerald-600 transition-colors">
                  <span className="text-sm font-bold text-emerald-700 group-hover:text-white">الملف التشغيلي</span>
                  <Eye className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, fontFamily: 'inherit' } } }} dir="rtl">
        <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', fontFamily: 'inherit' }}>
          {editMode ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1, fontFamily: 'inherit' }}>
          {!editMode && (!currentParent || UI_ALLOWED_CHILDREN[currentParent.type]?.length !== 1) && (
            <TextField
              select
              fullWidth
              label="نوع العنصر"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              slotProps={{ 
                htmlInput: { sx: { borderRadius: 3, fontFamily: 'inherit' } },
                inputLabel: { sx: { fontFamily: 'inherit', right: 28, transformOrigin: 'top right' } }
              }}
            >
              {(currentParent ? UI_ALLOWED_CHILDREN[currentParent.type] : [NT.SECTOR, NT.STAGE]).map((type) => (
                <MenuItem key={type} value={type} sx={{ fontFamily: 'inherit' }}>
                  {getTypeLabel(type)}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            autoFocus
            label="الاسم"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && form.name && handleSave()}
            slotProps={{ 
              htmlInput: { sx: { borderRadius: 3, fontFamily: 'inherit' } },
              inputLabel: { sx: { fontFamily: 'inherit', right: 28, transformOrigin: 'top right' } }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <MuiButton onClick={() => setModalOpen(false)} sx={{ fontWeight: 700, color: '#64748b', fontFamily: 'inherit' }}>
            إلغاء
          </MuiButton>
          <MuiButton
            onClick={handleSave}
            variant="contained"
            disabled={formLoading || !form.name}
            sx={{ borderRadius: 3, px: 4, fontWeight: 800, bgcolor: '#16a34a', fontFamily: 'inherit', '&:hover': { bgcolor: '#15803d' } }}
          >
            {formLoading ? <CircularProgress size={20} color="inherit" /> : 'حفظ'}
          </MuiButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد؟ سيتم حذف جميع العناصر التابعة."
        confirmText="حذف"
        cancelText="إلغاء"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

export default FarmStructure
