import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Button, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { PieChart as PieChartIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { reportsApi } from '../../../services/reportsApi';
import ReportFilters from '../shared/ReportFilters';

const DailyTaskSummary = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '', end_date: '', sector: '', engineer_name: ''
  });

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const res = await reportsApi.getTasksSummary(params);
      setSummaryData(res.data);
    } catch (err) {
      setError('فشل في جلب ملخص التقارير');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChartIcon color="primary" /> ملخص المهام اليومية
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowForwardIcon />}
          onClick={() => navigate(-1)}
          sx={{ borderRadius: 1, fontWeight: 700 }}
        >
          رجوع
        </Button>
      </Box>

      <ReportFilters filters={filters} onFilterChange={setFilters} />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : summaryData.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc', boxShadow: 'none', border: '1px dashed #cbd5e1' }}>
          <Typography color="text.secondary" fontWeight="600">لا توجد بيانات ملخصة.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>القطاع</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>إجمالي المهام</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>إجمالي الإنتاجية الفعلية</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>إجمالي العمالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell fontWeight="600">{row.sector || 'غير محدد'}</TableCell>
                  <TableCell>{row.total_tasks}</TableCell>
                  <TableCell>{row.total_productivity}</TableCell>
                  <TableCell>{row.total_workers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default DailyTaskSummary;
