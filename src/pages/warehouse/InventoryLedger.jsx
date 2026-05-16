import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  List as ListIcon
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
  DialogTrigger
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

const CATEGORIES = [
  { id: 'tools', label: 'المعدات والأدوات', color: 'bg-blue-100 text-blue-700' },
  { id: 'pesticides', label: 'المبيدات', color: 'bg-rose-100 text-rose-700' },
  { id: 'fertilizers', label: 'الأسمدة', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'crops', label: 'المحاصيل', color: 'bg-amber-100 text-amber-700' },
  { id: 'other', label: 'أخرى', color: 'bg-slate-100 text-slate-700' },
]

const InventoryLedger = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [movements, setMovements] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'

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
    console.log("Fetching warehouse data...")
    try {
      const [iRes, wRes, mRes, eRes, uRes] = await Promise.allSettled([
        getItems(), 
        getWarehouses(), 
        getMovements(), 
        getEngineers(),
        reportsApi.getUnits()
      ])
      
      // Detailed logging for debugging
      console.log("Items Response:", iRes)
      console.log("Warehouses Response:", wRes)
      console.log("Movements Response:", mRes)
      
      const r = (res) => {
        if (res.status === 'rejected') return []
        const val = res.value
        // Handle axios response objects vs direct data
        const data = val?.data || val
        return data?.results || (Array.isArray(data) ? data : [])
      }

      const itemsData = r(iRes)
      const warehousesData = r(wRes)
      const movementsData = r(mRes)
      const engineersData = r(eRes)
      const unitsData = r(uRes)

      console.log("Extracted Items:", itemsData)

      setItems(itemsData)
      setWarehouses(warehousesData)
      setMovements(movementsData)
      setEngineers(engineersData)
      setUnits(unitsData)
      
      if (iRes.status === 'rejected') {
        console.error("Failed to fetch items:", iRes.reason)
        toast.error('خطأ في جلب قائمة الأصناف')
      }
    } catch (err) {
      console.error("Unexpected error in fetchData:", err)
      toast.error('حدث خطأ غير متوقع أثناء جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [items, searchQuery, activeCategory])

  const handleSaveItem = async () => {
    try {
      const sanitizeId = (val) => (val && val !== 'null' ? val : null)
      const payload = { 
        ...itemForm, 
        warehouse: sanitizeId(itemForm.warehouse) 
      }
      
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
      const errorData = err.response?.data;
      if (errorData) {
        const errorMsg = errorData.name || errorData.company || errorData.non_field_errors || errorData.detail || 'حدث خطأ أثناء الحفظ';
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
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
      const errorData = err.response?.data;
      if (errorData) {
        const errorMsg = errorData.name || errorData.company || errorData.non_field_errors || errorData.detail || 'حدث خطأ أثناء الحفظ';
        toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        toast.error('حدث خطأ أثناء الحفظ');
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
      };
      
      if (payload.location === 'OTHER') {
        payload.location = null;
      } else {
        payload.other_location = '';
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
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen" dir="rtl">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <WarehouseIcon className="w-7 h-7" />
            </div>
            إدارة المستودعات والمخزون
          </h1>
          <p className="text-slate-500 mt-2 font-medium">نظام متقدم لتتبع الأصناف، الحركات، والعمليات اللوجستية</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold h-11"
            onClick={() => setIsWarehouseModalOpen(true)}
          >
            <WarehouseIcon className="w-4 h-4 ml-2" />
            إضافة مستودع
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold h-11"
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 rounded-xl font-bold px-6 h-11"
            onClick={() => setIsMovementModalOpen(true)}
          >
            <History className="w-4 h-4 ml-2" />
            تسجيل حركة
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-14 shadow-sm inline-flex">
            <TabsTrigger value="inventory" className="rounded-lg px-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold">
              <Package className="w-4 h-4 ml-2" />
              المخزون الحالي
            </TabsTrigger>
            <TabsTrigger value="movements" className="rounded-lg px-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold">
              <History className="w-4 h-4 ml-2" />
              سجل الحركات
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="rounded-lg px-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 font-bold">
              <WarehouseIcon className="w-4 h-4 ml-2" />
              المستودعات
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
             <div className="relative w-full md:w-64">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input 
                  placeholder="بحث سريع..." 
                  className="pr-10 rounded-xl border-slate-200 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
                <Button 
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="rounded-lg h-8 w-8"
                  onClick={() => setViewMode('table')}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="icon" 
                  className="rounded-lg h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
             </div>
          </div>
        </div>

        <TabsContent value="inventory" className="mt-0">
          <div className="flex flex-col gap-6">
            {/* Category Filter Pills */}
            <div className="flex gap-2 flex-wrap pb-2 overflow-x-auto no-scrollbar">
              <Button 
                variant={activeCategory === 'all' ? 'default' : 'outline'}
                className={`rounded-full px-6 h-9 font-bold ${activeCategory === 'all' ? 'bg-emerald-600' : 'border-slate-200'}`}
                onClick={() => setActiveCategory('all')}
              >
                الكل
              </Button>
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  className={`rounded-full px-6 h-9 font-bold ${activeCategory === cat.id ? 'bg-emerald-600' : 'border-slate-200'}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {viewMode === 'table' ? (
              <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-right font-bold py-4">الصنف</TableHead>
                      <TableHead className="text-right font-bold">التصنيف</TableHead>
                      <TableHead className="text-right font-bold">المستودع</TableHead>
                      <TableHead className="text-right font-bold">الرصيد</TableHead>
                      <TableHead className="text-right font-bold">آخر تحديث</TableHead>
                      <TableHead className="text-left font-bold px-6">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Inbox className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium">لا توجد أصناف تطابق البحث</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map(item => (
                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-bold text-slate-800">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`${CATEGORIES.find(c => c.id === item.category)?.color} rounded-lg border-0 px-3 py-1`}>
                              {CATEGORIES.find(c => c.id === item.category)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 font-medium">
                            {warehouses.find(w => w.id === item.warehouse)?.name || 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-black ${item.quantity > 0 ? 'text-slate-900' : 'text-rose-500'}`}>
                                {parseFloat(item.quantity).toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400 font-bold uppercase">{item.unit || 'وحدة'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">
                             {item.updated_by_name || 'النظام'}
                          </TableCell>
                          <TableCell className="px-6">
                            <DropdownMenu dir="rtl">
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-40">
                                <DropdownMenuItem onClick={() => openEditItem(item)} className="cursor-pointer gap-2 font-medium">
                                  <Edit className="w-4 h-4 text-slate-500" /> تعديل الصنف
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setDeletingId(item.id)
                                    setDeleteType('item')
                                    setIsDeleteDialogOpen(true)
                                  }} 
                                  className="cursor-pointer gap-2 font-medium text-rose-600 focus:text-rose-600"
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
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {filteredItems.map(item => (
                   <Card key={item.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all group rounded-2xl overflow-hidden">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between">
                         <div className="space-y-1">
                            <Badge variant="outline" className={`${CATEGORIES.find(c => c.id === item.category)?.color} border-0 rounded-lg`}>
                              {CATEGORIES.find(c => c.id === item.category)?.label}
                            </Badge>
                            <CardTitle className="text-xl font-bold text-slate-800">{item.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                               <WarehouseIcon className="w-3 h-3" />
                               {warehouses.find(w => w.id === item.warehouse)?.name || 'غير محدد'}
                            </CardDescription>
                         </div>
                         <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                               <DropdownMenuItem onClick={() => openEditItem(item)} className="gap-2 font-medium">
                                  <Edit className="w-4 h-4" /> تعديل
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => {
                                  setDeletingId(item.id)
                                  setDeleteType('item')
                                  setIsDeleteDialogOpen(true)
                               }} className="gap-2 font-medium text-rose-600 focus:text-rose-600">
                                  <Trash2 className="w-4 h-4" /> حذف
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </CardHeader>
                      <CardContent>
                         <div className="bg-slate-50 p-4 rounded-xl flex items-end justify-between border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                            <div>
                               <p className="text-[10px] uppercase font-black text-slate-400 mb-1">الرصيد المتاح</p>
                               <span className={`text-3xl font-black ${item.quantity > 0 ? 'text-slate-900' : 'text-rose-500'}`}>
                                  {parseFloat(item.quantity).toLocaleString()}
                               </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm uppercase">
                               {item.unit || 'وحدة'}
                            </span>
                         </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-0">
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-right font-bold py-4">الصنف</TableHead>
                    <TableHead className="text-right font-bold">النوع</TableHead>
                    <TableHead className="text-right font-bold">الكمية</TableHead>
                    <TableHead className="text-right font-bold">مدخل البيانات</TableHead>
                    <TableHead className="text-right font-bold">المسؤول</TableHead>
                    <TableHead className="text-right font-bold">الموقع</TableHead>
                    <TableHead className="text-right font-bold">التاريخ</TableHead>
                    <TableHead className="text-right font-bold">ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-64 text-center">
                         <div className="flex flex-col items-center justify-center text-slate-400">
                            <History className="w-12 h-12 mb-3 opacity-20" />
                            <p className="font-medium">لا توجد حركات مسجلة</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map(mov => (
                      <TableRow key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-bold text-slate-800">{mov.item_name}</TableCell>
                        <TableCell>
                           {mov.movement_type === 'IN' && (
                             <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-lg gap-1 border-0">
                                <ArrowDownLeft className="w-3 h-3" /> وارد
                             </Badge>
                           )}
                           {mov.movement_type === 'OUT' && (
                             <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-lg gap-1 border-0">
                                <ArrowUpRight className="w-3 h-3" /> منصرف
                             </Badge>
                           )}
                           {mov.movement_type === 'RETURNED' && (
                             <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg gap-1 border-0">
                                <ArrowDownLeft className="w-3 h-3" /> مرتجع
                             </Badge>
                           )}
                           {mov.movement_type === 'DAMAGED' && (
                             <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 rounded-lg gap-1 border-0">
                                <ArrowUpRight className="w-3 h-3" /> هالك
                             </Badge>
                           )}
                        </TableCell>
                        <TableCell>
                           <span className={`font-black text-lg ${['IN', 'RETURNED'].includes(mov.movement_type) ? 'text-emerald-700' : 'text-rose-700'}`}>
                             {['IN', 'RETURNED'].includes(mov.movement_type) ? '+' : '-'} {parseFloat(mov.quantity).toLocaleString()}
                           </span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-600">{mov.user_name || 'النظام'}</TableCell>
                        <TableCell className="font-medium text-slate-600">{mov.responsible_user_name || mov.user_name || 'النظام'}</TableCell>
                        <TableCell className="font-medium text-slate-600">
                          {mov.location_name || mov.other_location || '-'}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                           {new Date(mov.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-500 italic text-sm">
                           {mov.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
           </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="mt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouses.map(w => (
                <Card key={w.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                   <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-3">
                         <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <WarehouseIcon className="w-5 h-5" />
                         </div>
                         <div>
                            <CardTitle className="text-lg font-bold text-slate-800">{w.name}</CardTitle>
                            <CardDescription className="text-xs">{w.location || 'بدون موقع محدد'}</CardDescription>
                         </div>
                      </div>
                      <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                           <DropdownMenuItem onClick={() => openEditWarehouse(w)} className="gap-2 font-medium">
                              <Edit className="w-4 h-4" /> تعديل
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => {
                              setDeletingId(w.id)
                              setDeleteType('warehouse')
                              setIsDeleteDialogOpen(true)
                           }} className="gap-2 font-medium text-rose-600 focus:text-rose-600">
                              <Trash2 className="w-4 h-4" /> حذف
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </CardHeader>
                   <CardContent>
                      <div className="flex items-center justify-between text-slate-500">
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-slate-400">إجمالي الأصناف</span>
                            <span className="text-2xl font-black text-slate-800">
                               {items.filter(i => i.warehouse === w.id).length}
                            </span>
                         </div>
                         <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold gap-1">
                            عرض التفاصيل <ArrowDownLeft className="w-3 h-3 rotate-[225deg]" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
              
              <Button 
                variant="outline" 
                className="h-full min-h-[160px] border-dashed border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-2xl flex flex-col gap-3 group transition-all"
                onClick={() => setIsWarehouseModalOpen(true)}
              >
                 <div className="bg-slate-100 text-slate-400 p-3 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                    <Plus className="w-6 h-6" />
                 </div>
                 <span className="font-bold text-slate-500 group-hover:text-emerald-700">إضافة مستودع جديد</span>
              </Button>
           </div>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}

      {/* Item Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={(open) => {
        setIsItemModalOpen(open)
        if(!open) setEditingItem(null)
      }}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات الصنف الأساسية لتتبعه في المخزون.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم الصنف</Label>
              <Input 
                value={itemForm.name} 
                onChange={e => setItemForm({...itemForm, name: e.target.value})}
                placeholder="مثال: سماد نترات"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">التصنيف</Label>
                <Select dir="rtl" value={itemForm.category} onValueChange={v => setItemForm({...itemForm, category: v})}>
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
                <Select dir="rtl" value={itemForm.unit} onValueChange={v => setItemForm({...itemForm, unit: v})}>
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
              <Select dir="rtl" value={itemForm.warehouse.toString()} onValueChange={v => setItemForm({...itemForm, warehouse: v})}>
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
      <Dialog open={isWarehouseModalOpen} onOpenChange={(open) => {
        setIsWarehouseModalOpen(open)
        if(!open) setEditingWarehouse(null)
      }}>
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">{editingWarehouse ? 'تعديل المستودع' : 'إضافة مستودع جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات موقع التخزين.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم المستودع / المخزن</Label>
              <Input 
                value={warehouseForm.name} 
                onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})}
                placeholder="مثال: مخزن الأسمدة الرئيسي"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">الموقع / الوصف</Label>
              <Input 
                value={warehouseForm.location} 
                onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})}
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
        <DialogContent className="max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle className="text-xl font-bold">تسجيل حركة مخزنية</DialogTitle>
            <DialogDescription>قم بتسجيل عمليات السحب أو الإضافة للمخزون.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="font-bold">الصنف</Label>
              <Select dir="rtl" value={movementForm.item.toString()} onValueChange={v => setMovementForm({...movementForm, item: v})}>
                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                  <SelectValue placeholder="اختر الصنف" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
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
                <Select dir="rtl" value={movementForm.movement_type} onValueChange={v => setMovementForm({...movementForm, movement_type: v})}>
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
                  onChange={e => setMovementForm({...movementForm, quantity: e.target.value})}
                  placeholder="0.00"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>

            {['OUT', 'RETURNED', 'DAMAGED'].includes(movementForm.movement_type) && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">المستخدم المسؤول (اختياري)</Label>
                    <Select dir="rtl" value={movementForm.responsible_user?.toString() || ''} onValueChange={v => setMovementForm({...movementForm, responsible_user: v})}>
                      <SelectTrigger className="rounded-xl border-slate-200 h-11">
                        <SelectValue placeholder="اختر المسؤول" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-[200px]">
                         {engineers.map(e => (
                           <SelectItem key={e.id} value={e.id.toString()}>
                              {e.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-bold">الموقع / الحوشة (اختياري)</Label>
                    <LocationSelect 
                      value={movementForm.location} 
                      onChange={v => setMovementForm({...movementForm, location: v})} 
                    />
                  </div>
                </div>
                
                {movementForm.location === 'OTHER' && (
                   <div className="space-y-2">
                     <Label className="font-bold">اسم الموقع الآخر</Label>
                     <Input 
                        value={movementForm.other_location || ''} 
                        onChange={e => setMovementForm({...movementForm, other_location: e.target.value})} 
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
                onChange={e => setMovementForm({...movementForm, note: e.target.value})}
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
        <AlertDialogContent className="rounded-2xl" dir="rtl">
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
