import React, { useCallback, useEffect, useState } from 'react'

import { Add as AddIcon, Remove as RemoveIcon, Save as SaveIcon } from '@mui/icons-material'
import { Alert, Autocomplete, CircularProgress, LinearProgress, TextField } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import dayjs from 'dayjs'

import { useAuth } from '../../../app/AuthContext'
import LocationSelect from '../../../components/LocationSelect'
import api from '../../../services/api'
import { reportsApi } from '../../../services/reportsApi'
import { useReportOptions } from '../hooks/useReportOptions'
import DynamicFieldsRenderer from '../shared/DynamicFieldsRenderer'
import { AC, Field, inputSx, Label } from '../shared/FormControls'

import OperationLogPanel from './components/OperationLogPanel'

// ── Schema ──────────────────────────────────────────────────────────────────
const operationSchema = z.object({
  temp_id: z.string(),
  location: z.number({ required_error: 'الحوشة / الموقع مطلوب' }).min(1, 'الحوشة مطلوبة'),
  operation: z.number({ required_error: 'العملية مطلوبة' }).min(1, 'العملية مطلوبة'),
  variety: z.number({ required_error: 'الصنف مطلوب' }).min(1, 'الصنف مطلوب'),
  unit: z.number({ required_error: 'الوحدة مطلوبة' }).min(1, 'الوحدة مطلوبة'),
  contractor: z.number().nullable().optional(),
  company_workers: z.coerce.number().min(0),
  contractor_workers: z.coerce.number().min(0),
  actual_productivity: z.coerce.number().min(0),
  work_hours: z.coerce.number().min(0.5, 'يجب أن تكون ساعات العمل 0.5 على الأقل'),
  overtime_hours: z.coerce.number().min(0).optional(),
  overtime_productivity: z.coerce.number().min(0).optional(),
})

const taskSchema = z.object({
  report_date: z.any(),
  engineer: z.number({ required_error: 'المهندس مطلوب' }).min(1, 'المهندس مطلوب'),
  notes: z.string().optional(),
  override_reason: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
  operations: z.array(operationSchema).min(1, 'يجب إضافة عملية واحدة على الأقل'),
})

