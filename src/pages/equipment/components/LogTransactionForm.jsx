import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEquipmentList, logEquipmentTransaction } from "../../../features/equipment/services";
import api from "../../../services/api";
import { toast } from "sonner";
import { Loader2, Calendar, Gauge, DollarSign, User, Activity } from "lucide-react";

export default function LogTransactionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    equipment: '',
    log_type: 'maintenance',
    date: new Date().toISOString().split('T')[0],
    meter_reading: '',
    cost: '0.0',
    amount_liters: '',
    assigned_operator: '',
    details: ''
  });
  
  const [fleetList, setFleetList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingLists(true);
        const [fleetData, usersRes] = await Promise.all([
          getEquipmentList(),
          api.get('users/engineers')
        ]);
        setFleetList(fleetData);
        setUsersList(usersRes.data);
      } catch (err) {
        console.error(err);
        toast.error("خطأ في تحميل قوائم المدخلات");
      } finally {
        setLoadingLists(false);
      }
    };

    loadData();
  }, []);

  const handleEquipmentChange = (id) => {
    const eq = fleetList.find(f => f.id === id);
    setSelectedEq(eq);
    setFormData(prev => ({
      ...prev,
      equipment: id,
      meter_reading: eq ? String(parseFloat(eq.current_meter)) : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.equipment) {
      toast.error("يرجى اختيار المعدة أولاً");
      return;
    }
    
    const isDays = selectedEq && selectedEq.meter_type === 'days';
    
    if (!isDays) {
      if (!formData.meter_reading || parseFloat(formData.meter_reading) < 0) {
        toast.error("يرجى إدخال قراءة عداد صالحة");
        return;
      }
      if (selectedEq && parseFloat(formData.meter_reading) < parseFloat(selectedEq.current_meter)) {
        toast.error(`قراءة العداد لا يمكن أن تكون أقل من القراءة الحالية للمعدة (${selectedEq.current_meter})`);
        return;
      }
    }

    if (formData.log_type === 'fueling') {
      if (!formData.amount_liters || parseFloat(formData.amount_liters) <= 0) {
        toast.error("يرجى إدخال كمية الوقود المضافة باللتر بشكل صحيح");
        return;
      }
    }

    if (formData.log_type === 'oil_change' && formData.amount_liters) {
      if (parseFloat(formData.amount_liters) <= 0) {
        toast.error("يرجى إدخال كمية زيت صالحة أو ترك الحقل فارغاً");
        return;
      }
    }

    setSubmitting(true);
    try {
      await logEquipmentTransaction({
        equipment: formData.equipment,
        log_type: formData.log_type,
        date: formData.date,
        meter_reading: isDays ? 0.0 : parseFloat(formData.meter_reading),
        cost: parseFloat(formData.cost) || 0.0,
        amount_liters: (formData.log_type === 'fueling' || formData.log_type === 'oil_change') && formData.amount_liters ? parseFloat(formData.amount_liters) : null,
        assigned_operator: formData.assigned_operator || null,
        details: formData.details
      });
      toast.success("تم تسجيل قيد الحركة وتحديث سجل المعدة بنجاح");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حفظ قيد الحركة");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLists) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-400">جاري تحميل قوائم البيانات...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 max-w-xl mx-auto text-right" dir="rtl">
      <div className="flex items-center gap-2 border-b pb-3 mb-2">
        <Activity className="h-5 w-5 text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">نموذج قيد عمليات المستند والبيانات الحركية</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Equipment Selector */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">اختر الآلية / المعدة *</Label>
          <Select value={formData.equipment} onValueChange={handleEquipmentChange}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="المعدة المعنية..." />
            </SelectTrigger>
            <SelectContent>
              {fleetList.map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} ({f.plate_number || 'بدون لوحة'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Type Selector */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">نوع المعاملة</Label>
          <Select value={formData.log_type} onValueChange={(val) => setFormData({...formData, log_type: val, amount_liters: ''})}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">🛠️ إصلاح وصيانة عامة</SelectItem>
              <SelectItem value="oil_change">🛢️ تغيير زيت وفلاتر</SelectItem>
              <SelectItem value="fueling">⛽ تزويد وقود ومحروقات</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Field */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">التاريخ *</Label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="date" 
              className="h-9 text-xs pl-9" 
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})} 
              required 
            />
          </div>
        </div>

        {/* Meter Reading Field */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">
            {selectedEq && selectedEq.meter_type === 'days' ? 'عداد الأيام' : 'قراءة العداد أثناء العملية *'} 
            {selectedEq && selectedEq.meter_type !== 'days' && (
              <span className="text-[10px] text-slate-400 font-medium"> ({selectedEq.meter_type === 'hours' ? 'ساعة' : 'كم'})</span>
            )}
          </Label>
          <div className="relative">
            <Gauge className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type={selectedEq && selectedEq.meter_type === 'days' ? 'text' : 'number'} 
              step="0.01" 
              placeholder={selectedEq && selectedEq.meter_type === 'days' ? 'يحتسب تلقائياً باليوم' : '0.0'} 
              className="h-9 text-xs pl-9" 
              value={selectedEq && selectedEq.meter_type === 'days' ? 'يحتسب تلقائياً باليوم' : formData.meter_reading}
              disabled={selectedEq && selectedEq.meter_type === 'days'}
              onChange={e => setFormData({...formData, meter_reading: e.target.value})} 
              required={selectedEq ? selectedEq.meter_type !== 'days' : true} 
            />
          </div>
          {selectedEq && (
            <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
              {selectedEq.meter_type === 'days' 
                ? `مر على تسجيل المعدة: ${parseFloat(selectedEq.current_meter).toLocaleString()} يوم`
                : `القراءة الحالية بالمسجل: ${parseFloat(selectedEq.current_meter).toLocaleString()} ${selectedEq.meter_type === 'hours' ? 'ساعة' : 'كم'}`
              }
            </span>
          )}
        </div>

        {/* Cost Field */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">التكلفة المباشرة (جنية)</Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="number" 
              step="0.1" 
              placeholder="0.0" 
              className="h-9 text-xs pl-9" 
              value={formData.cost}
              onChange={e => setFormData({...formData, cost: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* Liters input for Fuel or Oil Change */}
      {(formData.log_type === 'oil_change' || formData.log_type === 'fueling') && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-slate-700">
            {formData.log_type === 'fueling' ? 'كمية الوقود المضافة (لتر) *' : 'كمية الزيت المضافة (لتر)'}
          </Label>
          <div className="relative">
            <Activity className="absolute left-2.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input 
              type="number" 
              step="0.01" 
              placeholder="0.0" 
              className="h-9 text-xs pl-9" 
              value={formData.amount_liters}
              onChange={e => setFormData({...formData, amount_liters: e.target.value})} 
              required={formData.log_type === 'fueling'}
            />
          </div>
        </div>
      )}

      {/* Operator Selector */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-700">السائق / المستخدم المسؤول (اختياري)</Label>
        <Select value={formData.assigned_operator} onValueChange={(val) => setFormData({...formData, assigned_operator: val})}>
          <SelectTrigger className="h-9 text-xs">
            <User className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <SelectValue placeholder="تحديد الشخص المستلم للمعدة حالياً..." />
          </SelectTrigger>
          <SelectContent>
            {usersList.map(u => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Details Field */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-700">شرح العمل والبيانات التوثيقية *</Label>
        <Textarea 
          className="text-xs border-slate-200" 
          placeholder="اكتب تفاصيل الصيانة، نوع الزيت المستخدم، أو فواتير المحروقات هنا..." 
          rows={3} 
          value={formData.details}
          onChange={e => setFormData({...formData, details: e.target.value})} 
          required 
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={submitting} 
        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 font-bold rounded-lg shadow-sm"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-1.5" /> : null}
        حفظ وتوثيق الحركة في سجل المعدة ✔️
      </Button>
    </form>
  );
}
