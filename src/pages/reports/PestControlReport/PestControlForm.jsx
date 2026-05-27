import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Save, Loader2, AlertCircle, ShieldAlert, ArrowRight, Image, Users, FileText, Trash2, Plus } from 'lucide-react';

import { reportsApi } from '../../../services/reportsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MaterialSelector from '../../../components/MaterialSelector';
import AttachmentUploader from '../../../components/AttachmentUploader';

export default function PestControlForm() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineerId, setEngineerId] = useState('');
  const [pesticide, setPesticide] = useState({ material_id: null, is_custom: false, name: '' });
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Loaded Options
  const [engineers, setEngineers] = useState([]);
  const [stages, setStages] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [pesticideItems, setPesticideItems] = useState([]);

  // Selections
  const [allocations, setAllocations] = useState([
    {
      id: `temp-${Date.now()}`,
      stageId: '',
      enclosureId: '',
      workers_company: 0,
      workers_contractor_a: 0,
      workers_contractor_b: 0,
      productivity: 0,
      notes: ''
    }
  ]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        // 1. Fetch Engineers
        const engRes = await reportsApi.getEngineers();
        setEngineers(engRes.data || []);
        if (engRes.data && engRes.data.length > 0) {
          setEngineerId(engRes.data[0].id);
        }

        // 2. Fetch Stages
        const stageRes = await reportsApi.getLocationNodes("STAGE");
        setStages(stageRes.data.results || stageRes.data || []);

        // 3. Fetch Enclosures
        const encRes = await reportsApi.getLocationNodes("ENCLOSURE");
        setEnclosures(encRes.data.results || encRes.data || []);

        // 4. Fetch Pesticide Items from warehouse
        const itemsRes = await api.get('/warehouse/items/');
        const allItems = itemsRes.data.results || itemsRes.data || [];
        setPesticideItems(allItems.filter(item => item.category === 'pesticides'));
      } catch (err) {
        console.error("Error loading pest control form options:", err);
      }
    };
    loadFormData();
  }, []);

  const handlePesticideChange = (pesticideData) => {
    setPesticide(pesticideData);
  };

  const addAllocation = () => {
    setAllocations([
      ...allocations,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        stageId: '',
        enclosureId: '',
        workers_company: 0,
        workers_contractor_a: 0,
        workers_contractor_b: 0,
        productivity: 0,
        notes: ''
      }
    ]);
  };

  const removeAllocation = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const updateAllocation = (id, field, value) => {
    setAllocations(
      allocations.map(a => {
        if (a.id === id) {
          const updated = { ...a, [field]: value };
          if (field === 'stageId') {
            updated.enclosureId = '';
          }
          return updated;
        }
        return a;
      })
    );
  };

  const filteredEnclosures = (stageId) => {
    if (!stageId) return enclosures;
    return enclosures.filter(enc => String(enc.parent) === String(stageId));
  };

  const totalCompanyWorkers = allocations.reduce((sum, a) => sum + (parseInt(a.workers_company) || 0), 0);
  const totalContractorWorkers = allocations.reduce((sum, a) => sum + (parseInt(a.workers_contractor_a) || 0) + (parseInt(a.workers_contractor_b) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (isUploading) {
      setSubmitError('يرجى الانتظار حتى يكتمل رفع المرفقات.');
      return;
    }

    if (!pesticide.material_id && !pesticide.name) {
      setSubmitError('يرجى اختيار أو كتابة المبيد المستخدم.');
      return;
    }

    if (allocations.some(a => !a.enclosureId)) {
      setSubmitError('يرجى اختيار الحوشة لكل المواقع المستهدفة.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create PestControlReport
      const reportPayload = {
        date,
        engineer: engineerId,
        pesticide_item: pesticide.material_id,
        custom_pesticide_name: pesticide.is_custom ? pesticide.name : null,
        quantity,
        notes,
        attachments: attachments.map(a => ({ url: a.url || a.file_url, type: a.type || a.file_type }))
      };

      const reportRes = await api.post('/reports/pest-control/', reportPayload);
      const reportId = reportRes.data.id;

      // 2. Create OperationalLocationAllocations
      for (const alloc of allocations) {
        const allocPayload = {
          content_type_model: 'pestcontrolreport',
          object_id: reportId,
          enclosure: alloc.enclosureId,
          allocated_workers_company: parseInt(alloc.workers_company) || 0,
          allocated_workers_contractor_a: parseInt(alloc.workers_contractor_a) || 0,
          allocated_workers_contractor_b: parseInt(alloc.workers_contractor_b) || 0,
          productivity_value: parseFloat(alloc.productivity) || 0.0,
          notes: alloc.notes || ''
        };
        await api.post('/reports/allocations/', allocPayload);
      }

      navigate('/reports/pest-control');
    } catch (err) {
      console.error(err);
      setSubmitError('حدث خطأ أثناء حفظ تقرير المكافحة ووقاية النبات.');
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
              <ShieldAlert className="w-6 h-6 text-amber-600" />
              تسجيل تقرير مكافحة ووقاية نبات جديد
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              يرجى إدخال تفاصيل دورة المكافحة والمواقع المستهدفة والمواد المستهلكة بدقة.
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
            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              المعلومات الأساسية لعملية الرش والمكافحة
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

          {/* Pesticide and Materials Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              المادة الفعالة وجرعة الاستهلاك
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <MaterialSelector 
                materials={pesticideItems}
                label="نوع المبيد المستخدم *"
                onMaterialChange={handlePesticideChange}
              />

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">إجمالي الكمية المستخدمة (لتر / كجم) *</Label>
                <Input 
                  type="number" 
                  min="0.1"
                  step="0.1"
                  placeholder="0.0"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                  required
                />
              </div>

            </div>
          </div>

          {/* Target Locations Card */}
          <Card className="w-full border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 flex flex-row justify-between items-center">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                توزيع الموارد والعمالة والإنتاجية للمواقع (الأحواش)
              </CardTitle>
              <Button
                type="button"
                onClick={addAllocation}
                className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm border-none bg-emerald-600"
              >
                <Plus className="w-4 h-4" />
                إضافة موقع مستهدف
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {allocations.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold text-sm">
                  لم يتم إضافة أي موقع مستهدف بعد. اضغط على "إضافة موقع مستهدف" للبدء.
                </div>
              ) : (
                <div className="space-y-4">
                  {allocations.map((alloc, idx) => (
                    <div key={alloc.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm relative space-y-4">
                      <button
                        type="button"
                        onClick={() => removeAllocation(alloc.id)}
                        className="absolute top-4 left-4 text-red-500 hover:text-red-700 transition-colors bg-slate-50 border border-slate-200 p-1.5 rounded-lg hover:bg-slate-100"
                        title="حذف الموقع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Stage Dropdown */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">المرحلة التشغيلية</Label>
                          <select
                            value={alloc.stageId}
                            onChange={(e) => updateAllocation(alloc.id, 'stageId', e.target.value)}
                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm"
                          >
                            <option value="">كل المراحل...</option>
                            {stages.map(stg => (
                              <option key={stg.id} value={stg.id}>{stg.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Enclosure Dropdown */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">الحوشة *</Label>
                          <select
                            value={alloc.enclosureId}
                            onChange={(e) => updateAllocation(alloc.id, 'enclosureId', e.target.value)}
                            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm"
                            required
                          >
                            <option value="">اختر الحوشة...</option>
                            {filteredEnclosures(alloc.stageId).map(enc => (
                              <option key={enc.id} value={enc.id}>{enc.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-4">
                        {/* Company Workers */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-600">عمال الشركة</Label>
                          <Input
                            type="number"
                            min="0"
                            value={alloc.workers_company || ''}
                            onChange={(e) => updateAllocation(alloc.id, 'workers_company', parseInt(e.target.value) || 0)}
                            className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                            placeholder="0"
                          />
                        </div>

                        {/* Contractor A Workers */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-600">عمال مقاول أ</Label>
                          <Input
                            type="number"
                            min="0"
                            value={alloc.workers_contractor_a || ''}
                            onChange={(e) => updateAllocation(alloc.id, 'workers_contractor_a', parseInt(e.target.value) || 0)}
                            className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                            placeholder="0"
                          />
                        </div>

                        {/* Contractor B Workers */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-600">عمال مقاول ب</Label>
                          <Input
                            type="number"
                            min="0"
                            value={alloc.workers_contractor_b || ''}
                            onChange={(e) => updateAllocation(alloc.id, 'workers_contractor_b', parseInt(e.target.value) || 0)}
                            className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                            placeholder="0"
                          />
                        </div>

                        {/* Productivity */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-emerald-600">الإنتاجية للموقع</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={alloc.productivity || ''}
                            onChange={(e) => updateAllocation(alloc.id, 'productivity', parseFloat(e.target.value) || 0)}
                            className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm border-emerald-100 focus-visible:ring-emerald-400"
                            placeholder="0.0"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold text-slate-600">ملاحظات الموقع</Label>
                        <Input
                          type="text"
                          value={alloc.notes || ''}
                          onChange={(e) => updateAllocation(alloc.id, 'notes', e.target.value)}
                          placeholder="ملاحظات تشغيلية خاصة بهذا الحوش..."
                          className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worker Counts Summary */}
          {allocations.length > 0 && (
            <div className="grid grid-cols-2 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-right">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي عمال الشركة</span>
                  <span className="text-2xl font-black text-slate-800">{totalCompanyWorkers}</span>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي عمال المقاولين</span>
                  <span className="text-2xl font-black text-slate-800">{totalContractorWorkers}</span>
                </div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </div>
          )}

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
              ملاحظات / تشخيص الإصابة والظروف البيئية
            </Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات حول شدة الإصابة، سرعة الرياح، الرطوبة، أو أي معطيات تشغيلية أخرى للمكافحة..."
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
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ تقرير المكافحة'}
        </Button>
      </div>
    </form>
  );
}
