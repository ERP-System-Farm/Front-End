import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutGrid as SectorIcon,
  Layers as StageIcon,
  Mountain as EnclosureIcon,
  Loader2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import api from '../services/api'

/**
 * A single smart Location Select component.
 * - Fetches filtered hierarchical tree from backend.
 * - Flattens the tree for a single Autocomplete list with indentation.
 * - Respects FarmSettings (already filtered by backend).
 */
const LocationSelect = ({
  value,
  onChange,
  error,
  helperText,
  disabled,
  label = 'الموقع / الحوشة',
}) => {
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState([])

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true)
        // Using ?filtered=1 to get nodes enabled in FarmSettings
        const response = await api.get('farm/location-tree/?filtered=1')
        const treeData = response.data.tree || []

        // Flatten tree for Select options
        const flattened = []
        const flatten = (nodes, level = 0) => {
          nodes.forEach((node) => {
            flattened.push({
              ...node,
              level,
            })
            if (node.children && node.children.length > 0) {
              flatten(node.children, level + 1)
            }
          })
        }
        flatten(treeData)
        // Add "OTHER" option at the end
        flattened.push({
          id: 'OTHER',
          name: 'أخرى (خارج الهيكل)',
          type: 'SECTOR', // using SECTOR just for styling icon
          level: 0
        })
        setOptions(flattened)
      } catch (err) {
        console.error('Failed to fetch location tree:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTree()
  }, [])

  const selectedOption = useMemo(
    () => options.find((o) => o.id.toString() === (value || '').toString()) || null,
    [options, value]
  )

  const borderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'

  const handleChange = (val) => {
    if (!val || val === "null") {
      onChange(null)
    } else {
      onChange(val)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <Select
        disabled={disabled || loading}
        value={value ? value.toString() : ''}
        onValueChange={handleChange}
        dir="rtl"
      >
        <SelectTrigger className={`h-10 ${borderClass} bg-white text-right relative overflow-hidden`}>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          ) : (
            <SelectValue placeholder={`اختر ${label}...`}>
              {selectedOption ? (
                <div className="flex items-center gap-2 text-slate-800">
                  {selectedOption.type === 'SECTOR' && <SectorIcon className="w-4 h-4 text-slate-400" />}
                  {selectedOption.type === 'STAGE' && <StageIcon className="w-4 h-4 text-slate-400" />}
                  {selectedOption.type === 'ENCLOSURE' && <EnclosureIcon className="w-4 h-4 text-slate-400" />}
                  <span className="truncate">{selectedOption.name}</span>
                </div>
              ) : null}
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent dir="rtl" className="max-h-[350px]">
          {options.map((option) => (
            <SelectItem 
              key={option.id} 
              value={option.id.toString()}
              className="py-2.5 transition-colors"
              style={{
                paddingRight: `${option.level * 1.5 + 0.5}rem`,
              }}
            >
              <div className="flex items-center gap-2">
                {option.type === 'SECTOR' && <SectorIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                {option.type === 'STAGE' && <StageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                {option.type === 'ENCLOSURE' && <EnclosureIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                <span 
                  className={`
                    truncate 
                    ${option.type === 'SECTOR' ? 'font-bold text-slate-800' : ''}
                    ${option.type === 'STAGE' ? 'font-semibold text-emerald-800' : ''}
                    ${option.type === 'ENCLOSURE' ? 'font-medium text-amber-800' : ''}
                  `}
                >
                  {option.name}
                </span>
              </div>
            </SelectItem>
          ))}
          {options.length === 0 && !loading && (
            <div className="p-3 text-sm text-center text-slate-500">لا توجد مواقع متاحة</div>
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

export default LocationSelect
