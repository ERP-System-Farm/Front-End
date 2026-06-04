import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  Save,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Image,
  Users,
  FileText,
  Trash2,
  Plus,
  Sparkles,
  Edit2
} from 'lucide-react';

import { reportsApi } from '../../../services/reportsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MaterialSelector from '../../../components/MaterialSelector';
import AttachmentUploader from '../../../components/AttachmentUploader';
import LocationMultiSelect from '../../../components/LocationMultiSelect';
import { useFeatures } from '@/contexts/FeatureToggleContext';

export default function PestControlForm() {
  const navigate = useNavigate();
  const { config } = useFeatures();
  const isHrEnabled = config?.features?.hr ?? true;

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [date, setDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return (new Date(now - tzOffset)).toISOString().slice(0, 16);
  });
  const [engineerId, setEngineerId] = useState('');
  const [pesticides, setPesticides] = useState([
    { tempId: crypto.randomUUID(), material_id: null, is_custom: false, name: '', quantity: 0, rate_per_feddan: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Loaded Options
  const [engineers, setEngineers] = useState([]);
  const [pesticideItems, setPesticideItems] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [hrWorkers, setHrWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Geographic hierarchy states
  const [locationTreeOptions, setLocationTreeOptions] = useState([]);
  const [flatLocations, setFlatLocations] = useState([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [allocations, setAllocations] = useState([]);

  // Common labor states
  const [isCommonLabor, setIsCommonLabor] = useState(true);
  const [commonWorkersCompany, setCommonWorkersCompany] = useState(0);
  const [commonContractorId, setCommonContractorId] = useState('');
  const [commonContractorWorkers, setCommonContractorWorkers] = useState(0);
  const [commonLaborEntries, setCommonLaborEntries] = useState([]);
  const [isCommonLaborDetailsOpen, setIsCommonLaborDetailsOpen] = useState(false);

  // Expanded labor details state per allocation row: maps allocation.id -> boolean
  const [expandedLaborDetails, setExpandedLaborDetails] = useState({});

  useEffect(() => {
    const loadFormData = async () => {
      try {
        // 1. Fetch Engineers
        const engRes = await reportsApi.getEngineers();
        setEngineers(engRes.data || []);
        if (engRes.data && engRes.data.length > 0) {
          setEngineerId(engRes.data[0].id);
        }

        // 2. Fetch Contractors & Sort Alphabetically
        const contractorsRes = await reportsApi.getContractors();
        const fetchedContractors = contractorsRes.data.results || contractorsRes.data || [];
        const sortedContractors = fetchedContractors
          .filter(c => c.is_active !== false)
          .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        setContractors(sortedContractors);

        // 3. Fetch Pesticide Items from warehouse
        const itemsRes = await api.get('/warehouse/items/');
        const allItems = itemsRes.data.results || itemsRes.data || [];
        setPesticideItems(allItems.filter(item => item.category === 'pesticides'));

        // 4. Fetch Geography Tree once to build flat labels & helper maps
        const treeRes = await api.get('farm/location-tree/?filtered=1');
        const treeData = treeRes.data.tree || [];

        const flat = [];
        const treeOptions = [];
        const traverse = (node, parentPath = [], level = 0) => {
          const currentPath = [...parentPath, node.name];

          const getDescendantEnclosures = (n) => {
            if (n.type === 'ENCLOSURE') {
              return [n.id];
            }
            let res = [];
            if (n.children && n.children.length > 0) {
              n.children.forEach(child => {
                res = [...res, ...getDescendantEnclosures(child)];
              });
            }
            return res;
          };

          const enclosures = getDescendantEnclosures(node);

          flat.push({
            id: node.id,
            name: node.name,
            type: node.type,
            pathLabel: currentPath.join(' ➔ ')
          });

          treeOptions.push({
            id: node.id,
            name: node.name,
            type: node.type,
            level,
            pathLabel: currentPath.join(' ➔ '),
            descendantEnclosures: enclosures
          });

          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              traverse(child, currentPath, level + 1);
            });
          }
        };

        treeData.forEach(rootNode => traverse(rootNode));
        setFlatLocations(flat);
        setLocationTreeOptions(treeOptions);
      } catch (err) {
        console.error("Error loading pest control form options:", err);
      }
    };
    loadFormData();
  }, []);

  // Fetch HR Workers if HR Module is active
  useEffect(() => {
    if (!isHrEnabled) return;
    const fetchWorkers = async () => {
      try {
        setLoadingWorkers(true);
        const res = await api.get('/hr/workers/');
        setHrWorkers(res.data || []);
      } catch (e) {
        console.error("Failed to load workers list", e);
      } finally {
        setLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, [isHrEnabled]);

  const handleAddPesticideRow = () => {
    setPesticides(prev => [
      ...prev,
      { tempId: crypto.randomUUID(), material_id: null, is_custom: false, name: '', quantity: 0, rate_per_feddan: 0 }
    ]);
  };

  const handleRemovePesticideRow = (tempId) => {
    if (pesticides.length === 1) return;
    setPesticides(prev => prev.filter(p => p.tempId !== tempId));
  };

  const handlePesticideRowChange = (tempId, field, value) => {
    setPesticides(prev =>
      prev.map(p => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };

  const handlePesticideChange = (tempId, pesticideData) => {
    setPesticides(prev =>
      prev.map(p => (p.tempId === tempId ? { ...p, ...pesticideData } : p))
    );
  };

  const handleLocationChange = (newNodeIds, resolvedEnclosureIds) => {
    setSelectedLocationIds(newNodeIds);

    // Synchronize allocations
    setAllocations(prev => {
      // 1. Keep rows where enclosureId is in resolvedEnclosureIds
      const kept = prev.filter(row => resolvedEnclosureIds.includes(row.enclosureId));

      // 2. For any resolvedEnclosureId not in the kept list, add a new default row
      const existingIds = kept.map(row => row.enclosureId);
      const newRows = resolvedEnclosureIds
        .filter(encId => !existingIds.includes(encId))
        .map(encId => ({
          id: `temp-${Date.now()}-${encId}-${Math.random()}`,
          enclosureId: encId,
          workers_company: 0,
          contractorId: '',
          contractor_workers: 0,
          productivity: 0,
          notes: '',
          labor_entries: []
        }));

      return [...kept, ...newRows];
    });
  };

  // Expand individual enclosure tags into single other node tags when trashing a row
  const removeEnclosureFromSelection = (enclosureId) => {
    const newSelection = [];
    selectedLocationIds.forEach(locId => {
      const opt = flatLocations.find(l => String(l.id) === String(locId));
      if (opt) {
        if (String(opt.id) === String(enclosureId) && opt.type === 'ENCLOSURE') {
          return;
        }

        const descendantTreeOption = locationTreeOptions.find(o => String(o.id) === String(locId));
        if (descendantTreeOption && descendantTreeOption.descendantEnclosures.includes(enclosureId)) {
          // Replace parent tag with all other descendant enclosures
          descendantTreeOption.descendantEnclosures.forEach(childId => {
            if (String(childId) !== String(enclosureId)) {
              newSelection.push(childId);
            }
          });
        } else {
          newSelection.push(locId);
        }
      }
    });

    const uniqueSelection = Array.from(new Set(newSelection));

    // Recalculate resolved enclosures
    const resolved = [];
    uniqueSelection.forEach(id => {
      const opt = locationTreeOptions.find(o => String(o.id) === String(id));
      if (opt) {
        opt.descendantEnclosures.forEach(encId => {
          if (!resolved.includes(encId)) resolved.push(encId);
        });
      }
    });

    setSelectedLocationIds(uniqueSelection);
    setAllocations(prev => prev.filter(row => resolved.includes(row.enclosureId)));
  };

  const updateAllocation = (id, field, value) => {
    setAllocations(prev =>
      prev.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Labor entries state management per allocation row
  const handleAddLaborEntry = (allocId) => {
    setAllocations(prev => prev.map(a => {
      if (a.id === allocId) {
        const newEntry = {
          temp_id: crypto.randomUUID(),
          worker: null,
          worker_name: '',
          worker_type: 'COMPANY',
          worker_rate: 0,
          deduction_hours: 0,
          overtime: 0,
          note: '',
          isManual: false
        };
        return {
          ...a,
          labor_entries: [...(a.labor_entries || []), newEntry]
        };
      }
      return a;
    }));
  };

  const handleRemoveLaborEntry = (allocId, tempId) => {
    setAllocations(prev => prev.map(a => {
      if (a.id === allocId) {
        return {
          ...a,
          labor_entries: (a.labor_entries || []).filter(entry => entry.temp_id !== tempId)
        };
      }
      return a;
    }));
  };

  const handleUpdateLaborEntry = (allocId, tempId, fields) => {
    setAllocations(prev => prev.map(a => {
      if (a.id === allocId) {
        return {
          ...a,
          labor_entries: (a.labor_entries || []).map(entry => {
            if (entry.temp_id === tempId) {
              return { ...entry, ...fields };
            }
            return entry;
          })
        };
      }
      return a;
    }));
  };

  const toggleLaborDetails = (allocId) => {
    setExpandedLaborDetails(prev => ({
      ...prev,
      [allocId]: !prev[allocId]
    }));
  };

  // Labor entries state management for common labor
  const handleAddCommonLaborEntry = () => {
    const newEntry = {
      temp_id: crypto.randomUUID(),
      worker: null,
      worker_name: '',
      worker_type: 'COMPANY',
      worker_rate: 0,
      deduction_hours: 0,
      overtime: 0,
      note: '',
      isManual: false
    };
    setCommonLaborEntries(prev => [...prev, newEntry]);
  };

  const handleRemoveCommonLaborEntry = (tempId) => {
    setCommonLaborEntries(prev => prev.filter(entry => entry.temp_id !== tempId));
  };

  const handleUpdateCommonLaborEntry = (tempId, fields) => {
    setCommonLaborEntries(prev => prev.map(entry => {
      if (entry.temp_id === tempId) {
        return { ...entry, ...fields };
      }
      return entry;
    }));
  };

  const totalCompanyWorkers = isCommonLabor
    ? (parseInt(commonWorkersCompany) || 0)
    : allocations.reduce((sum, a) => sum + (parseInt(a.workers_company) || 0), 0);
  const totalContractorWorkers = isCommonLabor
    ? (parseInt(commonContractorWorkers) || 0)
    : allocations.reduce((sum, a) => sum + (parseInt(a.contractor_workers) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (isUploading) {
      setSubmitError('يرجى الانتظار حتى يكتمل رفع المرفقات.');
      return;
    }

    const hasInvalidPesticide = pesticides.some(p => !p.material_id && !p.name);
    if (hasInvalidPesticide) {
      setSubmitError('يرجى اختيار أو كتابة المبيد المستخدم لجميع المواد المضافة.');
      return;
    }
    if (allocations.length === 0) {
      setSubmitError('يرجى اختيار موقع مستهدف واحد على الأقل.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create PestControlReport
      const reportPayload = {
        date,
        engineer: engineerId,
        applied_pesticides: pesticides.map(p => ({
          pesticide_item: p.material_id,
          custom_pesticide_name: p.is_custom ? p.name : null,
          quantity: p.quantity || null,
          rate_per_feddan: p.rate_per_feddan || null
        })),
        notes,
        attachments: attachments.map(a => ({ url: a.url || a.file_url, type: a.type || a.file_type }))
      };

      const reportRes = await api.post('/reports/pest-control/', reportPayload);
      const reportId = reportRes.data.id;

      // 2. Create OperationalLocationAllocations
      for (const alloc of allocations) {
        const activeContractorId = isCommonLabor ? commonContractorId : alloc.contractorId;
        const activeContractorWorkers = isCommonLabor ? commonContractorWorkers : alloc.contractor_workers;
        const activeWorkersCompany = isCommonLabor ? commonWorkersCompany : alloc.workers_company;

        const allocPayload = {
          content_type_model: 'pestcontrolreport',
          object_id: reportId,
          enclosure: alloc.enclosureId,
          allocated_workers_company: parseInt(activeWorkersCompany) || 0,
          contractor: activeContractorId || null,
          contractor_workers: parseInt(activeContractorWorkers) || 0,
          productivity_value: 0.0,
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
    <form onSubmit={handleSubmit} className="pb-32 bg-slate-50 dark:bg-transparent min-h-screen text-right" dir="rtl">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 rounded-xl"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
              تسجيل تقرير مكافحة ووقاية نبات جديد
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
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
                  type="datetime-local"
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">
                المواد الفعالة وجرعة الاستهلاك
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPesticideRow}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-205 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                إضافة مبيد آخر
              </Button>
            </div>
            
            <div className="space-y-6">
              {pesticides.map((pestRow, index) => (
                <div key={pestRow.tempId} className="relative bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl p-4.5 space-y-4">
                  {pesticides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePesticideRow(pestRow.tempId)}
                      className="absolute top-3 left-3 text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="حذف المبيد"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                  
                  <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    المبيد #{index + 1}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                    <MaterialSelector
                      materials={pesticideItems}
                      label="نوع المبيد المستخدم *"
                      onMaterialChange={(pesticideData) => handlePesticideChange(pestRow.tempId, pesticideData)}
                    />

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">إجمالي الكمية المستخدمة (لتر / كجم)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={pestRow.quantity || ''}
                        onChange={(e) => handlePesticideRowChange(pestRow.tempId, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">معدل الاستخدام للفدان (لتر / كجم)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.0"
                        value={pestRow.rate_per_feddan || ''}
                        onChange={(e) => handlePesticideRowChange(pestRow.tempId, 'rate_per_feddan', e.target.value ? parseFloat(e.target.value) : null)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Selector Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-4">
            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider border-b border-slate-100 pb-2">
              تحديد المواقع المستهدفة (الأحواش)
            </p>
            <LocationMultiSelect
              value={selectedLocationIds}
              onChange={handleLocationChange}
            />
          </div>

          {/* Target Locations Card */}
          <Card className="w-full border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                توزيع الموارد والعمالة والإنتاجية للمواقع (الأحواش)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {/* Checkbox for Common Labor */}
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <Checkbox
                  id="common-labor-checkbox"
                  checked={isCommonLabor}
                  onCheckedChange={(checked) => setIsCommonLabor(!!checked)}
                />
                <Label htmlFor="common-labor-checkbox" className="text-xs sm:text-sm font-bold text-slate-700 cursor-pointer select-none">
                  العمالة مشتركة لجميع المواقع (تحديد طاقم عمل موحد)
                </Label>
              </div>

              {/* Common Labor inputs if checked */}
              {isCommonLabor && allocations.length > 0 && (
                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
                    <Users className="w-4.5 h-4.5 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">تفاصيل العمالة الموحدة المشتركة</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    {/* Common Company Workers */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">عمال الشركة</Label>
                      <Input
                        type="number"
                        min="0"
                        value={commonWorkersCompany || ''}
                        onChange={(e) => setCommonWorkersCompany(parseInt(e.target.value) || 0)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm bg-white text-right"
                        placeholder="0"
                      />
                    </div>

                    {/* Common Contractor Select */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">المقاول</Label>
                      <select
                        value={commonContractorId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCommonContractorId(val);
                          if (!val) {
                            setCommonContractorWorkers(0);
                          }
                        }}
                        className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm text-right"
                      >
                        <option value="">اختر المقاول...</option>
                        {contractors.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Common Contractor Workers Count */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">عمال المقاول</Label>
                      <Input
                        type="number"
                        min="0"
                        disabled={!commonContractorId}
                        value={commonContractorWorkers || ''}
                        onChange={(e) => setCommonContractorWorkers(parseInt(e.target.value) || 0)}
                        className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm bg-white disabled:bg-slate-50 disabled:cursor-not-allowed text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Common Individual Labor details section (HR enabled only) */}
                  {isHrEnabled && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCommonLaborDetailsOpen(!isCommonLaborDetailsOpen)}
                        className="w-full sm:w-auto h-auto py-2 px-3 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 rounded-xl bg-white"
                      >
                        <Users className="w-4 h-4" />
                        <span>تفاصيل العمالة الفردية للكل (إضافي / خصم)</span>
                        {commonLaborEntries && commonLaborEntries.length > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {commonLaborEntries.length}
                          </span>
                        )}
                      </Button>

                      {isCommonLaborDetailsOpen && (
                        <div className="mt-4 p-4 rounded-xl bg-white border border-slate-150 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>توزيع العمالة الفردية المشتركة</span>
                            </h4>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddCommonLaborEntry}
                              className="bg-emerald-650 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 text-xs px-2.5 h-8 bg-emerald-600"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة تفاصيل عامل</span>
                            </Button>
                          </div>

                          {loadingWorkers && (
                            <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري تحميل قائمة عمالة الشركة...</span>
                            </div>
                          )}

                          {(!commonLaborEntries || commonLaborEntries.length === 0) ? (
                            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                              لم يتم إضافة تفاصيل فردية بعد. اضغط على زر "إضافة تفاصيل عامل" لتخصيص الخصومات أو ساعات الإضافي.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {commonLaborEntries.map((entry, entryIdx) => {
                                const isManual = entry.isManual || !entry.worker;

                                return (
                                  <div
                                    key={entry.temp_id || entryIdx}
                                    className="grid grid-cols-12 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm relative items-start hover:border-emerald-250 transition-all duration-200 text-right"
                                  >
                                    {/* Worker Name Input */}
                                    <div className="col-span-12 md:col-span-3 flex flex-col items-start w-full">
                                      <div className="flex justify-between items-center w-full mb-1.5 h-[18px]">
                                        <label className="block text-[11px] font-bold text-slate-500">اسم العامل</label>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUpdateCommonLaborEntry(entry.temp_id, {
                                              isManual: !isManual,
                                              worker: null,
                                              worker_name: '',
                                            })
                                          }
                                          className="text-[10px] text-emerald-650 hover:underline flex items-center gap-0.5 font-bold transition-colors text-emerald-600"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                          {isManual ? 'قائمة HR' : 'إدخال يدوي'}
                                        </button>
                                      </div>
                                      {isManual ? (
                                        <Input
                                          type="text"
                                          placeholder="اكتب اسم العامل كاملاً"
                                          value={entry.worker_name || ''}
                                          onChange={(e) =>
                                            handleUpdateCommonLaborEntry(entry.temp_id, {
                                              worker_name: e.target.value,
                                              worker: null,
                                            })
                                          }
                                          className="h-10 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500 bg-white"
                                        />
                                      ) : (
                                        <select
                                          value={entry.worker ? entry.worker.toString() : ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const selected = hrWorkers.find((w) => w.id.toString() === val);
                                            if (selected) {
                                              handleUpdateCommonLaborEntry(entry.temp_id, {
                                                worker: selected.id,
                                                worker_name: selected.name,
                                                worker_type: selected.worker_type,
                                                worker_rate: selected.hourly_rate || 0,
                                              });
                                            } else {
                                              handleUpdateCommonLaborEntry(entry.temp_id, {
                                                worker: null,
                                                worker_name: '',
                                              });
                                            }
                                          }}
                                          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
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
                                          handleUpdateCommonLaborEntry(entry.temp_id, { worker_type: e.target.value })
                                        }
                                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
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
                                          handleUpdateCommonLaborEntry(entry.temp_id, {
                                            overtime: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="h-10 text-xs text-center font-bold w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500 bg-white"
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
                                          handleUpdateCommonLaborEntry(entry.temp_id, {
                                            deduction_hours: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="h-10 text-xs text-center font-bold text-red-600 w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500 bg-white"
                                      />
                                    </div>

                                    {/* Notes */}
                                    <div className="col-span-12 md:col-span-4 flex flex-col items-start w-full">
                                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right h-[18px]">
                                        ملاحظة الحركة
                                      </label>
                                      <Input
                                        type="text"
                                        placeholder="سبب الخصم أو الإضافي"
                                        value={entry.note || ''}
                                        onChange={(e) =>
                                          handleUpdateCommonLaborEntry(entry.temp_id, { note: e.target.value })
                                        }
                                        className="h-10 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500 bg-white"
                                      />
                                    </div>

                                    {/* Remove worker row */}
                                    <div className="col-span-12 md:col-span-1 flex flex-col justify-end items-center w-full mt-4 md:mt-0">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleRemoveCommonLaborEntry(entry.temp_id)}
                                        className="h-10 w-full text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center justify-center border border-slate-200 bg-white"
                                      >
                                        <Trash2 className="w-4 h-4 ml-2 md:ml-0" />
                                        <span className="md:hidden font-bold text-xs">حذف العامل</span>
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {allocations.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-bold text-sm">
                  لم يتم اختيار أي مواقع مستهدفة بعد. يرجى اختيار المواقع من القائمة أعلاه للبدء.
                </div>
              ) : (
                <div className="space-y-4">
                  {allocations.map((alloc, idx) => {
                    const locationLabel = flatLocations.find(l => String(l.id) === String(alloc.enclosureId))?.pathLabel || `حوشة #${alloc.enclosureId}`;
                    const isExpanded = !!expandedLaborDetails[alloc.id];

                    return (
                      <div key={alloc.id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm relative space-y-4">
                        <button
                          type="button"
                          onClick={() => removeEnclosureFromSelection(alloc.enclosureId)}
                          className="absolute top-4 left-4 text-red-500 hover:text-red-700 transition-colors bg-slate-50 border border-slate-200 p-1.5 rounded-lg hover:bg-slate-100"
                          title="حذف الموقع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="pl-8 mb-2">
                          <span className="text-sm font-bold text-slate-900 block border-b border-slate-150 pb-1.5">
                            {locationLabel}
                          </span>
                        </div>

                        {isCommonLabor ? (
                          /* If Common Labor is checked, only show Notes */
                          <div className="space-y-2 pt-2">
                            <Label className="text-xs font-bold text-slate-700">ملاحظات الموقع</Label>
                            <Input
                              type="text"
                              value={alloc.notes || ''}
                              onChange={(e) => updateAllocation(alloc.id, 'notes', e.target.value)}
                              placeholder="ملاحظات الموقع..."
                              className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm text-right bg-white"
                            />
                          </div>
                        ) : (
                          /* Otherwise show individual row labor inputs */
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 items-end">
                              {/* Company Workers */}
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">عمال الشركة</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={alloc.workers_company || ''}
                                  onChange={(e) => updateAllocation(alloc.id, 'workers_company', parseInt(e.target.value) || 0)}
                                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm text-right bg-white"
                                  placeholder="0"
                                />
                              </div>

                              {/* Contractor Select */}
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">المقاول</Label>
                                <select
                                  value={alloc.contractorId || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateAllocation(alloc.id, 'contractorId', val);
                                    if (!val) {
                                      updateAllocation(alloc.id, 'contractor_workers', 0);
                                    }
                                  }}
                                  className="w-full h-10 border border-slate-200 rounded-xl px-3 text-xs sm:text-sm bg-white focus:ring-emerald-500 shadow-sm text-right"
                                >
                                  <option value="">اختر المقاول...</option>
                                  {contractors.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Contractor Workers Count */}
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">عمال المقاول</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  disabled={!alloc.contractorId}
                                  value={alloc.contractor_workers || ''}
                                  onChange={(e) => updateAllocation(alloc.id, 'contractor_workers', parseInt(e.target.value) || 0)}
                                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed text-right bg-white"
                                  placeholder="0"
                                />
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700">ملاحظات الموقع</Label>
                                <Input
                                  type="text"
                                  value={alloc.notes || ''}
                                  onChange={(e) => updateAllocation(alloc.id, 'notes', e.target.value)}
                                  placeholder="ملاحظات الموقع..."
                                  className="rounded-xl border-slate-200 text-xs sm:text-sm h-10 shadow-sm text-right bg-white"
                                />
                              </div>
                            </div>

                            {/* Individual Labor details section (HR enabled only) */}
                            {isHrEnabled && (
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => toggleLaborDetails(alloc.id)}
                                  className="w-full sm:w-auto h-auto py-2 px-3 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 rounded-xl"
                                >
                                  <Users className="w-4 h-4" />
                                  <span>تفاصيل العمالة الفردية (إضافي / خصم)</span>
                                  {alloc.labor_entries && alloc.labor_entries.length > 0 && (
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      {alloc.labor_entries.length}
                                    </span>
                                  )}
                                </Button>

                                {isExpanded && (
                                  <div className="mt-4 p-4 rounded-xl bg-slate-50/50 border border-slate-150 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex justify-between items-center mb-4">
                                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                        <span>توزيع العمالة الفردية للموقع</span>
                                      </h4>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleAddLaborEntry(alloc.id)}
                                        className="bg-emerald-650 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1 text-xs px-2.5 h-8 bg-emerald-600"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>إضافة تفاصيل عامل</span>
                                      </Button>
                                    </div>

                                    {loadingWorkers && (
                                      <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>جاري تحميل قائمة عمالة الشركة...</span>
                                      </div>
                                    )}

                                    {(!alloc.labor_entries || alloc.labor_entries.length === 0) ? (
                                      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                                        لم يتم إضافة تفاصيل فردية بعد. اضغط على زر "إضافة تفاصيل عامل" لتخصيص الخصومات أو ساعات الإضافي.
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {alloc.labor_entries.map((entry, entryIdx) => {
                                          const isManual = entry.isManual || !entry.worker;

                                          return (
                                            <div
                                              key={entry.temp_id || entryIdx}
                                              className="grid grid-cols-12 gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm relative items-start hover:border-emerald-250 transition-all duration-200 text-right"
                                            >
                                              {/* Worker Name Input */}
                                              <div className="col-span-12 md:col-span-3 flex flex-col items-start w-full">
                                                <div className="flex justify-between items-center w-full mb-1.5 h-[18px]">
                                                  <label className="block text-[11px] font-bold text-slate-500">اسم العامل</label>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                        isManual: !isManual,
                                                        worker: null,
                                                        worker_name: '',
                                                      })
                                                    }
                                                    className="text-[10px] text-emerald-650 hover:underline flex items-center gap-0.5 font-bold transition-colors text-emerald-600"
                                                  >
                                                    <Edit2 className="w-2.5 h-2.5" />
                                                    {isManual ? 'قائمة HR' : 'إدخال يدوي'}
                                                  </button>
                                                </div>
                                                {isManual ? (
                                                  <Input
                                                    type="text"
                                                    placeholder="اكتب اسم العامل كاملاً"
                                                    value={entry.worker_name || ''}
                                                    onChange={(e) =>
                                                      handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                        worker_name: e.target.value,
                                                        worker: null,
                                                      })
                                                    }
                                                    className="h-10 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                                                  />
                                                ) : (
                                                  <select
                                                    value={entry.worker ? entry.worker.toString() : ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      const selected = hrWorkers.find((w) => w.id.toString() === val);
                                                      if (selected) {
                                                        handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                          worker: selected.id,
                                                          worker_name: selected.name,
                                                          worker_type: selected.worker_type,
                                                          worker_rate: selected.hourly_rate || 0,
                                                        });
                                                      } else {
                                                        handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                          worker: null,
                                                          worker_name: '',
                                                        });
                                                      }
                                                    }}
                                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
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
                                                    handleUpdateLaborEntry(alloc.id, entry.temp_id, { worker_type: e.target.value })
                                                  }
                                                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-right"
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
                                                    handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                      overtime: parseFloat(e.target.value) || 0,
                                                    })
                                                  }
                                                  className="h-10 text-xs text-center font-bold w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
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
                                                    handleUpdateLaborEntry(alloc.id, entry.temp_id, {
                                                      deduction_hours: parseFloat(e.target.value) || 0,
                                                    })
                                                  }
                                                  className="h-10 text-xs text-center font-bold text-red-600 w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                                                />
                                              </div>

                                              {/* Notes */}
                                              <div className="col-span-12 md:col-span-4 flex flex-col items-start w-full">
                                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 w-full text-right h-[18px]">
                                                  ملاحظة الحركة
                                                </label>
                                                <Input
                                                  type="text"
                                                  placeholder="سبب الخصم أو الإضافي"
                                                  value={entry.note || ''}
                                                  onChange={(e) =>
                                                    handleUpdateLaborEntry(alloc.id, entry.temp_id, { note: e.target.value })
                                                  }
                                                  className="h-10 text-xs w-full text-right border-slate-200 rounded-lg focus-visible:ring-emerald-500"
                                                />
                                              </div>

                                              {/* Remove worker row */}
                                              <div className="col-span-12 md:col-span-1 flex flex-col justify-end items-center w-full mt-4 md:mt-0">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  onClick={() => handleRemoveLaborEntry(alloc.id, entry.temp_id)}
                                                  className="h-10 w-full text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center justify-center border border-slate-200"
                                                >
                                                  <Trash2 className="w-4 h-4 ml-2 md:ml-0" />
                                                  <span className="md:hidden font-bold text-xs">حذف العامل</span>
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
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

          {/* Symmetrically balanced Notes and Attachments Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Notes Card */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  ملاحظات / تشخيص الإصابة والظروف البيئية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2 flex-1 flex flex-col">
                  <Label className="text-xs font-bold text-slate-700 block mb-1">ملاحظات / مشاهدات ميدانية</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب أي ملاحظات حول شدة الإصابة، سرعة الرياح، الرطوبة، أو أي معطيات تشغيلية أخرى للمكافحة..."
                    className="rounded-xl border-slate-200 text-xs sm:text-sm min-h-[140px] resize-none flex-1 h-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Image className="w-5 h-5 text-emerald-600" />
                  مرفقات التقرير (صور الميدان)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <Label className="text-xs font-bold text-slate-700 block mb-1">مرفقات التقرير</Label>
                  <div className="flex-1 flex flex-col justify-center">
                    <AttachmentUploader
                      value={attachments}
                      onChange={setAttachments}
                      onUploadStateChange={setIsUploading}
                      type="daily-task"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
