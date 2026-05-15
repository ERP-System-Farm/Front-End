import React from 'react';
import { TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Button, Box } from '@mui/material';
import { Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTranslation } from 'react-i18next';

/**
 * Reusable table toolbar with search and filter controls.
 * 
 * Props:
 *  - searchValue: string — current search text
 *  - onSearchChange: (value) => void
 *  - filters: [{ key, label, value, options: [{value, label}] }]
 *  - onFilterChange: (key, value) => void
 *  - onClear: () => void
 */
const TableToolbar = ({ searchValue, onSearchChange, filters = [], onFilterChange, onClear }) => {
  const { t } = useTranslation();

  return (
    <Box className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 mb-6">
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={filters.length > 0 ? 4 : 10}>
          <TextField
            fullWidth
            placeholder={t('common.search', 'بحث...')}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: 'white', borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderRadius: '10px' } }}
          />
        </Grid>

        {filters.map((filter) => (
          <Grid item xs={6} md={3} key={filter.key}>
            <FormControl fullWidth size="small">
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filter.value}
                label={filter.label}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                sx={{ bgcolor: 'white', borderRadius: '10px' }}
              >
                <MenuItem value="ALL">{t('common.all', 'الكل')}</MenuItem>
                {filter.options.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="text"
            startIcon={<FilterListIcon />}
            onClick={onClear}
            sx={{ color: '#64748b', fontWeight: 'bold' }}
          >
            {t('common.clear', 'مسح')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TableToolbar;
