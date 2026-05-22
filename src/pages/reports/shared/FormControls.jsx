import React from 'react'
import { Plus, Minus, Check, X, ChevronDown } from 'lucide-react'
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

export const Field = ({ label, children, required }) => (
  <div className="flex flex-col w-full">
    <Label>
      {label}
      {required && <span className="text-red-500 mr-0.5">*</span>}
    </Label>
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
      onChange(val)
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

export const MultiAC = ({
  options = [],
  value = [], // array of selected IDs
  onChange,
  placeholder,
  error,
  helperText,
  disabled,
  getLabel,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedIds = React.useMemo(() => {
    return Array.isArray(value) ? value.map(v => v != null ? v.toString() : '') : []
  }, [value])

  const handleToggleOption = (id) => {
    const stringId = id.toString()
    let newValue
    if (selectedIds.includes(stringId)) {
      newValue = value.filter(v => v != null && v.toString() !== stringId)
    } else {
      const option = options.find(o => o.id.toString() === stringId)
      const originalId = option ? option.id : id
      newValue = [...value, originalId]
    }
    onChange(newValue)
  }

  const handleRemoveValue = (e, id) => {
    e.stopPropagation()
    const stringId = id.toString()
    const newValue = value.filter(v => v != null && v.toString() !== stringId)
    onChange(newValue)
  }

  const filteredOptions = options.filter(o => {
    const label = getLabel ? getLabel(o) : o.name || ''
    return label.toLowerCase().includes(search.toLowerCase())
  })

  const borderClass = error 
    ? 'border-red-500 focus-within:ring-red-500' 
    : 'border-slate-200 focus-within:ring-emerald-500 focus-within:border-emerald-500'

  const selectedOptions = options.filter(o => selectedIds.includes(o.id.toString()))

  return (
    <div className="flex flex-col w-full relative" ref={containerRef} dir="rtl">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[40px] flex items-center justify-between w-full rounded-md border ${borderClass} bg-white px-3 py-1.5 shadow-sm cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                {getLabel ? getLabel(o) : o.name || ''}
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(e, o.id)}
                  className="hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-full p-0.5 text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-slate-400 text-xs font-normal">
              {placeholder || "اختر..."}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 ml-1 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-50 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 shadow-lg text-right animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-8.5 w-full rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-right text-slate-900 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filteredOptions.map((o) => {
              const isSelected = selectedIds.includes(o.id.toString())
              return (
                <div
                  key={o.id}
                  onClick={() => handleToggleOption(o.id)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{getLabel ? getLabel(o) : o.name || ''}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </div>
              )
            })}
            {filteredOptions.length === 0 && (
              <div className="p-3 text-xs text-slate-400 text-center">لا توجد خيارات</div>
            )}
          </div>
        </div>
      )}

      {helperText && (
        <span className="text-[11px] font-medium text-red-500 mt-1.5 ml-1">
          {helperText}
        </span>
      )}
    </div>
  )
}
