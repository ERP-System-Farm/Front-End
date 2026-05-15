import React, { useEffect, useState } from 'react'

import { Add as AddIcon } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'

import { reportsApi } from '../../../services/reportsApi'
import ReportFilters from '../shared/ReportFilters'

const IrrigationList = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    sector: '',
    engineer_name: '',
  })

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      const res = await reportsApi.getIrrigations(params)
      setReports(res.data.results || res.data)
    } catch (err) {
      setError('فشل في جلب تقارير الري')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReports()
  }, [filters])

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" fontWeight="800">
          💧 تقارير الري
        </Typography>
        <Button
          component={Link}
          to="new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 1, fontWeight: 700, mt: 2, mb: 2 }}
        >
          تقرير جديد
        </Button>
      </Box>

      <ReportFilters filters={filters} onFilterChange={setFilters} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 4,
            bgcolor: '#f8fafc',
            boxShadow: 'none',
            border: '1px dashed #cbd5e1',
          }}
        >
          <Typography color="text.secondary" fontWeight="600">
            لا توجد تقارير ري.
          </Typography>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}
        >
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>القطاع</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ساعات الري</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>المساحة (فدان)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>تصرف البئر</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.report_date}</TableCell>
                  <TableCell>
                    القطاع {report.sector_number} - تحويلة {report.transfer_number}
                  </TableCell>
                  <TableCell>{report.irrigation_hours} ساعة</TableCell>
                  <TableCell>{report.area_feddan}</TableCell>
                  <TableCell>{report.well_flow_m3} م³/ساعة</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default IrrigationList
