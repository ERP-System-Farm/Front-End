import React from 'react';
import { TextField, MenuItem, Button, Paper, Typography, Box } from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

const ReportFilters = ({ filters, onFilterChange, options = {} }) => {
  const operations = options.operations || [];
  const engineers = options.engineers || [];
  const locations = options.locations || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleClear = () => {
    onFilterChange({
      start_date: '',
      end_date: '',
      operation: '',
      engineer: '',
      location: '',
    });
  };

  const fieldSx = {
    flex: '1 1 160px',
    minWidth: 0,
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 1 },
    width: '100%',
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>فلاتر التقارير</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>

        {/* تاريخ البدء */}
        <Box sx={fieldSx}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>تاريخ البدء</Typography>
          <TextField
            fullWidth
            type="date"
            name="start_date"
            value={filters.start_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={inputSx}
          />
        </Box>

        {/* تاريخ الانتهاء */}
        <Box sx={fieldSx}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>تاريخ الانتهاء</Typography>
          <TextField
            fullWidth
            type="date"
            name="end_date"
            value={filters.end_date || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={inputSx}
          />
        </Box>

        {/* العملية */}
        <Box sx={fieldSx}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>العملية</Typography>
          <TextField
            select
            fullWidth
            name="operation"
            value={filters.operation || ''}
            onChange={handleChange}
            size="small"
            displayEmpty
            sx={inputSx}
          >
            <MenuItem value="">الكل</MenuItem>
            {operations.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* المهندس */}
        <Box sx={fieldSx}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>المهندس</Typography>
          <TextField
            select
            fullWidth
            name="engineer"
            value={filters.engineer || ''}
            onChange={handleChange}
            size="small"
            displayEmpty
            sx={inputSx}
          >
            <MenuItem value="">الكل</MenuItem>
            {engineers.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name || option.full_name || option.email}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* الموقع */}
        <Box sx={fieldSx}>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>الموقع</Typography>
          <TextField
            select
            fullWidth
            name="location"
            value={filters.location || ''}
            onChange={handleChange}
            size="small"
            displayEmpty
            sx={inputSx}
          >
            <MenuItem value="">الكل</MenuItem>
            {locations.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* زر المسح */}
        <Box sx={{ flex: '1 1 140px', minWidth: 0, display: 'flex', alignItems: 'flex-end' }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            onClick={handleClear}
            startIcon={<ClearIcon />}
            sx={{ fontWeight: 600, borderRadius: 1, height: 40 }}
          >
            مسح الفلاتر
          </Button>
        </Box>

      </Box>
    </Paper>
  );
};

export default ReportFilters;
