import React, { useState, useEffect } from 'react'

import { Trash2, Users, Plus, AlertCircle, RefreshCw, Sparkles, Check, Edit2 } from 'lucide-react'
import { Controller, useWatch } from 'react-hook-form'

import LocationSelect from '../../../../components/LocationSelect'
import { OPERATION_PROFILES } from '../../../../constants/operationProfiles'
import { AC, Field, Stepper, MultiAC } from '../../shared/FormControls'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import DynamicFieldsRenderer from '../../shared/DynamicFieldsRenderer'
import enclosureProfileApi from '../../../../services/enclosureProfileApi'
import api from '../../../../services/api'

export default function OperationRow({
  index,
  control,
  setValue,
  errors,
  operations,
  varieties,
  units,
  contractors,
  onRemove,
  isRemovable,
}) {
  const [isFullEnclosure, setIsFullEnclosure] = useState(false)
  const [hrWorkers, setHrWorkers] = useState([])
  const [isLaborDetailsOpen, setIsLaborDetailsOpen] = useState(false)
  const [loadingWorkers, setLoadingWorkers] = useState(false)

  useEffect(() => {
    setLoadingWorkers(true)
    api.get('/hr/workers/').then((res) => {
      setHrWorkers(res.data)
      setLoadingWorkers(false)
    }).catch((e) => {
      console.error("Failed to load workers list for select", e)
      setLoadingWorkers(false)
    })
  }, [])
  
  const getError = (fieldName) => errors?.operations?.[index]?.[fieldName]
  const getProfileError = (fieldName) => errors?.operations?.[index]?.profile_data?.[fieldName]

  const currentOperationId = useWatch({ control, name: `operations.${index}.operation` })
  const currentLocationId = useWatch({ control, name: `operations.${index}.location` })
  const currentOperation = operations.find((o) => o.id === currentOperationId)
  const profileType = currentOperation?.profile_type || 'generic'
  const profileFields = OPERATION_PROFILES[profileType] || []

  const laborEntries = useWatch({ control, name: `operations.${index}.labor_entries` }) || []

  const handleAddLaborEntry = () => {
    const newEntry = {
      id: null,
      temp_id: crypto.randomUUID(),
      worker: null,
      worker_name: '',
      worker_type: 'COMPANY',
      worker_rate: 0,
      hours: 8,
      overtime: 0,
      deduction_hours: 0,
      note: '',
      isManual: false,
    }
    setValue(`operations.${index}.labor_entries`, [...laborEntries, newEntry])
  }

  const handleRemoveLaborEntry = (idx) => {
    setValue(`operations.${index}.labor_entries`, laborEntries.filter((_, i) => i !== idx))
  }

  const handleUpdateLaborEntry = (idx, fields) => {
    const updated = [...laborEntries]
    updated[idx] = { ...updated[idx], ...fields }
    setValue(`operations.${index}.labor_entries`, updated)
  }

  return (
    <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 md:p-6 bg-white/60 dark:bg-slate-900/60 shadow-sm mb-4 md:mb-6 transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
      {/* Card Header & Actions */}
      <div className="flex justify-between items-center mb-4 md:mb-6 pb-3 md:pb-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">الحدث التشغيلي</h3>
        </div>
        <div className="flex gap-2">
          {isRemovable && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>حذف العملية</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {/* Section 1: Core Event */}
        <div>
          <p className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-4 md:mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
            الحدث الأساسي
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-1 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.location`}
                control={control}
                render={({ field }) => (
                  <Field label="الموقع / الحوشة">
                    <LocationSelect
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('location')}
                      helperText={getError('location')?.message}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.operation`}
                control={control}
                render={({ field }) => (
                  <Field label="العملية الفنية">
                    <AC
                      options={operations}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر العملية"
                      error={!!getError('operation')}
                      helperText={getError('operation')?.message}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.variety`}
                control={control}
                render={({ field }) => (
                  <Field label="الصنف الزراعي">
                    <AC
                      options={varieties}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر الصنف"
                      error={!!getError('variety')}
                      helperText={getError('variety')?.message}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Labor & Time */}
        <div>
          <p className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-4 md:mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
            العمالة والوقت
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-1 md:col-span-6 lg:col-span-3">
              <Controller
                name={`operations.${index}.company_workers`}
                control={control}
                render={({ field }) => (
                  <Field label="عمالة الشركة">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('company_workers')}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3">
              <Controller
                name={`operations.${index}.contractor_workers`}
                control={control}
                render={({ field }) => (
                  <Field label="عمالة المقاول">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('contractor_workers')}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3">
              <Controller
                name={`operations.${index}.work_hours`}
                control={control}
                render={({ field }) => (
                  <Field label="ساعات العمل">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('work_hours')}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-6 lg:col-span-3">
              <Controller
                name={`operations.${index}.overtime_hours`}
                control={control}
                render={({ field }) => (
                  <Field label="ساعات الإضافي">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('overtime_hours')}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        {/* تفاصيل العمالة الفردية (إضافي / خصم) */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLaborDetailsOpen(!isLaborDetailsOpen)}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30 flex items-center gap-2"
          >
            <Users className="w-4.5 h-4.5" />
            <span>تفاصيل العمالة الفردية (إضافي / خصم)</span>
            {laborEntries.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-bold">
                {laborEntries.length}
              </span>
            )}
          </Button>

          {isLaborDetailsOpen && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>توزيع العمالة الفردية للحدث التشغيلي</span>
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

              {laborEntries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  لم يتم إضافة تفاصيل فردية بعد. يرجى الضغط على زر "إضافة تفاصيل عامل" بالعبوة أعلاه لتخصيص الخصومات أو ساعات الإضافي لكل عامل بشكل ديناميكي.
                </div>
              ) : (
                <div className="space-y-4">
                  {laborEntries.map((entry, entryIdx) => {
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
                              value={entry.worker ? entry.worker.toString() : ''}
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

        {/* Section 3: Productivity */}
        <div>
          <p className="text-xs md:text-sm font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-4 md:mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
            الإنتاجية
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-end">
            <div className="col-span-1 md:col-span-4">
              <Controller
                name={`operations.${index}.actual_productivity`}
                control={control}
                render={({ field }) => (
                  <Field label="الإنتاجية (أساسي)">
                    <div className="flex flex-col gap-2">
                      <Input
                        type="number"
                        placeholder="الكمية المنجزة"
                        value={field.value === 0 ? '' : field.value}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          field.onChange(isNaN(val) ? 0 : val)
                        }}
                        disabled={isFullEnclosure}
                        className={getError('actual_productivity') ? 'border-red-500 bg-slate-100 dark:bg-slate-800' : (isFullEnclosure ? 'bg-slate-100 dark:bg-slate-800' : '')}
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`full-enclosure-${index}`} 
                          checked={isFullEnclosure} 
                          onCheckedChange={async (checked) => {
                            setIsFullEnclosure(checked)
                            if (checked && currentLocationId) {
                              try {
                                const res = await enclosureProfileApi.getProfile(currentLocationId)
                                const treeCount = res.data.asset_profile?.tree_count || res.data.asset_profile?.seedling_count || 0
                                if (treeCount > 0 && setValue) {
                                  setValue(`operations.${index}.actual_productivity`, treeCount)
                                }
                              } catch (e) {
                                console.error('Failed to fetch profile', e)
                              }
                            }
                          }} 
                        />
                        <label htmlFor={`full-enclosure-${index}`} className="text-xs font-bold leading-none text-emerald-700 cursor-pointer">
                          تمت العملية على الحوشة بالكامل
                        </label>
                      </div>
                    </div>
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-4">
              <Controller
                name={`operations.${index}.overtime_productivity`}
                control={control}
                render={({ field }) => (
                  <Field label="إنتاجية الإضافي">
                    <Input
                      type="number"
                      placeholder="الكمية المنجزة إضافي"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        field.onChange(isNaN(val) ? 0 : val)
                      }}
                      className={getError('overtime_productivity') ? 'border-red-500' : ''}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Controller
                name={`operations.${index}.unit`}
                control={control}
                render={({ field }) => (
                  <Field label="وحدة القياس">
                    <AC
                      options={units}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر وحدة"
                      error={!!getError('unit')}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Controller
                name={`operations.${index}.contractors`}
                control={control}
                render={({ field }) => (
                  <Field label="المقاولون">
                    <MultiAC
                      options={contractors}
                      value={field.value || []}
                      onChange={(vals) => {
                        field.onChange(vals)
                        if (setValue) {
                          setValue(`operations.${index}.contractor`, vals && vals.length > 0 ? vals[0] : null)
                        }
                      }}
                      placeholder="اختر المقاولين"
                      error={!!getError('contractors')}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        {profileFields.length > 0 && (
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-2">
              بيانات تشغيلية إضافية
            </p>
            <div className="grid grid-cols-12 gap-6">
              <DynamicFieldsRenderer
                fields={profileFields}
                control={control}
                basePath={`operations.${index}.profile_data`}
                getProfileError={getProfileError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
