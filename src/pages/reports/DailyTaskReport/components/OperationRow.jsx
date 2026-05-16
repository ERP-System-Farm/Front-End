import React, { useState } from 'react'

import { Trash2 } from 'lucide-react'
import { Controller, useWatch } from 'react-hook-form'

import LocationSelect from '../../../../components/LocationSelect'
import { OPERATION_PROFILES } from '../../../../constants/operationProfiles'
import { AC, Field, Stepper } from '../../shared/FormControls'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import DynamicFieldsRenderer from '../../shared/DynamicFieldsRenderer'
import enclosureProfileApi from '../../../../services/enclosureProfileApi'

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
  
  const getError = (fieldName) => errors?.operations?.[index]?.[fieldName]
  const getProfileError = (fieldName) => errors?.operations?.[index]?.profile_data?.[fieldName]

  const currentOperationId = useWatch({ control, name: `operations.${index}.operation` })
  const currentLocationId = useWatch({ control, name: `operations.${index}.location` })
  const currentOperation = operations.find((o) => o.id === currentOperationId)
  const profileType = currentOperation?.profile_type || 'generic'
  const profileFields = OPERATION_PROFILES[profileType] || []

  return (
    <div className="relative border border-slate-200 rounded-xl p-6 bg-white/60 shadow-sm mb-6 transition-all hover:shadow-md hover:border-emerald-200">
      {/* Card Header & Actions */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <h3 className="font-bold text-lg text-slate-800">الحدث التشغيلي</h3>
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

      <div className="flex flex-col gap-8">
        {/* Section 1: Core Event */}
        <div>
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
            الحدث الأساسي
          </p>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
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
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
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
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
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
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
            العمالة والوقت
          </p>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 lg:col-span-3">
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
            <div className="col-span-12 md:col-span-6 lg:col-span-3">
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
            <div className="col-span-12 md:col-span-6 lg:col-span-3">
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
            <div className="col-span-12 md:col-span-6 lg:col-span-3">
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

        {/* Section 3: Productivity */}
        <div>
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
            الإنتاجية
          </p>
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-4">
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
                        className={getError('actual_productivity') ? 'border-red-500 bg-slate-100' : (isFullEnclosure ? 'bg-slate-100' : '')}
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
            <div className="col-span-12 md:col-span-4">
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
            <div className="col-span-12 md:col-span-2">
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
            <div className="col-span-12 md:col-span-2">
              <Controller
                name={`operations.${index}.contractor`}
                control={control}
                render={({ field }) => (
                  <Field label="المقاول">
                    <AC
                      options={contractors}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر مقاول"
                      error={!!getError('contractor')}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Fields */}
        {profileFields.length > 0 && (
          <div>
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-5 border-b border-slate-100 pb-2">
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
