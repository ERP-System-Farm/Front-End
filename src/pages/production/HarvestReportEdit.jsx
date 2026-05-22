import React, { useEffect, useState } from 'react'

import { Alert, Box, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate,useParams } from 'react-router-dom'

import HarvestForm from '../../features/production/components/HarvestForm'
import { getEngineers,getHarvestReport, getSeasons, updateHarvestReport } from '../../features/production/services'
import { getContractors, getUnits, getVarieties } from '../../features/reports/services'
import api from '../../services/api'

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
      } catch (_err) {
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
      // Attachments are now pre-uploaded objects with file_url; send clean JSON
      await updateHarvestReport(id, data)

      // Link new attachments (already uploaded) to the report
      if (attachments?.length > 0) {
        const newAttachments = attachments.filter((a) => a.isNew && a.file_url)
        for (const att of newAttachments) {
          try {
            await api.post('production/harvest-attachments/', {
              report: id,
              file_url: att.file_url,
              file_type: att.file_type || 'FILE',
            })
          } catch (attErr) {
            console.error('Failed to link harvest attachment:', att.file_url, attErr)
          }
        }
      }

      navigate('/production')
    } catch (err) {
      let errMsg = t('common.error_save', 'فشل في حفظ التعديلات');
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errMsg = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
            .join(' | ');
        } else {
          errMsg = String(err.response.data);
        }
      }
      setError(errMsg)
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
