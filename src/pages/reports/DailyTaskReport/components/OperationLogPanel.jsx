import React, { useRef } from 'react'

import { Add as AddIcon } from '@mui/icons-material'
import { Button } from '@mui/material'
import { useFieldArray } from 'react-hook-form'

import OperationRow from './OperationRow'

// Feature Flag: Multi-operation submission
const ENABLE_MULTI_OPERATION = true

export default function OperationLogPanel({
  control,
  getValues,
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
      company_workers: 0,
      contractor_workers: 0,
      actual_productivity: 0,
      work_hours: 8,
      overtime_hours: 0,
      overtime_productivity: 0,
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
            variant="outlined"
            onClick={handleAdd}
            startIcon={<AddIcon />}
            sx={{
              color: '#0f5238',
              borderColor: '#0f5238',
              borderRadius: '0.75rem',
              '&:hover': {
                borderColor: '#0b3d2a',
                backgroundColor: '#f4f7f4',
              },
            }}
          >
            إضافة حدث تشغيلي
          </Button>
        </div>
      )}
    </div>
  )
}
