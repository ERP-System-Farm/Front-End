import React, { useState, useEffect } from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { Plus, Leaf } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../../../services/api'
import dayjs from 'dayjs'

const EnclosureHarvestList = ({ enclosureId }) => {
  const navigate = useNavigate()
  const [harvests, setHarvests] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // In a real app, this would fetch actual harvest logs for this enclosure
    // api.get(`/production/harvest/?enclosure=${enclosureId}`).then(...)
  }, [enclosureId])

  return (
    <Box>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">سجل إنتاجية المحصول</h3>
          <p className="text-sm text-slate-500">حصر الكميات التي تم حصادها من هذه الحوشة.</p>
        </div>
        <Button onClick={() => navigate('/production/harvest/new')} variant="outline" className="rounded-xl gap-2 font-bold bg-white">
          <Plus className="w-4 h-4" /> تسجيل حصاد جديد
        </Button>
      </div>

      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        <Leaf className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
          لم يتم تسجيل أي إنتاجية (حصاد) بعد لهذه الحوشة
        </Typography>
      </Paper>
    </Box>
  )
}

export default EnclosureHarvestList
