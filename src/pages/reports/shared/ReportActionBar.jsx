import React, { useState } from 'react'

import { Cancel, CheckCircle, Send, Visibility } from '@mui/icons-material'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'

const ReportActionBar = ({ availableActions, onAction, disabled }) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleAction = (action) => {
    if (action === 'reject') {
      setRejectDialogOpen(true)
      return
    }
    onAction(action)
  }

  const submitReject = () => {
    if (!rejectReason.trim()) return
    onAction('reject', rejectReason)
    setRejectDialogOpen(false)
    setRejectReason('')
  }

  if (!availableActions || availableActions.length === 0) return null

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {availableActions.includes('submit') && (
          <Button
            disabled={disabled}
            variant="contained"
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
            onClick={() => handleAction('submit')}
            startIcon={<Send />}
          >
            تقديم التقرير
          </Button>
        )}
        {availableActions.includes('review') && (
          <Button
            disabled={disabled}
            variant="outlined"
            color="warning"
            onClick={() => handleAction('review')}
            startIcon={<Visibility />}
          >
            بدء المراجعة
          </Button>
        )}
        {availableActions.includes('approve') && (
          <Button
            disabled={disabled}
            variant="contained"
            color="success"
            onClick={() => handleAction('approve')}
            startIcon={<CheckCircle />}
          >
            اعتماد التقرير
          </Button>
        )}
        {availableActions.includes('reject') && (
          <Button
            disabled={disabled}
            variant="outlined"
            color="error"
            onClick={() => handleAction('reject')}
            startIcon={<Cancel />}
          >
            رفض التقرير
          </Button>
        )}
      </Box>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#dc2626' }}>سبب رفض التقرير</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="يرجى كتابة سبب الرفض بوضوح ليتمكن المهندس من التعديل"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setRejectDialogOpen(false)}
            sx={{ fontWeight: 700 }}
            color="inherit"
          >
            إلغاء
          </Button>
          <Button
            onClick={submitReject}
            color="error"
            variant="contained"
            sx={{ fontWeight: 700 }}
            disabled={!rejectReason.trim()}
          >
            تأكيد الرفض
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReportActionBar
