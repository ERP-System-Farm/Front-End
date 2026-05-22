import React, { useRef } from 'react'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFieldArray } from 'react-hook-form'

import OperationRow from './OperationRow'

// Feature Flag: Multi-operation submission
const ENABLE_MULTI_OPERATION = true

export default function OperationLogPanel({
  control,
  getValues,
  setValue,
  errors,
  operations,
  varieties,
  units,
  contractors,
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'operations',
  })

  const endOfListRef = useRef(null)

  const handleAdd = () => {
    // Smart Prefill logic
    const currentOps = getValues ? getValues('operations') : []
    const lastOp = currentOps.length > 0 ? currentOps[currentOps.length - 1] : null

    append({
      temp_id: crypto.randomUUID(),
      location: lastOp ? lastOp.location : null,
      operation: null,
      variety: lastOp ? lastOp.variety : null,
      unit: lastOp ? lastOp.unit : null,
      contractor: lastOp ? lastOp.contractor : null,
      contractors: lastOp && lastOp.contractors ? [...lastOp.contractors] : [],
      company_workers: 0,
      contractor_workers: 0,
      actual_productivity: 0,
      work_hours: 8,
      overtime_hours: 0,
      overtime_productivity: 0,
      labor_entries: [],
    })

    // Auto-scroll to the newly appended item
    setTimeout(() => {
      endOfListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <OperationRow
          key={field.id} // Stable key from useFieldArray
          index={index}
          control={control}
          setValue={setValue}
          errors={errors}
          operations={operations}
          varieties={varieties}
          units={units}
          contractors={contractors}
          onRemove={() => remove(index)}
          isRemovable={fields.length > 1 && ENABLE_MULTI_OPERATION}
        />
      ))}

      <div ref={endOfListRef} />

      {ENABLE_MULTI_OPERATION && (
        <div className="flex justify-center mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            className="text-emerald-700 dark:text-emerald-400 border-emerald-700 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-800 dark:hover:text-emerald-300"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة حدث تشغيلي
          </Button>
        </div>
      )}
    </div>
  )
}
