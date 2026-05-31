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
  Calendar
} from 'lucide-react'

import {
  getWarehouses,
  getItems,
  getMovements,
} from '../../features/warehouse/services'
import { useSnackbar } from '../../contexts/SnackbarContext'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const ITEMS_PER_PAGE = 10

const WarehouseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()

  const [warehouse, setWarehouse] = useState(null)
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination
  const [itemsPage, setItemsPage] = useState(1)
  const [movementsPage, setMovementsPage] = useState(1)

  // Search
  const [itemSearch, setItemSearch] = useState('')
  const [movSearch, setMovSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [warehousesList, allItems, allMovements] = await Promise.all([
        getWarehouses(),
        getItems(),
        getMovements(),
      ])

      const wh = (warehousesList || []).find(w => String(w.id) === String(id))
      if (!wh) {
        showSnackbar('لم يتم العثور على المخزن', 'error')
        navigate('/warehouse')
        return
      }
      setWarehouse(wh)

      // Filter items belonging to this warehouse
      const warehouseItems = (allItems || []).filter(item => String(item.warehouse) === String(id))
      setItems(warehouseItems)

      // Filter movements for items in this warehouse
      const warehouseItemIds = new Set(warehouseItems.map(i => String(i.id)))
      const warehouseMovements = (allMovements || []).filter(
        m => warehouseItemIds.has(String(m.item))
      )
      setMovements(warehouseMovements)
    } catch (err) {
      console.error('Error loading warehouse details:', err)
      showSnackbar('فشل تحميل بيانات المخزن', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  // Filtered + paginated items
  const filteredItems = useMemo(() =>
    items.filter(i => i.name?.toLowerCase().includes(itemSearch.toLowerCase())),
    [items, itemSearch]
  )
  const itemsTotalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const pagedItems = filteredItems.slice((itemsPage - 1) * ITEMS_PER_PAGE, itemsPage * ITEMS_PER_PAGE)

  // Filtered + paginated movements
  const filteredMovements = useMemo(() =>
    movements.filter(m =>
      (m.item_name || '').toLowerCase().includes(movSearch.toLowerCase()) ||
      (m.note || '').toLowerCase().includes(movSearch.toLowerCase())
    ),
    [movements, movSearch]
  )
  const movsTotalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const pagedMovements = filteredMovements.slice((movementsPage - 1) * ITEMS_PER_PAGE, movementsPage * ITEMS_PER_PAGE)

  // KPI Stats
  const totalItems = items.length
  const totalIn = movements.filter(m => m.movement_type === 'IN').reduce((s, m) => s + (Number(m.quantity) || 0), 0)
  const totalOut = movements.filter(m => m.movement_type === 'OUT').reduce((s, m) => s + (Number(m.quantity) || 0), 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6" dir="rtl">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!warehouse) return null

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">

      {/* ── Header ─────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/warehouse')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <WarehouseIcon className="w-6 h-6 text-emerald-600" />
              {warehouse.name}
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-0.5">
              تفاصيل المخزن وسجل الحركة الكاملة
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          className="rounded-xl border-slate-200 font-bold h-9 px-4 text-slate-600 hover:bg-slate-50 gap-2 text-sm flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          تحديث
        </Button>
      </div>

      {/* ── KPI Cards ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">إجمالي الأصناف</p>
              <p className="text-2xl font-black text-slate-800">{totalItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700">إجمالي الوارد</p>
              <p className="text-2xl font-black text-emerald-800">{totalIn.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-red-200 bg-red-50/50 shadow-sm hover:-translate-y-0.5 transition-transform">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-700">إجمالي الصادر</p>
              <p className="text-2xl font-black text-red-800">{totalOut.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ───────────────────────────── */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="bg-slate-100 rounded-xl p-1 mb-4 gap-1 h-auto">
          <TabsTrigger value="items" className="rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 h-9">
            الأصناف ({totalItems})
          </TabsTrigger>
          <TabsTrigger value="movements" className="rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm px-5 h-9">
            الحركات ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Items Tab ── */}
        <TabsContent value="items">
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base font-black text-slate-800">أصناف المخزن</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="بحث في الأصناف..."
                  value={itemSearch}
                  onChange={e => { setItemSearch(e.target.value); setItemsPage(1) }}
                  className="pr-9 h-9 rounded-xl text-sm border-slate-200 font-bold text-right"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pagedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <Inbox className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-bold">لا توجد أصناف في هذا المخزن</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-black text-slate-600 text-right pr-5">الصنف</TableHead>
                          <TableHead className="font-black text-slate-600 text-center">الفئة</TableHead>
                          <TableHead className="font-black text-slate-600 text-center">الكمية</TableHead>
                          <TableHead className="font-black text-slate-600 text-center">الوحدة</TableHead>
                          <TableHead className="font-black text-slate-600 text-right pl-5">آخر تحديث</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedItems.map(item => (
                          <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="font-bold text-slate-800 pr-5 text-right">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-xs rounded-lg border-0">
                                {item.category || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`font-black text-base ${item.quantity <= 0 ? 'text-red-600' : item.quantity < 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                                {item.quantity ?? 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-500 text-sm">{item.unit || '—'}</TableCell>
                            <TableCell className="text-right pl-5 text-xs font-bold text-slate-400">
                              {item.updated_by_name || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {itemsTotalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-500">
                        صفحة {itemsPage} من {itemsTotalPages} ({filteredItems.length} صنف)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={itemsPage <= 1}
                          onClick={() => setItemsPage(p => p - 1)}
                          className="rounded-lg h-8 px-3 font-bold text-xs border-slate-200"
                        >التالي</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={itemsPage >= itemsTotalPages}
                          onClick={() => setItemsPage(p => p + 1)}
                          className="rounded-lg h-8 px-3 font-bold text-xs border-slate-200"
                        >السابق</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Movements Tab ── */}
        <TabsContent value="movements">
          <Card className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base font-black text-slate-800">سجل الحركات</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="بحث في الحركات..."
                  value={movSearch}
                  onChange={e => { setMovSearch(e.target.value); setMovementsPage(1) }}
                  className="pr-9 h-9 rounded-xl text-sm border-slate-200 font-bold text-right"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {pagedMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <Inbox className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-bold">لا توجد حركات مسجلة لهذا المخزن</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="font-black text-slate-600 text-right pr-5">النوع</TableHead>
                          <TableHead className="font-black text-slate-600 text-right">الصنف</TableHead>
                          <TableHead className="font-black text-slate-600 text-center">الكمية</TableHead>
                          <TableHead className="font-black text-slate-600 text-right">ملاحظة</TableHead>
                          <TableHead className="font-black text-slate-600 text-right">التاريخ</TableHead>
                          <TableHead className="font-black text-slate-600 text-right pl-5">المسؤول</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedMovements.map(mov => (
                          <TableRow key={mov.id} className="hover:bg-slate-50/70 transition-colors">
                            <TableCell className="pr-5">
                              {mov.movement_type === 'IN' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg font-black text-xs gap-1.5">
                                  <ArrowDownLeft className="w-3 h-3" />
                                  وارد
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-0 rounded-lg font-black text-xs gap-1.5">
                                  <ArrowUpRight className="w-3 h-3" />
                                  صادر
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-slate-800 text-sm">{mov.item_name || '—'}</TableCell>
                            <TableCell className="text-center font-black text-base text-slate-800">{mov.quantity}</TableCell>
                            <TableCell className="text-slate-500 font-bold text-sm max-w-[180px] truncate">{mov.note || '—'}</TableCell>
                            <TableCell className="font-bold text-slate-500 text-sm whitespace-nowrap">
                              {mov.date
                                ? new Date(mov.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
                                : '—'}
                            </TableCell>
                            <TableCell className="pl-5 text-sm font-bold text-slate-500">{mov.engineer_name || mov.user_name || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {movsTotalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-500">
                        صفحة {movementsPage} من {movsTotalPages} ({filteredMovements.length} حركة)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementsPage <= 1}
                          onClick={() => setMovementsPage(p => p - 1)}
                          className="rounded-lg h-8 px-3 font-bold text-xs border-slate-200"
                        >التالي</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={movementsPage >= movsTotalPages}
                          onClick={() => setMovementsPage(p => p + 1)}
                          className="rounded-lg h-8 px-3 font-bold text-xs border-slate-200"
                        >السابق</Button>
                      </div>
                    </div>
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
