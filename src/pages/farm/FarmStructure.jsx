import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './FarmStructure.css'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, Edit, Trash2, Eye, Map, Layers,
  Box as BoxIcon, Home, ChevronRight, Loader2, AlertTriangle,
  Network, RefreshCw,
} from 'lucide-react'

import {
  createLocationNode,
  deleteLocationNode,
  getLocationTree,
  updateLocationNode,
} from '../../features/farm/services'
import { useSnackbar } from '../../contexts/SnackbarContext'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const NT = { SECTOR: 'SECTOR', STAGE: 'STAGE', ENCLOSURE: 'ENCLOSURE' }

const UI_ALLOWED_CHILDREN = {
  [NT.SECTOR]:    [NT.STAGE, NT.ENCLOSURE],
  [NT.STAGE]:     [NT.ENCLOSURE],
  [NT.ENCLOSURE]: [],
}

// Hierarchy levels for the level-progress indicator
const LEVEL_ORDER = [NT.SECTOR, NT.STAGE, NT.ENCLOSURE]

const TYPE_META = {
  [NT.SECTOR]: {
    label:       'قطاع',
    icon:        Map,
    iconBg:      'bg-violet-100 text-violet-700',
    iconHover:   'group-hover:bg-violet-600 group-hover:text-white',
    badge:       'bg-violet-100 text-violet-700',
    topBar:      'from-violet-500 to-violet-400',
    borderBase:  'border-slate-200',
    borderHover: 'hover:border-violet-300',
    shadow:      'hover:shadow-violet-100',
    levelDot:    'bg-violet-500',
    levelText:   'text-violet-700',
    levelBg:     'bg-violet-50',
    emptyIcon:   'text-violet-300',
  },
  [NT.STAGE]: {
    label:       'مرحلة',
    icon:        Layers,
    iconBg:      'bg-amber-100 text-amber-700',
    iconHover:   'group-hover:bg-amber-500 group-hover:text-white',
    badge:       'bg-amber-100 text-amber-700',
    topBar:      'from-amber-500 to-amber-400',
    borderBase:  'border-slate-200',
    borderHover: 'hover:border-amber-300',
    shadow:      'hover:shadow-amber-100',
    levelDot:    'bg-amber-500',
    levelText:   'text-amber-700',
    levelBg:     'bg-amber-50',
    emptyIcon:   'text-amber-300',
  },
  [NT.ENCLOSURE]: {
    label:       'حوشة',
    icon:        BoxIcon,
    iconBg:      'bg-emerald-100 text-emerald-700',
    iconHover:   'group-hover:bg-emerald-600 group-hover:text-white',
    badge:       'bg-emerald-100 text-emerald-700',
    topBar:      'from-emerald-600 to-emerald-500',
    borderBase:  'border-slate-200',
    borderHover: 'hover:border-emerald-300',
    shadow:      'hover:shadow-emerald-100',
    levelDot:    'bg-emerald-500',
    levelText:   'text-emerald-700',
    levelBg:     'bg-emerald-50',
    emptyIcon:   'text-emerald-300',
  },
}

const getTypeLabel  = (type) => TYPE_META[type]?.label ?? 'عنصر'
const getChildLabel = (count) => count === 1 ? 'عنصر' : 'عناصر'

const NodeIcon = ({ type, className }) => {
  const Icon = TYPE_META[type]?.icon ?? Network
  return <Icon className={className} />
}

const formatDate = (str) => {
  if (!str) return null
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(str))
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton card — matches NodeCard dimensions
// ─────────────────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
    <div className="h-1 w-full bg-slate-100" />
    <div className="p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex gap-1.5">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton className="w-7 h-7 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
      </div>
      <div className="pt-2 border-t border-slate-100 flex justify-between">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Empty state — contextual per level
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_COPY = {
  [NT.SECTOR]: {
    title:   'لا توجد قطاعات',
    body:    'ابدأ ببناء هيكل المزرعة بإضافة أول قطاع. القطاعات هي الوحدة الرئيسية لتقسيم الأراضي.',
  },
  [NT.STAGE]: {
    title:   'لا توجد مراحل',
    body:    'أضف مراحل داخل هذا القطاع لتنظيم دورات الزراعة وتتبع التقدم.',
  },
  [NT.ENCLOSURE]: {
    title:   'لا توجد حوشات',
    body:    'أضف حوشات داخل هذه المرحلة لتتبع الإنتاج والعمليات اليومية.',
  },
}

const EmptyState = ({ levelType, onAdd }) => {
  const addType = UI_ALLOWED_CHILDREN[levelType]?.[0] ?? NT.SECTOR
  const copy    = EMPTY_COPY[addType] ?? EMPTY_COPY[NT.SECTOR]
  const meta    = TYPE_META[addType]

  return (
    <div className="col-span-full">
      <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 text-center">
        <div className={`w-16 h-16 rounded-2xl ${meta.levelBg} flex items-center justify-center mb-5`}>
          <NodeIcon type={addType} className={`w-7 h-7 ${meta.emptyIcon}`} />
        </div>
        <h3 className="text-base font-black text-slate-700 mb-1.5">{copy.title}</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">{copy.body}</p>
        <Button
          onClick={onAdd}
          id="btn-empty-add"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold px-5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          إضافة {getTypeLabel(addType)}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Error state with retry
// ─────────────────────────────────────────────────────────────────────────────
const ErrorState = ({ onRetry }) => (
  <div className="col-span-full">
    <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-5">
        <AlertTriangle className="w-7 h-7 text-rose-400" />
      </div>
      <h3 className="text-base font-black text-slate-700 mb-1.5">تعذّر تحميل البيانات</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
        حدث خطأ أثناء تحميل هيكل المزرعة. تحقق من الاتصال وحاول مجدداً.
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        id="btn-retry"
        className="gap-2 font-bold rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
      >
        <RefreshCw className="w-4 h-4" />
        إعادة المحاولة
      </Button>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Level Progress Bar — shows Farm → Sector → Stage → Enclosure progress
// ─────────────────────────────────────────────────────────────────────────────
const LevelProgressBar = ({ path }) => {
  // path[0] is first sector-level node, so currentDepth = path.length
  const currentType = path.length === 0 ? null : path[path.length - 1].type

  return (
    <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
      {/* Farm (root) */}
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0
        ${path.length === 0
          ? 'bg-emerald-100 text-emerald-800'
          : 'text-slate-400'}`}
      >
        <Home className="w-3 h-3" />
        <span>المزرعة</span>
      </div>

      {LEVEL_ORDER.map((level, idx) => {
        const meta      = TYPE_META[level]
        const isReached = path.some((p) => p.type === level)
        const isCurrent = currentType === level

        return (
          <React.Fragment key={level}>
            <ChevronLeft className={`w-3 h-3 shrink-0 ${isReached ? 'text-slate-400' : 'text-slate-200'}`} />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0
              ${isCurrent
                ? `${meta.levelBg} ${meta.levelText}`
                : isReached
                  ? 'text-slate-500'
                  : 'text-slate-300'}`}
            >
              {isCurrent && <span className={`w-1.5 h-1.5 rounded-full ${meta.levelDot}`} />}
              <span>{meta.label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Node Card
// ─────────────────────────────────────────────────────────────────────────────
const NodeCard = ({ node, onNavigate, onEdit, onDelete }) => {
  const meta       = TYPE_META[node.type] ?? TYPE_META[NT.SECTOR]
  const isEnclosure = node.type === NT.ENCLOSURE
  const childCount  = node.children?.length ?? 0
  const updatedAt   = formatDate(node.updated_at)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(node)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(node)}
      aria-label={`${getTypeLabel(node.type)}: ${node.name}`}
      className={`group relative bg-white border ${meta.borderBase} ${meta.borderHover}
        rounded-2xl overflow-hidden shadow-sm hover:shadow-xl ${meta.shadow}
        transition-all duration-300 cursor-pointer
        hover:-translate-y-0.5 active:translate-y-0 active:shadow-md
        flex flex-col outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2`}
    >
      {/* Gradient top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${meta.topBar} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3.5">

        {/* Row 1: Icon + Quick Actions */}
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl transition-all duration-200 ${meta.iconBg} ${meta.iconHover}`}>
            <NodeIcon type={node.type} className="w-5 h-5" />
          </div>

          {/* Actions — always visible on mobile (touch), revealed on hover desktop */}
          <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 sm:translate-x-1 sm:group-hover:translate-x-0">
            <button
              id={`btn-edit-${node.id}`}
              onClick={(e) => { e.stopPropagation(); onEdit(node, e) }}
              title="تعديل"
              aria-label={`تعديل ${node.name}`}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              id={`btn-delete-${node.id}`}
              onClick={(e) => { e.stopPropagation(); onDelete(node, e) }}
              title="حذف"
              aria-label={`حذف ${node.name}`}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Name + Type badge + child count */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-black text-slate-800 leading-snug mb-2 truncate">
            {node.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`text-[10px] font-bold border-0 rounded-md px-2 py-0.5 ${meta.badge}`}>
              {meta.label}
            </Badge>

            {!isEnclosure && childCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.levelDot} opacity-60`} />
                {childCount} {getChildLabel(childCount)}
              </span>
            )}
            {!isEnclosure && childCount === 0 && (
              <span className="text-[11px] font-medium text-slate-300 italic">لا توجد عناصر</span>
            )}
          </div>
        </div>

        {/* Row 3: Metadata + Navigation cue */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          {updatedAt ? (
            <span className="text-[10px] text-slate-400 font-medium truncate">
              آخر تحديث: {updatedAt}
            </span>
          ) : (
            <span className="text-[10px] text-slate-300">—</span>
          )}

          {/* Navigation cue */}
          {isEnclosure ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Eye className="w-3.5 h-3.5" />
              عرض
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0">
              فتح
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
            </span>
          )}
        </div>
      </div>

      {/* Enclosure: full-width footer CTA */}
      {isEnclosure && (
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-emerald-600 transition-colors duration-300">
          <span className="text-xs font-bold text-slate-500 group-hover:text-white transition-colors">
            الملف التشغيلي
          </span>
          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
const FarmStructure = () => {
  const { t }            = useTranslation()
  const { showSnackbar } = useSnackbar()
  const navigate         = useNavigate()

  // ── Data ────────────────────────────────────────────────────────────────────
  const [tree,     setTree]     = useState([])
  const [farmInfo, setFarmInfo] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [fetchErr, setFetchErr] = useState(false)

  // ── Drill-down navigation ────────────────────────────────────────────────────
  const [path, setPath] = useState([])

  // ── Add / Edit modal ────────────────────────────────────────────────────────
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editMode,    setEditMode]    = useState(false)
  const [currentNode, setCurrentNode] = useState(null)
  const [form,        setForm]        = useState({ name: '', type: NT.SECTOR })
  const [formLoading, setFormLoading] = useState(false)
  const [nameError,   setNameError]   = useState('')

  // ── Delete confirm ───────────────────────────────────────────────────────────
  const [confirmOpen,       setConfirmOpen]       = useState(false)
  const [pendingDeleteNode, setPendingDeleteNode] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchErr(false)
    try {
      const data = await getLocationTree()
      setTree(data.tree || [])
      setFarmInfo(data.farm)
    } catch {
      setFetchErr(true)
      showSnackbar(t('farm.error_fetch', 'فشل تحميل هيكل المزرعة'), 'error')
    } finally {
      setLoading(false)
    }
  }, [t, showSnackbar])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentParent = path.length > 0 ? path[path.length - 1] : null

  const currentLevelNodes = useMemo(() => {
    if (path.length === 0) return tree
    const pid = path[path.length - 1].id
    const find = (nodes, id) => {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children) { const f = find(n.children, id); if (f) return f }
      }
      return null
    }
    const parent = find(tree, pid)
    return parent ? (parent.children || []) : []
  }, [tree, path])

  // The type that would be displayed at this level
  const currentLevelType = currentParent
    ? (UI_ALLOWED_CHILDREN[currentParent.type][0] ?? NT.ENCLOSURE)
    : NT.SECTOR

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNodeClick = (node) => {
    if (node.type === NT.ENCLOSURE) {
      navigate(`/farm/enclosure/${node.id}`)
    } else {
      setPath([...path, node])
    }
  }

  const navigateToLevel = (index) => {
    if (index === -1) setPath([])
    else setPath(path.slice(0, index + 1))
  }

  // ── Add / Edit ───────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditMode(false)
    setCurrentNode(null)
    const defaultType = currentParent
      ? UI_ALLOWED_CHILDREN[currentParent.type][0]
      : NT.SECTOR
    setForm({ name: '', type: defaultType })
    setNameError('')
    setModalOpen(true)
  }

  const handleOpenEdit = (node, e) => {
    e.stopPropagation()
    setEditMode(true)
    setCurrentNode(node)
    setForm({ name: node.name, type: node.type })
    setNameError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setNameError('الاسم مطلوب'); return }
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
    } catch {
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

  // ── Dialog helpers ───────────────────────────────────────────────────────────
  const availableTypes  = currentParent ? UI_ALLOWED_CHILDREN[currentParent.type] : [NT.SECTOR, NT.STAGE]
  const showTypeSelect  = !editMode && availableTypes.length > 1
  const addButtonLabel  = getTypeLabel(
    currentParent ? UI_ALLOWED_CHILDREN[currentParent.type][0] : NT.SECTOR
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50" dir="rtl">

      {/* ════════════════════════════════════════════════════════════════════
          STICKY HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto">

          {/* ── Top Row ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">

            {/* Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              {path.length > 0 && (
                <button
                  onClick={() => navigateToLevel(path.length - 2)}
                  aria-label="رجوع للمستوى السابق"
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-base font-black text-slate-800 truncate leading-tight">
                  {currentParent
                    ? currentParent.name
                    : farmInfo?.name || 'هيكل المزرعة'}
                </h1>
                {/* Subtitle: type + count */}
                <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  {currentParent
                    ? `${getTypeLabel(currentParent.type)} · ${currentLevelNodes.length} عنصر`
                    : `${tree.length} قطاع`}
                </p>
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={handleOpenAdd}
              id="btn-add-node"
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold h-9 px-4 sm:px-5 shadow-md shadow-emerald-600/20 active:scale-95 transition-transform text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">إضافة {addButtonLabel}</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          </div>

          {/* ── Breadcrumb Row ──────────────────────────────────────────── */}
          <div className="px-4 sm:px-6 pb-2 overflow-x-auto no-scrollbar">
            <nav
              aria-label="مسار التنقل"
              className="flex items-center gap-1 whitespace-nowrap text-xs"
            >
              {/* Farm root */}
              <button
                onClick={() => navigateToLevel(-1)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-colors
                  ${path.length === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
              >
                <Home className="w-3 h-3 shrink-0" />
                <span>{farmInfo?.name || 'المزرعة'}</span>
              </button>

              {path.map((node, index) => {
                const isCurrent = index === path.length - 1
                const m = TYPE_META[node.type]
                return (
                  <React.Fragment key={node.id}>
                    <ChevronLeft className="w-3 h-3 text-slate-300 shrink-0" />
                    <button
                      onClick={() => navigateToLevel(index)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition-colors
                        ${isCurrent
                          ? `${m?.levelBg} ${m?.levelText}`
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {isCurrent && m && (
                        <span className={`w-1.5 h-1.5 rounded-full ${m.levelDot} shrink-0`} />
                      )}
                      <NodeIcon type={node.type} className="w-3 h-3 shrink-0" />
                      <span className="max-w-[100px] sm:max-w-[160px] truncate">{node.name}</span>
                    </button>
                  </React.Fragment>
                )
              })}
            </nav>
          </div>

          {/* ── Level Progress Indicator ────────────────────────────────── */}
          <div className="px-4 sm:px-6 pb-2.5">
            <LevelProgressBar path={path} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CARDS AREA
      ════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">

          {/* Loading skeletons */}
          {loading && (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          )}

          {/* Error state */}
          {!loading && fetchErr && (
            <ErrorState onRetry={fetchData} />
          )}

          {/* Empty state */}
          {!loading && !fetchErr && currentLevelNodes.length === 0 && (
            <EmptyState
              levelType={currentParent?.type ?? null}
              onAdd={handleOpenAdd}
            />
          )}

          {/* Node cards */}
          {!loading && !fetchErr && currentLevelNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onNavigate={handleNodeClick}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ADD / EDIT DIALOG
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!formLoading) setModalOpen(v) }}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5 sm:p-6"
          dir="rtl"
        >
          <DialogHeader className="text-right space-y-1 mb-1">
            <DialogTitle className="text-lg font-black text-slate-800">
              {editMode ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editMode
                ? `تعديل اسم ${getTypeLabel(currentNode?.type ?? NT.SECTOR)}`
                : currentParent
                  ? `إضافة عنصر داخل: ${currentParent.name}`
                  : 'إضافة قطاع جديد في المزرعة'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Type selector */}
            {showTypeSelect && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="select-node-type" className="text-xs font-bold text-slate-600">
                  نوع العنصر
                </label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val })}
                  dir="rtl"
                >
                  <SelectTrigger
                    id="select-node-type"
                    className="h-10 rounded-xl text-sm font-medium"
                  >
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="rounded-xl">
                    {availableTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-node-name" className="text-xs font-bold text-slate-600">
                الاسم <span className="text-rose-500">*</span>
              </label>
              <Input
                id="input-node-name"
                autoFocus
                placeholder={`اسم ${getTypeLabel(form.type)}...`}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value })
                  if (nameError) setNameError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && form.name.trim() && handleSave()}
                className={`h-10 rounded-xl text-sm font-medium text-right transition-colors
                  ${nameError ? 'border-rose-400 focus-visible:ring-rose-300' : ''}`}
              />
              {nameError && (
                <p className="flex items-center gap-1 text-xs text-rose-500 font-medium animate-in fade-in duration-150">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {nameError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={formLoading}
              className="rounded-xl font-bold w-full sm:w-auto border-slate-200 hover:bg-slate-50"
            >
              إلغاء
            </Button>
            <Button
              id="btn-save-node"
              onClick={handleSave}
              disabled={formLoading || !form.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold w-full sm:w-auto gap-2 shadow-md shadow-emerald-600/20"
            >
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {formLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          DELETE CONFIRM
      ════════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5 sm:p-6"
          dir="rtl"
        >
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-base font-black text-slate-800 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed mt-2">
              هل أنت متأكد من حذف{' '}
              <strong className="font-black text-slate-700">{pendingDeleteNode?.name}</strong>؟{' '}
              سيتم حذف جميع العناصر التابعة نهائياً ولا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl font-bold w-full sm:w-auto border-slate-200 hover:bg-slate-50"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-delete"
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold w-full sm:w-auto shadow-md shadow-rose-600/20"
            >
              نعم، احذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

export default FarmStructure
