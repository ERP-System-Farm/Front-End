import React, { useEffect, useMemo, useState } from 'react'
import {
  GridViewOutlined as SectorIcon,
  LayersOutlined as StageIcon,
  TerrainOutlined as EnclosureIcon,
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'

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
  const [tree, setTree] = useState([])

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true)
        // Using ?filtered=1 to get nodes enabled in FarmSettings
        const response = await api.get('farm/location-tree/?filtered=1')
        const treeData = response.data.tree || []
        setTree(treeData)

        // Flatten tree for Autocomplete options
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
    () => options.find((o) => o.id === value) || null,
    [options, value]
  )

  return (
    <FormControl
      fullWidth
      size="small"
      error={!!error}
      disabled={disabled || loading}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#f8faf6',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          '& fieldset': { borderColor: '#bfc9c1' },
          '&:hover fieldset': { borderColor: '#0f5238' },
          '&.Mui-focused fieldset': { borderColor: '#0f5238', borderWidth: '1.5px' },
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
            },
          },
        }}
        endAdornment={loading ? <CircularProgress color="inherit" size={20} sx={{ mr: 2 }} /> : null}
      >
        <MenuItem value="" disabled sx={{ display: 'none' }}>
          اختر {label}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
            sx={{
              paddingInlineStart: `${option.level * 24 + 16}px !important`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            {option.type === 'SECTOR' && <SectorIcon sx={{ fontSize: 18, color: '#16a34a' }} />}
            {option.type === 'STAGE' && <StageIcon sx={{ fontSize: 18, color: '#3b82f6' }} />}
            {option.type === 'ENCLOSURE' && (
              <EnclosureIcon sx={{ fontSize: 18, color: '#f97316' }} />
            )}

            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: option.type === 'SECTOR' ? 700 : 500, color: '#1e293b' }}
              >
                {option.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: 9, fontWeight: 800 }}
              >
                {option.type === 'SECTOR' ? 'قطاع' : option.type === 'STAGE' ? 'مرحلة' : 'حوشة'}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.5 }}>{helperText}</Typography>}
    </FormControl>
  )
}

export default LocationSelect
