import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Calendar,
  Scale,
  Leaf,
  Users,
  Clock,
  FileText,
  CheckCircle2,
  HardHat,
  Truck,
  Building2,
  CheckCircle,
  UserCheck,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '../../../app/AuthContext'
import api from '../../../services/api'
import AttachmentUploader from '../../../components/AttachmentUploader'

// We fallback to MUI Select/Autocomplete for complex data where Shadcn Select might be missing
import { Autocomplete, TextField, MenuItem, Select as MuiSelect, CircularProgress } from '@mui/material'
import LocationSelect from '../../../components/LocationSelect'

const HarvestForm = ({
  initialData,
  seasons,
  varieties,
  units,
  contractors,
  engineers,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const isManagerPlus = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ADMIN'].includes(currentUser?.role)

  const [formData, setFormData] = useState({
    location: '',
    season: '',
    harvest_date: new Date().toISOString().split('T')[0],
    variety: '',
    quantity: '',
    unit: '',
    company_workers: 0,
    contractor_workers: 0,
    contractor: null,
    contractor_name: '',
    labor_hours: 8.0,
    supervisor: initialData?.supervisor || currentUser?.id || '',
    transport_method: '',
    is_partial: true,
    notes: '',
    labor_entries: [],
    ...initialData,
  })

  const [hrWorkers, setHrWorkers] = useState([])
  const [isLaborDetailsOpen, setIsLaborDetailsOpen] = useState(false)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  // Initialize with existing attachments when editing
  const [attachments, setAttachments] = useState(
    Array.isArray(initialData?.attachments) ? initialData.attachments : []
  )
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setLoadingWorkers(true)
    api.get('/hr/workers/').then((res) => {
      setHrWorkers(res.data?.results || res.data || [])
      setLoadingWorkers(false)
    }).catch((e) => {
      console.error("Failed to load workers list for select", e)
      setLoadingWorkers(false)
    })
  }, [])

  const handleAddLaborEntry = () => {
    const newEntry = {
      id: null,
      temp_id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      worker: null,
      worker_name: '',
      worker_type: 'COMPANY',
      worker_rate: 0,
      hours: formData.labor_hours || 8.0,
      overtime: 0,
      deduction_hours: 0,
      note: '',
      isManual: false,
    }
    setFormData((prev) => ({
      ...prev,
      labor_entries: [...(prev.labor_entries || []), newEntry]
    }))
  }

  const handleRemoveLaborEntry = (idx) => {
    setFormData((prev) => ({
      ...prev,
      labor_entries: (prev.labor_entries || []).filter((_, i) => i !== idx)
    }))
  }

  const handleUpdateLaborEntry = (idx, fields) => {
    setFormData((prev) => {
      const updated = [...(prev.labor_entries || [])]
      updated[idx] = { ...updated[idx], ...fields }
      return { ...prev, labor_entries: updated }
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileChange = (e) => {
    // Kept for backward-compat but not called — AttachmentUploader handles uploads directly
    console.warn('handleFileChange is deprecated; use AttachmentUploader instead')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Clean data for API
    const cleanData = {
      ...formData,
      // Ensure we send IDs, not objects (important for PATCH/POST)
      location: formData.location?.id || formData.location,
      season: formData.season?.id || formData.season,
      variety: formData.variety?.id || formData.variety,
      unit: formData.unit?.id || formData.unit,
      supervisor: formData.supervisor?.id || formData.supervisor || null,
      
      // Ensure numeric types
      quantity: parseFloat(formData.quantity) || 0,
      company_workers: parseInt(formData.company_workers) || 0,
      contractor_workers: parseInt(formData.contractor_workers) || 0,
      labor_hours: parseFloat(formData.labor_hours) || 0,
      labor_count: parseInt(formData.company_workers || 0) + parseInt(formData.contractor_workers || 0),
      
      // Map labor entries
      labor_entries: (formData.labor_entries || []).map(entry => ({
        ...entry,
        worker: entry.worker?.id || entry.worker,
        contractor: entry.contractor?.id || entry.contractor || formData.contractor,
      }))
    }

    // Remove read-only or extra UI-only fields that might crash backend
    const readOnlyFields = ['location_name', 'season_name', 'variety_name', 'unit_name', 'supervisor_name', 'creator_name', 'crop_name', 'attachments', 'company', 'contractor']
    readOnlyFields.forEach(field => delete cleanData[field])

    // Handle Attachments: pass the already-uploaded attachment objects to the parent
    onSubmit(cleanData, attachments)
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">تسجيل تقرير حصاد يومي</h1>
            <p className="text-slate-500 font-bold text-sm">قم بتسجيل تفاصيل المحصول المقطوف والعمالة الميدانية بدقة.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6">
        
        {/* Section 1: Basic Info */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-emerald-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              البيانات الأساسية للتقرير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-emerald-600"/> 
                المهندس المسؤول <span className="text-rose-500">*</span>
              </label>
              <MuiSelect
                fullWidth
                size="small"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                displayEmpty
                className={`bg-white rounded-lg border ${!isManagerPlus ? 'bg-slate-50 opacity-80' : 'border-slate-200'}`}
                disabled={!isManagerPlus}
                required
              >
                <MenuItem value="">
                  {isManagerPlus ? 'اختر المهندس' : (currentUser?.name || currentUser?.full_name || 'أنا')}
                </MenuItem>
                {Array.isArray(engineers) && engineers.map((eng) => (
                  <MenuItem key={eng.id} value={eng.id}>{eng.name || eng.full_name || eng.username}</MenuItem>
                ))}
              </MuiSelect>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">الحوشة / الموقع <span className="text-rose-500">*</span></label>
              <LocationSelect
                value={formData.location}
                onChange={(val) => setFormData((prev) => ({ ...prev, location: val || '' }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">تاريخ الحصاد <span className="text-rose-500">*</span></label>
              <Input
                type="date"
                name="harvest_date"
                value={formData.harvest_date}
                onChange={handleChange}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">الموسم الزراعي <span className="text-rose-500">*</span></label>
               <MuiSelect
                fullWidth
                size="small"
                name="season"
                value={formData.season}
                onChange={handleChange}
                displayEmpty
                className="bg-white rounded-lg border border-slate-200"
                required
              >
                <MenuItem value="" disabled>اختر الموسم</MenuItem>
                {seasons?.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </MuiSelect>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Production */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-amber-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              الإنتاجية والكميات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">الصنف المقطوف <span className="text-rose-500">*</span></label>
              <MuiSelect
                fullWidth
                size="small"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                displayEmpty
                className="bg-white rounded-lg"
                required
              >
                <MenuItem value="" disabled>اختر الصنف</MenuItem>
                {varieties?.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </MuiSelect>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">الكمية المقدرة / الفعلية <span className="text-rose-500">*</span></label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="bg-white flex-2"
                />
                <MuiSelect
                  size="small"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  displayEmpty
                  className="bg-white rounded-lg flex-1"
                  required
                >
                  <MenuItem value="" disabled>الوحدة</MenuItem>
                  {units?.filter(u => ['كجم', 'طن', 'kg', 'ton', 'كيلو'].some(w => u.name?.toLowerCase().includes(w))).map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </MuiSelect>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Labor */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-blue-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              العمالة التشغيلية الميدانية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Building2 className="w-4 h-4 text-slate-400"/> عمالة الشركة</label>
              <Input
                type="number"
                name="company_workers"
                value={formData.company_workers}
                onChange={handleChange}
                min="0"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><HardHat className="w-4 h-4 text-slate-400"/> مقاول العمالة</label>
              <Autocomplete
                options={contractors || []}
                getOptionLabel={(o) => o.name || ''}
                value={contractors?.find((c) => c.id === formData.contractor) || null}
                onChange={(_, val) => setFormData((prev) => ({ ...prev, contractor: val?.id || null, contractor_name: val?.name || '' }))}
                renderInput={(params) => <TextField {...params} placeholder="اختر المقاول" size="small" sx={{ bgcolor: 'white', borderRadius: 1 }} />}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Users className="w-4 h-4 text-slate-400"/> عمالة المقاول</label>
              <Input
                type="number"
                name="contractor_workers"
                value={formData.contractor_workers}
                onChange={handleChange}
                min="0"
                disabled={!formData.contractor}
                className="bg-white disabled:bg-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400"/> إجمالي ساعات العمل</label>
              <Input
                type="number"
                name="labor_hours"
                value={formData.labor_hours}
                onChange={handleChange}
                step="0.5"
                min="0"
                className="bg-white font-bold text-blue-700"
              />
            </div>

            {/* تفاصيل العمالة الفردية (إضافي / خصم) */}
            <div className="col-span-1 md:col-span-4 border-t border-slate-100 dark:border-slate-800/50 pt-6 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLaborDetailsOpen(!isLaborDetailsOpen)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30 flex items-center gap-2"
              >
                <Users className="w-4.5 h-4.5" />
                <span>تفاصيل العمالة الفردية (إضافي / خصم)</span>
                {formData.labor_entries?.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold">
                    {formData.labor_entries.length}
                  </span>
                )}
              </Button>

              {isLaborDetailsOpen && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>توزيع العمالة الفردية لتقرير الإنتاج</span>
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLaborEntry}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة تفاصيل عامل</span>
                    </Button>
                  </div>

                  {loadingWorkers && (
                    <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري تحميل قائمة عمالة الشركة...</span>
                    </div>
                  )}

                  {(!formData.labor_entries || formData.labor_entries.length === 0) ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      لم يتم إضافة تفاصيل فردية بعد. يرجى الضغط على زر "إضافة تفاصيل عامل" بالعبوة أعلاه لتخصيص الخصومات أو ساعات الإضافي لكل عامل بشكل ديناميكي.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.labor_entries.map((entry, entryIdx) => {
                        const isManual = entry.isManual || !entry.worker

                        return (
                          <div
                            key={entry.temp_id || entry.id || entryIdx}
                            className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm relative items-start hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all duration-200 text-right"
                          >
                            {/* حقل اسم العامل */}
                            <div className="col-span-12 md:col-span-3 flex flex-col items-start w-full">
                              <div className="flex justify-between items-center w-full mb-1.5 h-[18px]">
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  اسم العامل
                                </label>
                                {/* زر التبديل بين إدخال يدوي أو من القائمة */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateLaborEntry(entryIdx, {
                                      isManual: !isManual,
                                      worker: null,
                                      worker_name: '',
                                    })
                                  }
                                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-bold transition-colors"
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
                                    handleUpdateLaborEntry(entryIdx, {
                                      worker_name: e.target.value,
                                      worker: null,
                                    })
                                  }
                                  className="h-9.5 text-xs w-full text-right border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                                />
                              ) : (
                                <select
                                  value={entry.worker ? (entry.worker.id || entry.worker).toString() : ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    const selected = hrWorkers.find((w) => w.id.toString() === val)
                                    if (selected) {
                                      handleUpdateLaborEntry(entryIdx, {
                                        worker: selected.id,
                                        worker_name: selected.name,
                                        worker_type: selected.worker_type,
                                        worker_rate: selected.hourly_rate || 0,
                                      })
                                    } else {
                                      handleUpdateLaborEntry(entryIdx, {
                                        worker: null,
                                        worker_name: '',
                                      })
                                    }
                                  }}
                                  className="flex h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 text-right"
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

                            {/* نوع العامل */}
                            <div className="col-span-12 sm:col-span-6 md:col-span-2 flex flex-col items-start w-full">
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 w-full text-right h-[18px]">
                                نوع العامل
                              </label>
                              <select
                                value={entry.worker_type || 'COMPANY'}
                                onChange={(e) =>
                                  handleUpdateLaborEntry(entryIdx, { worker_type: e.target.value })
                                }
                                className="flex h-9.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 text-right"
                              >
                                <option value="COMPANY">عمالة الشركة</option>
                                <option value="CONTRACTOR">عمالة المقاول</option>
                              </select>
                            </div>

                            {/* ساعات الإضافي */}
                            <div className="col-span-6 sm:col-span-3 md:col-span-1 flex flex-col items-start w-full">
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 w-full text-right truncate h-[18px]">
                                إضافي (س)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={entry.overtime || 0}
                                onChange={(e) =>
                                  handleUpdateLaborEntry(entryIdx, {
                                    overtime: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-9.5 text-xs text-center font-bold w-full text-right border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                              />
                            </div>

                            {/* ساعات الخصم */}
                            <div className="col-span-6 sm:col-span-3 md:col-span-1 flex flex-col items-start w-full">
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 w-full text-right truncate h-[18px]">
                                خصم (س)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={entry.deduction_hours || 0}
                                onChange={(e) =>
                                  handleUpdateLaborEntry(entryIdx, {
                                    deduction_hours: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-9.5 text-xs text-center font-bold text-red-600 dark:text-red-400 w-full text-right border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                              />
                            </div>

                            {/* ملاحظة الحركة */}
                            <div className="col-span-10 sm:col-span-10 md:col-span-4 flex flex-col items-start w-full">
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 w-full text-right h-[18px]">
                                ملاحظة / سبب الخصم أو الإضافي
                              </label>
                              <Input
                                type="text"
                                placeholder="أدخل أي ملاحظة تشغيلية"
                                value={entry.note || ''}
                                onChange={(e) =>
                                  handleUpdateLaborEntry(entryIdx, { note: e.target.value })
                                }
                                className="h-9.5 text-xs w-full text-right border-slate-200 dark:border-slate-800 rounded-lg focus-visible:ring-emerald-500"
                              />
                            </div>

                            {/* زر حذف السطر الفردي */}
                            <div className="col-span-2 sm:col-span-2 md:col-span-1 flex flex-col justify-center items-center w-full">
                              <div className="h-[18px] mb-1.5 w-full block"></div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLaborEntry(entryIdx)}
                                className="h-9.5 w-full max-w-[40px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800/80"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Notes & Overrides */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              ملاحظات الميدان والمرفقات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                {initialData?.status?.toUpperCase() === 'FINALIZED' && (
                  <div className="space-y-2 bg-rose-50 border border-rose-200 p-4 rounded-xl">
                    <label className="text-sm font-black text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      سبب التعديل الاستثنائي (مطلوب) <span className="text-rose-600">*</span>
                    </label>
                    <p className="text-[10px] text-rose-600 font-bold mb-2">هذا التقرير تم إقفاله مسبقاً. يجب تقديم مبرر صريح لتعديله وسيسجل في النظام.</p>
                    <Textarea 
                       name="override_reason"
                       value={formData.override_reason || ''}
                       onChange={handleChange}
                       placeholder="اكتب سبب التعديل الاستثنائي هنا بشكل واضح..."
                       className="min-h-[80px] bg-white border-rose-200 focus-visible:ring-rose-500 resize-none"
                       required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">تفاصيل وملاحظات إضافية</label>
                  <Textarea 
                     name="notes"
                     value={formData.notes || ''}
                     onChange={handleChange}
                     placeholder="اكتب هنا أي ملاحظات حول جودة الثمار أو مشاكل الحصاد..."
                     className="min-h-[120px] bg-white resize-none"
                  />
                </div>
             </div>
              <div className="space-y-2 flex flex-col">
                 <label className="text-sm font-bold text-slate-700">مرفقات العملية (صور الحصاد)</label>
                 <AttachmentUploader
                   value={attachments}
                   onChange={setAttachments}
                   onUploadStateChange={setIsUploading}
                   type="harvest"
                 />
              </div>
          </CardContent>
        </Card>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-4 z-50">
           <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              
              <div className="flex gap-4">
                 <button type="button" onClick={() => setFormData({...formData, is_partial: false})} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${!formData.is_partial ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'}`}>
                    <CheckCircle2 className={`w-5 h-5 ${!formData.is_partial ? 'text-emerald-600' : 'text-slate-400'}`} />
                    حصاد كامل ومغلق
                 </button>
                 <button type="button" onClick={() => setFormData({...formData, is_partial: true})} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${formData.is_partial ? 'bg-amber-100 text-amber-800 border-2 border-amber-500' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'}`}>
                    <CheckCircle className={`w-5 h-5 ${formData.is_partial ? 'text-amber-600' : 'text-slate-400'}`} />
                    حصاد جزئي / مستمر
                 </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <Button type="button" onClick={onCancel} variant="outline" className="font-bold text-slate-600 rounded-xl px-6">
                    إلغاء
                 </Button>
                 <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl px-10 shadow-lg shadow-emerald-700/20 w-full sm:w-auto">
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'اعتماد وحفظ التقرير'}
                 </Button>
              </div>
           </div>
        </div>

      </form>
    </div>
  )
}

export default HarvestForm
