import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutGrid as SectorIcon,
  Layers as StageIcon,
  Mountain as EnclosureIcon,
  Loader2,
  Search,
  X,
  Check,
  ChevronDown
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import api from '../services/api'

/**
 * A hierarchical location multi-select picker.
 * - Fetches location tree from farm/location-tree/?filtered=1.
 * - Supports searching with Arabic normalization.
 * - Allows selecting Sectors, Stages, and Enclosures.
 * - Displays selected locations as tags.
 * - Calls onChange(selectedNodeIds, resolvedEnclosureIds) on changes.
 */
export default function LocationMultiSelect({
  value = [], // Array of selected node IDs
  onChange,
  disabled,
  error,
  helperText,
}) {
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState([])
  const [options, setOptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // 1. Fetch Location Tree
  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true)
        const response = await api.get('farm/location-tree/?filtered=1')
        const tree = response.data.tree || []
        setTreeData(tree)

        // Preprocess tree into flat list with hierarchy paths and resolved descendant enclosures
        const flatOptions = []
        const traverse = (node, parentPath = [], level = 0) => {
          const currentPath = [...parentPath, node.name]

          // Helper to recursively collect all descendant enclosures under this node
          const getDescendantEnclosures = (n) => {
            if (n.type === 'ENCLOSURE') {
              return [n.id]
            }
            let res = []
            if (n.children && n.children.length > 0) {
              n.children.forEach(child => {
                res = [...res, ...getDescendantEnclosures(child)]
              })
            }
            return res
          }

          const enclosures = getDescendantEnclosures(node)

          flatOptions.push({
            id: node.id,
            name: node.name,
            type: node.type,
            level,
            path: currentPath,
            pathLabel: currentPath.join(' ➔ '),
            descendantEnclosures: enclosures,
          })

          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              traverse(child, currentPath, level + 1)
            })
          }
        }

        tree.forEach(rootNode => traverse(rootNode))
        setOptions(flatOptions)
      } catch (err) {
        console.error('Failed to fetch location tree for multi-select:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTree()
  }, [])

  // Arabic Normalization for robust search
  const normalizeArabic = (str) => {
    if (!str) return ''
    return str
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase()
  }

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    const normalizedQuery = normalizeArabic(searchTerm)
    return options.filter(opt =>
      normalizeArabic(opt.pathLabel).includes(normalizedQuery)
    )
  }, [options, searchTerm])

  // Get selected details for tags
  const selectedTags = useMemo(() => {
    return options.filter(opt => value.includes(opt.id))
  }, [options, value])

  // Compute total unique resolved enclosures
  const resolvedEnclosures = useMemo(() => {
    const enclosureIds = new Set()
    options.forEach(opt => {
      if (value.includes(opt.id)) {
        opt.descendantEnclosures.forEach(id => enclosureIds.add(id))
      }
    })
    return Array.from(enclosureIds)
  }, [options, value])

  // Toggle selection
  const handleToggle = (id) => {
    let newValue
    if (value.includes(id)) {
      newValue = value.filter(v => v !== id)
    } else {
      newValue = [...value, id]
    }
    
    // Compute resolved enclosures for the new selection
    const newEnclosures = new Set()
    options.forEach(opt => {
      if (newValue.includes(opt.id)) {
        opt.descendantEnclosures.forEach(encId => newEnclosures.add(encId))
      }
    })

    onChange(newValue, Array.from(newEnclosures))
  }

  // Remove single tag
  const handleRemoveTag = (e, id) => {
    e.stopPropagation()
    handleToggle(id)
  }

  const borderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'

  return (
    <div className="space-y-3 text-right w-full" dir="rtl">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className={`w-full min-h-[44px] h-auto flex items-center justify-between border ${borderClass} bg-white hover:bg-slate-50 rounded-xl px-4 py-2 text-right shadow-xs`}
          >
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs sm:text-sm">جاري تحميل الهيكل الجغرافي...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700">
                <SectorIcon className="w-4.5 h-4.5 text-slate-400" />
                <span className="text-xs sm:text-sm font-bold">
                  {value.length > 0 
                    ? `موقع محدد (${value.length})` 
                    : 'اختر المواقع المستهدفة (قطاع، مرحلة، حوشة)...'}
                </span>
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-slate-455 shrink-0 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] sm:w-[480px] p-0 rounded-2xl shadow-xl border border-slate-200 max-h-[400px] flex flex-col bg-white overflow-hidden z-[1500]" align="start" side="bottom" dir="rtl">
          {/* Search Header */}
          <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <Input
              type="text"
              placeholder="البحث بالاسم أو الهيكل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-slate-400 text-xs sm:text-sm text-right pr-0 pl-3 w-full"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Options Tree List */}
          <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-50/50">
            {filteredOptions.map((opt) => {
              const isChecked = value.includes(opt.id)

              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggle(opt.id)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all select-none`}
                  style={{
                    paddingRight: `${opt.level * 1.25 + 0.75}rem`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(opt.id)}
                      className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-1.5">
                      {opt.type === 'SECTOR' && <SectorIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      {opt.type === 'STAGE' && <StageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {opt.type === 'ENCLOSURE' && <EnclosureIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      <span 
                        className={`
                          text-xs sm:text-sm truncate 
                          ${opt.type === 'SECTOR' ? 'font-bold text-slate-800' : ''}
                          ${opt.type === 'STAGE' ? 'font-semibold text-emerald-800' : ''}
                          ${opt.type === 'ENCLOSURE' ? 'font-medium text-amber-800' : ''}
                        `}
                      >
                        {opt.name}
                      </span>
                    </div>
                  </div>
                  {isChecked && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                </div>
              )
            })}

            {filteredOptions.length === 0 && (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-bold">
                لا توجد مواقع تطابق بحثك
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Tags Chips List */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 mt-2">
          {selectedTags.map((opt) => (
            <Badge
              key={opt.id}
              variant="secondary"
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold leading-none"
            >
              {opt.type === 'SECTOR' && <SectorIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {opt.type === 'STAGE' && <StageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
              {opt.type === 'ENCLOSURE' && <EnclosureIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <span>{opt.pathLabel}</span>
              <button
                type="button"
                onClick={(e) => handleRemoveTag(e, opt.id)}
                className="hover:bg-slate-200 p-0.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {helperText && (
        <span className="text-[11px] font-bold text-red-500 mt-1 block">
          {helperText}
        </span>
      )}
    </div>
  )
}
