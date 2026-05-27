import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment } from "../../../features/equipment/services";
import { Search, Filter, PlusCircle, Gauge, AlertTriangle, Eye, Loader2, Wrench, ShieldAlert, MoreVertical, Trash2, Edit, Info, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function FleetRegistryTable({ onSelectProfile }) {
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Registration Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    equipment_type: "tractor",
    plate_number: "",
    meter_type: "hours",
    current_meter: "0.0",
    maintenance_interval: "50.0",
    notes: ""
  });

  // Edit/Delete States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    equipment_type: "tractor",
    plate_number: "",
    meter_type: "hours",
    current_meter: "0.0",
    maintenance_interval: "50.0",
    notes: "",
    is_active: true
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingName, setDeletingName] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId(prev => prev === id ? null : id);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${imagePath}`;
    } catch (e) {
      return `http://localhost:8000${imagePath}`;
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const data = await getEquipmentList();
      setEquipmentList(data);
    } catch (err) {
      console.error(err);
      toast.error("خطأ في تحميل سجل الأسطول والمعدات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("اسم المعدة حقل مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("equipment_type", formData.equipment_type);
      if (formData.plate_number) data.append("plate_number", formData.plate_number);
      data.append("meter_type", formData.meter_type);
      data.append("current_meter", parseFloat(formData.current_meter) || 0.0);
      data.append("maintenance_interval", parseFloat(formData.maintenance_interval) || 50.0);
      if (formData.notes) data.append("notes", formData.notes);
      
      const imageFile = e.target.elements.reg_image?.files[0];
      if (imageFile) {
        data.append("image", imageFile);
      }

      await createEquipment(data);
      toast.success("تم تسجيل المعدة بنجاح في الأسطول");
      setIsDialogOpen(false);
      // Reset form
      setFormData({
        name: "",
        equipment_type: "tractor",
        plate_number: "",
        meter_type: "hours",
        current_meter: "0.0",
        maintenance_interval: "50.0",
        notes: ""
      });
      fetchEquipment();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ بيانات المعدة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (eq) => {
    setEditingId(eq.id);
    setEditFormData({
      name: eq.name,
      equipment_type: eq.equipment_type,
      plate_number: eq.plate_number || "",
      meter_type: eq.meter_type,
      current_meter: String(eq.current_meter),
      maintenance_interval: String(eq.maintenance_interval),
      notes: eq.notes || "",
      is_active: eq.is_active
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error("اسم المعدة حقل مطلوب");
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", editFormData.name);
      data.append("equipment_type", editFormData.equipment_type);
      if (editFormData.plate_number) data.append("plate_number", editFormData.plate_number);
      data.append("meter_type", editFormData.meter_type);
      data.append("current_meter", parseFloat(editFormData.current_meter) || 0.0);
      data.append("maintenance_interval", parseFloat(editFormData.maintenance_interval) || 50.0);
      if (editFormData.notes) data.append("notes", editFormData.notes);
      data.append("is_active", editFormData.is_active);
      
      const imageFile = e.target.elements.edit_image?.files[0];
      if (imageFile) {
        data.append("image", imageFile);
      }

      await updateEquipment(editingId, data);
      toast.success("تم تحديث بيانات المعدة بنجاح");
      setIsEditOpen(false);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تعديل بيانات المعدة");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (eq) => {
    setDeletingId(eq.id);
    setDeletingName(eq.name);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      await deleteEquipment(deletingId);
      toast.success(`تم حذف المعدة ${deletingName} بنجاح`);
      setIsDeleteOpen(false);
      fetchEquipment();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حذف المعدة");
    } finally {
      setSubmitting(false);
    }
  };

  const getEquipmentIcon = (type) => {
    switch (type) {
      case 'tractor': return '🚜';
      case 'car': return '🚗';
      case 'motorcycle': return '🏍️';
      case 'generator': return '⚡';
      case 'sprayer': return '💨';
      default: return '⚙️';
    }
  };

  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (eq.plate_number && eq.plate_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "all" || eq.equipment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="ابحث عن معدة بالاسم أو رقم اللوحة..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 text-xs h-9"
            />
          </div>
          {/* Type Filter Select */}
          <div className="w-full sm:w-44">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs">
                <Filter className="h-3 w-3 ml-2 text-slate-400" />
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                <SelectItem value="tractor">🚜 جرار / حارث زراعي</SelectItem>
                <SelectItem value="car">🚗 سيارة نقل / بيك أب</SelectItem>
                <SelectItem value="motorcycle">🏍️ موتوسيكل ميداني</SelectItem>
                <SelectItem value="generator">⚡ مولد / مضخة ري</SelectItem>
                <SelectItem value="sprayer">💨 ماكينة رش / مكافحة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Register Dialog Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold rounded-lg shrink-0 flex items-center gap-1.5 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>تسجيل آلية جديدة</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-right">
              <DialogTitle className="text-base font-bold text-slate-900">تسجيل معدة جديدة بالأسطول</DialogTitle>
              <DialogDescription className="text-xs">إدخال آلية جديدة إلى نظام إدارة وحسابات الحركة والوقود.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2 text-right" dir="rtl">
              <div className="space-y-1.5">
                <Label htmlFor="reg_name" className="text-xs">اسم المعدة / الآلية *</Label>
                <Input 
                  id="reg_name" 
                  required 
                  placeholder="جرار جون دير 7500 / بيك أب دبل" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">نوع الآلية</Label>
                  <Select 
                    value={formData.equipment_type} 
                    onValueChange={val => setFormData({...formData, equipment_type: val})}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tractor">جرار زراعي</SelectItem>
                      <SelectItem value="car">سيارة نقل / بيك أب</SelectItem>
                      <SelectItem value="motorcycle">موتوسيكل ميداني</SelectItem>
                      <SelectItem value="generator">مولد كهربائي / مضخة</SelectItem>
                      <SelectItem value="sprayer">ماكينة رش / مكافحة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">وحدة قياس العداد</Label>
                  <Select 
                    value={formData.meter_type} 
                    onValueChange={val => setFormData({...formData, meter_type: val})}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">ساعات عمل (Hours)</SelectItem>
                      <SelectItem value="km">مسافة مقطوعة (KM)</SelectItem>
                      <SelectItem value="days">أيام تقويمية (Days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg_plate" className="text-xs">رقم اللوحة / الشاسيه (اختياري)</Label>
                <Input 
                  id="reg_plate" 
                  placeholder="مثال: أ ب ج 1234" 
                  value={formData.plate_number}
                  onChange={e => setFormData({...formData, plate_number: e.target.value})}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg_meter" className="text-xs">قراءة العداد الحالية</Label>
                  <Input 
                    id="reg_meter" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.current_meter}
                    onChange={e => setFormData({...formData, current_meter: e.target.value})}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_interval" className="text-xs">فترة الصيانة الدورية</Label>
                  <Input 
                    id="reg_interval" 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formData.maintenance_interval}
                    onChange={e => setFormData({...formData, maintenance_interval: e.target.value})}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg_image" className="text-xs">صورة المعدة (اختياري)</Label>
                <Input 
                  id="reg_image" 
                  name="reg_image"
                  type="file" 
                  accept="image/*"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg_notes" className="text-xs">ملاحظات ومواصفات الآلية</Label>
                <Textarea 
                  id="reg_notes" 
                  placeholder="أكتب قوة المحرك، موديل السنة، سعة خزان الوقود..." 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <DialogFooter className="flex-row-reverse justify-end gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4 font-bold rounded-lg"
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : null}
                  حفظ المعدة بالأسطول
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="text-xs h-9"
                >
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Equipment Table Container */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-xs text-slate-400">جاري تحميل سجل المعدات...</span>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400">
            لا توجد معدات مسجلة تطابق بحثك.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-right text-xs font-bold text-slate-500 py-3">المعدة</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 py-3">النوع</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 py-3">تاريخ آخر عملية</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 py-3">الاستهلاك منذ آخر صيانة</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 py-3">الحالة</TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-500 py-3 w-16">خيارات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map(eq => {
                  const reqMaint = eq.requires_maintenance;
                  const unit = eq.meter_type === 'hours' ? 'ساعة' : (eq.meter_type === 'days' ? 'يوم' : 'كم');
                  const isExpanded = expandedRowId === eq.id;
                  
                  return (
                    <React.Fragment key={eq.id}>
                      <TableRow 
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50 hover:bg-slate-50/50' : 'hover:bg-slate-50/30'}`}
                        onClick={() => toggleRow(eq.id)}
                      >
                        <TableCell className="font-semibold text-xs text-slate-900 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{getEquipmentIcon(eq.equipment_type)}</span>
                            <span>{eq.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-slate-100/60 font-semibold border-slate-200">
                            {eq.equipment_type_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium py-3">
                          {eq.last_operation_date ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {eq.last_operation_date}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-medium">لا توجد عمليات</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={`text-xs font-bold ${reqMaint ? 'text-amber-600 flex items-center gap-1' : 'text-slate-600'}`}>
                            {reqMaint ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" /> : null}
                            {parseFloat(eq.meter_delta).toLocaleString()} / {parseFloat(eq.maintenance_interval).toLocaleString()} {unit}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={eq.is_active ? "success" : "secondary"} className="text-[10px] px-2 py-0.5 font-bold">
                            {eq.is_active ? 'نشط بالخدمة' : 'خارج الخدمة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-3" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                            onClick={() => toggleRow(eq.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="bg-slate-50/40 hover:bg-slate-50/40" onClick={(e) => e.stopPropagation()}>
                          <TableCell colSpan={6} className="p-4 border-t-0">
                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2 text-right" dir="rtl">
                              
                              {/* Left/Middle: Details Grid */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-800">تفاصيل المعدة: {eq.name}</span>
                                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-slate-50">
                                    {eq.equipment_type_display}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">رقم اللوحة / الشاسيه</span>
                                    <span className="font-bold text-slate-800">{eq.plate_number || 'غير متوفر'}</span>
                                  </div>
                                  
                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">العداد الحالي</span>
                                    <span className="font-bold text-slate-800">{parseFloat(eq.current_meter).toLocaleString()} {unit}</span>
                                  </div>

                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">فترة الصيانة المسموحة</span>
                                    <span className="font-bold text-slate-800">كل {parseFloat(eq.maintenance_interval).toLocaleString()} {unit}</span>
                                  </div>
                                  
                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">الاستهلاك منذ الصيانة</span>
                                    <span className="font-bold text-slate-800">{parseFloat(eq.meter_delta).toLocaleString()} {unit}</span>
                                  </div>

                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">تاريخ آخر صيانة</span>
                                    <span className="font-bold text-slate-800">{eq.last_maintenance_date || 'غير مسجل'}</span>
                                  </div>

                                  <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block text-[10px] mb-0.5">تاريخ آخر حركة</span>
                                    <span className="font-bold text-slate-800">{eq.last_operation_date || 'لا توجد حركات'}</span>
                                  </div>
                                </div>

                                {eq.notes && (
                                  <div className="bg-slate-50/30 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 font-sans mt-2">
                                    <strong>المواصفات الإضافية:</strong> {eq.notes}
                                  </div>
                                )}
                              </div>

                              {/* Right side: Machinery Image Preview & Action Buttons */}
                              <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-stretch gap-3 shrink-0 w-full md:w-44 pt-1">
                                {/* Image Thumbnail */}
                                <div className="h-24 w-full bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative shadow-sm">
                                  {eq.image ? (
                                    <img 
                                      src={getImageUrl(eq.image)} 
                                      alt={eq.name} 
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-3xl text-slate-300">{getEquipmentIcon(eq.equipment_type)}</div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 w-full">
                                  <Button 
                                    onClick={() => onSelectProfile(eq.id)} 
                                    size="sm" 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-8 flex items-center justify-center gap-1 shadow-sm rounded-lg"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>عرض السجل الكامل</span>
                                  </Button>
                                  
                                  <div className="flex gap-2 w-full">
                                    <Button 
                                      onClick={() => handleEditClick(eq)} 
                                      size="sm" 
                                      variant="outline"
                                      className="flex-1 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 text-[11px] font-bold h-8 flex items-center justify-center gap-1 rounded-lg"
                                    >
                                      <Edit className="h-3.5 w-3.5 text-slate-400" />
                                      <span>تعديل</span>
                                    </Button>
                                    
                                    <Button 
                                      onClick={() => handleDeleteClick(eq)} 
                                      size="sm" 
                                      variant="destructive"
                                      className="flex-1 text-white bg-red-600 hover:bg-red-700 text-[11px] font-bold h-8 flex items-center justify-center gap-1 rounded-lg"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>حذف</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold text-slate-900">تعديل بيانات المعدة</DialogTitle>
            <DialogDescription className="text-xs">تحديث معلومات العداد أو الفئة وصورة المعدة.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2 text-right" dir="rtl">
            <div className="space-y-1.5">
              <Label htmlFor="edit_name" className="text-xs">اسم المعدة / الآلية *</Label>
              <Input 
                id="edit_name" 
                required 
                placeholder="جرار جون دير 7500 / بيك أب دبل" 
                value={editFormData.name}
                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">نوع الآلية</Label>
                <Select 
                  value={editFormData.equipment_type} 
                  onValueChange={val => setEditFormData({...editFormData, equipment_type: val})}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tractor">جرار زراعي</SelectItem>
                    <SelectItem value="car">سيارة نقل / بيك أب</SelectItem>
                    <SelectItem value="motorcycle">موتوسيكل ميداني</SelectItem>
                    <SelectItem value="generator">مولد كهربائي / مضخة</SelectItem>
                    <SelectItem value="sprayer">ماكينة رش / مكافحة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">وحدة قياس العداد</Label>
                <Select 
                  value={editFormData.meter_type} 
                  onValueChange={val => setEditFormData({...editFormData, meter_type: val})}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">ساعات عمل (Hours)</SelectItem>
                    <SelectItem value="km">مسافة مقطوعة (KM)</SelectItem>
                    <SelectItem value="days">أيام تقويمية (Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_plate" className="text-xs">رقم اللوحة / الشاسيه (اختياري)</Label>
              <Input 
                id="edit_plate" 
                placeholder="مثال: أ ب ج 1234" 
                value={editFormData.plate_number}
                onChange={e => setEditFormData({...editFormData, plate_number: e.target.value})}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_meter" className="text-xs">قراءة العداد الحالية</Label>
                <Input 
                  id="edit_meter" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={editFormData.current_meter}
                  onChange={e => setEditFormData({...editFormData, current_meter: e.target.value})}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_interval" className="text-xs">فترة الصيانة الدورية</Label>
                <Input 
                  id="edit_interval" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={editFormData.maintenance_interval}
                  onChange={e => setEditFormData({...editFormData, maintenance_interval: e.target.value})}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_image" className="text-xs">تغيير صورة المعدة (اختياري)</Label>
              <Input 
                id="edit_image" 
                name="edit_image"
                type="file" 
                accept="image/*"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_notes" className="text-xs">ملاحظات ومواصفات الآلية</Label>
              <Textarea 
                id="edit_notes" 
                placeholder="أكتب قوة المحرك، موديل السنة..." 
                value={editFormData.notes}
                onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                className="text-xs"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-reverse space-x-2 pt-2">
              <input 
                id="edit_is_active" 
                type="checkbox" 
                checked={editFormData.is_active} 
                onChange={e => setEditFormData({...editFormData, is_active: e.target.checked})} 
                className="h-4 w-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <Label htmlFor="edit_is_active" className="text-xs font-semibold text-slate-700 cursor-pointer">معدّة نشطة وتعمل بالخدمة</Label>
            </div>

            <DialogFooter className="flex-row-reverse justify-end gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={submitting} 
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 px-4 font-bold rounded-lg"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : null}
                تحديث البيانات
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="text-xs h-9"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>تأكيد الحذف النهائي</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              هل أنت متأكد من رغبتك في حذف المعدة <strong>({deletingName})</strong> نهائياً من النظام؟
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-500 py-3 border-y border-slate-100 my-2">
            ⚠️ <strong>تحذير:</strong> سيؤدي هذا الإجراء إلى حذف جميع سجلات الحركة والصيانة والوقود الخاصة بهذه المعدة بشكل دائم ومباشر ولا يمكن التراجع عنه.
          </div>
          <DialogFooter className="flex-row-reverse justify-end gap-2 pt-1">
            <Button 
              onClick={handleDeleteConfirm}
              disabled={submitting} 
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 px-4 font-bold rounded-lg"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : null}
              نعم، احذف نهائياً
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs h-9"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
