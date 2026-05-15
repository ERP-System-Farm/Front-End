import React from 'react'

import { DeleteOutlined, DynamicFeedOutlined } from '@mui/icons-material'
import { FormControl, IconButton, MenuItem, Select, TextField, Tooltip } from '@mui/material'
import { Controller, useWatch } from 'react-hook-form'

import LocationSelect from '../../../../components/LocationSelect'
import { OPERATION_PROFILES } from '../../../../constants/operationProfiles'
import { AC, Field, inputSx, Stepper } from '../../shared/FormControls'

export default function OperationRow({
  index,
  control,
  errors,
  operations,
  varieties,
  units,
  contractors,
  onRemove,
  isRemovable,
}) {
  // Helper to extract nested error messages safely
  const getError = (fieldName) => errors?.operations?.[index]?.[fieldName]
  const getProfileError = (fieldName) => errors?.operations?.[index]?.profile_data?.[fieldName]

  const currentOperationId = useWatch({ control, name: `operations.${index}.operation` })
  const currentOperation = operations.find((o) => o.id === currentOperationId)
  const profileType = currentOperation?.profile_type || 'generic'
  const profileFields = OPERATION_PROFILES[profileType] || []

  return (
    <div className="relative border border-[#bfc9c1] rounded-2xl p-6 bg-white shadow-sm mb-6">
      {/* Card Header & Actions */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#e1e3df]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#f4f7f4] text-[#0f5238] flex items-center justify-center font-bold text-sm">
            {index + 1}
          </div>
          <h3 className="font-semibold text-lg text-[#191c1a]">الحدث التشغيلي</h3>
        </div>
        <div className="flex gap-2">
          {isRemovable && (
            <Tooltip title="حذف العملية">
              <IconButton size="small" onClick={onRemove} sx={{ color: '#ba1a1a' }}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Section 1: Core Event (The "What & Where") */}
        <div>
          <p className="text-sm font-bold text-[#0f5238] uppercase tracking-wider mb-5 border-b border-[#e1e3df] pb-2">
            الحدث الأساسي
          </p>
          <div className="grid grid-cols-12 gap-6">
            {/* Location */}
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
            {/* Operation */}
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
            {/* Variety */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.variety`}
                control={control}
                render={({ field }) => (
                  <Field label="الصنف">
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

        {/* Section 2: Dynamic Profile (If applicable) */}
        {profileFields.length > 0 && (
          <div className="bg-[#f8fafc] -mx-6 px-6 py-6 border-y border-[#e2e8f0]">
            <p className="text-sm font-bold text-[#0f5238] uppercase tracking-wider mb-5 flex items-center gap-2">
              <DynamicFeedOutlined fontSize="small" />
              البيانات التشغيلية (
              {profileType === 'irrigation'
                ? 'الري'
                : profileType === 'fertilization'
                  ? 'التسميد'
                  : 'الرش'}
              )
            </p>
            <div className="grid grid-cols-12 gap-6">
              {profileFields.map((f) => (
                <div key={f.name} className="col-span-12 md:col-span-6 lg:col-span-4">
                  <Controller
                    name={`operations.${index}.profile_data.${f.name}`}
                    control={control}
                    render={({ field }) => (
                      <Field label={`${f.label} ${f.required ? '*' : ''}`}>
                        {f.type === 'select' ? (
                          <FormControl fullWidth size="small" error={!!getProfileError(f.name)}>
                            <Select
                              {...field}
                              value={field.value || ''}
                              displayEmpty
                              sx={{ ...inputSx, bgcolor: 'white' }}
                            >
                              <MenuItem value="" disabled>
                                اختر {f.label}
                              </MenuItem>
                              {f.options.map((opt) => (
                                <MenuItem key={opt} value={opt}>
                                  {opt}
                                </MenuItem>
                              ))}
                            </Select>
                            {getProfileError(f.name) && (
                              <p className="text-[#ba1a1a] text-xs mt-1 ml-3 font-semibold">
                                {getProfileError(f.name)?.message}
                              </p>
                            )}
                          </FormControl>
                        ) : (
                          <TextField
                            {...field}
                            value={field.value || ''}
                            type={f.type}
                            fullWidth
                            size="small"
                            placeholder={`أدخل ${f.label}`}
                            InputProps={
                              f.unit
                                ? {
                                  endAdornment: (
                                    <span className="text-xs text-gray-500 ml-2">{f.unit}</span>
                                  ),
                                }
                                : {}
                            }
                            error={!!getProfileError(f.name)}
                            helperText={getProfileError(f.name)?.message}
                            sx={{ ...inputSx, bgcolor: 'white' }}
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Execution (The "Who & How") */}
        <div>
          <p className="text-sm font-bold text-[#0f5238] uppercase tracking-wider mb-5 border-b border-[#e1e3df] pb-2">
            التنفيذ والعمالة
          </p>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.contractor`}
                control={control}
                render={({ field }) => (
                  <Field label="المقاول (اختياري)">
                    <AC
                      options={contractors}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر المقاول"
                      error={!!getError('contractor')}
                      helperText={getError('contractor')?.message}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.company_workers`}
                control={control}
                render={({ field }) => (
                  <Field label="عمال الشركة">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('company_workers')}
                    />
                  </Field>
                )}
              />
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <Controller
                name={`operations.${index}.contractor_workers`}
                control={control}
                render={({ field }) => (
                  <Field label="عمال المقاول">
                    <Stepper
                      value={field.value}
                      onChange={field.onChange}
                      error={!!getError('contractor_workers')}
                    />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Metrics (The "Results") */}
        <div>
          <p className="text-sm font-bold text-[#0f5238] uppercase tracking-wider mb-5 border-b border-[#e1e3df] pb-2">
            المقاييس والإنتاجية
          </p>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6 lg:col-span-2">
              <Controller
                name={`operations.${index}.unit`}
                control={control}
                render={({ field }) => (
                  <Field label="وحدة القياس">
                    <AC
                      options={units}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="اختر الوحدة"
                      error={!!getError('unit')}
                      helperText={getError('unit')?.message}
                    />
                  </Field>
                )}
              />
            </div>
            {[
              { name: 'work_hours', label: 'ساعات العمل', placeholder: '8', step: '0.5' },
              { name: 'overtime_hours', label: 'ساعات إضافية', placeholder: '0', step: '0.5' },
              {
                name: 'actual_productivity',
                label: 'الإنتاجية الفعلية',
                placeholder: '0.00',
                step: '0.01',
              },
              {
                name: 'overtime_productivity',
                label: 'إنتاجية إضافية',
                placeholder: '0.00',
                step: '0.01',
              },
            ].map(({ name, label, placeholder, step }) => (
              <div key={name} className="col-span-6 md:col-span-3 lg:col-span-2">
                <Controller
                  name={`operations.${index}.${name}`}
                  control={control}
                  render={({ field }) => (
                    <Field label={label}>
                      <TextField
                        {...field}
                        type="number"
                        inputProps={{ min: 0, step }}
                        placeholder={placeholder}
                        fullWidth
                        size="small"
                        error={!!getError(name)}
                        helperText={getError(name)?.message}
                        sx={inputSx}
                      />
                    </Field>
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
