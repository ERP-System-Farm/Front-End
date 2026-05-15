import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, MenuItem, Grid, Card } from '@mui/material';
import { getYields, createYield } from '../../features/production/services';
import { getFarmStructure } from '../../features/farm/services';
import { useTranslation } from 'react-i18next';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';

const YieldTracking = () => {
  const { t } = useTranslation();
  const [yields, setYields]       = useState([]);
  const [structure, setStructure] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [openModal, setOpenModal]     = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');

  const [formData, setFormData] = useState({
    plot: '', year: new Date().getFullYear(), production_amount: ''
  });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [y, struct] = await Promise.all([getYields(), getFarmStructure()]);
      setYields(y); setStructure(struct);
    } catch { setError(t('production.error_fetch')); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setFormLoading(true); setFormError('');
    try { await createYield(formData); setOpenModal(false); fetchInitialData(); }
    catch (err) {
      if (err.response?.data) setFormError(Object.values(err.response.data).flat().join(', '));
      else setFormError(t('common.error'));
    } finally { setFormLoading(false); }
  };

  return (
    <div className="p-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 flex items-center">
              <AutoGraphOutlinedIcon fontSize="large" />
            </div>
            {t('production.title', 'سجل الإنتاج والمحاصيل')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{t('production.subtitle', 'متابعة إنتاجية الحقول والمواسم السابقة')}</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpenModal(true)} 
          sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.39)' }}
        >
          {t('production.add_btn', 'تسجيل إنتاج')}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? <div className="flex justify-center p-12"><CircularProgress sx={{ color: '#0f172a' }} /></div> : (
        <Card sx={{ p: 0, bgcolor: 'white', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <TableContainer elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('production.col_location', 'موقع الإنتاج')}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('production.col_year', 'الموسم')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', py: 2 }}>{t('production.col_production', 'الكمية المنتجة')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 12 }}>
                      <AnalyticsOutlinedIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                      <p className="text-slate-400 font-semibold">{t('production.no_data', 'لا توجد بيانات إنتاج حتى الآن')}</p>
                    </TableCell>
                  </TableRow>
                ) : yields.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <div className="font-bold text-slate-800">{row.plot_name}</div>
                      <div className="text-[0.7rem] font-semibold text-slate-400 mt-0.5">{row.sector_name}</div>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#4338ca' }}>{row.year}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.1rem' }}>{row.production_amount} <span className="text-xs font-semibold text-slate-500">طن</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#0f172a' }}>{t('production.modal_title', 'تسجيل إنتاج محصول جديد')}</DialogTitle>
        <DialogContent className="pt-2 space-y-5">
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField select fullWidth label={t('production.plot_label', 'الحقل الجغرافي')} value={formData.plot} onChange={(e) => setFormData({...formData, plot: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} className="mt-2">
            {structure.flatMap(s => s.plots.map(p => <MenuItem key={p.id} value={p.id} sx={{ fontWeight: 600 }}>{p.name} - ({s.name})</MenuItem>))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth type="number" label={t('production.year_label', 'سنة الحصاد')} value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label={t('production.qty_label', 'الكمية المنتجة (بالطن)')} value={formData.production_amount} onChange={(e) => setFormData({...formData, production_amount: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
          <div className="text-xs text-slate-400 font-semibold p-3 bg-slate-50 rounded-xl border border-slate-100">{t('production.note', 'يرجى التأكد من وحدة القياس (بالطن) وأن هذا المحصول يعود لنفس السنة المسجلة.')}</div>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>{t('production.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreate} variant="contained" disabled={formLoading || !formData.plot || !formData.production_amount} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>{t('production.save_btn', 'حفظ سجل الإنتاج')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default YieldTracking;
