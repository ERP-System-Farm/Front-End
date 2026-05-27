import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';
import { Save, Loader2, AlertCircle, Droplets, ArrowRight, Plus, Trash2, Sprout, Image, Users, FileText, Edit2 } from 'lucide-react';

import { reportsApi } from '../../../services/reportsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MaterialSelector from '../../../components/MaterialSelector';
import AttachmentUploader from '../../../components/AttachmentUploader';

export default function IrrigationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineerId, setEngineerId] = useState('');
  const [notes, setNotes] = useState('');
  const [totalShifts, setTotalShifts] = useState(0);
  const [totalHours, setTotalHours] = useState(0.0);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Global Workers State
  const [companyWorkers, setCompanyWorkers] = useState(0);
  const [contractorId, setContractorId] = useState('');
  const [contractorWorkers, setContractorWorkers] = useState(0);
  const [laborEntries, setLaborEntries] = useState([]);

  // Loaded Options
  const [engineers, setEngineers] = useState([]);
  const [fertilizerItems, setFertilizerItems] = useState([]);
  const [stages, setStages] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [hrWorkers, setHrWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Selections
  const [shifts, setShifts] = useState([
    { id: 1, phaseId: '', shiftsCount: 1, hoursPerShift: 1.0, fertilizers: [] }
  ]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        // 1. Fetch Engineers
        const engRes = await reportsApi.getEngineers();
        setEngineers(engRes.data || []);
        if (engRes.data && engRes.data.length > 0 && !isEditMode) {
          setEngineerId(engRes.data[0].id);
        }

        // 2. Fetch Stages (Phases)
        const stageRes = await reportsApi.getLocationNodes("STAGE");
        setStages(stageRes.data.results || stageRes.data || []);

        // 3. Fetch Fertilizer & Pesticide Items from warehouse
        const itemsRes = await api.get('/warehouse/items/');
        const allItems = itemsRes.data.results || itemsRes.data || [];
        setFertilizerItems(allItems.filter(item => item.category === 'fertilizers' || item.category === 'pesticides'));

        // 4. Fetch Contractors
        const contractorsRes = await reportsApi.getContractors();
        setContractors(contractorsRes.data.results || contractorsRes.data || []);

        // 5. Fetch HR Workers
        setLoadingWorkers(true);
        const workersRes = await api.get('/hr/workers/');
        setHrWorkers(workersRes.data || []);
        setLoadingWorkers(false);

        // 6. Fetch report data if in edit mode
        if (isEditMode) {
          const reportRes = await api.get(`/reports/irrigation/${id}/`);
          const rep = reportRes.data;
          setDate(rep.date);
          setEngineerId(rep.engineer);
          setNotes(rep.notes || '');
          setCompanyWorkers(rep.company_workers || 0);
          setContractorId(rep.contractor || '');
          setContractorWorkers(rep.contractor_workers || 0);
          
          if (rep.attachments) {
            setAttachments(rep.attachments.map((a, idx) => ({
              id: idx,
              file_url: a.url || a.file_url || a.file,
              file_type: a.type || a.file_type || 'FILE'
            })));
          }

          if (rep.details && rep.details.length > 0) {
            setShifts(rep.details.map(d => ({
              id: d.id || Date.now() + Math.random(),
              phaseId: d.phase,
              shiftsCount: d.shifts_count,
              hoursPerShift: parseFloat(d.hours_per_shift),
              fertilizers: (d.fertilizers || []).map(f => ({
                id: f.id || Date.now() + Math.random(),
                material_id: f.fertilizer_item,
                is_custom: !!f.custom_material_name,
                name: f.custom_material_name || '',
                quantity: parseFloat(f.quantity) || 0
              }))
            })));
          }

          if (rep.labor_entries) {
            setLaborEntries(rep.labor_entries.map((e, index) => ({
              temp_id: e.id || crypto.randomUUID(),
              worker: e.worker_id || e.worker || null,
              worker_name: e.worker_name,
              worker_type: e.worker_type,
              worker_rate: parseFloat(e.worker_rate) || 0,
              deduction_hours: 8 - (parseFloat(e.hours) || 8),
              overtime: parseFloat(e.overtime) || 0,
              note: e.note || '',
              isManual: !e.worker_id && !e.worker
            })));
          }
        }
      } catch (err) {
        console.error("Error loading irrigation form options:", err);
        setLoadingWorkers(false);
      }
    };
    loadFormData();
  }, [id, isEditMode]);

  const handleAddLaborEntry = () => {
    const newEntry = {
      temp_id: crypto.randomUUID(),
      worker: null,
      worker_name: '',
      worker_type: 'COMPANY',
      worker_rate: 0,
      deduction_hours: 0,
      overtime: 0,
      note: '',
      isManual: false,
    };
    setLaborEntries(prev => [...prev, newEntry]);
  };

  const handleRemoveLaborEntry = (tempId) => {
    setLaborEntries(prev => prev.filter(entry => entry.temp_id !== tempId));
  };

  const handleUpdateLaborEntry = (tempId, fields) => {
    setLaborEntries(prev => prev.map(entry => {
      if (entry.temp_id === tempId) {
        return { ...entry, ...fields };
      }
      return entry;
    }));
  };

  const addShift = () => {
    setShifts(prev => [
      ...prev,
      { id: Date.now(), phaseId: '', shiftsCount: 1, hoursPerShift: 1.0, fertilizers: [] }
    ]);
  };

  const removeShift = (id) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const updateShift = (id, field, value) => {
    setShifts(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const addFertilizerToShift = (shiftId) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          fertilizers: [
            ...(s.fertilizers || []),
            { id: Date.now(), material_id: null, is_custom: false, name: '', quantity: 0 }
          ]
        };
      }
      return s;
    }));
  };

  const removeFertilizerFromShift = (shiftId, fertId) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          fertilizers: (s.fertilizers || []).filter(f => f.id !== fertId)
        };
      }
      return s;
    }));
  };

  const updateShiftFertilizer = (shiftId, fertId, fertData) => {
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        return {
          ...s,
          fertilizers: (s.fertilizers || []).map(f => {
            if (f.id === fertId) {
              return { ...f, ...fertData };
            }
            return f;
          })
        };
      }
      return s;
    }));
  };

  // Auto calculate total shifts & hours from shift details
  useEffect(() => {
    const shiftsCount = shifts.reduce((sum, s) => sum + (parseInt(s.shiftsCount) || 0), 0);
    const hoursCount = shifts.reduce((sum, s) => sum + ((parseInt(s.shiftsCount) || 0) * (parseFloat(s.hoursPerShift) || 0)), 0);
    setTotalShifts(shiftsCount);
    setTotalHours(hoursCount.toFixed(1));
  }, [shifts]);

  const totalCompanyWorkers = parseInt(companyWorkers) || 0;
  const totalContractorWorkers = contractorId ? (parseInt(contractorWorkers) || 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (isUploading) {
      setSubmitError('يرجى الانتظار حتى يكتمل رفع الملفات والمرفقات.');
      return;
    }

    if (shifts.some(s => !s.phaseId)) {
      setSubmitError('يرجى تحديد المرحلة التشغيلية لكل تحويلة ري.');
      return;
    }

    setIsSubmitting(true);

    try {
      const hasAnyFertilizer = shifts.some(s => s.fertilizers && s.fertilizers.length > 0);

      // Prepare nested shifts details
      const details = shifts.map(shift => {
        const fertilizers = (shift.fertilizers || [])
          .filter(f => f.material_id || f.name)
          .map(f => ({
            fertilizer_item: f.material_id || null,
            custom_material_name: f.is_custom ? f.name : null,
            quantity: parseFloat(f.quantity) || 0,
            unit: 'كجم'
          }));

        return {
          phase: shift.phaseId,
          shifts_count: parseInt(shift.shiftsCount) || 1,
          hours_per_shift: parseFloat(shift.hoursPerShift) || 1.0,
          fertilizers
        };
      });

      // 1. Create IrrigationReport with nested details
      const reportPayload = {
        date,
        engineer: engineerId,
        notes,
        is_fertilized: hasAnyFertilizer,
        total_shifts: parseInt(totalShifts) || 0,
        total_hours: parseFloat(totalHours) || 0.0,
        company_workers: parseInt(companyWorkers) || 0,
        contractor: contractorId || null,
        contractor_workers: contractorId ? (parseInt(contractorWorkers) || 0) : 0,
        labor_entries: laborEntries.map(entry => ({
          worker_name: entry.worker_name,
          worker_type: entry.worker_type,
          contractor: entry.worker_type === 'CONTRACTOR' ? (contractorId || null) : null,
          worker_rate: parseFloat(entry.worker_rate) || 0,
          hours: 8 - (parseFloat(entry.deduction_hours) || 0),
          overtime: parseFloat(entry.overtime) || 0,
          note: entry.note || ''
        })),
        attachments: attachments.map(a => ({ url: a.url || a.file_url, type: a.type || a.file_type })),
        details
      };

      if (isEditMode) {
        await api.put(`/reports/irrigation/${id}/`, reportPayload);
      } else {
        await api.post('/reports/irrigation/', reportPayload);
      }

      navigate('/reports/irrigation');
    } catch (err) {
      console.error(err);
      setSubmitError('حدث خطأ أثناء حفظ تقرير الري والتسميد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pb-32 bg-slate-50 min-h-screen text-right" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-6 h-6 text-blue-600" />
              {isEditMode ? 'تعديل تقرير ري وتسميد' : 'تسجيل دورة ري وتسميد جديدة'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditMode ? 'تعديل تفاصيل دورة الري وتوزيع العمالة بدقة في المواقع المختلفة.' : 'يرجى إدخال تفاصيل دورة الري وتوزيع العمالة بدقة في المواقع المختلفة.'}
            </p>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              المعلومات الأساسية للمناوبة
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Date */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">تاريخ التقرير *</Label>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-11"
                  required
                />
              </div>

              {/* Engineer */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">المهندس المسؤول *</Label>
                <select 
                  value={engineerId} 
                  onChange={(e) => setEngineerId(e.target.value)}
                  className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  required
                >
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.name || eng.username}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Shifts and Durations Collapsible Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                تحويلات الري ومكونات التسميد
              </p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addShift}
                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
              >
                <Plus className="w-4 h-4 ml-1" />
                إضافة تحويلة
              </Button>
            </div>

            <div className="space-y-6">
              {shifts.map((shift, idx) => (
                <div key={shift.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/30 relative space-y-4 shadow-sm">
                  {shifts.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeShift(shift.id)}
                      className="absolute top-3 left-3 text-red-500 hover:text-red-700 transition-colors bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Operating Phase */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">المرحلة / القطاع التشغيلي *</Label>
                      <select 
                        value={shift.phaseId} 
                        onChange={(e) => updateShift(shift.id, 'phaseId', e.target.value)}
                        className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm"
                        required
                      >
                        <option value="">اختر المرحلة...</option>
                        {stages.map(stg => (
                          <option key={stg.id} value={stg.id}>{stg.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Shifts Count */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">عدد التحويلات *</Label>
                      <Input 
                        type="number" 
                        min="1"
                        value={shift.shiftsCount} 
                        onChange={(e) => updateShift(shift.id, 'shiftsCount', e.target.value)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                        required
                      />
                    </div>

                    {/* Hours Per Shift */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">عدد الساعات للتحويلة *</Label>
                      <Input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        value={shift.hoursPerShift} 
                        onChange={(e) => updateShift(shift.id, 'hoursPerShift', e.target.value)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                        required
                      />
                    </div>

                  </div>

                  {/* Per-shift applied fertilizers/pesticides list */}
                  <div className="border-t border-slate-200/80 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-slate-800">المواد المضافة (أسمدة / مبيدات) لهذه التحويلة:</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addFertilizerToShift(shift.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة سماد / مبيد
                      </Button>
                    </div>

                    {(!shift.fertilizers || shift.fertilizers.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">لا توجد مواد مضافة لهذه التحويلة حالياً.</p>
                    ) : (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-inner">
                        {shift.fertilizers.map((fert) => (
                          <div key={fert.id} className="flex flex-col sm:flex-row items-end gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative">
                            <button
                              type="button"
                              onClick={() => removeFertilizerFromShift(shift.id, fert.id)}
                              className="absolute top-2 left-2 text-slate-400 hover:text-red-500 sm:relative sm:top-auto sm:left-auto sm:mb-2.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="flex-1 w-full">
                              <MaterialSelector 
                                materials={fertilizerItems}
                                label="نوع المادة (سماد / مبيد)"
                                onMaterialChange={(data) => updateShiftFertilizer(shift.id, fert.id, data)}
                              />
                            </div>

                            <div className="w-full sm:w-32 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-600">الكمية (كجم)</Label>
                              <Input 
                                type="number" 
                                min="0.1"
                                step="0.1"
                                placeholder="0.0"
                                value={fert.quantity || ''}
                                onChange={(e) => updateShiftFertilizer(shift.id, fert.id, { quantity: parseFloat(e.target.value) || 0 })}
                                className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Aggregated Totals Banner */}
            <div className="flex gap-4 bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-blue-800 text-xs sm:text-sm font-bold justify-around shadow-inner">
              <span>إجمالي التحويلات: {totalShifts}</span>
              <span>إجمالي الساعات التشغيلية: {totalHours} ساعة</span>
            </div>
          </div>

          {/* Global Workers Input Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              توزيع العمالة الإجمالية لدورة الري
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Company Workers */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">عدد عمال الشركة *</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={companyWorkers} 
                  onChange={(e) => setCompanyWorkers(parseInt(e.target.value) || 0)} 
                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                  required
                />
              </div>

              {/* Contractor Select */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">المقاول</Label>
                <select 
                  value={contractorId} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setContractorId(val);
                    if (!val) {
                      setContractorWorkers(0);
                    }
                  }}
                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                >
                  <option value="">اختر المقاول...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Contractor Workers Count */}
              {contractorId && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">عدد عمال المقاول *</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={contractorWorkers} 
                    onChange={(e) => setContractorWorkers(parseInt(e.target.value) || 0)} 
                    className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                    required
                  />
                </div>
              )}
            </div>

            {/* Workers Summary Banner */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">إجمالي عمال الشركة:</span>
                <span className="text-lg font-black text-slate-800">{totalCompanyWorkers}</span>
              </div>
              <div className="flex items-center justify-between border-r border-slate-200 pr-4">
                <span className="text-xs text-slate-500 font-bold">إجمالي عمال المقاولين:</span>
                <span className="text-lg font-black text-slate-800">{totalContractorWorkers}</span>
              </div>
            </div>

            {/* Individual Labor Details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-bold text-slate-800">تفاصيل العمالة الفردية (خصم / إضافي / ملاحظة):</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLaborEntry}
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة تفاصيل عامل
                </Button>
              </div>

              {loadingWorkers && (
                <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري تحميل قائمة عمالة الشركة...</span>
                </div>
              )}

              {laborEntries.length === 0 ? (
                <p className="text-xs text-slate-400 italic">لم يتم إضافة تفاصيل فردية بعد.</p>
              ) : (
                <div className="space-y-4">
                  {laborEntries.map((entry) => {
                    const isManual = entry.isManual || !entry.worker;

                    return (
                      <div
                        key={entry.temp_id}
                        className="grid grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 relative items-start"
                      >
                        {/* Worker Name */}
                        <div className="col-span-12 md:col-span-3 flex flex-col items-start w-full">
                          <div className="flex justify-between items-center w-full mb-1.5 h-[18px]">
                            <label className="block text-[11px] font-bold text-slate-500">اسم العامل</label>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateLaborEntry(entry.temp_id, {
                                  isManual: !isManual,
                                  worker: null,
                                  worker_name: '',
                                })
                              }
                              className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold transition-colors"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              {isManual ? 'قائمة HR' : 'إدخال يدوي'}
                            </button>
                          </div>
                          {isManual ? (
                            <Input
                              type="text"
                              placeholder="اسم العامل كاملاً"
                              value={entry.worker_name || ''}
                              onChange={(e) =>
                                handleUpdateLaborEntry(entry.temp_id, {
                                  worker_name: e.target.value,
                                  worker: null,
                                })
                              }
                              className="h-9 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                            />
                          ) : (
                            <select
                              value={entry.worker ? entry.worker.toString() : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const selected = hrWorkers.find((w) => w.id.toString() === val);
                                if (selected) {
                                  handleUpdateLaborEntry(entry.temp_id, {
                                    worker: selected.id,
                                    worker_name: selected.name,
                                    worker_type: selected.worker_type,
                                    worker_rate: selected.hourly_rate || 0,
                                  });
                                } else {
                                  handleUpdateLaborEntry(entry.temp_id, {
                                    worker: null,
                                    worker_name: '',
                                  });
                                }
                              }}
                              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
                            >
                              <option value="">اختر العامل...</option>
                              {hrWorkers.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({w.worker_type === 'COMPANY' ? 'شركة' : 'مقاول'})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Worker Type */}
                        <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col items-start w-full">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right h-[18px]">
                            نوع العامل
                          </label>
                          <select
                            value={entry.worker_type || 'COMPANY'}
                            onChange={(e) =>
                              handleUpdateLaborEntry(entry.temp_id, { worker_type: e.target.value })
                            }
                            className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
                          >
                            <option value="COMPANY">عمالة الشركة</option>
                            <option value="CONTRACTOR">عمالة المقاول</option>
                          </select>
                        </div>

                        {/* Overtime */}
                        <div className="col-span-6 sm:col-span-3 md:col-span-1 flex flex-col items-start w-full">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right truncate h-[18px]">
                            إضافي (س)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={entry.overtime || 0}
                            onChange={(e) =>
                              handleUpdateLaborEntry(entry.temp_id, {
                                overtime: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-9 text-xs text-center font-bold w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                          />
                        </div>

                        {/* Deduction */}
                        <div className="col-span-6 sm:col-span-3 md:col-span-1 flex flex-col items-start w-full">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right truncate h-[18px]">
                            خصم (س)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={entry.deduction_hours || 0}
                            onChange={(e) =>
                              handleUpdateLaborEntry(entry.temp_id, {
                                deduction_hours: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="h-9 text-xs text-center font-bold text-red-600 w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                          />
                        </div>

                        {/* Note */}
                        <div className="col-span-10 sm:col-span-10 md:col-span-4 flex flex-col items-start w-full">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right h-[18px]">
                            ملاحظة / الحركة
                          </label>
                          <Input
                            type="text"
                            placeholder="ملاحظات الحركة"
                            value={entry.note || ''}
                            onChange={(e) =>
                              handleUpdateLaborEntry(entry.temp_id, { note: e.target.value })
                            }
                            className="h-9 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                          />
                        </div>

                        {/* Delete button */}
                        <div className="col-span-2 sm:col-span-2 md:col-span-1 flex flex-col justify-center items-center w-full">
                          <div className="h-[18px] mb-1.5 w-full block"></div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLaborEntry(entry.temp_id)}
                            className="h-9 w-full max-w-[40px] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center justify-center border border-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
            <p className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Image className="w-5 h-5 text-emerald-600" />
              مرفقات التقرير (صور الميدان)
            </p>
            <AttachmentUploader
              value={attachments}
              onChange={setAttachments}
              onUploadStateChange={setIsUploading}
              type="daily-task"
            />
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <Label className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              ملاحظات / توصيات إضافية للمناوبة
            </Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات أو تعليمات خاصة بمناوبة الري هنا..."
              className="rounded-xl border-slate-200 text-xs sm:text-sm min-h-[100px]"
            />
          </div>

        </div>
      </div>

      {/* Fixed Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 px-6 md:px-12 flex justify-end items-center shadow-lg gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="h-11 px-8 rounded-xl font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || isUploading} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl shadow-md flex items-center gap-1.5"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? 'جاري الحفظ...' : isEditMode ? 'تعديل التقرير' : 'حفظ تقرير الري والتسميد'}
        </Button>
      </div>
    </form>
  );
}
