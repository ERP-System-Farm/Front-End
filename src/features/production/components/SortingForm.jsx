import React, { useEffect, useState } from 'react'

import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

const SortingForm = ({
  harvestReport,
  sortingCategories,
  qualityGrades,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    harvest_report: harvestReport?.id || '',
    processing_date: new Date().toISOString().split('T')[0],
    incoming_quantity: harvestReport?.quantity || 0,
    final_quantity: 0,
    rejected_quantity: 0,
    waste_quantity: 0,
    sorting_category: '',
    quality_grade: '',
    notes: '',
  })

  const totalOut =
    Number(formData.final_quantity) +
    Number(formData.rejected_quantity) +
    Number(formData.waste_quantity)
  const remaining = Number(formData.incoming_quantity) - totalOut
  const isOverLimit = remaining < 0

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isOverLimit) return
    onSubmit(formData)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* Quantity Flow Visualization */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 }}>
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1, fontWeight: 700 }}>
                {t('production.quantity_integrity', 'نزاهة تدفق الكميات')}
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={3} className="text-center">
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a' }}>
                    {formData.incoming_quantity}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                    {t('production.incoming', 'الوارد')}
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <CompareArrowsIcon sx={{ color: '#cbd5e1' }} />
                </Grid>
                <Grid item xs={8}>
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((totalOut / formData.incoming_quantity) * 100, 100)}
                      color={isOverLimit ? 'error' : 'primary'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <div className="flex justify-between text-[0.7rem] font-bold">
                    <span className="text-emerald-600">
                      {t('production.processed', 'المعالج')}: {totalOut}
                    </span>
                    <span className={isOverLimit ? 'text-red-600' : 'text-slate-400'}>
                      {t('production.remaining', 'المتبقي')}: {remaining}
                    </span>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Output Details */}
        <Grid item xs={12} md={7}>
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}
              >
                <CheckCircleIcon color="success" /> {t('production.sorting_output', 'مخرجات الفرز')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('production.processing_date', 'تاريخ الفرز')}
                    name="processing_date"
                    value={formData.processing_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('production.final_qty', 'المقبول')}
                    name="final_quantity"
                    value={formData.final_quantity}
                    onChange={handleChange}
                    required
                    error={isOverLimit}
                    InputProps={{
                      startAdornment: (
                        <CheckCircleIcon sx={{ mr: 1, color: '#10b981', fontSize: 18 }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('production.rejected_qty', 'المرفوض')}
                    name="rejected_quantity"
                    value={formData.rejected_quantity}
                    onChange={handleChange}
                    required
                    error={isOverLimit}
                    InputProps={{
                      startAdornment: <CancelIcon sx={{ mr: 1, color: '#f43f5e', fontSize: 18 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('production.waste_qty', 'الهالك')}
                    name="waste_quantity"
                    value={formData.waste_quantity}
                    onChange={handleChange}
                    required
                    error={isOverLimit}
                    InputProps={{
                      startAdornment: (
                        <DeleteSweepIcon sx={{ mr: 1, color: '#64748b', fontSize: 18 }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration & Meta */}
        <Grid item xs={12} md={5}>
          <Card
            variant="outlined"
            sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}
          >
            <CardContent className="flex flex-col h-full">
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {t('production.classification', 'التصنيف والجودة')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label={t('production.sorting_category', 'فئة الفرز')}
                    name="sorting_category"
                    value={formData.sorting_category}
                    onChange={handleChange}
                  >
                    {sortingCategories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label={t('production.quality_grade', 'درجة الجودة')}
                    name="quality_grade"
                    value={formData.quality_grade}
                    onChange={handleChange}
                  >
                    {qualityGrades.map((g) => (
                      <MenuItem key={g.id} value={g.id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 'auto', pt: 3 }} className="flex gap-2">
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onCancel}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  {t('common.cancel', 'إلغاء')}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading || isOverLimit}
                  sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#0f172a' }}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    t('production.finalize_sorting', 'اعتماد الفرز')
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {isOverLimit && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ borderRadius: 2, fontWeight: 700 }}>
              {t(
                'production.over_limit_error',
                'خطأ: إجمالي الكميات المخرجة تتجاوز الكمية الواردة من الحصاد.'
              )}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default SortingForm
