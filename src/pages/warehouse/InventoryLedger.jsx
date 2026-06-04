import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  Package,
  History,
  MoreVertical,
  Edit,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Loader2,
  Inbox,
  LayoutGrid,
  List as ListIcon,
  BellRing,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getMovements,
  createMovement,
  getEngineers
} from '../../features/warehouse/services'

import LocationSelect from '@/components/LocationSelect'
import { reportsApi } from '../../services/reportsApi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10

const CATEGORIES = [
  { id: 'tools', label: 'المعدات والأدوات', color: 'bg-blue-100 text-blue-700' },
  { id: 'pesticides', label: 'المبيدات', color: 'bg-rose-100 text-rose-700' },
  { id: 'fertilizers', label: 'الأسمدة', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'crops', label: 'المحاصيل', color: 'bg-amber-100 text-amber-700' },
  { id: 'other', label: 'أخرى', color: 'bg-slate-100 text-slate-700' },
]

const MOVEMENT_TYPES = [
  { id: 'all', label: 'جميع الأنواع' },
  { id: 'IN', label: 'وارد' },
  { id: 'OUT', label: 'منصرف' },
  { id: 'RETURNED', label: 'مرتجع' },
  { id: 'DAMAGED', label: 'هالك' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MovTypeBadge = ({ type }) => {
  if (type === 'IN') return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg gap-1 border-0 text-xs">
      <ArrowDownLeft className="w-3 h-3" /> وارد
    </Badge>
  )
  if (type === 'OUT') return (
    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-lg gap-1 border-0 text-xs">
      <ArrowUpRight className="w-3 h-3" /> منصرف
    </Badge>
  )
  if (type === 'RETURNED') return (
    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg gap-1 border-0 text-xs">
      <ArrowDownLeft className="w-3 h-3" /> مرتجع
    </Badge>
  )
  if (type === 'DAMAGED') return (
    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-lg gap-1 border-0 text-xs">
      <ArrowUpRight className="w-3 h-3" /> هالك
    </Badge>
  )
  return null
}

// Inline pagination used in both tabs
const InlinePagination = ({ page, totalPages, total, label, onPrev, onNext }) => (
  <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-500">
    <span>صفحة {page} من {totalPages} ({total} {label})</span>
    <div className="flex gap-2" dir="ltr">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}
        className="rounded-lg h-7 w-7 p-0 border-slate-200">
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}
        className="rounded-lg h-7 w-7 p-0 border-slate-200">
        <ChevronLeft className="w-4 h-4" />
      </Button>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const InventoryLedger = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'inventory')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [movements, setMovements] = useState([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'

  // ── Inventory pagination ──────────────────────────────────────────────────
  const [inventoryPage, setInventoryPage] = useState(1)

  // ── Movement filters ──────────────────────────────────────────────────────
  const [movSearch, setMovSearch] = useState('')
  const [movType, setMovType] = useState('all')
  const [movDateFrom, setMovDateFrom] = useState('')
  const [movDateTo, setMovDateTo] = useState('')
  const [movWarehouse, setMovWarehouse] = useState('all')
  const [movItemFilter, setMovItemFilter] = useState('all')
  const [movPage, setMovPage] = useState(1)
  const [showMovFilters, setShowMovFilters] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
    const searchVal = searchParams.get('search')
    if (searchVal) setSearchQuery(searchVal)
  }, [searchParams])

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [editingItem, setEditingItem] = useState(null)
  const [editingWarehouse, setEditingWarehouse] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteType, setDeleteType] = useState('item') // 'item' or 'warehouse'

  // Form states
  const [engineers, setEngineers] = useState([])
  const [units, setUnits] = useState([])
  const [itemForm, setItemForm] = useState({ name: '', category: 'tools', warehouse: '', unit: '' })
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '' })
  const [movementForm, setMovementForm] = useState({ item: '', movement_type: 'IN', quantity: '', note: '', location: null, other_location: '', responsible_user: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [iRes, wRes, mRes, eRes, uRes] = await Promise.allSettled([
        getItems(),
        getWarehouses(),
        getMovements(),
        getEngineers(),
        reportsApi.getUnits()
      ])

      const r = (res) => {
        if (res.status === 'rejected') return []
        const val = res.value
        const data = val?.data || val
        return data?.results || (Array.isArray(data) ? data : [])
      }

      setItems(r(iRes))
      setWarehouses(r(wRes))
      // Sort movements newest first
      const movs = r(mRes)
      movs.sort((a, b) => new Date(b.date) - new Date(a.date))
      setMovements(movs)
      setEngineers(r(eRes))
      setUnits(r(uRes))

      if (iRes.status === 'rejected') toast.error('خطأ في جلب قائمة الأصناف')
    } catch (err) {
      toast.error('حدث خطأ غير متوقع أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Inventory filtered + paged ────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [items, searchQuery, activeCategory])

  const inventoryTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const pagedItems = filteredItems.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE)

  // Reset inventory page on filter change
  useEffect(() => { setInventoryPage(1) }, [searchQuery, activeCategory])

  // ── Movement filtered + paged ─────────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      // Search
      const q = movSearch.toLowerCase()
      const searchMatch = !q || (
        (mov.item_name || '').toLowerCase().includes(q) ||
        (mov.note || '').toLowerCase().includes(q) ||
        (mov.responsible_user_name || '').toLowerCase().includes(q) ||
        (mov.user_name || '').toLowerCase().includes(q) ||
        (mov.location_name || '').toLowerCase().includes(q)
      )
      // Movement type
      const typeMatch = movType === 'all' || mov.movement_type === movType
      // Date range
      const movDate = mov.date ? new Date(mov.date) : null
      const dateFromMatch = !movDateFrom || (movDate && movDate >= new Date(movDateFrom))
      const dateToMatch = !movDateTo || (movDate && movDate <= new Date(movDateTo + 'T23:59:59'))
      // Warehouse filter — match via item's warehouse
      const warehouseMatch = movWarehouse === 'all' || (() => {
        const item = items.find(i => String(i.id) === String(mov.item))
        return item && String(item.warehouse) === movWarehouse
      })()
      // Item filter
      const itemMatch = movItemFilter === 'all' || String(mov.item) === movItemFilter

      return searchMatch && typeMatch && dateFromMatch && dateToMatch && warehouseMatch && itemMatch
    })
  }, [movements, movSearch, movType, movDateFrom, movDateTo, movWarehouse, movItemFilter, items])

  const movTotalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const pagedMovements = filteredMovements.slice((movPage - 1) * ITEMS_PER_PAGE, movPage * ITEMS_PER_PAGE)

  // Reset movement page on filter change
  useEffect(() => { setMovPage(1) }, [movSearch, movType, movDateFrom, movDateTo, movWarehouse, movItemFilter])

  // Active movement filter count (for badge)
  const activeMovFilters = [
    movType !== 'all',
    !!movDateFrom,
    !!movDateTo,
    movWarehouse !== 'all',
    movItemFilter !== 'all',
  ].filter(Boolean).length

  const clearMovFilters = () => {
    setMovType('all')
    setMovDateFrom('')
    setMovDateTo('')
    setMovWarehouse('all')
    setMovItemFilter('all')
    setMovSearch('')
  }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleSaveItem = async () => {
    try {
      const sanitizeId = (val) => (val && val !== 'null' ? val : null)
      const payload = { ...itemForm, warehouse: sanitizeId(itemForm.warehouse) }
      if (editingItem) {
        await updateItem(editingItem.id, payload)
        toast.success('تم تحديث الصنف بنجاح')
      } else {
        await createItem(payload)
        toast.success('تم إضافة الصنف بنجاح')
      }
      setIsItemModalOpen(false)
      setEditingItem(null)
      setItemForm({ name: '', category: 'tools', warehouse: '', unit: '' })
      fetchData()
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const errorMsg = errorData.name || errorData.company || errorData.non_field_errors || errorData.detail || 'حدث خطأ أثناء الحفظ'
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg)
      } else {
        toast.error('حدث خطأ أثناء الحفظ')
      }
    }
  }

  const handleSaveWarehouse = async () => {
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, warehouseForm)
        toast.success('تم تحديث المستودع بنجاح')
      } else {
        await createWarehouse(warehouseForm)
        toast.success('تم إضافة المستودع بنجاح')
      }
      setIsWarehouseModalOpen(false)
      setEditingWarehouse(null)
      setWarehouseForm({ name: '', location: '' })
      fetchData()
    } catch (err) {
      const errorData = err.response?.data
      if (errorData) {
        const errorMsg = errorData.name || errorData.company || errorData.non_field_errors || errorData.detail || 'حدث خطأ أثناء الحفظ'
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg)
      } else {
        toast.error('حدث خطأ أثناء الحفظ')
      }
    }
  }

  const handleSaveMovement = async () => {
    try {
      const sanitizeId = (val) => (val && val !== 'null' ? val : null)
      const payload = {
        ...movementForm,
        item: sanitizeId(movementForm.item),
        location: sanitizeId(movementForm.location),
        responsible_user: sanitizeId(movementForm.responsible_user)
      }
      if (payload.location === 'OTHER') {
        payload.location = null
      } else {
        payload.other_location = ''
      }
      await createMovement(payload)
      toast.success('تم تسجيل الحركة بنجاح')
      setIsMovementModalOpen(false)
      setMovementForm({ item: '', movement_type: 'IN', quantity: '', note: '', location: null, other_location: '', responsible_user: '' })
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.quantity || 'حدث خطأ أثناء تسجيل الحركة'
      toast.error(msg)
    }
  }

  const confirmDelete = async () => {
    try {
      if (deleteType === 'item') {
        await deleteItem(deletingId)
      } else {
        await deleteWarehouse(deletingId)
      }
      toast.success('تم الحذف بنجاح')
      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (err) {
      toast.error('لا يمكن الحذف لوجود بيانات مرتبطة')
    }
  }

  const openEditItem = (item) => {
    setEditingItem(item)
    setItemForm({ name: item.name, category: item.category, warehouse: item.warehouse || '', unit: item.unit || '' })
    setIsItemModalOpen(true)
  }

  const openEditWarehouse = (w) => {
    setEditingWarehouse(w)
    setWarehouseForm({ name: w.name, location: w.location })
    setIsWarehouseModalOpen(true)
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 md:p-8 bg-slate-50 min-h-screen" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
              <div className="bg-emerald-600 p-1.5 sm:p-2 rounded-xl text-white shrink-0">
                <WarehouseIcon className="w-5 h-5 sm:w-7 sm:h-7" />
              </div>
              إدارة المستودعات
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium hidden sm:block">نظام متقدم لتتبع الأصناف، الحركات، والعمليات اللوجستية</p>
          </div>
          {/* Desktop action buttons */}
          <div className="hidden md:flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 font-bold h-10"
              onClick={() => navigate('/warehouse/alerts')}
            >
              <BellRing className="w-4 h-4 ml-2 text-amber-500 animate-pulse" />
              التنبيهات
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold h-10"
              onClick={() => setIsWarehouseModalOpen(true)}
            >
              <WarehouseIcon className="w-4 h-4 ml-2" />
              إضافة مستودع
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold h-10"
              onClick={() => {
                setEditingItem(null)
                setItemForm({ name: '', category: 'tools', warehouse: '', unit: '' })
                setIsItemModalOpen(true)
              }}
            >
              <Plus className="w-4 h-4 ml-2" />
              صنف جديد
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 rounded-xl font-bold px-5 h-10"
              onClick={() => setIsMovementModalOpen(true)}
            >
              <History className="w-4 h-4 ml-2" />
              تسجيل حركة
            </Button>
          </div>
        </div>
        {/* Mobile action buttons — compact row */}
        <div className="flex gap-2 md:hidden overflow-x-auto pb-1 no-scrollbar">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shrink-0 h-9"
            onClick={() => setIsMovementModalOpen(true)}
          >
            <History className="w-3.5 h-3.5 ml-1.5" />
            حركة
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-emerald-200 text-emerald-700 font-bold shrink-0 h-9"
            onClick={() => {
              setEditingItem(null)
              setItemForm({ name: '', category: 'tools', warehouse: '', unit: '' })
              setIsItemModalOpen(true)
            }}
          >
            <Plus className="w-3.5 h-3.5 ml-1.5" />
            صنف
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl font-bold shrink-0 h-9"
            onClick={() => setIsWarehouseModalOpen(true)}
          >
            <WarehouseIcon className="w-3.5 h-3.5 ml-1.5" />
            مستودع
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-amber-200 text-amber-700 font-bold shrink-0 h-9"
            onClick={() => navigate('/warehouse/alerts')}
          >
            <BellRing className="w-3.5 h-3.5 ml-1.5 animate-pulse" />
            تنبيهات
          </Button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 sm:space-y-6" dir="rtl">
        <div className="flex flex-col gap-3">
          {/* Tabs + search row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="overflow-x-auto no-scrollbar">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm inline-flex min-w-max">
                <TabsTrigger value="inventory" className="rounded-lg px-4 sm:px-6 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold h-9 sm:h-10 whitespace-nowrap">
                  <Package className="w-3.5 h-3.5 ml-1.5" />
                  المخزون الحالي
                </TabsTrigger>
                <TabsTrigger value="movements" className="rounded-lg px-4 sm:px-6 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold h-9 sm:h-10 whitespace-nowrap">
                  <History className="w-3.5 h-3.5 ml-1.5" />
                  سجل الحركات
                </TabsTrigger>
                <TabsTrigger value="warehouses" className="rounded-lg px-4 sm:px-6 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold h-9 sm:h-10 whitespace-nowrap">
                  <WarehouseIcon className="w-3.5 h-3.5 ml-1.5" />
                  المستودعات
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Search + view toggle — only for inventory tab */}
            {activeTab === 'inventory' && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56 sm:flex-none">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="بحث سريع..."
                    className="pr-10 rounded-xl border-slate-200 bg-white h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm shrink-0">
                  <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon"
                    className="rounded-lg h-7 w-7" onClick={() => setViewMode('table')}>
                    <ListIcon className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon"
                    className="rounded-lg h-7 w-7" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── INVENTORY TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="inventory" className="mt-0">
          <div className="flex flex-col gap-4">
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap overflow-x-auto no-scrollbar pb-1">
              <Button
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className={`rounded-full px-4 sm:px-6 h-8 sm:h-9 font-bold text-xs sm:text-sm shrink-0 ${activeCategory === 'all' ? 'bg-emerald-600' : 'border-slate-200'}`}
                onClick={() => setActiveCategory('all')}
              >
                الكل
                <span className="mr-1.5 text-[10px] opacity-70">({items.length})</span>
              </Button>
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  className={`rounded-full px-4 sm:px-6 h-8 sm:h-9 font-bold text-xs sm:text-sm shrink-0 ${activeCategory === cat.id ? 'bg-emerald-600' : 'border-slate-200'}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {filteredItems.length === 0
                  ? 'لا توجد نتائج'
                  : `عرض ${Math.min((inventoryPage - 1) * ITEMS_PER_PAGE + 1, filteredItems.length)}–${Math.min(inventoryPage * ITEMS_PER_PAGE, filteredItems.length)} من ${filteredItems.length} صنف`}
              </span>
            </div>

            {viewMode === 'table' ? (
              <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="text-right font-bold py-3 pr-4 sm:pr-5 text-xs sm:text-sm whitespace-nowrap">الصنف</TableHead>
                        <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">التصنيف</TableHead>
                        <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">المستودع</TableHead>
                        <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap">الرصيد</TableHead>
                        <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">آخر تحديث</TableHead>
                        <TableHead className="text-left font-bold text-xs sm:text-sm pl-4 sm:pl-5 whitespace-nowrap">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <Inbox className="w-10 h-10 mb-3 opacity-20" />
                              <p className="font-medium text-sm">لا توجد أصناف تطابق البحث</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedItems.map(item => (
                          <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-bold text-slate-800 pr-4 sm:pr-5 py-3 text-sm">
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                {/* Warehouse on mobile */}
                                <span className="md:hidden text-[11px] font-bold text-slate-400 mt-0.5">
                                  {warehouses.find(w => w.id === item.warehouse)?.name || 'غير محدد'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell py-3">
                              <Badge variant="secondary" className={`${CATEGORIES.find(c => c.id === item.category)?.color} rounded-lg border-0 px-2 py-0.5 text-xs font-bold`}>
                                {CATEGORIES.find(c => c.id === item.category)?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 font-medium hidden md:table-cell py-3 text-sm">
                              {warehouses.find(w => w.id === item.warehouse)?.name || 'غير محدد'}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-base sm:text-lg font-black ${item.quantity > 0 ? 'text-slate-900' : 'text-rose-500'}`}>
                                  {parseFloat(item.quantity).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit || 'وحدة'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs hidden md:table-cell py-3">
                              {item.updated_by_name || 'النظام'}
                            </TableCell>
                            <TableCell className="pl-4 sm:pl-5 py-3">
                              <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-slate-100">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-40">
                                  <DropdownMenuItem onClick={() => openEditItem(item)} className="cursor-pointer gap-2 font-medium text-sm">
                                    <Edit className="w-4 h-4 text-slate-500" /> تعديل الصنف
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => { setDeletingId(item.id); setDeleteType('item'); setIsDeleteDialogOpen(true) }}
                                    className="cursor-pointer gap-2 font-medium text-rose-600 focus:text-rose-600 text-sm"
                                  >
                                    <Trash2 className="w-4 h-4" /> حذف نهائي
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {inventoryTotalPages > 1 && (
                  <InlinePagination
                    page={inventoryPage}
                    totalPages={inventoryTotalPages}
                    total={filteredItems.length}
                    label="صنف"
                    onPrev={() => setInventoryPage(p => p - 1)}
                    onNext={() => setInventoryPage(p => p + 1)}
                  />
                )}
              </Card>
            ) : (
              /* Grid View */
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pagedItems.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <Inbox className="w-12 h-12 opacity-20" />
                      <p className="font-medium">لا توجد أصناف تطابق البحث</p>
                    </div>
                  ) : (
                    pagedItems.map(item => (
                      <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all group rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                          <div className="space-y-1">
                            <Badge variant="outline" className={`${CATEGORIES.find(c => c.id === item.category)?.color} border-0 rounded-lg text-xs`}>
                              {CATEGORIES.find(c => c.id === item.category)?.label}
                            </Badge>
                            <CardTitle className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{item.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-xs">
                              <WarehouseIcon className="w-3 h-3" />
                              {warehouses.find(w => w.id === item.warehouse)?.name || 'غير محدد'}
                            </CardDescription>
                          </div>
                          <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => openEditItem(item)} className="gap-2 font-medium text-sm">
                                <Edit className="w-4 h-4" /> تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setDeletingId(item.id); setDeleteType('item'); setIsDeleteDialogOpen(true) }} className="gap-2 font-medium text-rose-600 focus:text-rose-600 text-sm">
                                <Trash2 className="w-4 h-4" /> حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-slate-50 p-3 rounded-xl flex items-end justify-between border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                            <div>
                              <p className="text-[10px] uppercase font-black text-slate-400 mb-1">الرصيد المتاح</p>
                              <span className={`text-2xl font-black ${item.quantity > 0 ? 'text-slate-900' : 'text-rose-500'}`}>
                                {parseFloat(item.quantity).toLocaleString()}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm uppercase">
                              {item.unit || 'وحدة'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                {inventoryTotalPages > 1 && (
                  <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <InlinePagination
                      page={inventoryPage}
                      totalPages={inventoryTotalPages}
                      total={filteredItems.length}
                      label="صنف"
                      onPrev={() => setInventoryPage(p => p - 1)}
                      onNext={() => setInventoryPage(p => p + 1)}
                    />
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── MOVEMENTS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="movements" className="mt-0">
          <div className="flex flex-col gap-3">
            {/* Search + Filter toggle row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="بحث في الحركات (الصنف، المستخدم، الملاحظة)..."
                  className="pr-10 rounded-xl border-slate-200 bg-white h-10 text-sm"
                  value={movSearch}
                  onChange={(e) => setMovSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`rounded-xl border-slate-200 font-bold h-10 gap-2 relative ${showMovFilters ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
                  onClick={() => setShowMovFilters(v => !v)}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">فلترة</span>
                  {activeMovFilters > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {activeMovFilters}
                    </span>
                  )}
                </Button>
                {(activeMovFilters > 0 || movSearch) && (
                  <Button variant="ghost" size="sm" onClick={clearMovFilters}
                    className="rounded-xl h-10 text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold gap-1">
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">مسح</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filter panel */}
            {showMovFilters && (
              <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Movement Type */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-wide">نوع الحركة</Label>
                      <Select dir="rtl" value={movType} onValueChange={setMovType}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {MOVEMENT_TYPES.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Warehouse */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-wide">المستودع</Label>
                      <Select dir="rtl" value={movWarehouse} onValueChange={setMovWarehouse}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-9 text-sm">
                          <SelectValue placeholder="جميع المستودعات" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">جميع المستودعات</SelectItem>
                          {warehouses.map(w => (
                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date From */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-wide">من تاريخ</Label>
                      <Input
                        type="date"
                        value={movDateFrom}
                        onChange={e => setMovDateFrom(e.target.value)}
                        className="rounded-xl border-slate-200 h-9 text-sm"
                      />
                    </div>

                    {/* Date To */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-wide">إلى تاريخ</Label>
                      <Input
                        type="date"
                        value={movDateTo}
                        onChange={e => setMovDateTo(e.target.value)}
                        className="rounded-xl border-slate-200 h-9 text-sm"
                      />
                    </div>

                    {/* Item filter */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                      <Label className="text-xs font-black text-slate-500 uppercase tracking-wide">الصنف</Label>
                      <Select dir="rtl" value={movItemFilter} onValueChange={setMovItemFilter}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-9 text-sm">
                          <SelectValue placeholder="جميع الأصناف" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-48">
                          <SelectItem value="all">جميع الأصناف</SelectItem>
                          {items.map(i => (
                            <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {filteredMovements.length === 0
                  ? 'لا توجد نتائج'
                  : `عرض ${Math.min((movPage - 1) * ITEMS_PER_PAGE + 1, filteredMovements.length)}–${Math.min(movPage * ITEMS_PER_PAGE, filteredMovements.length)} من ${filteredMovements.length} حركة`}
              </span>
            </div>

            {/* Movement Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-right font-bold py-3 pr-4 sm:pr-5 text-xs sm:text-sm whitespace-nowrap">الصنف</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap">النوع</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap">الكمية</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">مدخل البيانات</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">المسؤول</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">الموقع</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap">التاريخ</TableHead>
                      <TableHead className="text-right font-bold text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell pl-4 sm:pl-5">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <History className="w-10 h-10 mb-3 opacity-20" />
                            <p className="font-medium text-sm">لا توجد حركات تطابق الفلتر</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedMovements.map(mov => (
                        <TableRow key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-bold text-slate-800 pr-4 sm:pr-5 py-3 text-sm max-w-[120px] truncate">
                            {mov.item_name}
                          </TableCell>
                          <TableCell className="py-3">
                            <MovTypeBadge type={mov.movement_type} />
                          </TableCell>
                          <TableCell className="py-3">
                            <span className={`font-black text-sm ${['IN', 'RETURNED'].includes(mov.movement_type) ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {['IN', 'RETURNED'].includes(mov.movement_type) ? '+' : '-'} {parseFloat(mov.quantity).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-600 hidden sm:table-cell py-3 text-sm">{mov.user_name || 'النظام'}</TableCell>
                          <TableCell className="font-medium text-slate-600 hidden sm:table-cell py-3 text-sm">{mov.responsible_user_name || mov.user_name || '—'}</TableCell>
                          <TableCell className="font-medium text-slate-600 hidden lg:table-cell py-3 text-sm">{mov.location_name || mov.other_location || '—'}</TableCell>
                          <TableCell className="text-slate-400 text-xs py-3 whitespace-nowrap">
                            {new Date(mov.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-slate-500 italic text-xs hidden lg:table-cell pl-4 sm:pl-5 py-3">{mov.note || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {movTotalPages > 1 && (
                <InlinePagination
                  page={movPage}
                  totalPages={movTotalPages}
                  total={filteredMovements.length}
                  label="حركة"
                  onPrev={() => setMovPage(p => p - 1)}
                  onNext={() => setMovPage(p => p + 1)}
                />
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ── WAREHOUSES TAB ────────────────────────────────────────────────── */}
        <TabsContent value="warehouses" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(w => (
              <Card key={w.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 px-4 sm:px-5 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                      <WarehouseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">{w.name}</CardTitle>
                      <CardDescription className="text-xs">{w.location || 'بدون موقع محدد'}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEditWarehouse(w)} className="gap-2 font-medium text-sm">
                        <Edit className="w-4 h-4" /> تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setDeletingId(w.id); setDeleteType('warehouse'); setIsDeleteDialogOpen(true) }} className="gap-2 font-medium text-rose-600 focus:text-rose-600 text-sm">
                        <Trash2 className="w-4 h-4" /> حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4">
                  <div className="flex items-center justify-between text-slate-500">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-slate-400">إجمالي الأصناف</span>
                      <span className="text-2xl font-black text-slate-800">
                        {items.filter(i => i.warehouse === w.id).length}
                      </span>
                    </div>
                    {/* ── ISSUE 3 FIX: "View Details" button now navigates to details page ── */}
                    <Button
                      variant="ghost"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold gap-1"
                      onClick={() => navigate(`/warehouse/${w.id}`)}
                    >
                      عرض التفاصيل <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className="h-full min-h-[140px] sm:min-h-[160px] border-dashed border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-2xl flex flex-col gap-3 group transition-all"
              onClick={() => setIsWarehouseModalOpen(true)}
            >
              <div className="bg-slate-100 text-slate-400 p-3 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="font-bold text-slate-500 group-hover:text-emerald-700 text-sm">إضافة مستودع جديد</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {/* Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={(open) => { setIsItemModalOpen(open); if (!open) setEditingItem(null) }}>
        <DialogContent className="max-w-md rounded-2xl w-[calc(100vw-2rem)] sm:w-full" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات الصنف الأساسية لتتبعه في المخزون.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم الصنف</Label>
              <Input
                value={itemForm.name}
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="مثال: سماد نترات"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">التصنيف</Label>
                <Select dir="rtl" value={itemForm.category} onValueChange={v => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">وحدة القياس</Label>
                <Select dir="rtl" value={itemForm.unit} onValueChange={v => setItemForm({ ...itemForm, unit: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="اختر الوحدة" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {units.map(u => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                    <SelectItem value="unit">وحدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">المستودع الافتراضي</Label>
              <Select dir="rtl" value={itemForm.warehouse.toString()} onValueChange={v => setItemForm({ ...itemForm, warehouse: v })}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} className="rounded-xl font-bold">إلغاء</Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.name} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 h-11">
              {editingItem ? 'تحديث' : 'حفظ الصنف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Modal */}
      <Dialog open={isWarehouseModalOpen} onOpenChange={(open) => { setIsWarehouseModalOpen(open); if (!open) setEditingWarehouse(null) }}>
        <DialogContent className="max-w-md rounded-2xl w-[calc(100vw-2rem)] sm:w-full" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingWarehouse ? 'تعديل المستودع' : 'إضافة مستودع جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات موقع التخزين.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم المستودع / المخزن</Label>
              <Input
                value={warehouseForm.name}
                onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                placeholder="مثال: مخزن الأسمدة الرئيسي"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">الموقع / الوصف</Label>
              <Input
                value={warehouseForm.location}
                onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                placeholder="مثال: البوابة الشمالية"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsWarehouseModalOpen(false)} className="rounded-xl font-bold">إلغاء</Button>
            <Button onClick={handleSaveWarehouse} disabled={!warehouseForm.name} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 h-11">
              {editingWarehouse ? 'تحديث' : 'حفظ المستودع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Modal */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="max-w-md rounded-2xl w-[calc(100vw-2rem)] sm:w-full" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">تسجيل حركة مخزنية</DialogTitle>
            <DialogDescription>قم بتسجيل عمليات السحب أو الإضافة للمخزون.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">الصنف</Label>
              <Select dir="rtl" value={movementForm.item.toString()} onValueChange={v => setMovementForm({ ...movementForm, item: v })}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                  <SelectValue placeholder="اختر الصنف" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-52">
                  {items.map(i => (
                    <SelectItem key={i.id} value={i.id.toString()}>
                      {i.name} (المتاح: {i.quantity} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">نوع الحركة</Label>
                <Select dir="rtl" value={movementForm.movement_type} onValueChange={v => setMovementForm({ ...movementForm, movement_type: v })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="IN" className="text-emerald-600 font-bold">وارد (+)</SelectItem>
                    <SelectItem value="OUT" className="text-rose-600 font-bold">منصرف (-)</SelectItem>
                    <SelectItem value="RETURNED" className="text-blue-600 font-bold">مرتجع (+)</SelectItem>
                    <SelectItem value="DAMAGED" className="text-slate-600 font-bold">هالك/تالف (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">الكمية</Label>
                <Input
                  type="number"
                  value={movementForm.quantity}
                  onChange={e => setMovementForm({ ...movementForm, quantity: e.target.value })}
                  placeholder="0.00"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>

            {['OUT', 'RETURNED', 'DAMAGED'].includes(movementForm.movement_type) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">المستخدم المسؤول (اختياري)</Label>
                    <Select dir="rtl" value={movementForm.responsible_user?.toString() || ''} onValueChange={v => setMovementForm({ ...movementForm, responsible_user: v })}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue placeholder="اختر المسؤول" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-48">
                        {engineers.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">الموقع / الحوشة (اختياري)</Label>
                    <LocationSelect
                      value={movementForm.location}
                      onChange={v => setMovementForm({ ...movementForm, location: v })}
                    />
                  </div>
                </div>

                {movementForm.location === 'OTHER' && (
                  <div className="space-y-2">
                    <Label className="font-bold">اسم الموقع الآخر</Label>
                    <Input
                      value={movementForm.other_location || ''}
                      onChange={e => setMovementForm({ ...movementForm, other_location: e.target.value })}
                      className="h-11 rounded-xl"
                      placeholder="أدخل اسم الموقع خارج المزرعة"
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label className="font-bold">ملاحظات إضافية</Label>
              <Input
                value={movementForm.note}
                onChange={e => setMovementForm({ ...movementForm, note: e.target.value })}
                placeholder="سبب الحركة أو رقم المستند"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsMovementModalOpen(false)} className="rounded-xl font-bold">إلغاء</Button>
            <Button
              onClick={handleSaveMovement}
              disabled={!movementForm.item || !movementForm.quantity}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 h-11 shadow-lg shadow-emerald-100"
            >
              تسجيل الحركة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl w-[calc(100vw-2rem)] sm:w-full max-w-md" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="text-xl font-bold text-rose-600">تأكيد الحذف النهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا {deleteType === 'item' ? 'الصنف' : 'المستودع'}؟ لا يمكن التراجع عن هذا الإجراء وسيتم أرشفة البيانات المرتبطة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">تأكيد الحذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default InventoryLedger
