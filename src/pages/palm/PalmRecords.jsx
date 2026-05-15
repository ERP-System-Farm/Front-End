import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, MenuItem, Grid, Card } from '@mui/material';
import { getPalmRecords, createPalmRecord } from '../../features/palm/services';
import { getFarmStructure } from '../../features/farm/services';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import ParkOutlinedIcon from '@mui/icons-material/ParkOutlined';

const PalmRecords = () => {
  const { t } = useTranslation();
  const [records, setRecords]   = useState([]);
  const [structure, setStructure] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [openModal, setOpenModal]   = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]   = useState('');

  const [formData, setFormData] = useState({
    plot: '', trees_count: '', palm_type: '', trees_age: '',
    last_year_production: '', expected_production: '',
    offshoots_count: '', sold_offshoots: ''
  });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [recs, struct] = await Promise.all([getPalmRecords(), getFarmStructure()]);
      setRecords(recs); setStructure(struct);
    } catch { setError(t('palm.error_fetch')); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setFormLoading(true); setFormError('');
    try {
      await createPalmRecord(formData);
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
              <ParkOutlinedIcon fontSize="large" />
            </div>
            {t('palm.title', 'سجل النخيل')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{t('palm.subtitle', 'إدارة ومتابعة سجلات أشجار النخيل')}</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpenModal(true)} 
          sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)' }}
        >
          {t('palm.add_record', 'إضافة سجل')}
        </Button>
      </div>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      {loading ? <div className="flex justify-center p-12"><CircularProgress sx={{ color: '#16a34a' }} /></div> : (
        <Card sx={{ p: 0, bgcolor: 'white', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <TableContainer elevation={0}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_plot', 'الحقل')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_type', 'الصنف')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_trees', 'العدد')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_age', 'العمر')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_exp_yield', 'المتوقع')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_act_yield', 'الفعلي')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('palm.col_offshoots', 'الفسائل')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                      <ParkOutlinedIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                      <p className="text-slate-400 font-semibold">{t('palm.no_records', 'لا توجد سجلات نخيل حتى الآن')}</p>
                    </TableCell>
                  </TableRow>
                ) : records.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <div className="font-bold text-slate-800">{row.plot_name}</div>
                      <div className="text-[0.7rem] font-semibold text-slate-400 mt-0.5">{row.sector_name}</div>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{row.palm_type}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#16a34a' }}>{row.trees_count}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.trees_age || '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.expected_production ? `${row.expected_production} طن` : '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>{row.last_year_production ? `${row.last_year_production} طن` : '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>{row.offshoots_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('palm.modal_title', 'إضافة سجل نخيل جديد')}</DialogTitle>
        <DialogContent className="pt-2 space-y-5">
          {formError && <Alert severity="error" className="mb-4">{formError}</Alert>}
          <TextField select fullWidth label={t('palm.plot_link', 'ربط مع حقل')} value={formData.plot} onChange={(e) => setFormData({...formData, plot: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }}>
            {structure.flatMap(s => s.plots.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontWeight: 600 }}>{p.name} - ({s.name})</MenuItem>))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label={t('palm.total_trees', 'عدد الأشجار')} type="number" value={formData.trees_count} onChange={(e) => setFormData({...formData, trees_count: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={t('palm.palm_variety', 'صنف النخيل')} value={formData.palm_type} onChange={(e) => setFormData({...formData, palm_type: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={4}><TextField fullWidth label={t('palm.age_years', 'العمر (سنوات)')} type="number" value={formData.trees_age} onChange={(e) => setFormData({...formData, trees_age: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={t('palm.exp_yield', 'الإنتاج المتوقع')} type="number" value={formData.expected_production} onChange={(e) => setFormData({...formData, expected_production: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={4}><TextField fullWidth label={t('palm.prev_yield', 'الإنتاج الفعلي')} type="number" value={formData.last_year_production} onChange={(e) => setFormData({...formData, last_year_production: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth label={t('palm.offshoots_total', 'إجمالي الفسائل')} type="number" value={formData.offshoots_count} onChange={(e) => setFormData({...formData, offshoots_count: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label={t('palm.sold_offshoots', 'الفسائل المباعة')} type="number" value={formData.sold_offshoots} onChange={(e) => setFormData({...formData, sold_offshoots: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>{t('palm.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreate} variant="contained" disabled={formLoading || !formData.plot || !formData.trees_count} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
            {formLoading ? <CircularProgress size={20} /> : t('palm.save', 'حفظ السجل')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default PalmRecords;
