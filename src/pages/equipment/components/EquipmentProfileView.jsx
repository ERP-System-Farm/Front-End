import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEquipmentProfile, updateEquipment } from "../../../features/equipment/services";
import { Gauge, Calendar, User, DollarSign, Activity, Loader2, AlertCircle, ArrowRight, Upload, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function EquipmentProfileView({ equipmentId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingImage, setUpdatingImage] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!equipmentId) return;
      setLoading(true);
      try {
        const data = await getEquipmentProfile(equipmentId);
        setProfile(data.profile);
        setHistoryLogs(data.historyLogs);
      } catch (err) {
        console.error(err);
        toast.error("خطأ في تحميل ملف المعدة التاريخي");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [equipmentId]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    setUpdatingImage(true);
    try {
      const updated = await updateEquipment(profile.id, data);
      setProfile(updated);
      toast.success("تم تحديث صورة المعدة بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تحميل الصورة");
    } finally {
      setUpdatingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-50/20 border rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-400">جاري تحميل الملف التاريخي للمعدة...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 bg-slate-50/20 border rounded-xl text-slate-400 text-xs">
        <AlertCircle className="h-8 w-8 text-slate-300" />
        <span>حدث خطأ في تحميل ملف المعدة. يرجى المحاولة مرة أخرى.</span>
      </div>
    );
  }

  const unit = profile.meter_type === 'hours' ? 'ساعة' : (profile.meter_type === 'days' ? 'يوم' : 'كم');
  const reqMaint = profile.requires_maintenance;

  const getLogBadgeVariant = (logType) => {
    switch (logType) {
      case 'maintenance': return 'destructive';
      case 'oil_change': return 'warning';
      case 'fueling': return 'success';
      default: return 'default';
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

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Dynamic Ribbon Action Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Button 
            onClick={onBack} 
            size="sm" 
            variant="ghost" 
            className="h-9 px-3 text-slate-600 hover:text-slate-900 text-xs font-bold gap-1 rounded-lg hover:bg-slate-50 border border-slate-200"
          >
            <ArrowRight className="h-4 w-4" />
            <span>رجوع لسجل الأسطول</span>
          </Button>
          <div className="border-r pr-2 py-0.5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{getEquipmentIcon(profile.equipment_type)}</span>
              <span>الملف التعريفي: {profile.name}</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Main Grid Portal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Right Column: Detailed Info Card & Image Upload */}
        <div className="space-y-4 md:col-span-1">
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
            <div className="relative bg-slate-100 h-48 w-full flex items-center justify-center overflow-hidden border-b border-slate-100">
              {profile.image ? (
                <img 
                  src={getImageUrl(profile.image)} 
                  alt={profile.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <span className="text-5xl">{getEquipmentIcon(profile.equipment_type)}</span>
                  <span className="text-xs font-semibold text-slate-400">لا توجد صورة للمعدة</span>
                </div>
              )}
              
              {/* Upload overlay trigger */}
              <label className="absolute bottom-3 left-3 bg-white/95 hover:bg-white text-slate-800 text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-colors">
                <Upload className="h-3 w-3 text-slate-500" />
                <span>{profile.image ? 'تغيير الصورة' : 'إرفاق صورة'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                  disabled={updatingImage}
                />
              </label>
              {updatingImage && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <Badge variant={profile.is_active ? "success" : "secondary"} className="mb-2">
                  {profile.is_active ? 'نشطة بالخدمة' : 'خارج الخدمة'}
                </Badge>
                <h3 className="text-sm font-bold text-slate-900">{profile.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">نوع المعدة: {profile.equipment_type_display}</p>
              </div>

              <div className="border-t pt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">رقم اللوحة / الشاسيه:</span>
                  <span className="font-bold text-slate-800">{profile.plate_number || 'غير متوفر'}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">العداد الحالي:</span>
                  <span className="font-bold text-slate-800">{parseFloat(profile.current_meter).toLocaleString()} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">عداد آخر صيانة:</span>
                  <span className="font-bold text-slate-800">{parseFloat(profile.last_maintenance_meter).toLocaleString()} {unit}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">تاريخ آخر صيانة:</span>
                  <span className="font-bold text-slate-800">{profile.last_maintenance_date || 'غير مسجل'}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500 font-medium">فترة الصيانة الدورية:</span>
                  <span className="font-bold text-slate-800">كل {parseFloat(profile.maintenance_interval).toLocaleString()} {unit}</span>
                </div>
              </div>

              {profile.notes && (
                <div className="border-t pt-3 space-y-1">
                  <span className="block text-[11px] text-slate-400 font-semibold">ملاحظات ومواصفات إضافية</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 leading-relaxed font-sans">{profile.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Left Column: Live Alert ribbon & Historical Journal Logs */}
        <div className="md:col-span-2 space-y-4">
          {/* Active Maintenance Alert */}
          {reqMaint && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800">تنبيه صيانة وقائية مجدول</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  تجاوزت هذه المعدة حد استهلاك الصيانة المسموح به بمقدار <strong className="underline">{parseFloat(profile.meter_delta).toLocaleString()} {unit}</strong>. يرجى توثيق صيانة أو فحص وتصفير العداد لتفادي الأعطال الحركية.
                </p>
              </div>
            </div>
          )}

          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" /> 
                <span>السجل التاريخي للأنشطة والعمليات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {historyLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  لا توجد عمليات، صيانة، أو فواتير مسجلة تاريخياً لهذه المعدة.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {historyLogs.map(log => (
                    <div key={log.id} className="border border-slate-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between bg-white hover:bg-slate-50/30 gap-3 transition-colors">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Badge variant={getLogBadgeVariant(log.log_type)} className="text-[9px] px-2 py-0.5 font-bold shrink-0">
                            {log.log_type_display}
                          </Badge>
                          <span className="text-xs font-bold text-slate-800">{log.details}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {log.date}</span>
                          <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> قراءة العداد: {parseFloat(log.meter_reading).toLocaleString()} {unit}</span>
                          {log.amount_liters && (
                            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50/70 px-1.5 rounded font-bold">
                              الكمية: {parseFloat(log.amount_liters).toLocaleString()} لتر
                            </span>
                          )}
                          {log.operator_name && (
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> المسؤول: {log.operator_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50 font-bold text-xs text-slate-700 px-3 py-1.5 rounded-lg flex items-center shrink-0 self-start border border-slate-100">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                        <span>{parseFloat(log.cost).toLocaleString()} جنية</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
