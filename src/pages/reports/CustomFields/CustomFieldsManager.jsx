import React, { useEffect, useState } from 'react'

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Lock as LockIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { useAuth } from '../../../app/AuthContext' // Updated import based on DailyTaskCard.jsx
import ConfirmDialog from '../../../components/ConfirmDialog'
import { useSnackbar } from '../../../contexts/SnackbarContext'
import { reportsApi } from '../../../services/reportsApi'

const fieldSchema = z.object({
  name: z.string().min(1, 'اسم الحقل مطلوب'),
  field_type: z.enum(['text', 'number', 'date', 'dropdown', 'boolean'], {
    required_error: 'النوع مطلوب',
  }),
  applies_to: z.number().min(1, 'اختر النموذج الذي يطبق عليه'),
  is_required: z.boolean(),
})

const operationSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  slug: z.string().optional(),
  profile_type: z
    .enum(['generic', 'irrigation', 'fertilization', 'spraying', 'harvest'])
    .default('generic'),
  category: z.string().default('other'),
  is_active: z.boolean(),
})

const simpleSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
})

const contractorSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  rate_per_hour: z.coerce.number().min(0, 'يجب أن يكون صفر أو أكثر').default(0),
  is_active: z.boolean(),
})

const PROFILE_TYPES = {
  generic: 'عام (بدون حقول إضافية)',
  irrigation: 'ري',
  fertilization: 'تسميد',
  spraying: 'مكافحة ورش',
  harvest: 'حصاد',
}

const CATEGORIES_AR = {
  pollination: 'تلقيح ومشاتل',
  planting: 'زراعة وفسائل',
  maintenance: 'صيانة ونظافة',
  fertilization: 'تسميد',
  protection: 'مكافحة',
  monitoring: 'متابعة وإشراف',
  transport: 'نقل وتحميل',
  other: 'أخرى',
}

const FIELD_TYPES_AR = {
  text: 'نص',
  number: 'رقم',
  date: 'تاريخ',
  dropdown: 'قائمة منسدلة',
  boolean: 'نعم/لا',
}

const MODEL_CHOICES = [
  { id: 14, name: 'تقرير المهام اليومية (DailyTaskReport)', model: 'dailytaskreport' },
  { id: 15, name: 'تقرير التسميد (FertilizationReport)', model: 'fertilizationreport' },
  { id: 16, name: 'تقرير الري (IrrigationReport)', model: 'irrigationreport' },
]

