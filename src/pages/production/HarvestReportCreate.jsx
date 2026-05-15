import React, { useEffect, useState } from 'react'

import { Alert, Box, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import HarvestForm from '../../features/production/components/HarvestForm'
import { createHarvestReport, getSeasons } from '../../features/production/services'
import { getContractors, getUnits, getVarieties } from '../../features/reports/services'

const HarvestReportCreate = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState(null)
  const [masterData, setMasterData] = useState({
    seasons: [],
    varieties: [],
    units: [],
    contractors: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, v, u, c] = await Promise.all([
          getSeasons(),
          getVarieties(),
          getUnits(),
          getContractors(),
        ])
        setMasterData({
          seasons: s.results || s,
          varieties: v.results || v,
          units: u.results || u,
          contractors: c.results || c,
        })
      } catch (err) {
        setError(t('production.error_fetch', 'خطأ في تحميل البيانات الأساسية'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [t])

  const handleSubmit = async (data) => {
    setSubmitLoading(true)
    try {
      await createHarvestReport(data)
      navigate('/production')
    } catch (err) {
      setError(t('common.error_save', 'فشل في حفظ التقرير'))
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bg: '#f4f7f4',
        }}
      >
        <CircularProgress sx={{ color: '#0f5238' }} />
      </Box>
    )
  }

  return (
    <Box sx={{ bg: '#f4f7f4', minHeight: '100vh' }}>
      {error && (
        <Box sx={{ p: 2, maxWidth: '1200px', mx: 'auto' }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Box>
      )}
      <HarvestForm
        seasons={masterData.seasons}
        varieties={masterData.varieties}
        units={masterData.units}
        contractors={masterData.contractors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/production')}
        loading={submitLoading}
      />
    </Box>
  )
}

export default HarvestReportCreate
