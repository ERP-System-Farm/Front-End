import React from 'react'

import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'

import DynamicTimelineCard from './DynamicTimelineCard'

/**
 * Timeline Widget
 * Displays the feed of OperationLog events.
 */
const TimelineWidget = ({ events, loading, hasMore, onLoadMore, error }) => {
  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  // Operational Grouping Logic:
  // Collapse consecutive events sharing the same bulk_operation_id into a single visual block.
  const groupedEvents = []
  let currentGroup = null

  events.forEach((event, index) => {
    if (event.bulk_operation_id) {
      if (currentGroup && currentGroup.bulk_id === event.bulk_operation_id) {
        currentGroup.items.push(event)
      } else {
        currentGroup = {
          id: `group-${event.bulk_operation_id}-${index}`,
          type: 'bulk',
          bulk_id: event.bulk_operation_id,
          scope: event.operation_scope,
          items: [event],
          mainEvent: event, // Use the first one as primary
        }
        groupedEvents.push(currentGroup)
      }
    } else {
      currentGroup = null
      groupedEvents.push({
        id: event.id,
        type: 'single',
        items: [event],
      })
    }
  })

  return (
    <Box>
      {events.length === 0 && !loading && (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 4,
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography color="textSecondary" variant="body1" sx={{ fontWeight: 500 }}>
            لا يوجد سجلات عمليات لهذا الموقع حتى الآن.
          </Typography>
          <Typography color="textSecondary" variant="caption">
            العمليات المضافة حديثاً ستظهر هنا تلقائياً.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {groupedEvents.map((group) => {
          if (group.type === 'bulk') {
            return (
              <Box key={group.id} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    px: 2,
                    py: 0.5,
                    bgcolor: 'primary.50',
                    borderRadius: 1,
                    width: 'fit-content',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>
                    عملية جماعية (نطاق: {group.scope === 'STAGE' ? 'مرحلة' : 'قطاع'})
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.dark', opacity: 0.7 }}>
                    • تشمل {group.items.length} حوشات
                  </Typography>
                </Box>
                <DynamicTimelineCard
                  event={group.mainEvent}
                  isBulkGroup
                  itemsCount={group.items.length}
                />
              </Box>
            )
          }
          return <DynamicTimelineCard key={group.id} event={group.items[0]} />
        })}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={30} thickness={4} />
        </Box>
      )}

      {hasMore && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={onLoadMore} sx={{ borderRadius: 2, px: 4 }}>
            تحميل المزيد من العمليات
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default TimelineWidget