const MasterDataManager = () => {
  const { t } = useTranslation()
  const { showSnackbar } = useSnackbar()
  const { user } = useAuth()

  const isManager = ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user?.role)

  const [tabIndex, setTabIndex] = useState(0)

  // Pagination states
  const [pages, setPages] = useState([1, 1, 1, 1, 1])
  const [totalCounts, setTotalCounts] = useState([0, 0, 0, 0, 0])

  const [data, setData] = useState({
    operations: [],
    varieties: [],
    units: [],
    contractors: [],
    customFields: [],
  })
  const [loading, setLoading] = useState(true)

  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const formMethods = {
    0: useForm({
      resolver: zodResolver(operationSchema),
      defaultValues: {
        name: '',
        slug: '',
        profile_type: 'generic',
        category: 'other',
        is_active: true,
      },
    }),
    1: useForm({ resolver: zodResolver(simpleSchema), defaultValues: { name: '' } }),
    2: useForm({ resolver: zodResolver(simpleSchema), defaultValues: { name: '' } }),
    3: useForm({
      resolver: zodResolver(contractorSchema),
      defaultValues: { name: '', rate_per_hour: 0, is_active: true },
    }),
    4: useForm({
      resolver: zodResolver(fieldSchema),
      defaultValues: { name: '', field_type: 'text', applies_to: 14, is_required: false },
    }),
  }

  const currentForm = formMethods[tabIndex]

  const fetchData = async () => {
    try {
      setLoading(true)
      const [opsRes, varRes, uniRes, conRes, cfRes] = await Promise.all([
        reportsApi.getOperations({ page: pages[0] }),
        reportsApi.getVarieties({ page: pages[1] }),
        reportsApi.getUnits({ page: pages[2] }),
        reportsApi.getContractors({ page: pages[3] }),
        reportsApi.getCustomFields({ page: pages[4] }),
      ])
      setData({
        operations: opsRes.data.results || opsRes.data,
        varieties: varRes.data.results || varRes.data,
        units: uniRes.data.results || uniRes.data,
        contractors: conRes.data.results || conRes.data,
        customFields: cfRes.data.results || cfRes.data,
      })
      setTotalCounts([
        opsRes.data.count || opsRes.data.length || 0,
        varRes.data.count || varRes.data.length || 0,
        uniRes.data.count || uniRes.data.length || 0,
        conRes.data.count || conRes.data.length || 0,
        cfRes.data.count || cfRes.data.length || 0,
      ])
    } catch (err) {
      showSnackbar('فشل في جلب البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pages])

  const handlePageChange = (event, value) => {
    const newPages = [...pages]
    newPages[tabIndex] = value
    setPages(newPages)
  }

  const handleOpenModal = (item = null) => {
    setEditingItem(item)
    if (item) {
      currentForm.reset(item)
    } else {
      if (tabIndex === 0)
        currentForm.reset({
          name: '',
          slug: '',
          profile_type: 'generic',
          category: 'other',
          is_active: true,
        })
      if (tabIndex === 1) currentForm.reset({ name: '' })
      if (tabIndex === 2) currentForm.reset({ name: '' })
      if (tabIndex === 3) currentForm.reset({ name: '', rate_per_hour: 0, is_active: true })
      if (tabIndex === 4)
        currentForm.reset({ name: '', field_type: 'text', applies_to: 14, is_required: false })
    }
    setModalOpen(true)
  }

  const onSubmit = async (formData) => {
    try {
      if (tabIndex === 0) {
        if (editingItem) await reportsApi.updateOperation(editingItem.id, formData)
        else await reportsApi.createOperation(formData)
      } else if (tabIndex === 1) {
        if (editingItem) await reportsApi.updateVariety(editingItem.id, formData)
        else await reportsApi.createVariety(formData)
      } else if (tabIndex === 2) {
        if (editingItem) await reportsApi.updateUnit(editingItem.id, formData)
        else await reportsApi.createUnit(formData)
      } else if (tabIndex === 3) {
        if (editingItem) await reportsApi.updateContractor(editingItem.id, formData)
        else await reportsApi.createContractor(formData)
      } else if (tabIndex === 4) {
        if (editingItem) await reportsApi.updateCustomField(editingItem.id, formData)
        else await reportsApi.createCustomField(formData)
      }
      setModalOpen(false)
      showSnackbar('تم الحفظ بنجاح')
      fetchData()
    } catch (err) {
      showSnackbar('حدث خطأ أثناء الحفظ. تأكد من صحة البيانات.', 'error')
    }
  }

  const executeDelete = async () => {
    try {
      const id = deleteTarget.id
      if (tabIndex === 0) await reportsApi.deleteOperation(id)
      if (tabIndex === 1) await reportsApi.deleteVariety(id)
      if (tabIndex === 2) await reportsApi.deleteUnit(id)
      if (tabIndex === 3) await reportsApi.deleteContractor(id)
      if (tabIndex === 4) await reportsApi.deleteCustomField(id)

      showSnackbar('تم التعطيل/الحذف بنجاح')
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.detail || 'فشل التعطيل. قد يكون العنصر محمي من النظام.'
      showSnackbar(msg, 'error')
    } finally {
      setConfirmOpen(false)
    }
  }

  const isSystemOperation = tabIndex === 0 && editingItem?.is_system

  if (loading && !data.operations.length)
    return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />

  return (
    <Box>
      <Typography variant="h5" fontWeight="800" mb={3}>
        البيانات الأساسية (Master Data)
      </Typography>

      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 700 } }}
        >
          <Tab label="العمليات التشغيلية" />
          <Tab label="الأصناف" />
          <Tab label="الوحدات" />
          <Tab label="المقاولون" />
          <Tab label="الحقول المخصصة" />
        </Tabs>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="700">
          {['العمليات التشغيلية', 'الأصناف', 'الوحدات', 'المقاولون', 'الحقول المخصصة'][tabIndex]}
        </Typography>
        {isManager && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
            إضافة عنصر
          </Button>
        )}
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>الاسم</TableCell>
              {tabIndex === 0 && <TableCell sx={{ fontWeight: 600 }}>نوع القالب</TableCell>}
              {tabIndex === 0 && <TableCell sx={{ fontWeight: 600 }}>القسم</TableCell>}
              {tabIndex === 3 && <TableCell sx={{ fontWeight: 600 }}>التكلفة / ساعة</TableCell>}
              {tabIndex === 4 && <TableCell sx={{ fontWeight: 600 }}>النوع</TableCell>}
              {tabIndex === 4 && <TableCell sx={{ fontWeight: 600 }}>إجباري</TableCell>}
              {(tabIndex === 0 || tabIndex === 3) && (
                <TableCell sx={{ fontWeight: 600 }}>الحالة</TableCell>
              )}
              {isManager && (
                <TableCell sx={{ fontWeight: 600 }} align="right">
                  إجراءات
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tabIndex === 0 &&
              data.operations.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell fontWeight="500">
                    <Box display="flex" alignItems="center" gap={1}>
                      {item.name}
                      {item.is_system && (
                        <Tooltip title="عملية أساسية محمية">
                          <LockIcon fontSize="small" color="disabled" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{PROFILE_TYPES[item.profile_type] || item.profile_type}</TableCell>
                  <TableCell>{CATEGORIES_AR[item.category] || item.category}</TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <Chip size="small" label="نشط" color="success" />
                    ) : (
                      <Chip size="small" label="معطل" color="error" />
                    )}
                  </TableCell>
                  {isManager && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={item.is_system}
                        onClick={() => {
                          setDeleteTarget({ id: item.id })
                          setConfirmOpen(true)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {tabIndex === 1 &&
              data.varieties.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell fontWeight="500">{item.name}</TableCell>
                  {isManager && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget({ id: item.id })
                          setConfirmOpen(true)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {tabIndex === 2 &&
              data.units.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell fontWeight="500">{item.name}</TableCell>
                  {isManager && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget({ id: item.id })
                          setConfirmOpen(true)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {tabIndex === 3 &&
              data.contractors.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell fontWeight="500">{item.name}</TableCell>
                  <TableCell>{item.rate_per_hour} جنية</TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <Chip size="small" label="نشط" color="success" />
                    ) : (
                      <Chip size="small" label="معطل" color="error" />
                    )}
                  </TableCell>
                  {isManager && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget({ id: item.id })
                          setConfirmOpen(true)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {tabIndex === 4 &&
              data.customFields.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell fontWeight="500">{item.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={FIELD_TYPES_AR[item.field_type]}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.is_required ? (
                      <Chip size="small" label="نعم" color="error" />
                    ) : (
                      <Chip size="small" label="لا" color="default" />
                    )}
                  </TableCell>
                  {isManager && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(item)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteTarget({ id: item.id })
                          setConfirmOpen(true)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {Math.ceil(totalCounts[tabIndex] / 25) > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.ceil(totalCounts[tabIndex] / 25)}
            page={pages[tabIndex]}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Reusable Modal Form */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingItem ? 'تعديل البيانات' : 'إضافة بيانات جديدة'}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            id="master-form"
            onSubmit={currentForm.handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}
          >
            <Controller
              name="name"
              control={currentForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="الاسم"
                  fullWidth
                  error={!!currentForm.formState.errors.name}
                  helperText={currentForm.formState.errors.name?.message}
                />
              )}
            />

            {tabIndex === 0 && (
              <>
                <Controller
                  name="slug"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="المعرف (Slug)"
                      fullWidth
                      disabled={isSystemOperation}
                      placeholder="اختياري للاستخدام البرمجي"
                    />
                  )}
                />
                <Controller
                  name="profile_type"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="نوع القالب (Profile Type)"
                      fullWidth
                      disabled={isSystemOperation}
                    >
                      {Object.entries(PROFILE_TYPES).map(([k, v]) => (
                        <MenuItem key={k} value={k}>
                          {v}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="category"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="القسم" fullWidth>
                      {Object.entries(CATEGORIES_AR).map(([k, v]) => (
                        <MenuItem key={k} value={k}>
                          {v}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="is_active"
                  control={currentForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="نشط"
                    />
                  )}
                />
                {isSystemOperation && (
                  <Typography
                    variant="caption"
                    color="warning.main"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <LockIcon fontSize="small" /> لا يمكن تعديل هيكل هذه العملية لأنها محمية
                    بالنظام.
                  </Typography>
                )}
              </>
            )}

            {tabIndex === 3 && (
              <>
                <Controller
                  name="rate_per_hour"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="التكلفة في الساعة"
                      type="number"
                      fullWidth
                      error={!!currentForm.formState.errors.rate_per_hour}
                    />
                  )}
                />
                <Controller
                  name="is_active"
                  control={currentForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="نشط"
                    />
                  )}
                />
              </>
            )}

            {tabIndex === 4 && (
              <>
                <Controller
                  name="field_type"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="النوع" fullWidth>
                      {Object.entries(FIELD_TYPES_AR).map(([k, v]) => (
                        <MenuItem key={k} value={k}>
                          {v}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="applies_to"
                  control={currentForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="يطبق على" fullWidth>
                      {MODEL_CHOICES.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="is_required"
                  control={currentForm.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="إجباري"
                    />
                  )}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setModalOpen(false)}>إلغاء</Button>
          <Button
            type="submit"
            form="master-form"
            variant="contained"
            disabled={currentForm.formState.isSubmitting}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="تأكيد التعطيل"
        message="هل أنت متأكد من تعطيل هذا العنصر؟ لن يظهر في القوائم المنسدلة للتقارير الجديدة، لكنه سيبقى محفوظاً في السجلات السابقة."
        onConfirm={executeDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  )
}

export default MasterDataManager
