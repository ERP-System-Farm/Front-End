import React, { useEffect, useState } from 'react'

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'

import enclosureProfileApi from '../../../../services/enclosureProfileApi'

const QuickNoteModal = ({ open, onClose, enclosureId, currentNotes, onSaveSuccess }) => {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setNotes(currentNotes || '')
  }, [currentNotes, open])

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      await enclosureProfileApi.updateProfile(enclosureId, { general_notes: notes })
      onSaveSuccess()
      onClose()
    } catch (err) {
      setError('حدث خطأ أثناء حفظ الملاحظة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#1e293b' }}>ملاحظة عامة للحوشة</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          label="الملاحظات"
          type="text"
          fullWidth
          multiline
          rows={5}
          variant="outlined"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="سجل ملاحظة عامة دائمة لهذه الحوشة..."
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: '6px', fontWeight: 600 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'حفظ الملاحظة'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickNoteModal
