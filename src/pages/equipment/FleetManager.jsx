import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getEquipmentList, createEquipment, getEquipmentDetails, logMaintenance, 
  logUsage, logOilChange, getOilAlerts 
} from '../../features/equipment/services';
import { useTranslation } from 'react-i18next';
import { 
  Tractor, 
  PlusCircle, 
  Wrench, 
  Fuel, 
  Car, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  Droplet,
  Calendar as CalendarIcon,
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

const FleetManager = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEqId, setSelectedEqId]   = useState(null);
  const [details, setDetails]             = useState(null);
  const [loading, setLoading]             = useState(true);
  const [oilAlerts, setOilAlerts]         = useState([]);

  // Modals & UI Navigation
  const [openEqModal, setOpenEqModal]       = useState(false);
  const [openMaintModal, setOpenMaintModal] = useState(false);
  const [openUsageModal, setOpenUsageModal] = useState(false);
  const [openOilModal, setOpenOilModal]     = useState(false);
  const [detailTab, setDetailTab]           = useState('overview');
  
  const [formLoading, setFormLoading]       = useState(false);
  const [formError, setFormError]           = useState('');

  // Forms states
  const [eqName, setEqName]                 = useState('');
  const [eqType, setEqType]                 = useState('TRACTOR');
  const [eqModel, setEqModel]               = useState('');
  const [eqSerial, setEqSerial]             = useState('');
  const [eqOilHours, setEqOilHours]         = useState(250);
  const [eqOilDays, setEqOilDays]           = useState(180);
  const [eqSpecs, setEqSpecs]               = useState({ engine_power: '', fuel_type: 'ديزل / Diesel', year: '', weight: '' });

  const [maintForm, setMaintForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '', cost: '' });
  const [usageForm, setUsageForm] = useState({ date: new Date().toISOString().split('T')[0], hours_used: '', fuel_consumption: '' });
  const [oilForm, setOilForm]     = useState({ date: new Date().toISOString().split('T')[0], current_hours: '', cost: '', notes: '' });

  useEffect(() => { 
    fetchMaster(); 
    fetchAlerts();
  }, []);

  useEffect(() => { 
    if (selectedEqId) {
      fetchDetails(selectedEqId); 
    }
  }, [selectedEqId]);

  const fetchMaster = async () => {
    setLoading(true);
    try { 
      setEquipmentList(await getEquipmentList()); 
    } catch (err) { 
      console.error(err); 
      toast.error(t('common.error', 'خطأ في تحميل قائمة الأسطول'));
    } finally {
      setLoading(false); 
    }
  };

  const fetchAlerts = async () => {
    try {
      const alerts = await getOilAlerts();
      setOilAlerts(alerts);
    } catch (err) {
      console.error("Failed to fetch oil alerts", err);
    }
  };

  const fetchDetails = async (id) => {
    try { 
      setDetails(null); 
      const data = await getEquipmentDetails(id);
      setDetails(data); 
      setOilForm(prev => ({ ...prev, current_hours: data.equipment.current_hours }));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleCreateMaster = async (e) => {
    e.preventDefault();
    setFormLoading(true); 
    setFormError('');
    try { 
      const payload = {
        name: eqName,
        type: eqType,
        model: eqModel,
        serial_number: eqSerial,
        oil_change_interval_hours: parseFloat(eqOilHours) || 250,
        oil_change_interval_days: parseInt(eqOilDays) || 180,
        specifications: eqSpecs,
        status: 'active'
      };
      const res = await createEquipment(payload); 
      setOpenEqModal(false); 
      // Reset form
      setEqName(''); setEqModel(''); setEqSerial(''); setEqOilHours(250); setEqOilDays(180);
      setEqSpecs({ engine_power: '', fuel_type: 'ديزل / Diesel', year: '', weight: '' });
      
      toast.success(t('equipment.created_success', 'تم تسجيل المعدة بنجاح'));
      await fetchMaster(); 
      setSelectedEqId(res.id); 
    } catch (err) { 
      console.error(err);
      setFormError(t('common.error', 'حدث خطأ أثناء حفظ البيانات')); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    setFormLoading(true); 
    setFormError('');
    try { 
      await logMaintenance({ 
        equipment: selectedEqId, 
        date: maintForm.date,
        notes: maintForm.notes,
        cost: maintForm.cost ? parseFloat(maintForm.cost) : 0.0
      }); 
      setOpenMaintModal(false); 
      setMaintForm({ date: new Date().toISOString().split('T')[0], notes: '', cost: '' });
      toast.success(t('equipment.maintenance_logged', 'تم تسجيل الصيانة بنجاح'));
      fetchDetails(selectedEqId); 
    } catch (err) { 
      console.error(err);
      setFormError(t('common.error', 'حدث خطأ أثناء حفظ البيانات')); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleCreateUsage = async (e) => {
    e.preventDefault();
    setFormLoading(true); 
    setFormError('');
    try { 
      await logUsage({ 
        equipment: selectedEqId, 
        date: usageForm.date,
        hours_used: parseFloat(usageForm.hours_used),
        fuel_consumption: usageForm.fuel_consumption ? parseFloat(usageForm.fuel_consumption) : null
      }); 
      setOpenUsageModal(false); 
      setUsageForm({ date: new Date().toISOString().split('T')[0], hours_used: '', fuel_consumption: '' });
      toast.success(t('equipment.usage_logged', 'تم تسجيل ساعات التشغيل'));
      fetchDetails(selectedEqId); 
      fetchAlerts(); 
    } catch (err) { 
      console.error(err);
      setFormError(t('common.error', 'حدث خطأ أثناء حفظ البيانات')); 
    } finally { 
      setFormLoading(false); 
    }
  };

  const handleCreateOilChange = async (e) => {
    e.preventDefault();
    setFormLoading(true); 
    setFormError('');
    try {
      await logOilChange({
        equipment: selectedEqId,
        date: oilForm.date,
        hours_at_change: parseFloat(oilForm.current_hours),
        cost: oilForm.cost ? parseFloat(oilForm.cost) : 0.0,
        notes: oilForm.notes
      });
      setOpenOilModal(false);
      setOilForm({ date: new Date().toISOString().split('T')[0], current_hours: '', cost: '', notes: '' });
      toast.success(t('equipment.oil_logged', 'تم تسجيل تغيير الزيت'));
      fetchDetails(selectedEqId);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      setFormError(t('common.error', 'حدث خطأ أثناء حفظ البيانات'));
    } finally {
      setFormLoading(false);
    }
  };

  // Calculations for Oil Alert Display
  const getOilStatus = (eq) => {
    if (!eq) return { needsOilChange: false, text: '', color: 'emerald' };
    const nextChangeHrs = (eq.last_oil_change_hours || 0) + eq.oil_change_interval_hours;
    const hoursRemaining = nextChangeHrs - eq.current_hours;
    const isHoursDue = hoursRemaining <= 0;
    
    let isDateDue = false;
    let nextChangeDateStr = 'N/A';
    if (eq.last_oil_change_date) {
      const nextChangeDate = new Date(new Date(eq.last_oil_change_date).getTime() + eq.oil_change_interval_days * 24 * 60 * 60 * 1000);
      isDateDue = new Date() >= nextChangeDate;
      nextChangeDateStr = nextChangeDate.toISOString().split('T')[0];
    }

    const needsOilChange = isHoursDue || isDateDue;
    return {
      needsOilChange,
      hoursRemaining,
      nextChangeHrs,
      nextChangeDateStr,
      isHoursDue,
      isDateDue,
      text: needsOilChange 
        ? (isRTL ? 'تنبيه: يجب تغيير الزيت فوراً!' : 'Warning: Oil Change Due!')
        : (isRTL ? 'حالة الزيت ممتازة وعاملة' : 'Oil Status: Excellent'),
      color: needsOilChange ? 'rose' : 'emerald'
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-3 bg-amber-50 rounded-xl text-amber-600 inline-block">
              <Tractor className="h-7 w-7" />
            </span>
            {t('equipment.title', 'الأسطول والمعدات')}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{t('equipment.subtitle', 'إدارة أسطول الآليات وسجلات الصيانة وتنبيهات الزيت')}</p>
        </div>
        <Button 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
          onClick={() => setOpenEqModal(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1 ml-1" />
          {t('equipment.deploy_btn', 'تسجيل معدة')}
        </Button>
      </div>

      {/* Global Oil alerts banner */}
      {oilAlerts.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm font-bold leading-relaxed">
            {isRTL 
              ? `تنبيه صيانة الزيت: المعدات التالية تجاوزت الساعات/المدة المقررة وتحتاج لتغيير زيت فوري: `
              : `Oil Maintenance Alert: The following fleet equipment requires immediate oil change: `}
            <strong className="underline ml-1">
              {oilAlerts.map(alert => alert.name).join('، ')}
            </strong>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Equipment list */}
        <div className="w-full md:w-1/3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : (
            equipmentList.map(eq => {
              const hasAlert = oilAlerts.some(a => a.id === eq.id);
              const isSelected = selectedEqId === eq.id;
              return (
                <div 
                  key={eq.id} 
                  onClick={() => setSelectedEqId(eq.id)} 
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border text-right ${
                    isSelected 
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                      : (hasAlert ? 'bg-rose-50/30 border-rose-200 border-dashed hover:bg-rose-50/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm')
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h3 className={`font-black text-base ${isSelected ? 'text-emerald-800' : (hasAlert ? 'text-rose-700' : 'text-slate-800')}`}>
                      {eq.name}
                    </h3>
                    {hasAlert && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Droplet className="h-3 w-3" />
                        {isRTL ? "مطلوب زيت" : "Oil Due"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">
                    {t('equipment.registry_id', 'الرقم التسلسلي')}: HW-{String(eq.id).split('-')[0].toUpperCase()}
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-1.5 flex items-center gap-1 justify-end">
                    <span>{eq.current_hours} {isRTL ? `ساعة` : `hrs`}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span>{isRTL ? `ساعات التشغيل:` : `Hours:`}</span>
                  </p>
                </div>
              )
            })
          )}
          {equipmentList.length === 0 && !loading && (
            <div className="text-slate-400 font-semibold italic text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
              {t('equipment.no_fleet', 'لا توجد معدات مسجلة')}
            </div>
          )}
        </div>

        {/* Details panel */}
        <div className="w-full md:w-2/3">
          <Card className="border-slate-100 shadow-sm min-h-[550px] flex flex-col">
            {!selectedEqId ? (
              <div className="flex flex-col flex-1 items-center justify-center text-slate-400 p-8">
                <Car className="h-16 w-16 text-slate-200 mb-2" />
                <p className="font-semibold">{t('common.empty', 'حدد معدة من القائمة لعرض تفاصيلها')}</p>
              </div>
            ) : !details ? (
              <div className="flex flex-1 justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-950"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1 flex flex-col">
                {/* Details Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{details.equipment.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-extrabold">
                      {t('equipment.registry_id', 'الرقم التسلسلي')}: HW-{selectedEqId}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setOpenMaintModal(true)} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold">
                      <Wrench className="h-4 w-4 mr-1 ml-1" />
                      {t('equipment.log_maintenance', 'صيانة')}
                    </Button>
                    <Button onClick={() => setOpenUsageModal(true)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                      <Fuel className="h-4 w-4 mr-1 ml-1" />
                      {t('equipment.log_usage', 'تشغيل')}
                    </Button>
                    <Button onClick={() => setOpenOilModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      <Droplet className="h-4 w-4 mr-1 ml-1" />
                      {isRTL ? 'تغيير زيت' : 'Change Oil'}
                    </Button>
                  </div>
                </div>

                {/* Custom Tab Selector */}
                <div className="flex border-b border-slate-100 gap-1 pb-1">
                  {[
                    { id: 'overview', label: isRTL ? 'الخلاصة والمواصفات' : 'Overview & Specs' },
                    { id: 'usages', label: isRTL ? 'سجل التشغيل' : 'Usage Logs' },
                    { id: 'maintenances', label: isRTL ? 'سجلات الصيانة' : 'Maintenance Logs' },
                    { id: 'oil_changes', label: isRTL ? 'سجل تغيير الزيت' : 'Oil Changes' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id)}
                      className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                        detailTab === tab.id 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── OVERVIEW TAB ── */}
                {detailTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Status Alert */}
                    {(() => {
                      const os = getOilStatus(details.equipment);
                      return (
                        <div className="space-y-6">
                          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                            os.needsOilChange 
                              ? 'bg-rose-50 border-rose-200 text-rose-900' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}>
                            {os.needsOilChange ? <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
                            <span className="text-xs font-black">{os.text}</span>
                          </div>
                          
                          {/* Hours Tracker Card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                                {isRTL ? "ساعات التشغيل الحالية" : "Current Running Hours"}
                              </span>
                              <span className="text-2xl font-black text-slate-900 mt-1 block">
                                {details.equipment.current_hours} <span className="text-xs text-slate-500 font-bold">{isRTL ? "ساعة" : "hrs"}</span>
                              </span>
                            </div>

                            {/* Oil Schedule Tracker */}
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                                {isRTL ? "تغيير الزيت القادم عند" : "Next Oil Change At"}
                              </span>
                              <span className={`text-2xl font-black mt-1 block ${os.needsOilChange ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {os.nextChangeHrs} <span className="text-xs text-slate-500 font-bold">{isRTL ? "ساعة" : "hrs"}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold block mt-1.5">
                                {isRTL ? `المتبقي: ${os.hoursRemaining} ساعة` : `Remaining: ${os.hoursRemaining} hrs`} &bull; {isRTL ? `تاريخ الصلاحية: ${os.nextChangeDateStr}` : `Expiry Date: ${os.nextChangeDateStr}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Master Specifications */}
                    <Card className="border-slate-100 shadow-none">
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                          <Settings className="text-slate-400 h-4 w-4" /> 
                          {isRTL ? "مواصفات وتفاصيل المعدة" : "Equipment Specifications"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "نوع المعدة" : "Equipment Type"}</span>
                          <span className="font-extrabold text-xs text-slate-800">
                            {t(`equipment.type_${details.equipment.type}`, details.equipment.type)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "الموديل" : "Model"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.model || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "الرقم التسلسلي" : "Serial Number"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.serial_number || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "قوة المحرك" : "Engine Power"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.specifications?.engine_power || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "نوع الوقود" : "Fuel Type"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.specifications?.fuel_type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "سنة التصنيع" : "Mfg Year"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.specifications?.year || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">{isRTL ? "الوزن" : "Weight"}</span>
                          <span className="font-extrabold text-xs text-slate-800">{details.equipment.specifications?.weight || 'N/A'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ── USAGES TAB ── */}
                {detailTab === 'usages' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                      <Fuel className="text-blue-500 h-4 w-4" /> 
                      {t('equipment.runtime_title', 'سجل التشغيل والوقود')}
                    </h3>
                    {details.usages.length === 0 ? (
                      <p className="text-slate-400 italic text-center p-8 bg-slate-50 border border-dashed rounded-xl">{t('equipment.no_usage', 'لا توجد سجلات تشغيل بعد')}</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {details.usages.map(u => (
                          <div key={u.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-right">
                            <span className="font-bold text-xs text-slate-700">{u.date}</span>
                            <div>
                              <div className="text-blue-600 font-black text-sm">{u.hours_used} <span className="text-[10px] font-semibold text-slate-500">{t('equipment.hours', 'ساعة')}</span></div>
                              {u.fuel_consumption && <div className="text-[10px] font-bold text-amber-600 mt-0.5">{u.fuel_consumption} {t('equipment.fuel_short', 'لتر')}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── MAINTENANCE TAB ── */}
                {detailTab === 'maintenances' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                      <Wrench className="text-rose-500 h-4 w-4" /> 
                      {t('equipment.maintenance_title', 'سجل صيانة المعدة')}
                    </h3>
                    {details.maintenances.length === 0 ? (
                      <p className="text-slate-400 italic text-center p-8 bg-slate-50 border border-dashed rounded-xl">{t('equipment.no_maintenance', 'لا توجد سجلات صيانة حالية')}</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {details.maintenances.map(m => (
                          <div key={m.id} className="bg-rose-50/20 border border-rose-100 p-3.5 rounded-xl text-right">
                            <div className="flex justify-between items-center mb-1.5 border-b border-rose-200/50 pb-1.5">
                              <span className="font-black text-[10px] text-rose-800 uppercase">{t('equipment.event_label', 'حدث صيانة')}</span>
                              <span className="text-rose-600 font-bold text-xs bg-white px-2 py-0.5 rounded shadow-sm border">{m.date}</span>
                            </div>
                            <p className="text-slate-800 font-semibold text-xs leading-relaxed">{m.notes}</p>
                            {m.cost > 0 && (
                              <span className="block mt-1 text-[10px] text-rose-600 font-black">
                                {isRTL ? `تكلفة الصيانة:` : `Cost:`} {m.cost} EGP
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── OIL CHANGES TAB ── */}
                {detailTab === 'oil_changes' && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                      <Droplet className="text-emerald-500 h-4 w-4" /> 
                      {isRTL ? "سجلات تغيير الزيت" : "Oil Change Logs"}
                    </h3>
                    {details.oil_changes.length === 0 ? (
                      <p className="text-slate-400 italic text-center p-8 bg-slate-50 border border-dashed rounded-xl">{isRTL ? 'لا توجد سجلات لتغيير الزيت' : 'No oil changes recorded'}</p>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {details.oil_changes.map(o => (
                          <div key={o.id} className="bg-emerald-50/20 border border-emerald-100 p-3.5 rounded-xl text-right">
                            <div className="flex justify-between items-center mb-1.5 border-b border-emerald-200/50 pb-1.5">
                              <span className="font-black text-[10px] text-emerald-800 uppercase">{isRTL ? 'تغيير زيت وفلاتر' : 'Oil & Filter Change'}</span>
                              <span className="text-emerald-600 font-bold text-xs bg-white px-2 py-0.5 rounded shadow-sm border">{o.date}</span>
                            </div>
                            <p className="text-slate-800 font-black text-xs">
                              {isRTL ? `تم التغيير عند قراءة:` : `Changed at meter:`} {o.hours_at_change || o.current_hours} {isRTL ? `ساعة` : `hrs`}
                            </p>
                            {o.notes && <p className="text-slate-600 font-medium text-[10px] mt-1">{o.notes}</p>}
                            {o.cost > 0 && (
                              <span className="block mt-1 text-[10px] text-emerald-600 font-black">
                                {isRTL ? `التكلفة المباشرة:` : `Cost:`} {o.cost} EGP
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* REGISTER EQUIPMENT MODAL */}
      {openEqModal && (
        <Dialog open={true} onOpenChange={() => setOpenEqModal(false)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-800">{t('equipment.deploy_modal_title', 'تسجيل معدة جديدة')}</DialogTitle>
              <DialogDescription>{t('equipment.deploy_modal_desc', 'إضافة آلية جديدة إلى نظام إدارة الأسطول الزراعي.')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaster} className="space-y-4 pt-2">
              {formError && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-bold">{formError}</div>}
              
              <div className="space-y-1.5">
                <Label htmlFor="eq_name">{t('equipment.eq_name', 'اسم المعدة')}</Label>
                <Input id="eq_name" required placeholder="مثال: جرار جون دير 7500" value={eqName} onChange={(e) => setEqName(e.target.value)} />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="eq_type">{isRTL ? 'نوع الآلية' : 'Equipment Type'}</Label>
                <select id="eq_type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1" value={eqType} onChange={(e) => setEqType(e.target.value)}>
                  <option value="TRACTOR">{isRTL ? 'جرار زراعي / Tractor' : 'Tractor'}</option>
                  <option value="HARVESTER">{isRTL ? 'حاصدة زراعية / Harvester' : 'Harvester'}</option>
                  <option value="TRUCK">{isRTL ? 'سيارة نقل / شاحنة / Truck' : 'Truck'}</option>
                  <option value="IRRIGATION_PUMP">{isRTL ? 'مضخة ري / Irrigation Pump' : 'Irrigation Pump'}</option>
                  <option value="GENERATOR">{isRTL ? 'ولد كهربائي / Generator' : 'Generator'}</option>
                  <option value="OTHER">{isRTL ? 'آليات أخرى / Other' : 'Other'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eq_model">{isRTL ? 'موديل / طراز' : 'Model'}</Label>
                  <Input id="eq_model" placeholder="Model" value={eqModel} onChange={(e) => setEqModel(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eq_serial">{isRTL ? 'الرقم التسلسلي' : 'Serial Number'}</Label>
                  <Input id="eq_serial" placeholder="Serial No." value={eqSerial} onChange={(e) => setEqSerial(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eq_oil_hrs">{isRTL ? 'تغيير الزيت (ساعة)' : 'Oil (Hours)'}</Label>
                  <Input id="eq_oil_hrs" type="number" value={eqOilHours} onChange={(e) => setEqOilHours(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eq_oil_days">{isRTL ? 'تغيير الزيت (أيام)' : 'Oil (Days)'}</Label>
                  <Input id="eq_oil_days" type="number" value={eqOilDays} onChange={(e) => setEqOilDays(e.target.value)} />
                </div>
              </div>

              {/* Specs wrapper */}
              <div className="border border-slate-100 p-3.5 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-xs font-black text-slate-500 block">
                  {isRTL ? 'مواصفات فنية إضافية (Specifications)' : 'Technical Specifications'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isRTL ? 'قوة المحرك' : 'Power'}</Label>
                    <Input className="h-8 text-xs" placeholder="90 HP" value={eqSpecs.engine_power} onChange={(e) => setEqSpecs({ ...eqSpecs, engine_power: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isRTL ? 'نوع الوقود' : 'Fuel Type'}</Label>
                    <Input className="h-8 text-xs" value={eqSpecs.fuel_type} onChange={(e) => setEqSpecs({ ...eqSpecs, fuel_type: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isRTL ? 'سنة الصنع' : 'Year'}</Label>
                    <Input className="h-8 text-xs" placeholder="2024" value={eqSpecs.year} onChange={(e) => setEqSpecs({ ...eqSpecs, year: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{isRTL ? 'الوزن' : 'Weight'}</Label>
                    <Input className="h-8 text-xs" placeholder="3 Ton" value={eqSpecs.weight} onChange={(e) => setEqSpecs({ ...eqSpecs, weight: e.target.value })} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenEqModal(false)}>{t('equipment.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold">
                  {formLoading ? '...' : t('equipment.initialize_btn', 'حفظ المعدة')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MAINTENANCE MODAL */}
      {openMaintModal && (
        <Dialog open={true} onOpenChange={() => setOpenMaintModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-rose-700">{t('equipment.maint_modal_title', 'تسجيل صيانة')}</DialogTitle>
              <DialogDescription>{t('equipment.maint_modal_desc', 'إدخال عملية إصلاح أو صيانة دورية للمعدة.')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMaintenance} className="space-y-4 pt-2">
              {formError && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-bold">{formError}</div>}
              
              <div className="space-y-1.5">
                <Label htmlFor="maint_date">{t('equipment.maint_date', 'تاريخ الصيانة')}</Label>
                <Input id="maint_date" type="date" required value={maintForm.date} onChange={(e) => setMaintForm({...maintForm, date: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maint_cost">{isRTL ? 'تكلفة الصيانة (EGP)' : 'Cost (EGP)'}</Label>
                <Input id="maint_cost" type="number" step="0.01" placeholder="0.00" value={maintForm.cost} onChange={(e) => setMaintForm({...maintForm, cost: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maint_notes">{t('equipment.maint_notes', 'تفاصيل الصيانة')}</Label>
                <textarea id="maint_notes" required placeholder="وصف أعمال الصيانة وقطع الغيار المستبدلة..." className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" rows={4} value={maintForm.notes} onChange={(e) => setMaintForm({...maintForm, notes: e.target.value})} />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenMaintModal(false)}>{t('equipment.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  {formLoading ? '...' : t('equipment.maint_save', 'حفظ سجل الصيانة')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* USAGE MODAL */}
      {openUsageModal && (
        <Dialog open={true} onOpenChange={() => setOpenUsageModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-blue-700">{t('equipment.usage_modal_title', 'تسجيل تشغيل')}</DialogTitle>
              <DialogDescription>{t('equipment.usage_modal_desc', 'تسجيل ساعات عمل المعدة وحجم استهلاك الوقود.')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUsage} className="space-y-4 pt-2">
              {formError && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-bold">{formError}</div>}
              
              <div className="space-y-1.5">
                <Label htmlFor="usage_date">{t('equipment.usage_date', 'تاريخ التشغيل')}</Label>
                <Input id="usage_date" type="date" required value={usageForm.date} onChange={(e) => setUsageForm({...usageForm, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="usage_hours">{t('equipment.usage_hours', 'ساعات التشغيل المضافة')}</Label>
                  <Input id="usage_hours" type="number" step="0.1" required placeholder="مثال: 5.5" value={usageForm.hours_used} onChange={(e) => setUsageForm({...usageForm, hours_used: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usage_fuel">{t('equipment.usage_fuel', 'استهلاك الوقود (لتر)')}</Label>
                  <Input id="usage_fuel" type="number" step="0.1" placeholder="اختياري" value={usageForm.fuel_consumption} onChange={(e) => setUsageForm({...usageForm, fuel_consumption: e.target.value})} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenUsageModal(false)}>{t('equipment.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {formLoading ? '...' : t('equipment.usage_save', 'حفظ السجل')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* OIL CHANGE MODAL */}
      {openOilModal && (
        <Dialog open={true} onOpenChange={() => setOpenOilModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-emerald-700">{isRTL ? "تسجيل تغيير زيت وفلاتر للمعدة" : "Log Oil & Filter Change"}</DialogTitle>
              <DialogDescription>{isRTL ? "تسجيل صيانة الزيت وتحديث عداد الساعات تلقائياً." : "Record oil change event and automatically update next change schedule."}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOilChange} className="space-y-4 pt-2">
              {formError && <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-bold">{formError}</div>}
              
              <div className="space-y-1.5">
                <Label htmlFor="oil_date">{isRTL ? "تاريخ التغيير" : "Date of Change"}</Label>
                <Input id="oil_date" type="date" required value={oilForm.date} onChange={(e) => setOilForm({...oilForm, date: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="oil_hrs">{isRTL ? "قراءة العداد الحالية" : "Current Meter (hrs)"}</Label>
                  <Input id="oil_hrs" type="number" required value={oilForm.current_hours} onChange={(e) => setOilForm({...oilForm, current_hours: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="oil_cost">{isRTL ? "التكلفة (EGP)" : "Cost (EGP)"}</Label>
                  <Input id="oil_cost" type="number" placeholder="اختياري" value={oilForm.cost} onChange={(e) => setOilForm({...oilForm, cost: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="oil_notes">{isRTL ? "ملاحظات" : "Notes"}</Label>
                <textarea id="oil_notes" placeholder={isRTL ? "مثال: نوع الزيت المستخدم أو الفلاتر..." : "e.g. Oil grade, filter brands..."} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" rows={3} value={oilForm.notes} onChange={(e) => setOilForm({...oilForm, notes: e.target.value})} />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenOilModal(false)}>{t('equipment.cancel', 'إلغاء')}</Button>
                <Button type="submit" disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {formLoading ? '...' : (isRTL ? "حفظ وتحديث" : "Save & Update")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FleetManager;
