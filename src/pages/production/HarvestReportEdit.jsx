import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Box, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'

import HarvestForm from '../../features/production/components/HarvestForm'
import { getHarvestReport, updateHarvestReport, getSeasons, getEngineers } from '../../features/production/services'
import { getContractors, getUnits, getVarieties } from '../../features/reports/services'

const HarvestReportEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)
  const [masterData, setMasterData] = useState({
    seasons: [],
    varieties: [],
    units: [],
    contractors: [],
    engineers: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [reportData, s, v, u, c, engs] = await Promise.all([
          getHarvestReport(id),
          getSeasons(),
          getVarieties(),
          getUnits(),
          getContractors(),
          getEngineers(),
        ])
        
        setReport(reportData)
        setMasterData({
          seasons: s.results || s,
          varieties: v.results || v,
          units: u.results || u,
          contractors: c.results || c,
          engineers: engs.results || engs,
        })
      } catch (err) {
        setError(t('production.error_fetch_edit', 'خطأ في تحميل بيانات التقرير للتعديل'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, t])

  const handleSubmit = async (data, attachments) => {
    setSubmitLoading(true)
    try {
      // Use FormData to support file uploads in PATCH
      const formData = new FormData()
      
      // Append regular fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key])
        }
      })
      
      // Append attachments
      if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file)
        })
      }

      await updateHarvestReport(id, formData)
      navigate('/production')
    } catch (err) {
      setError(t('common.error_save', 'فشل في حفظ التعديلات'))
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#0f5238' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ bg: '#f4f7f4', minHeight: '100vh' }}>
      {error && (
        <Box sx={{ p: 2, maxWidth: '1200px', mx: 'auto' }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        </Box>
      )}
      {report && (
        <HarvestForm
          initialData={report}
          seasons={masterData.seasons}
          varieties={masterData.varieties}
          units={masterData.units}
          contractors={masterData.contractors}
          engineers={masterData.engineers}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/production')}
          loading={submitLoading}
        />
      )}
    </Box>
  )
}

export default HarvestReportEdit
