import React, { useCallback, useEffect, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { reportsApi } from '../../../services/reportsApi'

import ReportsTable from './ReportsTable'

const AnalyticsDashboard = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Operational Data States
  const [reportsData, setReportsData] = useState([])

  // Filter States
  const [filters, setFilters] = useState({
    operation: '',
    location: '',
    report_date: '',
    search: '', // Added search filter
  })
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    totalCount: 0,
  })

  // Dropdown States
  const [operations, setOperations] = useState([])
  const [locations, setLocations] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [opsRes, locsRes] = await Promise.allSettled([
        reportsApi.getOperations(),
        reportsApi.getFarmHierarchy(),
      ])

      if (opsRes.status === 'fulfilled') {
        const opsData = opsRes.value.data
        setOperations(Array.isArray(opsData) ? opsData : (opsData.results ?? []))
      }
      if (locsRes.status === 'fulfilled') {
        const hier = locsRes.value.data
        const flatLocs = []
        ;(hier.crops || []).forEach((crop) => {
          ;(crop.stages || []).forEach((stage) =>
            (stage.enclosures || []).forEach((e) => flatLocs.push(e))
          )
          ;(crop.regions || []).forEach((r) => flatLocs.push(r))
        })
        setLocations(flatLocs)
      }

      await fetchReports()
      setError(null)
    } catch (err) {
      console.error('Error fetching operational data:', err)
      setError('فشل تحميل بيانات العمليات. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchReports = async (
    page = pagination.page,
    rowsPerPage = pagination.rowsPerPage,
    currentFilters = filters
  ) => {
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...currentFilters,
      }
      const response = await reportsApi.getTasks(params)
      setReportsData(response.data.results || response.data)
      setPagination((prev) => ({
        ...prev,
        page,
        rowsPerPage,
        totalCount:
          response.data.count ||
          (response.data.results ? response.data.results.length : response.data.length),
      }))
    } catch (err) {
      console.error('Error fetching reports:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchReports(0, pagination.rowsPerPage, newFilters)
  }

  const handlePageChange = (event, newPage) => {
    fetchReports(newPage, pagination.rowsPerPage)
  }

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    fetchReports(0, newRowsPerPage)
  }

  if (loading && reportsData.length === 0) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}
      >
        <CircularProgress sx={{ color: '#10b981' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4 }} color="primary.main">
        {t('analytics.operations_center', 'مركز عمليات التقارير')}
      </Typography>

      {/* Reports Table - Now the main focus */}
      <Box sx={{ mb: 3 }}>
        <ReportsTable
          data={reportsData}
          totalCount={pagination.totalCount}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          operations={operations}
          locations={locations}
          t={t}
          onRefresh={fetchReports}
        />
      </Box>
    </Box>
  )
}

export default AnalyticsDashboard
