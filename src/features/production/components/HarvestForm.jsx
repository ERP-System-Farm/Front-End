import React, { useState } from 'react'

// Icons
import AgricultureIcon from '@mui/icons-material/Agriculture'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DescriptionIcon from '@mui/icons-material/Description'
import EngineeringIcon from '@mui/icons-material/Engineering'
import EventIcon from '@mui/icons-material/Event'
import GroupIcon from '@mui/icons-material/Group'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import SaveIcon from '@mui/icons-material/Save'
import ScaleIcon from '@mui/icons-material/Scale'
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import LocationSelect from '../../../components/LocationSelect'

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#f8faf6',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    '& fieldset': { borderColor: '#bfc9c1' },
    '&:hover fieldset': { borderColor: '#0f5238' },
    '&.Mui-focused fieldset': { borderColor: '#0f5238', borderWidth: '1.5px' },
    '&.Mui-disabled': { backgroundColor: '#e8ebe8' },
  },
}

const FieldWrapper = ({ label, children, required, error }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#191c1a' }}>
      {label}{' '}
      {required && (
        <Box component="span" sx={{ color: '#ba1a1a' }}>
          *
        </Box>
      )}
    </Typography>
    {children}
  </Box>
)

const SectionHeader = ({ icon, title }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      mb: 3,
      pb: 1,
      borderBottom: '1px solid #e1e3df',
    }}
  >
    <Box sx={{ color: '#0f5238', display: 'flex' }}>{icon}</Box>
    <Typography
      sx={{
        fontSize: '0.75rem',
        fontWeight: 800,
        color: '#0f5238',
        textTransform: 'uppercase',
        tracking: '0.1em',
      }}
    >
      {title}
    </Typography>
  </Box>
)

const HarvestForm = ({
  initialData,
  seasons,
  varieties,
  units,
  contractors,
  onSubmit,
  onCancel,
  loading,
}) => {
  const { t } = useTranslation()

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
    labor_hours: 8.0,
    supervisor: '',
    transport_method: '',
    is_partial: true,
    notes: '',
    ...initialData,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'is_partial' ? value === 'true' : value,
    }))
  }

  const handleLocationChange = (node) => {
    setFormData((prev) => ({ ...prev, location: node?.id || '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        pb: 20, // Space for fixed footer
        bg: '#f4f7f4',
        minHeight: '100vh',
      }}
    >
      {/* Header Area */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderBottom: '1px solid #bfc9c1',
          py: 3,
          px: { xs: 2, md: 6 },
          mb: 4,
        }}
      >
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#191c1a', mb: 0.5 }}>
              {t('production.harvest_registration', 'تسجيل تقرير حصاد')}
            </Typography>
            <Typography variant="body1" sx={{ color: '#404943', fontWeight: 600 }}>
              {t(
                'production.harvest_desc_alt',
                'يرجى إدخال تفاصيل الحصاد والعمالة بدقة لضمان جودة البيانات'
              )}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: '2rem',
            p: { xs: 3, md: 8 },
            bgcolor: '#fff',
            border: '1px solid #bfc9c1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          {/* SECTION 1: الأساسيات */}
          <SectionHeader
            icon={<InfoOutlinedIcon fontSize="small" />}
            title="المعلومات الأساسية للموقع"
          />
          <Grid container spacing={5} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
              <FieldWrapper label={t('reports.location', 'الحوشة / الموقع')} required>
                <LocationSelect
                  value={formData.location}
                  onChange={handleLocationChange}
                  required
                />
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label={t('reports.season', 'الموسم الزراعي')} required>
                <Select
                  fullWidth
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  sx={inputSx}
                  displayEmpty
                  renderValue={(val) => seasons.find((s) => s.id === val)?.name || 'اختر الموسم'}
                >
                  {seasons.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label={t('reports.date', 'تاريخ الحصاد')} required>
                <TextField
                  fullWidth
                  type="date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleChange}
                  sx={inputSx}
                  required
                />
              </FieldWrapper>
            </Grid>
          </Grid>

          {/* SECTION 2: الإنتاجية */}
          <SectionHeader
            icon={<ScaleIcon fontSize="small" />}
            title="الإنتاجية والمخرجات النهائية"
          />
          <Grid container spacing={5} sx={{ mb: 8 }}>
            <Grid item xs={12} sm={8} md={6}>
              <FieldWrapper label={t('reports.quantity', 'الكمية المحصودة')} required>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    sx={{ ...inputSx, flex: 2 }}
                    placeholder="0.00"
                  />
                  <Select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    sx={{ ...inputSx, flex: 1 }}
                  >
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </FieldWrapper>
            </Grid>
          </Grid>

          {/* SECTION 3: العمالة */}
          <SectionHeader
            icon={<EngineeringIcon fontSize="small" />}
            title="العمالة وتكاليف التشغيل الميداني"
          />
          <Grid container spacing={5} sx={{ mb: 8 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label="عدد عمالة الشركة">
                <TextField
                  fullWidth
                  type="number"
                  name="company_workers"
                  value={formData.company_workers}
                  onChange={handleChange}
                  sx={inputSx}
                />
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label="المقاول المسؤول">
                <Autocomplete
                  options={contractors || []}
                  getOptionLabel={(o) => o.name || ''}
                  value={contractors?.find((c) => c.id === formData.contractor) || null}
                  onChange={(_, val) =>
                    setFormData((prev) => ({ ...prev, contractor: val?.id || null }))
                  }
                  sx={inputSx}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="اختر المقاول" size="small" />
                  )}
                />
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label="عدد عمالة المقاول">
                <TextField
                  fullWidth
                  type="number"
                  name="contractor_workers"
                  value={formData.contractor_workers}
                  onChange={handleChange}
                  sx={inputSx}
                  disabled={!formData.contractor}
                />
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FieldWrapper label="ساعات العمل الميدانية">
                <TextField
                  fullWidth
                  type="number"
                  name="labor_hours"
                  value={formData.labor_hours}
                  onChange={handleChange}
                  sx={inputSx}
                  InputProps={{
                    endAdornment: (
                      <Typography
                        sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f5238', ml: 1 }}
                      >
                        ساعة
                      </Typography>
                    ),
                  }}
                />
              </FieldWrapper>
            </Grid>
          </Grid>

          {/* SECTION 4: الملاحظات */}
          <SectionHeader
            icon={<DescriptionIcon fontSize="small" />}
            title="ملاحظات ومرفقات إضافية"
          />
          <Grid container spacing={5}>
            <Grid item xs={12} md={8}>
              <FieldWrapper label="ملاحظات أو مشاهدات ميدانية">
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="أدخل أي ملاحظات هامة هنا..."
                  sx={inputSx}
                />
              </FieldWrapper>
            </Grid>
            <Grid item xs={12} md={4}>
              <FieldWrapper label="المرفقات والمستندات">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CloudUploadIcon sx={{ fontSize: 40, mb: 1 }} />}
                  sx={{
                    borderStyle: 'dashed',
                    borderRadius: '1.25rem',
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    color: '#404943',
                    borderColor: '#bfc9c1',
                    bgcolor: '#f8faf6',
                    '&:hover': { borderColor: '#0f5238', bgcolor: '#f0f4f0' },
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    اسحب الملفات هنا أو اختر
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    يدعم الصور، الفيديوهات والملفات (PDF)
                  </Typography>
                </Button>
              </FieldWrapper>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Fixed Footer */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          bgcolor: '#fff',
          px: { xs: 2, md: 10 },
          py: 3,
          borderTop: '1.5px solid #bfc9c1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <RadioGroup
          row
          name="is_partial"
          value={formData.is_partial.toString()}
          onChange={handleChange}
        >
          <FormControlLabel
            value="false"
            control={<Radio sx={{ color: '#0f5238', '&.Mui-checked': { color: '#0f5238' } }} />}
            label={
              <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>حصاد مكتمل للكتلة</Typography>
            }
          />
          <FormControlLabel
            value="true"
            control={<Radio sx={{ color: '#0f5238', '&.Mui-checked': { color: '#0f5238' } }} />}
            label={
              <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>حصاد جزئي / دوري</Typography>
            }
          />
        </RadioGroup>

        <Box sx={{ display: 'flex', gap: 3 }}>
          <Button
            onClick={onCancel}
            sx={{ px: 4, fontWeight: 800, color: '#404943', fontSize: '1rem' }}
          >
            {t('common.cancel', 'إلغاء الأمر')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              px: 8,
              py: 1.5,
              borderRadius: '1rem',
              fontWeight: 900,
              bgcolor: '#0f5238',
              fontSize: '1.1rem',
              '&:hover': { bgcolor: '#0b3d2a' },
              boxShadow: '0 8px 16px rgba(15, 82, 56, 0.25)',
            }}
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التقرير النهائي'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default HarvestForm
