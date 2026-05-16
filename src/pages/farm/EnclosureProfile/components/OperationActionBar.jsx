import React from 'react'

import {
  Button,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

const OperationActionBar = ({ enclosureId, onClickAttachments }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const handleNavigate = (type) => {
    navigate(`/reports/tasks/new?enclosure=${enclosureId}&type=${type}`)
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="center"
        width={isMobile ? '100%' : 'auto'}
      >
        <Button
          variant="outlined"
          disableElevation
          onClick={onClickAttachments}
          sx={{
            borderRadius: '6px',
            fontWeight: 700,
            borderColor: '#cbd5e1',
            color: '#475569',
            '&:hover': { bgcolor: '#f1f5f9' },
            px: 2,
            py: isMobile ? 1.2 : 0.8,
          }}
        >
          المرفقات
        </Button>
        <Button
          variant="contained"
          disableElevation
          fullWidth={isMobile}
          onClick={() => handleNavigate('other')}
          sx={{
            borderRadius: '6px',
            fontWeight: 700,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' },
            px: 4,
            py: isMobile ? 1.2 : 0.8,
          }}
        >
          تقرير جديد
        </Button>
      </Stack>
    </Paper>
  )
}

export default OperationActionBar
