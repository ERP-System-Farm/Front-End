import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import api from '../../../../services/api'
import enclosureProfileApi from '../../../../services/enclosureProfileApi'

const EditEnclosureModal = ({ open, onClose, profile, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    crop_type: '',
    planting_year: '',
    tree_count: '',
    seedling_count: '',
    expected_yield: '',
    general_notes: '',
  })
  const [varieties, setVarieties] = useState([])
  const [loadingVarieties, setLoadingVarieties] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch varieties from database
  useEffect(() => {
    const fetchVarieties = async () => {
      try {
        setLoadingVarieties(true)
        const res = await api.get('/reports/varieties/')
        setVarieties(res.data.results || res.data || [])
      } catch (err) {
        console.error('Error fetching varieties:', err)
      } finally {
        setLoadingVarieties(false)
      }
    }

    if (open) {
      fetchVarieties()
    }
  }, [open])

  useEffect(() => {
    if (profile?.asset_profile) {
      setFormData({
        crop_type: profile.asset_profile.crop_type || '',
        planting_year: profile.asset_profile.planting_year || '',
        tree_count: profile.asset_profile.tree_count || '',
        seedling_count: profile.asset_profile.seedling_count || '',
        expected_yield: profile.asset_profile.expected_yield || '',
        general_notes: profile.asset_profile.general_notes || '',
      })
    }
  }, [profile, open])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      await enclosureProfileApi.updateProfile(profile.id, formData)
      onSaveSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-5 sm:p-6" dir="rtl">
        <DialogHeader className="text-right space-y-1 mb-3">
          <DialogTitle className="text-lg font-black text-slate-800">
            تعديل الملف الزراعي للحوشة
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            تحديث بيانات المحصول وأعداد الأشجار والإنتاجية المستهدفة للحوشة.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* نوع المحصول */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">نوع المحصول</label>
              <div className="relative">
                <select
                  name="crop_type"
                  value={formData.crop_type}
                  onChange={handleChange}
                  className="w-full h-10 pr-3 pl-8 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  disabled={loadingVarieties}
                >
                  <option value="">اختر نوع المحصول...</option>
                  {varieties.map((v) => (
                    <option key={v.id || v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* سنة الزراعة */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">سنة الزراعة</label>
              <Input
                name="planting_year"
                type="number"
                value={formData.planting_year}
                onChange={handleChange}
                placeholder="مثال: 2020"
                className="h-10 rounded-xl text-sm font-medium text-right"
              />
            </div>

            {/* عدد الأشجار */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">عدد الأشجار</label>
              <Input
                name="tree_count"
                type="number"
                value={formData.tree_count}
                onChange={handleChange}
                placeholder="0"
                className="h-10 rounded-xl text-sm font-medium text-right"
              />
            </div>

            {/* عدد الفسائل */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">عدد الفسائل</label>
              <Input
                name="seedling_count"
                type="number"
                value={formData.seedling_count}
                onChange={handleChange}
                placeholder="0"
                className="h-10 rounded-xl text-sm font-medium text-right"
              />
            </div>
          </div>

          {/* الإنتاجية المستهدفة */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">الإنتاجية المستهدفة للموسم (طن)</label>
            <Input
              name="expected_yield"
              type="number"
              value={formData.expected_yield}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="h-10 rounded-xl text-sm font-medium text-right"
            />
          </div>

          {/* الملاحظات العامة */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">الملاحظات العامة للأصل</label>
            <Textarea
              name="general_notes"
              value={formData.general_notes}
              onChange={handleChange}
              rows={3}
              placeholder="سجل أي ملاحظات دائمة تتعلق بهذه الحوشة (مثلاً: مشاكل تربة، ملاحظات تاريخية...)"
              className="rounded-xl text-sm font-medium text-right resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-slate-100 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl font-bold w-full sm:w-auto border-slate-200 hover:bg-slate-50"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl font-bold w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditEnclosureModal
