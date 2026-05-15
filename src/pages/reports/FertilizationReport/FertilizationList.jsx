import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { reportsApi } from '../../../services/reportsApi';

import ReportFilters from '../shared/ReportFilters';

const FertilizationList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', sector: '', engineer_name: ''
  });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await reportsApi.getFertilizations(params);
      setReports(res.data.results || res.data);
    } catch (err) {
      setError('فشل في جلب تقارير التسميد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h5" fontWeight="800">🧪 تقارير التسميد</Typography>
        <Button component={Link} to="new" variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 700, mt: 2, mb: 2 }}>
          تقرير جديد
        </Button>
      </Box>

      <ReportFilters filters={filters} onFilterChange={setFilters} />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : reports.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc', boxShadow: 'none', border: '1px dashed #cbd5e1' }}>
          <Typography color="text.secondary" fontWeight="600">لا توجد تقارير تسميد.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>الصنف</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>المادة الفعالة</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>الكمية الإجمالية</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>القائم بالعمل</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.report_date}</TableCell>
                  <TableCell>{report.variety}</TableCell>
                  <TableCell>{report.material_name} ({report.active_percentage}%)</TableCell>
                  <TableCell>{report.total_quantity}</TableCell>
                  <TableCell>{report.operator}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FertilizationList;
