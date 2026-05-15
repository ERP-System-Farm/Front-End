import React, { useEffect, useState } from 'react'

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
  }, [profile])

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1e293b' }}>تعديل الملف الزراعي</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="نوع المحصول"
              name="crop_type"
              value={formData.crop_type}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="مثال: نخل مجدول"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="سنة الزراعة"
              name="planting_year"
              type="number"
              value={formData.planting_year}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="عدد الأشجار"
              name="tree_count"
              type="number"
              value={formData.tree_count}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="عدد الفسائل"
              name="seedling_count"
              type="number"
              value={formData.seedling_count}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="الإنتاجية المستهدفة للموسم (طن)"
              name="expected_yield"
              type="number"
              value={formData.expected_yield}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="الملاحظات العامة للأصل"
              name="general_notes"
              value={formData.general_notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="سجل أي ملاحظات دائمة تتعلق بهذه الحوشة (مثلاً: مشاكل تربة، ملاحظات تاريخية...)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: '6px', fontWeight: 600, px: 3 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'حفظ التعديلات'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditEnclosureModal
