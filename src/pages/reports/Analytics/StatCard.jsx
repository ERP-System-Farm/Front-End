import React from 'react'

import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material'

const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: '100%',
        p: 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="800" sx={{ color: color || 'text.primary' }}>
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              bgcolor: color ? `${color}15` : 'grey.100',
              color: color || 'grey.700',
              display: 'flex',
            }}
          >
            {Icon && <Icon fontSize="large" />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StatCard
