import React from 'react'

import { Typography } from '@mui/material'

/**
 * Ensures ERP systems never render raw undefined, null, or NaN values.
 * Returns a standardized fallback UI element.
 */
export const renderValue = (value, unit = '', fallback = 'غير مسجل') => {
  if (value === null || value === undefined || value === '') {
    return (
      <Typography
        component="span"
        variant="caption"
        sx={{ color: 'text.disabled', fontStyle: 'italic' }}
      >
        {fallback}
      </Typography>
    )
  }

  // Handle NaN numbers explicitly
  if (typeof value === 'number' && Number.isNaN(value)) {
    return (
      <Typography
        component="span"
        variant="caption"
        sx={{ color: 'text.disabled', fontStyle: 'italic' }}
      >
        {fallback}
      </Typography>
    )
  }

  return `${value} ${unit}`.trim()
}
