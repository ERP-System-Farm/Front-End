import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Calendar,
  Scale,
  Leaf,
  Users,
  Clock,
  FileText,
  UploadCloud,
  CheckCircle2,
  HardHat,
  Truck,
  Building2,
  CheckCircle,
  UserCheck
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '../../../app/AuthContext'

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
  const isManagerPlus = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(currentUser?.role)

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
    ...initialData,
  })

  const [attachments, setAttachments] = useState([])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setAttachments((prev) => [...prev, ...files])
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
    }

    // Remove read-only or extra UI-only fields that might crash backend
    const readOnlyFields = ['location_name', 'season_name', 'variety_name', 'unit_name', 'supervisor_name', 'creator_name', 'crop_name', 'attachments', 'company', 'contractor']
    readOnlyFields.forEach(field => delete cleanData[field])

    // Handle Attachments (we would typically use FormData here if sending files)
    // For now, we pass cleanData to onSubmit. If attachments exist, the parent should handle FormData conversion.
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
          </CardContent>
        </Card>

        {/* Section 4: Notes */}
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              ملاحظات الميدان والمرفقات
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">تفاصيل وملاحظات إضافية</label>
                <Textarea 
                   name="notes"
                   value={formData.notes}
                   onChange={handleChange}
                   placeholder="اكتب هنا أي ملاحظات حول جودة الثمار أو مشاكل الحصاد..."
                   className="min-h-[120px] bg-white resize-none"
                />
             </div>
              <div className="space-y-2 flex flex-col">
                 <label className="text-sm font-bold text-slate-700">مرفقات العملية (صور الحصاد)</label>
                 <div 
                   onClick={() => document.getElementById('harvest-file-upload').click()}
                   className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col justify-center items-center gap-2 hover:bg-slate-100 hover:border-emerald-400 transition-colors cursor-pointer p-4 min-h-[120px]"
                 >
                    <input 
                      id="harvest-file-upload" 
                      type="file" 
                      multiple 
                      hidden 
                      onChange={handleFileChange}
                    />
                    <UploadCloud className="w-10 h-10 text-slate-400" />
                    <span className="font-bold text-slate-600">اسحب أو انقر لرفع المرفقات</span>
                    <span className="text-xs text-slate-400">تدعم الصور و PDF حتى 10MB</span>
                 </div>
                 
                 {/* Selected Files Preview */}
                 {attachments.length > 0 && (
                   <div className="mt-2 space-y-1">
                     {attachments.map((file, idx) => (
                       <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                         <span className="text-xs font-bold text-emerald-800 truncate max-w-[200px]">{file.name}</span>
                         <Button 
                           type="button" 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 text-rose-500 hover:text-rose-700"
                           onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                         >
                           حذف
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
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
