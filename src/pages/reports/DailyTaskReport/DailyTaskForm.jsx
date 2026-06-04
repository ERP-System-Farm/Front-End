import React, { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import dayjs from 'dayjs'
import { Save, Loader2, AlertCircle, ArrowRight, ClipboardList, Calendar, User, AlertTriangle, FileText, Settings2 } from 'lucide-react'
import AttachmentUploader from '../../../components/AttachmentUploader'

import { useAuth } from '../../../app/AuthContext'
import api from '../../../services/api'
import { reportsApi } from '../../../services/reportsApi'
import { useReportOptions } from '../hooks/useReportOptions'
import DynamicFieldsRenderer from '../shared/DynamicFieldsRenderer'
import { AC, Field } from '../shared/FormControls'
import OperationLogPanel from './components/OperationLogPanel'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Schemas ──────────────────────────────────────────────────────────────────
const operationSchema = z.object({
  temp_id: z.string(),
  location: z.string({ required_error: 'الحوشة / الموقع مطلوب' }).min(1, 'الحوشة مطلوبة').or(z.any()),
  operation: z.string({ required_error: 'العملية مطلوبة' }).min(1, 'العملية مطلوبة').or(z.any()),
  variety: z.string({ required_error: 'الصنف مطلوب' }).min(1, 'الصنف مطلوب').or(z.any()),
  unit: z.string({ required_error: 'الوحدة مطلوبة' }).min(1, 'الوحدة مطلوبة').or(z.any()),
  contractor: z.string().nullable().optional().or(z.any()),
  contractors: z.array(z.any()).default([]),
  company_workers: z.coerce.number().min(0),
  contractor_workers: z.coerce.number().min(0),
  actual_productivity: z.coerce.number().min(0),
  work_hours: z.coerce.number().min(0.5, 'يجب أن تكون ساعات العمل 0.5 على الأقل'),
  overtime_hours: z.coerce.number().min(0).optional(),
  overtime_productivity: z.coerce.number().min(0).optional(),
  labor_entries: z.array(z.any()).optional(),
})

const taskSchema = z.object({
  report_date: z.any(),
  engineer: z.string({ required_error: 'المهندس مطلوب' }).min(1, 'المهندس مطلوب').or(z.any()),
  notes: z.string().optional(),
  override_reason: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
  operations: z.array(operationSchema).min(1, 'يجب إضافة عملية واحدة على الأقل'),
})

// ── Component ────────────────────────────────────────────────────────────────
export default function DailyTaskForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isOverrideMode = searchParams.get('override') === 'true'

  const PRIVILEGED = ['MANAGER', 'SUPER_ADMIN', 'ADMIN', 'OWNER']
  const isPrivileged = user && PRIVILEGED.includes(user.role)

  const [submitError, setSubmitError] = useState('')
  const [reportStatus, setReportStatus] = useState(null)
  const [attachments, setAttachments] = useState([]) // { id?, file_url, file_type, isNew?, tempId? }
  const [isUploading, setIsUploading] = useState(false)

  const { engineers, operations: availableOperations, varieties, units, contractors } = useReportOptions()

  const { control, handleSubmit, getValues, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      report_date: dayjs().format('YYYY-MM-DD'),
      engineer: user?.id ?? null,
      notes: '',
      override_reason: '',
      custom_fields: {},
      operations: [{
        temp_id: crypto.randomUUID(),
        location: null, operation: null, variety: null, unit: null, contractor: null,
        contractors: [],
        company_workers: 0, contractor_workers: 0, actual_productivity: 0,
        work_hours: 8, overtime_hours: 0, overtime_productivity: 0,
        labor_entries: [],
      }],
    },
  })

  useEffect(() => {
    if (user && !isPrivileged) setValue('engineer', user.id)
  }, [user, isPrivileged, setValue])

  useEffect(() => {
    if (!id) return
    api.get(`/reports/tasks/${id}/`).then((res) => {
      const data = res.data
      setReportStatus(data.status)
      setValue('report_date', dayjs(data.report_date).format('YYYY-MM-DD'))
      setValue('engineer', data.engineer)
      setValue('notes', data.notes || '')
      setValue('override_reason', data.override_reason || '')
      // Load existing attachments
      if (data.attachments?.length > 0) {
        setAttachments(data.attachments)
      }
      const logs = data.operation_logs?.length > 0
        ? data.operation_logs.map((op) => ({
            id: op.id, temp_id: crypto.randomUUID(),
            location: op.location, operation: op.operation, variety: op.variety,
            unit: op.unit, contractor: op.contractor,
            contractors: op.contractors || (op.contractor ? [op.contractor] : []),
            company_workers: op.company_workers, contractor_workers: op.contractor_workers,
            actual_productivity: op.actual_productivity, work_hours: op.work_hours,
            overtime_hours: op.overtime_hours || 0, overtime_productivity: op.overtime_productivity || 0,
            profile_type: op.profile_type || 'generic', profile_data: op.profile_data || {},
            labor_entries: op.labor_entries || []
          }))
        : [{ temp_id: crypto.randomUUID(), location: data.location, operation: data.operation,
            variety: data.variety, unit: data.unit, contractor: data.contractor,
            contractors: data.contractors || (data.contractor ? [data.contractor] : []),
            company_workers: data.company_workers, contractor_workers: data.contractor_workers,
            actual_productivity: data.actual_productivity, work_hours: data.work_hours,
            overtime_hours: data.overtime_hours || 0, overtime_productivity: data.overtime_productivity || 0,
            profile_type: 'generic', profile_data: {}, labor_entries: [] }]
      setValue('operations', logs)
    }).catch(() => setSubmitError('Failed to load report data.'))
  }, [id, setValue])

  const onSubmit = async (data) => {
    setSubmitError('')

    // Block submit if an upload is still in progress
    if (isUploading) {
      setSubmitError('يرجى الانتظار حتى يكتمل رفع الملفات قبل الحفظ.')
      return
    }

    if ((isOverrideMode || reportStatus?.toLowerCase() === 'approved') && !data.override_reason?.trim()) {
      setSubmitError('سبب التعديل الاستثنائي مطلوب للتقارير المعتمدة.')
      return
    }

    try {
      const { custom_fields, report_date, operations, notes, override_reason } = data
      const primaryOp = operations[0]
      const sanitizeId = (val) => (val && val !== 'null' ? (typeof val === 'object' && val !== null ? val.id : val) : null)

      const payload = {
        location: sanitizeId(primaryOp.location),
        operation: sanitizeId(primaryOp.operation),
        variety: sanitizeId(primaryOp.variety),
        unit: sanitizeId(primaryOp.unit),
        contractor: sanitizeId(primaryOp.contractor),
        contractors: (primaryOp.contractors || []).map(sanitizeId).filter(Boolean),
        company_workers: primaryOp.company_workers,
        contractor_workers: primaryOp.contractor_workers,
        actual_productivity: primaryOp.actual_productivity,
        work_hours: primaryOp.work_hours,
        overtime_hours: primaryOp.overtime_hours,
        overtime_productivity: primaryOp.overtime_productivity,
        operations: operations.map((op) => {
          const profileType = availableOperations.find((o) => o.id === op.operation)?.profile_type || 'generic'
          return {
            id: op.id, temp_id: op.temp_id,
            location: sanitizeId(op.location), operation: sanitizeId(op.operation),
            variety: sanitizeId(op.variety), unit: sanitizeId(op.unit),
            contractor: sanitizeId(op.contractor),
            contractors: (op.contractors || []).map(sanitizeId).filter(Boolean),
            company_workers: op.company_workers, contractor_workers: op.contractor_workers,
            actual_productivity: op.actual_productivity, work_hours: op.work_hours,
            overtime_hours: op.overtime_hours || 0, overtime_productivity: op.overtime_productivity || 0,
            profile_type: profileType, profile_data: op.profile_data || {},
            labor_entries: op.labor_entries || [],
          }
        }),
        report_date: dayjs(report_date).format('YYYY-MM-DD'),
        engineer: sanitizeId(data.engineer),
        notes,
        ...((isOverrideMode || reportStatus?.toLowerCase() === 'approved') && { override_reason }),
      }

      let reportId
      if (id) {
        await api.put(`/reports/tasks/${id}/`, payload)
        reportId = id
      } else {
        const res = await api.post('/reports/tasks/', payload)
        reportId = res.data.id
      }

      // Link new attachments (already uploaded by AttachmentUploader) to the report
      const newAttachments = attachments.filter((a) => a.isNew)
      for (const attachment of newAttachments) {
        try {
          await reportsApi.createAttachment({
            report: reportId,
            file_url: attachment.file_url,
            file_type: attachment.file_type || 'FILE',
          })
        } catch (attachErr) {
          console.error('Failed to link attachment to report:', attachment.file_url, attachErr)
        }
      }

      if (custom_fields && Object.keys(custom_fields).length > 0) {
        await Promise.all(Object.entries(custom_fields).map(([fieldId, val]) =>
          api.post('/reports/custom-field-values/', {
            field: fieldId, value: val.toString(),
            content_type_model: 'dailytaskreport', object_id: reportId,
          })
        ))
      }

      navigate('/reports/tasks')
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : 'حدث خطأ أثناء حفظ التقرير.'
      setSubmitError(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 dark:bg-transparent min-h-screen pb-32" dir="rtl">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              {id ? 'تعديل التقرير اليومي' : 'تسجيل تقرير يومي جديد'}
            </h1>
            <p className="text-sm text-slate-500 font-bold mt-1">
              يرجى إدخال تفاصيل العمل اليومي بدقة لضمان صحة البيانات الميدانية.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-6">

        {/* Error Banner */}
        {submitError && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 px-5 py-4 rounded-2xl font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap text-sm">{submitError}</span>
          </div>
        )}

        {/* Section 1: Basic Info */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-lg font-black text-emerald-800 dark:text-emerald-500 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              البيانات الأساسية للتقرير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Controller name="report_date" control={control} render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">تاريخ التقرير <span className="text-rose-500">*</span></label>
                <Input type="date" value={field.value} onChange={field.onChange}
                  className={`bg-white dark:bg-slate-900 h-10 font-bold ${errors.report_date ? 'border-red-400' : ''}`} />
                {errors.report_date && <p className="text-xs text-red-500 font-bold">{errors.report_date.message}</p>}
              </div>
            )} />
            <Controller name="engineer" control={control} render={({ field }) => (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> المهندس المسؤول <span className="text-rose-500">*</span>
                </label>
                {isPrivileged ? (
                  <AC options={engineers} value={field.value} onChange={field.onChange}
                    placeholder="اختر المهندس" error={!!errors.engineer}
                    helperText={errors.engineer?.message} getLabel={(o) => o.name || o.email || ''} />
                ) : (
                  <Input value={engineers.find((e) => e.id === field.value)?.name || user?.name || ''}
                    disabled className="bg-slate-50 dark:bg-slate-800 cursor-not-allowed font-bold text-slate-500 h-10" />
                )}
              </div>
            )} />
          </CardContent>
        </Card>

        {/* Override Reason */}
        {(isOverrideMode || reportStatus?.toLowerCase() === 'approved') && (
          <Card className="border-red-200 dark:border-red-900/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 pb-4">
              <CardTitle className="text-lg font-black text-red-800 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                تعديل استثنائي — مطلوب توضيح
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <Controller name="override_reason" control={control} render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">سبب التعديل (إلزامي)</label>
                  <Textarea {...field} rows={3}
                    placeholder="يرجى كتابة سبب التعديل الاستثنائي لهذا التقرير المعتمد..."
                    className={`bg-white dark:bg-slate-900 resize-none ${errors.override_reason ? 'border-red-400' : ''}`} />
                  {errors.override_reason && <p className="text-xs text-red-500 font-bold">{errors.override_reason.message}</p>}
                </div>
              )} />
            </CardContent>
          </Card>
        )}

        {/* Section 2: Operations */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 pb-4">
            <CardTitle className="text-lg font-black text-blue-800 dark:text-blue-500 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              تفاصيل العمليات الميدانية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <OperationLogPanel
              control={control} getValues={getValues} setValue={setValue}
              errors={errors} operations={availableOperations}
              varieties={varieties} units={units} contractors={contractors}
            />
          </CardContent>
        </Card>

        {/* Section 3: Notes & Attachments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Notes Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                الملاحظات والمشاهدات الميدانية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 flex-1 flex flex-col justify-between">
              <Controller name="notes" control={control} render={({ field }) => (
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ملاحظات / مشاهدات ميدانية</label>
                  <Textarea {...field} placeholder="أدخل أي ملاحظات هامة تتعلق بالعمل اليومي هنا..."
                    className="bg-white dark:bg-slate-900 resize-none flex-1 min-h-[120px] h-full" />
                </div>
              )} />
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500" />
                مرفقات العملية (صور الميدان)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-2 flex-1 flex flex-col justify-between">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">مرفقات العملية (صور الميدان)</label>
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

        <DynamicFieldsRenderer modelName="dailytaskreport" control={control} errors={errors} />

      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-3 md:px-8">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}
            className="flex-1 md:flex-none h-11 px-4 md:px-6 rounded-xl font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}
            className="flex-[2] md:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-black h-11 px-6 md:px-10 rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'جاري الحفظ...' : 'اعتماد وحفظ التقرير'}
          </Button>
        </div>
      </div>

    </form>
  )
}
