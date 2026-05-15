import React from 'react'
import { Plus, Minus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label as ShadcnLabel } from '@/components/ui/label'

// ── Sub-components ────────────────────────────────────────────────────────────

export const Label = ({ children, className }) => (
  <ShadcnLabel className={`block mb-2 font-semibold text-xs text-slate-700 ${className || ''}`}>
    {children}
  </ShadcnLabel>
)

export const Field = ({ label, children }) => (
  <div className="flex flex-col w-full">
    <Label>{label}</Label>
    {children}
  </div>
)

export const Stepper = ({ value, onChange, error }) => {
  const borderClass = error ? 'border-red-500 focus-within:ring-red-500' : 'border-slate-200 focus-within:ring-emerald-500 focus-within:border-emerald-500'
  
  return (
    <div className={`flex items-stretch h-10 border ${borderClass} rounded-md bg-white overflow-hidden transition-colors focus-within:ring-1`}>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 border-none border-l border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          onChange(isNaN(v) ? 0 : Math.max(0, v))
        }}
        className="flex-1 w-full border-none outline-none bg-transparent text-center font-semibold text-sm text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 border-none border-r border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  )
}

export const AC = ({
  options,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled,
  getLabel,
}) => {
  // Safe synchronization: if value is set but not in options, purge it.
  React.useEffect(() => {
    if (value != null && options && options.length > 0) {
      const exists = options.some((o) => o.id === value)
      if (!exists) {
        onChange(null)
      }
    }
  }, [value, options, onChange])

  // Defensive guard: Ensure we only pass integer IDs or null to onChange
  const handleChange = (val) => {
    if (!val || val === "null") {
      onChange(null)
    } else {
      const parsedId = parseInt(val, 10)
      onChange(isNaN(parsedId) ? null : parsedId)
    }
  }

  const borderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'

  return (
    <div className="flex flex-col w-full">
      <Select
        disabled={disabled}
        value={value ? value.toString() : ""}
        onValueChange={handleChange}
        dir="rtl"
      >
        <SelectTrigger className={`h-10 ${borderClass} bg-white text-right`}>
          <SelectValue placeholder={placeholder || "اختر..."} />
        </SelectTrigger>
        <SelectContent dir="rtl" className="max-h-[300px]">
          {options?.map((o) => (
            <SelectItem key={o.id} value={o.id.toString()}>
              {getLabel ? getLabel(o) : o.name || ''}
            </SelectItem>
          ))}
          {(!options || options.length === 0) && (
            <div className="p-2 text-sm text-slate-500 text-center">لا توجد خيارات</div>
          )}
        </SelectContent>
      </Select>
      {helperText && (
        <span className="text-[11px] font-medium text-red-500 mt-1.5 ml-1">
          {helperText}
        </span>
      )}
    </div>
  )
}
