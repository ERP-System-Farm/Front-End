import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Grid, Paper, Box, Typography, useMediaQuery, useTheme, Card } from '@mui/material';
import { getFinancialSummary, getExpenses, createExpense, getRevenues, createRevenue } from '../../features/accounting/services';
import { useTranslation } from 'react-i18next';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

const FinanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [summary, setSummary]   = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [modalType, setModalType]   = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]   = useState('');
  const [formData, setFormData]     = useState({ amount: '', date: new Date().toISOString().split('T')[0], textRef: '', notes: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, e, r] = await Promise.all([getFinancialSummary(), getExpenses(), getRevenues()]);
      setSummary(s); setExpenses(e); setRevenues(r);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setFormLoading(true); setFormError('');
    try {
      if (modalType === 'expense') {
        await createExpense({ amount: formData.amount, date: formData.date, category: formData.textRef, notes: formData.notes });
      } else {
        await createRevenue({ amount: formData.amount, date: formData.date, source: formData.textRef });
      }
      setModalType(null); fetchData();
    } catch { setFormError(t('common.error')); }
    finally { setFormLoading(false); }
  };

  const openModal = (type) => {
    setModalType(type);
    setFormData({ amount: '', date: new Date().toISOString().split('T')[0], textRef: '', notes: '' });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4, md: 8 }, width: '100%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyItems: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 6, gap: 4 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'slate.900', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 3, color: '#16a34a', display: 'flex' }}>
              <AccountBalanceWalletOutlinedIcon fontSize="large" />
            </Box>
            {t('accounting.title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'slate.500', mt: 1, fontWeight: 500 }}>{t('accounting.subtitle')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <Button fullWidth variant="outlined" startIcon={<TrendingDownOutlinedIcon />} color="error" onClick={() => openModal('expense')} sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>{t('accounting.log_expense')}</Button>
          <Button fullWidth variant="contained" startIcon={<AddCircleOutlinedIcon />} color="success" onClick={() => openModal('revenue')} sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)' }}>{t('accounting.log_revenue')}</Button>
        </Box>
      </Box>

      {loading || !summary ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress sx={{ color: '#16a34a' }} />
        </Box>
      ) : (
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05, transform: 'rotate(15deg)' }}><TrendingUpOutlinedIcon sx={{ fontSize: 120 }} /></Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('accounting.total_revenue')}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#16a34a', mt: 2 }}>${Number(summary.total_revenue).toLocaleString()}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05, transform: 'rotate(-15deg)' }}><TrendingDownOutlinedIcon sx={{ fontSize: 120 }} /></Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('accounting.total_expenses')}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#e11d48', mt: 2 }}>${Number(summary.total_expense).toLocaleString()}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05 }}><PaymentsOutlinedIcon sx={{ fontSize: 120 }} /></Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('accounting.total_salaries')}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#d97706', mt: 2 }}>${Number(summary.total_salaries).toLocaleString()}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 4, bgcolor: '#0f172a', borderRadius: 5, boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.3)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }} elevation={0}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><AttachMoneyOutlinedIcon sx={{ fontSize: 120, color: 'white' }} /></Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('accounting.net_margin')}</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: Number(summary.net) >= 0 ? '#4ade80' : '#f87171', mt: 2 }}>${Number(summary.net).toLocaleString()}</Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenues */}
        <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><TrendingUpOutlinedIcon color="success" /> {t('accounting.inflow_title')}</h3>
          <div className="space-y-4">
            {revenues.length === 0 ? <p className="text-slate-400 italic font-semibold p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">{t('common.empty', 'لا توجد بيانات')}</p> : revenues.slice(0, 10).map(r => (
              <div key={`rev-${r.id}`} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center transition-transform hover:-translate-y-1">
                <div>
                  <p className="font-bold text-slate-800 text-lg">{r.source}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 bg-white px-2 py-0.5 rounded-md inline-block shadow-sm border border-slate-100">{r.date}</p>
                </div>
                <div className="text-emerald-700 font-black text-xl bg-white px-3 py-1.5 rounded-xl shadow-sm border border-emerald-100">+${r.amount}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expenses */}
        <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><TrendingDownOutlinedIcon color="error" /> {t('accounting.outflow_title')}</h3>
          <div className="space-y-4">
            {expenses.length === 0 ? <p className="text-slate-400 italic font-semibold p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">{t('common.empty', 'لا توجد بيانات')}</p> : expenses.slice(0, 10).map(e => (
              <div key={`exp-${e.id}`} className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex justify-between items-center transition-transform hover:-translate-y-1">
                <div>
                  <p className="font-bold text-slate-800 text-lg">{e.category}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 bg-white px-2 py-0.5 rounded-md inline-block shadow-sm border border-slate-100">{e.date}</p>
                </div>
                <div className="text-rose-700 font-black text-xl bg-white px-3 py-1.5 rounded-xl shadow-sm border border-rose-100">-${e.amount}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={!!modalType} onClose={() => setModalType(null)} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', color: modalType === 'expense' ? '#e11d48' : '#16a34a', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {modalType === 'expense' ? <TrendingDownOutlinedIcon fontSize="large" /> : <TrendingUpOutlinedIcon fontSize="large" />}
          {modalType === 'expense' ? t('accounting.modal_expense_title') : t('accounting.modal_revenue_title')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label={t('accounting.date')} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} InputLabelProps={{ shrink: true }} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label={t('accounting.amount')} value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
            </Grid>
          </Grid>
          <TextField fullWidth label={modalType === 'expense' ? t('accounting.expense_category') : t('accounting.revenue_source')} value={formData.textRef} onChange={(e) => setFormData({...formData, textRef: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
          {modalType === 'expense' && <TextField fullWidth multiline rows={3} label={t('accounting.notes')} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setModalType(null)} sx={{ fontWeight: 800, color: 'text.secondary' }}>{t('accounting.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={formLoading || !formData.amount || !formData.textRef} sx={{ borderRadius: 2.5, px: 5, py: 1.5, fontWeight: 800, bgcolor: modalType === 'expense' ? '#e11d48' : '#16a34a', '&:hover': { bgcolor: modalType === 'expense' ? '#be123c' : '#15803d' } }}>{t('accounting.commit_btn')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default FinanceDashboard;