// ── Main Component ────────────────────────────────────────────────────────────
export default function DailyTaskForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isOverrideMode = searchParams.get('override') === 'true'

  const PRIVILEGED = ['MANAGER', 'SUPER_ADMIN', 'ADMIN', 'OWNER']
  const isPrivileged = user && PRIVILEGED.includes(user.role)

  const [submitError, setSubmitError] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const {
    engineers,
    operations: availableOperations,
    varieties,
    units,
    contractors,
  } = useReportOptions()

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      report_date: dayjs(),
      engineer: user?.id ?? null,
      notes: '',
      override_reason: '',
      custom_fields: {},
      operations: [
        {
          temp_id: crypto.randomUUID(),
          location: null,
          operation: null,
          variety: null,
          unit: null,
          contractor: null,
          company_workers: 0,
          contractor_workers: 0,
          actual_productivity: 0,
          work_hours: 8,
          overtime_hours: 0,
          overtime_productivity: 0,
        },
      ],
    },
  })

  useEffect(() => {
    if (user && !isPrivileged) setValue('engineer', user.id)
  }, [user, isPrivileged, setValue])

  // If editing, load the existing report
  useEffect(() => {
    if (id) {
      api
        .get(`/reports/tasks/${id}/`)
        .then((res) => {
          const data = res.data
          setValue('report_date', dayjs(data.report_date))
          setValue('engineer', data.engineer)
          setValue('notes', data.notes || '')
          // Use operation_logs if available, fallback to legacy container fields
          const logs =
            data.operation_logs && data.operation_logs.length > 0
              ? data.operation_logs.map((op) => ({
                id: op.id,
                temp_id: crypto.randomUUID(),
                location: op.location,
                operation: op.operation,
                variety: op.variety,
                unit: op.unit,
                contractor: op.contractor,
                company_workers: op.company_workers,
                contractor_workers: op.contractor_workers,
                actual_productivity: op.actual_productivity,
                work_hours: op.work_hours,
                overtime_hours: op.overtime_hours || 0,
                overtime_productivity: op.overtime_productivity || 0,
                profile_type: op.profile_type || 'generic',
                profile_data: op.profile_data || {},
              }))
              : [
                {
                  temp_id: crypto.randomUUID(),
                  location: data.location,
                  operation: data.operation,
                  variety: data.variety,
                  unit: data.unit,
                  contractor: data.contractor,
                  company_workers: data.company_workers,
                  contractor_workers: data.contractor_workers,
                  actual_productivity: data.actual_productivity,
                  work_hours: data.work_hours,
                  overtime_hours: data.overtime_hours || 0,
                  overtime_productivity: data.overtime_productivity || 0,
                  profile_type: 'generic',
                  profile_data: {},
                },
              ]
          setValue('operations', logs)
        })
        .catch((err) => {
          setSubmitError('Failed to load report data.')
        })
    }
  }, [id, setValue])

  const onSubmit = async (data) => {
    setSubmitError('')
    try {
      const { custom_fields, report_date, operations, notes, override_reason } = data

      // PHASE 4 COMPATIBILITY BRIDGE:
      const primaryOperation = operations[0]
      const sanitizeId = (val) => (val && !isNaN(parseInt(val, 10)) ? parseInt(val, 10) : null)

      const payload = {
        // Legacy Container Fields (from first operation)
        location: sanitizeId(primaryOperation.location),
        operation: sanitizeId(primaryOperation.operation),
        variety: sanitizeId(primaryOperation.variety),
        unit: sanitizeId(primaryOperation.unit),
        contractor: sanitizeId(primaryOperation.contractor),
        company_workers: primaryOperation.company_workers,
        contractor_workers: primaryOperation.contractor_workers,
        actual_productivity: primaryOperation.actual_productivity,
        work_hours: primaryOperation.work_hours,
        overtime_hours: primaryOperation.overtime_hours,
        overtime_productivity: primaryOperation.overtime_productivity,

        // Modern Operations Array
        operations: operations.map((op) => {
          const matchedOpDef = availableOperations.find((o) => o.id === op.operation)
          const profileType = matchedOpDef ? matchedOpDef.profile_type : 'generic'
          return {
            id: op.id,
            temp_id: op.temp_id,
            location: sanitizeId(op.location),
            operation: sanitizeId(op.operation),
            variety: sanitizeId(op.variety),
            unit: sanitizeId(op.unit),
            contractor: sanitizeId(op.contractor),
            company_workers: op.company_workers,
            contractor_workers: op.contractor_workers,
            actual_productivity: op.actual_productivity,
            work_hours: op.work_hours,
            overtime_hours: op.overtime_hours || 0,
            overtime_productivity: op.overtime_productivity || 0,
            profile_type: profileType,
            profile_data: op.profile_data || {},
          }
        }),

        // Shared
        report_date: dayjs(report_date).format('YYYY-MM-DD'),
        engineer: sanitizeId(data.engineer),
        notes: notes,
        ...(isOverrideMode && { override_reason }),
      }

      console.log('=== PRE-SUBMISSION PAYLOAD DEBUG ===', JSON.stringify(payload, null, 2))

      let reportId
      if (id) {
        await api.put(`/reports/tasks/${id}/`, payload)
        reportId = id
      } else {
        const res = await api.post('/reports/tasks/', payload)
        reportId = res.data.id
      }

      for (const file of pendingFiles) {
        const uploadRes = await reportsApi.uploadFile(file, (event) => {
          const ratio = event.total ? Math.round((event.loaded * 100) / event.total) : 0
          setUploadProgress((prev) => ({ ...prev, [file.name]: ratio }))
        })
        const fileType = file.type.startsWith('image/')
          ? 'IMAGE'
          : file.type.startsWith('video/')
            ? 'VIDEO'
            : 'FILE'
        await reportsApi.createAttachment({
          report: reportId,
          file_url: uploadRes.data.file_url,
          file_type: fileType,
        })
      }

      if (custom_fields && Object.keys(custom_fields).length > 0) {
        await Promise.all(
          Object.entries(custom_fields).map(([fieldId, val]) =>
            api.post('/reports/custom-field-values/', {
              field: parseInt(fieldId, 10),
              value: val.toString(),
              content_type_model: 'dailytaskreport',
              object_id: reportId,
            })
          )
        )
      }

      navigate('/reports/tasks')
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : 'حدث خطأ أثناء حفظ التقرير.'
      setSubmitError(msg)
    }
  }

  const onDropFiles = (event) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files || event.target.files || [])
    if (files.length) setPendingFiles((prev) => [...prev, ...files])
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit(onSubmit)} className="pb-32 bg-[#f4f7f4] min-h-screen">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
          {submitError && (
            <Alert severity="error" className="mb-6 rounded-lg whitespace-pre-wrap">
              {submitError}
            </Alert>
          )}

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#bfc9c1] overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="mb-8 pb-6 border-b border-[#e1e3df]">
                <h2 className="font-semibold text-2xl text-[#191c1a]">تسجيل تقرير يومي</h2>
                <p className="text-[15px] text-[#404943] mt-1.5">
                  يرجى إدخال تفاصيل العمل اليومي بدقة لضمان صحة البيانات.
                </p>
              </div>

              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-sm font-bold text-[#0f5238] uppercase tracking-wider mb-5 border-b border-[#e1e3df] pb-2">
                    معلومات أساسية
                  </p>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-6 lg:col-span-4">
                      <Controller
                        name="report_date"
                        control={control}
                        render={({ field }) => (
                          <Field label="التاريخ">
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  size: 'small',
                                  error: !!errors.report_date,
                                  sx: inputSx,
                                },
                              }}
                            />
                          </Field>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6 lg:col-span-4">
                      <Controller
                        name="engineer"
                        control={control}
                        render={({ field }) => (
                          <Field label="المهندس المسؤول">
                            {isPrivileged ? (
                              <AC
                                options={engineers}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="اختر المهندس"
                                error={!!errors.engineer}
                                helperText={errors.engineer?.message}
                                getLabel={(o) => o.name || o.email || ''}
                              />
                            ) : (
                              <TextField
                                value={
                                  engineers.find((e) => e.id === field.value)?.name ||
                                  user?.name ||
                                  ''
                                }
                                disabled
                                fullWidth
                                size="small"
                                sx={inputSx}
                                placeholder="المهندس المسؤول"
                              />
                            )}
                          </Field>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {isOverrideMode && (
                  <div>
                    <p className="text-sm font-bold text-[#dc2626] uppercase tracking-wider mb-5 border-b border-[#fee2e2] pb-2">
                      تعديل استثنائي
                    </p>
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12">
                        <Controller
                          name="override_reason"
                          control={control}
                          render={({ field }) => (
                            <Field label="سبب التعديل (إلزامي)">
                              <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={3}
                                size="small"
                                placeholder="يرجى كتابة سبب التعديل الاستثنائي لهذا التقرير المعتمد"
                                error={!!errors.override_reason}
                                helperText={errors.override_reason?.message}
                                sx={inputSx}
                              />
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Extracted Operation Panel for dynamic multi-operation rows */}
                <OperationLogPanel
                  control={control}
                  getValues={getValues}
                  errors={errors}
                  operations={availableOperations}
                  varieties={varieties}
                  units={units}
                  contractors={contractors}
                />

                <div className="w-full">
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <Field label="ملاحظات / مشاهدات">
                        <TextField
                          {...field}
                          placeholder="أدخل أي ملاحظات هامة هنا..."
                          fullWidth
                          size="small"
                          multiline
                          rows={4}
                          sx={inputSx}
                        />
                      </Field>
                    )}
                  />
                </div>

                <div className="w-full">
                  <Field label="المرفقات">
                    <div
                      className="border-2 border-dashed border-[#bfc9c1] rounded-xl p-5 bg-[#f8faf6]"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDropFiles}
                    >
                      <input
                        type="file"
                        multiple
                        onChange={onDropFiles}
                        className="mb-3 block w-full text-sm"
                      />
                      <p className="text-sm text-[#404943]">
                        اسحب الملفات هنا أو اخترها للرفع إلى Cloudinary.
                      </p>
                      <div className="mt-3 space-y-2">
                        {pendingFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}`}
                            className="rounded-md border border-[#d7ddd8] p-2 bg-white"
                          >
                            <div className="flex justify-between text-sm">
                              <span>{file.name}</span>
                              <span>{uploadProgress[file.name] ?? 0}%</span>
                            </div>
                            <LinearProgress
                              variant="determinate"
                              value={uploadProgress[file.name] ?? 0}
                              sx={{ mt: 1 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Field>
                </div>

                <DynamicFieldsRenderer
                  modelName="dailytaskreport"
                  control={control}
                  errors={errors}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#bfc9c1] py-4 px-6 md:px-12 flex justify-end items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-[#0f5238] text-white font-medium text-sm px-8 py-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:bg-[#0b3d2a] disabled:bg-[#a0b8a8] disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon fontSize="small" />
            )}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقرير'}
          </button>
        </div>
      </form>
    </LocalizationProvider>
  )
}
