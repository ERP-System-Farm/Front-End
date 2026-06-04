import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Warehouse as WarehouseIcon,
  Search,
  Inbox,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  Activity,
  BarChart3,
  ShieldAlert,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

import {
  getWarehouses,
  getItems,
  getMovements,
} from '../../features/warehouse/services'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ─── Constants ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10
const LOW_STOCK_THRESHOLD = 10

const CATEGORIES = {
  tools: { label: 'المعدات والأدوات', color: 'bg-blue-100 text-blue-700' },
  pesticides: { label: 'المبيدات', color: 'bg-rose-100 text-rose-700' },
  fertilizers: { label: 'الأسمدة', color: 'bg-emerald-100 text-emerald-700' },
  crops: { label: 'المحاصيل', color: 'bg-amber-100 text-amber-700' },
  other: { label: 'أخرى', color: 'bg-slate-100 text-slate-700' },
}

// ─── Helper: Movement type badge ─────────────────────────────────────────────
const MovTypeBadge = ({ type }) => {
  const map = {
    IN: { label: 'وارد', cls: 'bg-emerald-100 text-emerald-700', Icon: ArrowDownLeft },
    OUT: { label: 'منصرف', cls: 'bg-rose-100 text-rose-700', Icon: ArrowUpRight },
    RETURNED: { label: 'مرتجع', cls: 'bg-blue-100 text-blue-700', Icon: ArrowDownLeft },
    DAMAGED: { label: 'هالك', cls: 'bg-slate-100 text-slate-600', Icon: ArrowUpRight },
  }
  const m = map[type]
  if (!m) return <span className="text-slate-400 text-xs">—</span>
  return (
    <Badge className={`${m.cls} border-0 rounded-lg font-black text-xs gap-1 hover:${m.cls}`}>
      <m.Icon className="w-3 h-3" />
      {m.label}
    </Badge>
  )
}

// ─── Helper: KPI stat card ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg, border }) => (
  <Card className={`rounded-2xl border ${border} ${bg} shadow-sm hover:-translate-y-0.5 transition-transform`}>
    <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${bg} flex items-center justify-center ${color} shrink-0 border ${border}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold ${color} truncate`}>{label}</p>
        <p className={`text-xl sm:text-2xl font-black text-slate-800 leading-tight`}>{value}</p>
      </div>
    </CardContent>
  </Card>
)

// ─── Helper: Inline pagination ────────────────────────────────────────────────
const InlinePagination = ({ page, totalPages, total, label, onPrev, onNext }) => (
  <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-500">
    <span>
      صفحة {page} من {totalPages} ({total} {label})
    </span>
    <div className="flex gap-2" dir="ltr">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={onPrev}
        className="rounded-lg h-7 w-7 p-0 border-slate-200 flex items-center justify-center"
        aria-label="السابق"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={onNext}
        className="rounded-lg h-7 w-7 p-0 border-slate-200 flex items-center justify-center"
        aria-label="التالي"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const WarehouseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [warehouse, setWarehouse] = useState(null)
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination
  const [itemsPage, setItemsPage] = useState(1)
  const [movementsPage, setMovementsPage] = useState(1)

  // Search
  const [itemSearch, setItemSearch] = useState('')
  const [movSearch, setMovSearch] = useState('')

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [warehousesList, allItems, allMovements] = await Promise.all([
        getWarehouses(),
        getItems(),
        getMovements(),
      ])

      const extractArray = (res) => {
        const data = res?.data || res
        return data?.results || (Array.isArray(data) ? data : [])
      }

      const wList = extractArray(warehousesList)
      const iList = extractArray(allItems)
      const mList = extractArray(allMovements)

      const wh = wList.find(w => String(w.id) === String(id))
      if (!wh) {
        toast.error('لم يتم العثور على المستودع')
        navigate('/warehouse')
        return
      }
      setWarehouse(wh)

      const warehouseItems = iList.filter(item => String(item.warehouse) === String(id))
      setItems(warehouseItems)

      const warehouseItemIds = new Set(warehouseItems.map(i => String(i.id)))
      const warehouseMovements = mList.filter(m => warehouseItemIds.has(String(m.item)))
      // Sort newest first
      warehouseMovements.sort((a, b) => new Date(b.date) - new Date(a.date))
      setMovements(warehouseMovements)
    } catch (err) {
      console.error('Error loading warehouse details:', err)
      setError('فشل تحميل بيانات المستودع')
      toast.error('فشل تحميل بيانات المستودع')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  // ── Derived data ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() =>
    items.filter(i => i.name?.toLowerCase().includes(itemSearch.toLowerCase())),
    [items, itemSearch]
  )
  const itemsTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const pagedItems = filteredItems.slice((itemsPage - 1) * ITEMS_PER_PAGE, itemsPage * ITEMS_PER_PAGE)

  const filteredMovements = useMemo(() =>
    movements.filter(m =>
      (m.item_name || '').toLowerCase().includes(movSearch.toLowerCase()) ||
      (m.note || '').toLowerCase().includes(movSearch.toLowerCase()) ||
      (m.user_name || '').toLowerCase().includes(movSearch.toLowerCase()) ||
      (m.responsible_user_name || '').toLowerCase().includes(movSearch.toLowerCase())
    ),
    [movements, movSearch]
  )
  const movsTotalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const pagedMovements = filteredMovements.slice((movementsPage - 1) * ITEMS_PER_PAGE, movementsPage * ITEMS_PER_PAGE)

  // KPI stats
  const totalItems = items.length
  const lowStockItems = items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < LOW_STOCK_THRESHOLD)
  const outOfStockItems = items.filter(i => Number(i.quantity) <= 0)
  const totalMovements = movements.length

  // Recent activity = last 10 movements (already sorted newest first)
  const recentActivity = movements.slice(0, 10)

  // Top inventory items by quantity
  const topItems = [...items].sort((a, b) => Number(b.quantity) - Number(a.quantity)).slice(0, 5)
  const maxQty = topItems[0] ? Math.max(...topItems.map(i => Number(i.quantity))) : 1

  // Last updated = most recent movement date
  const lastUpdated = movements.length > 0
    ? new Date(movements[0].date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-7 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 sm:h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400" dir="rtl">
        <AlertTriangle className="w-12 h-12 text-rose-400" />
        <p className="font-bold text-lg text-slate-600">{error}</p>
        <Button onClick={fetchData} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
          <RefreshCw className="w-4 h-4 ml-2" /> إعادة المحاولة
        </Button>
      </div>
    )
  }

  if (!warehouse) return null

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-5" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/warehouse')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-all shrink-0"
            aria-label="العودة"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">مستودع</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-bold text-emerald-600">{warehouse.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2 mt-0.5">
              <WarehouseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
              {warehouse.name}
            </h1>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          className="rounded-xl border-slate-200 font-bold h-9 px-3 sm:px-4 text-slate-600 hover:bg-slate-50 gap-2 text-xs sm:text-sm flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* ── Section 1: General Information ────────────────────────────────── */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60">
          <CardTitle className="text-sm font-black text-slate-700 flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            المعلومات العامة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x-reverse sm:divide-x divide-slate-100">
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <WarehouseIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">اسم المستودع</p>
                <p className="text-sm font-bold text-slate-800 truncate">{warehouse.name}</p>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">الموقع</p>
                <p className="text-sm font-bold text-slate-800 truncate">{warehouse.location || 'غير محدد'}</p>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">الحالة</p>
                <Badge className={`text-xs font-black border-0 rounded-lg mt-0.5 ${totalItems > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {totalItems > 0 ? 'نشط' : 'فارغ'}
                </Badge>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">آخر تحديث</p>
                <p className="text-sm font-bold text-slate-800">{lastUpdated}</p>
              </div>
            </div>
            <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">آخر مستخدم</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {movements.length > 0 ? (movements[0].user_name || '—') : '—'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Inventory Statistics (KPI Cards) ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Package}
          label="إجمالي الأصناف"
          value={totalItems}
          color="text-blue-600"
          bg="bg-blue-50/60"
          border="border-blue-100"
        />
        <StatCard
          icon={AlertTriangle}
          label="مخزون منخفض"
          value={lowStockItems.length}
          color="text-amber-600"
          bg="bg-amber-50/60"
          border="border-amber-100"
        />
        <StatCard
          icon={TrendingDown}
          label="نفد من المخزون"
          value={outOfStockItems.length}
          color="text-rose-600"
          bg="bg-rose-50/60"
          border="border-rose-100"
        />
        <StatCard
          icon={BarChart3}
          label="إجمالي الحركات"
          value={totalMovements}
          color="text-emerald-600"
          bg="bg-emerald-50/60"
          border="border-emerald-100"
        />
      </div>

      {/* ── Section 3: Recent Activity ─────────────────────────────────────── */}
      <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
          <CardTitle className="text-sm font-black text-slate-700">
            آخر {recentActivity.length} حركة مخزنية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Inbox className="w-10 h-10 opacity-20" />
              <p className="text-sm font-bold">لا توجد حركات مسجلة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-black text-slate-600 text-right pr-4 sm:pr-5 text-xs whitespace-nowrap">النوع</TableHead>
                    <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap">الصنف</TableHead>
                    <TableHead className="font-black text-slate-600 text-center text-xs whitespace-nowrap">الكمية</TableHead>
                    <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap hidden sm:table-cell">المستخدم</TableHead>
                    <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="font-black text-slate-600 text-right pl-4 sm:pl-5 text-xs whitespace-nowrap hidden md:table-cell">الوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map(mov => {
                    const d = mov.date ? new Date(mov.date) : null
                    const isPositive = ['IN', 'RETURNED'].includes(mov.movement_type)
                    return (
                      <TableRow key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                        <TableCell className="pr-4 sm:pr-5 py-2.5">
                          <MovTypeBadge type={mov.movement_type} />
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 text-sm py-2.5 max-w-[120px] sm:max-w-none truncate">
                          {mov.item_name || '—'}
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <span className={`font-black text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isPositive ? '+' : '-'}{parseFloat(mov.quantity).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-slate-500 text-sm py-2.5 hidden sm:table-cell">
                          {mov.responsible_user_name || mov.user_name || '—'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-500 text-xs py-2.5 whitespace-nowrap">
                          {d ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell className="pl-4 sm:pl-5 font-bold text-slate-400 text-xs py-2.5 hidden md:table-cell whitespace-nowrap">
                          {d ? d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 4 & 5 + Full Tabs ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Section 4: Inventory Overview (Top Items) */}
        <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <CardTitle className="text-sm font-black text-slate-700">أعلى الأصناف كمية</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <Inbox className="w-8 h-8 opacity-20" />
                <p className="text-xs font-bold">لا توجد أصناف</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topItems.map((item, idx) => {
                  const qty = Number(item.quantity)
                  const pct = maxQty > 0 ? Math.round((qty / maxQty) * 100) : 0
                  const isLow = qty > 0 && qty < LOW_STOCK_THRESHOLD
                  const isOut = qty <= 0
                  return (
                    <div key={item.id} className="px-4 py-3 flex flex-col gap-1 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">#{idx + 1}</span>
                          <span className="text-sm font-bold text-slate-800 truncate">{item.name}</span>
                        </div>
                        <span className={`text-sm font-black shrink-0 ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {qty.toLocaleString()}
                          <span className="text-[10px] font-bold text-slate-400 mr-1">{item.unit || ''}</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isOut ? 'bg-rose-400' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Warehouse Health */}
        <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <CardTitle className="text-sm font-black text-slate-700">صحة المستودع والتنبيهات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-emerald-700">المخزون في حالة جيدة</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">لا توجد تنبيهات حالية</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto">
                {outOfStockItems.map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-rose-50/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-rose-600">نفد من المخزون</p>
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 border-0 rounded-lg text-xs font-black hover:bg-rose-100 shrink-0">0</Badge>
                  </div>
                ))}
                {lowStockItems.map(item => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-amber-50/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-amber-600">مخزون منخفض</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-0 rounded-lg text-xs font-black hover:bg-amber-100 shrink-0">
                      {Number(item.quantity).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Full Data Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="bg-slate-100 rounded-xl p-1 mb-4 gap-1 h-auto w-full sm:w-auto">
          <TabsTrigger
            value="items"
            className="rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-5 h-9 flex-1 sm:flex-none"
          >
            <Package className="w-3.5 h-3.5 ml-1.5 hidden sm:inline" />
            الأصناف ({totalItems})
          </TabsTrigger>
          <TabsTrigger
            value="movements"
            className="rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 sm:px-5 h-9 flex-1 sm:flex-none"
          >
            <Activity className="w-3.5 h-3.5 ml-1.5 hidden sm:inline" />
            الحركات ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-black text-slate-800">جميع أصناف المستودع</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="بحث في الأصناف..."
                  value={itemSearch}
                  onChange={e => { setItemSearch(e.target.value); setItemsPage(1) }}
                  className="pr-9 h-8 rounded-xl text-sm border-slate-200 font-bold text-right"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pagedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
                  <Inbox className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-bold">لا توجد أصناف</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-black text-slate-600 text-right pr-4 sm:pr-5 text-xs whitespace-nowrap">الصنف</TableHead>
                          <TableHead className="font-black text-slate-600 text-center text-xs whitespace-nowrap hidden sm:table-cell">الفئة</TableHead>
                          <TableHead className="font-black text-slate-600 text-center text-xs whitespace-nowrap">الكمية</TableHead>
                          <TableHead className="font-black text-slate-600 text-center text-xs whitespace-nowrap hidden sm:table-cell">الوحدة</TableHead>
                          <TableHead className="font-black text-slate-600 text-right pl-4 sm:pl-5 text-xs whitespace-nowrap hidden md:table-cell">آخر تحديث</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedItems.map(item => {
                          const qty = Number(item.quantity)
                          const isLow = qty > 0 && qty < LOW_STOCK_THRESHOLD
                          const isOut = qty <= 0
                          const cat = CATEGORIES[item.category]
                          return (
                            <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                              <TableCell className="font-bold text-slate-800 pr-4 sm:pr-5 text-sm py-3">
                                <div className="flex flex-col">
                                  <span>{item.name}</span>
                                  {/* Show category inline on mobile */}
                                  <span className="sm:hidden text-xs font-bold text-slate-400 mt-0.5">
                                    {cat?.label || item.category || '—'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-3 hidden sm:table-cell">
                                <Badge variant="secondary" className={`${cat?.color || 'bg-slate-100 text-slate-600'} font-bold text-xs rounded-lg border-0`}>
                                  {cat?.label || item.category || '—'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className={`font-black text-base ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                                  {qty.toLocaleString()}
                                </span>
                                {isLow && <span className="mr-1 text-[10px] text-amber-500">⚠</span>}
                                {isOut && <span className="mr-1 text-[10px] text-rose-500">!</span>}
                              </TableCell>
                              <TableCell className="text-center font-bold text-slate-500 text-sm py-3 hidden sm:table-cell">{item.unit || '—'}</TableCell>
                              <TableCell className="text-right pl-4 sm:pl-5 text-xs font-bold text-slate-400 py-3 hidden md:table-cell">
                                {item.updated_by_name || '—'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {itemsTotalPages > 1 && (
                    <InlinePagination
                      page={itemsPage}
                      totalPages={itemsTotalPages}
                      total={filteredItems.length}
                      label="صنف"
                      onPrev={() => setItemsPage(p => p - 1)}
                      onNext={() => setItemsPage(p => p + 1)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements">
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-black text-slate-800">سجل الحركات الكامل</CardTitle>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="بحث في الحركات..."
                  value={movSearch}
                  onChange={e => { setMovSearch(e.target.value); setMovementsPage(1) }}
                  className="pr-9 h-8 rounded-xl text-sm border-slate-200 font-bold text-right"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pagedMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2">
                  <Inbox className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-bold">لا توجد حركات</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-black text-slate-600 text-right pr-4 sm:pr-5 text-xs whitespace-nowrap">النوع</TableHead>
                          <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap">الصنف</TableHead>
                          <TableHead className="font-black text-slate-600 text-center text-xs whitespace-nowrap">الكمية</TableHead>
                          <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap hidden sm:table-cell">المسؤول</TableHead>
                          <TableHead className="font-black text-slate-600 text-right text-xs whitespace-nowrap hidden md:table-cell">ملاحظة</TableHead>
                          <TableHead className="font-black text-slate-600 text-right pl-4 sm:pl-5 text-xs whitespace-nowrap">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedMovements.map(mov => {
                          const d = mov.date ? new Date(mov.date) : null
                          const isPositive = ['IN', 'RETURNED'].includes(mov.movement_type)
                          return (
                            <TableRow key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                              <TableCell className="pr-4 sm:pr-5 py-3">
                                <MovTypeBadge type={mov.movement_type} />
                              </TableCell>
                              <TableCell className="font-bold text-slate-800 text-sm py-3 max-w-[100px] sm:max-w-none truncate">
                                {mov.item_name || '—'}
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className={`font-black text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isPositive ? '+' : '-'}{parseFloat(mov.quantity).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="font-bold text-slate-500 text-sm py-3 hidden sm:table-cell">
                                {mov.responsible_user_name || mov.user_name || '—'}
                              </TableCell>
                              <TableCell className="text-slate-400 font-bold text-xs py-3 max-w-[140px] truncate hidden md:table-cell">
                                {mov.note || '—'}
                              </TableCell>
                              <TableCell className="pl-4 sm:pl-5 font-bold text-slate-500 text-xs py-3 whitespace-nowrap">
                                {d ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {movsTotalPages > 1 && (
                    <InlinePagination
                      page={movementsPage}
                      totalPages={movsTotalPages}
                      total={filteredMovements.length}
                      label="حركة"
                      onPrev={() => setMovementsPage(p => p - 1)}
                      onNext={() => setMovementsPage(p => p + 1)}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WarehouseDetails
