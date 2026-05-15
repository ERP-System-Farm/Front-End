import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, MenuItem, Grid, Card } from '@mui/material';
import { getOliveRecords, createOliveRecord } from '../../features/olive/services';
import { getFarmStructure } from '../../features/farm/services';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import GrassOutlinedIcon from '@mui/icons-material/GrassOutlined';

const OliveRecords = () => {
  const { t } = useTranslation();
  const [records, setRecords]     = useState([]);
  const [structure, setStructure] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [openModal, setOpenModal]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');

  const [formData, setFormData] = useState({
    plot: '', trees_count: '', olive_type: '', trees_age: '',
    last_year_production: '', expected_production: ''
  });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [recs, struct] = await Promise.all([getOliveRecords(), getFarmStructure()]);
      setRecords(recs); setStructure(struct);
    } catch { setError(t('olive.error_fetch')); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setFormLoading(true); setFormError('');
    try {
      await createOliveRecord(formData);
      setOpenModal(false); fetchInitialData();
    } catch (err) {
      setFormError(err.response?.data ? Object.values(err.response.data).flat().join(', ') : t('common.error'));
    } finally { setFormLoading(false); }
  };

  return (
    <div className="p-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl text-green-600 flex items-center">
              <GrassOutlinedIcon fontSize="large" />
            </div>
            {t('olive.title', 'سجل الزيتون')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{t('olive.subtitle', 'إدارة ومتابعة سجلات أشجار الزيتون')}</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpenModal(true)} 
          sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, bgcolor: '#4d7c0f', '&:hover': { bgcolor: '#3f6212' }, boxShadow: '0 4px 14px 0 rgba(77, 124, 15, 0.39)' }}
        >
          {t('olive.add_record', 'إضافة سجل')}
        </Button>
      </div>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      {loading ? <div className="flex justify-center p-12"><CircularProgress sx={{ color: '#4d7c0f' }} /></div> : (
        <Card sx={{ p: 0, bgcolor: 'white', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <TableContainer elevation={0}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_plot', 'الحقل')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_type', 'الصنف')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_trees', 'العدد')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_age', 'العمر')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_exp_yield', 'المتوقع')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('olive.col_act_yield', 'الفعلي')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                      <GrassOutlinedIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                      <p className="text-slate-400 font-semibold">{t('olive.no_records', 'لا توجد سجلات زيتون حتى الآن')}</p>
                    </TableCell>
                  </TableRow>
                ) : records.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <div className="font-bold text-slate-800">{row.plot_name}</div>
                      <div className="text-[0.7rem] font-semibold text-slate-400 mt-0.5">{row.sector_name}</div>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{row.olive_type}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#4d7c0f' }}>{row.trees_count}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.trees_age || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.expected_production ? `${row.expected_production} طن` : '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.last_year_production ? `${row.last_year_production} طن` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('olive.modal_title', 'إضافة سجل زيتون جديد')}</DialogTitle>
        <DialogContent className="pt-2 space-y-5">
          {formError && <Alert severity="error" className="mb-4">{formError}</Alert>}
          <TextField select fullWidth label={t('olive.plot_link', 'ربط مع حقل')} value={formData.plot} onChange={(e) => setFormData({...formData, plot: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }}>
            {structure.flatMap(s => s.plots.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontWeight: 600 }}>{p.name} - ({s.name})</MenuItem>))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label={t('olive.total_trees', 'عدد الأشجار')} type="number" value={formData.trees_count} onChange={(e) => setFormData({...formData, trees_count: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={t('olive.olive_variety', 'صنف الزيتون')} value={formData.olive_type} onChange={(e) => setFormData({...formData, olive_type: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField fullWidth label={t('olive.age_years', 'العمر (سنوات)')} type="number" value={formData.trees_age} onChange={(e) => setFormData({...formData, trees_age: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={t('olive.exp_yield', 'الإنتاج المتوقع')} type="number" value={formData.expected_production} onChange={(e) => setFormData({...formData, expected_production: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={t('olive.prev_yield', 'الإنتاج الفعلي')} type="number" value={formData.last_year_production} onChange={(e) => setFormData({...formData, last_year_production: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>{t('olive.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreate} variant="contained" disabled={formLoading || !formData.plot || !formData.trees_count} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#4d7c0f', '&:hover': { bgcolor: '#3f6212' } }}>
            {formLoading ? <CircularProgress size={20} /> : t('olive.save', 'حفظ السجل')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default OliveRecords;
