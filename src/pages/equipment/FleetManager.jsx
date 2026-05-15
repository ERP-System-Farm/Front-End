import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Card, Grid } from '@mui/material';
import { getEquipmentList, createEquipment, getEquipmentDetails, logMaintenance, logUsage } from '../../features/equipment/services';
import { useTranslation } from 'react-i18next';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';

const FleetManager = () => {
  const { t } = useTranslation();
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEqId, setSelectedEqId]   = useState(null);
  const [details, setDetails]             = useState(null);
  const [loading, setLoading]             = useState(true);

  const [openEqModal, setOpenEqModal]       = useState(false);
  const [openMaintModal, setOpenMaintModal] = useState(false);
  const [openUsageModal, setOpenUsageModal] = useState(false);
  const [formLoading, setFormLoading]       = useState(false);
  const [formError, setFormError]           = useState('');

  const [eqName, setEqName]     = useState('');
  const [maintForm, setMaintForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });
  const [usageForm, setUsageForm] = useState({ date: new Date().toISOString().split('T')[0], hours_used: '', fuel_consumption: '' });

  useEffect(() => { fetchMaster(); }, []);
  useEffect(() => { if (selectedEqId) fetchDetails(selectedEqId); }, [selectedEqId]);

  const fetchMaster = async () => {
    try { setEquipmentList(await getEquipmentList()); setLoading(false); }
    catch (err) { console.error(err); }
  };
  const fetchDetails = async (id) => {
    try { setDetails(null); setDetails(await getEquipmentDetails(id)); }
    catch (err) { console.error(err); }
  };
  const handleCreateMaster = async () => {
    setFormLoading(true); setFormError('');
    try { const res = await createEquipment({ name: eqName }); setOpenEqModal(false); await fetchMaster(); setSelectedEqId(res.id); }
    catch { setFormError(t('common.error')); }
    finally { setFormLoading(false); }
  };
  const handleCreateMaintenance = async () => {
    setFormLoading(true); setFormError('');
    try { await logMaintenance({ equipment: selectedEqId, ...maintForm }); setOpenMaintModal(false); fetchDetails(selectedEqId); }
    catch { setFormError(t('common.error')); }
    finally { setFormLoading(false); }
  };
  const handleCreateUsage = async () => {
    setFormLoading(true); setFormError('');
    try { await logUsage({ equipment: selectedEqId, ...usageForm }); setOpenUsageModal(false); fetchDetails(selectedEqId); }
    catch { setFormError(t('common.error')); }
    finally { setFormLoading(false); }
  };

  return (
    <div className="p-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 flex items-center">
              <AgricultureOutlinedIcon fontSize="large" />
            </div>
            {t('equipment.title', 'المعدات والآليات')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{t('equipment.subtitle', 'إدارة أسطول الآليات وسجلات الصيانة')}</p>
        </div>
        <Button 
          variant="contained" 
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setOpenEqModal(true)} 
          sx={{ borderRadius: 3, px: 3, py: 1, fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, boxShadow: '0 4px 14px 0 rgba(15, 23, 42, 0.39)' }}
        >
          {t('equipment.deploy_btn', 'تسجيل معدة')}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Equipment list */}
        <div className="w-full md:w-1/3 space-y-3">
          {loading ? <div className="flex justify-center p-8"><CircularProgress sx={{ color: '#0f172a' }} /></div> : equipmentList.map(eq => (
            <Card key={eq.id} onClick={() => setSelectedEqId(eq.id)} elevation={0}
              sx={{ p: 3, borderRadius: 4, cursor: 'pointer', transition: 'all 0.2s ease', border: selectedEqId === eq.id ? '2px solid #16a34a' : '1px solid #e2e8f0', bgcolor: selectedEqId === eq.id ? '#f0fdf4' : 'white', boxShadow: selectedEqId === eq.id ? '0 10px 25px -5px rgba(22, 163, 74, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)', '&:hover': { borderColor: selectedEqId === eq.id ? '#16a34a' : '#cbd5e1' } }}>
              <h3 className={`font-black text-lg ${selectedEqId === eq.id ? 'text-green-800' : 'text-slate-800'}`}>{eq.name}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{t('equipment.registry_id', 'الرقم التسلسلي')}: HW-{String(eq.id).padStart(4, '0')}</p>
            </Card>
          ))}
          {equipmentList.length === 0 && !loading && <div className="text-slate-400 font-semibold italic text-center p-8 border border-dashed border-slate-300 rounded-3xl">{t('equipment.no_fleet', 'لا توجد معدات مسجلة')}</div>}
        </div>

        {/* Details panel */}
        <div className="w-full md:w-2/3">
          <Card sx={{ p: 4, bgcolor: 'white', borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            {!selectedEqId ? (
              <div className="flex flex-col flex-1 items-center justify-center text-slate-400">
                <DirectionsCarFilledOutlinedIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <p className="font-semibold">{t('common.empty', 'حدد معدة من القائمة لعرض تفاصيلها')}</p>
              </div>
            ) : !details ? (
              <div className="flex flex-1 items-center justify-center"><CircularProgress sx={{ color: '#0f172a' }} /></div>
            ) : (
              <div className="space-y-8 flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{details.equipment.name}</h2>
                    <p className="text-sm text-slate-500 mt-2 uppercase tracking-wider font-bold">{t('equipment.registry_id', 'الرقم التسلسلي')}: HW-{String(selectedEqId).padStart(4,'0')}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={() => setOpenMaintModal(true)} variant="outlined" startIcon={<BuildOutlinedIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, borderColor: '#e11d48', color: '#e11d48', '&:hover': { borderColor: '#be123c', bgcolor: '#fff1f2' } }}>{t('equipment.log_maintenance', 'صيانة')}</Button>
                    <Button onClick={() => setOpenUsageModal(true)} variant="contained" startIcon={<LocalGasStationOutlinedIcon />} sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}>{t('equipment.log_usage', 'تشغيل')}</Button>
                  </div>
                </div>

                <Grid container spacing={5}>
                  <Grid item xs={12} lg={6}>
                    <h3 className="text-slate-800 font-extrabold text-lg mb-5 flex items-center gap-2"><LocalGasStationOutlinedIcon color="primary" /> {t('equipment.runtime_title', 'سجل التشغيل')}</h3>
                    <div className="space-y-4">
                      {details.usages.length === 0
                        ? <p className="text-slate-400 italic font-semibold p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">{t('equipment.no_usage', 'لا توجد سجلات تشغيل')}</p>
                        : details.usages.map(u => (
                          <div key={u.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center transition-transform hover:-translate-y-1">
                            <span className="font-bold text-slate-800">{u.date}</span>
                            <div className="text-right">
                              <div className="text-blue-600 font-black text-lg">{u.hours_used} <span className="text-xs font-semibold text-slate-500">{t('equipment.hours', 'ساعة')}</span></div>
                              {u.fuel_consumption && <div className="text-xs font-bold text-amber-600 mt-0.5">{u.fuel_consumption} {t('equipment.fuel_short', 'لتر وقود')}</div>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </Grid>
                  <Grid item xs={12} lg={6}>
                    <h3 className="text-slate-800 font-extrabold text-lg mb-5 flex items-center gap-2"><BuildOutlinedIcon color="error" /> {t('equipment.maintenance_title', 'سجل الصيانة')}</h3>
                    <div className="space-y-4">
                      {details.maintenances.length === 0
                        ? <p className="text-slate-400 italic font-semibold p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">{t('equipment.no_maintenance', 'لا توجد سجلات صيانة')}</p>
                        : details.maintenances.map(m => (
                          <div key={m.id} className="bg-rose-50 border border-rose-100 p-4 rounded-2xl transition-transform hover:-translate-y-1">
                            <div className="flex justify-between items-center mb-2 border-b border-rose-200/50 pb-2">
                              <span className="font-black text-xs text-rose-800 uppercase tracking-widest">{t('equipment.event_label', 'حدث صيانة')}</span>
                              <span className="text-rose-600 font-bold text-sm bg-white px-2 py-0.5 rounded-md shadow-sm">{m.date}</span>
                            </div>
                            <p className="text-rose-900 font-medium text-sm leading-relaxed">{m.notes}</p>
                          </div>
                        ))}
                    </div>
                  </Grid>
                </Grid>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* REGISTER EQUIPMENT MODAL */}
      <Dialog open={openEqModal} onClose={() => setOpenEqModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{t('equipment.deploy_modal_title', 'تسجيل معدة جديدة')}</DialogTitle>
        <DialogContent className="pt-2 space-y-4">
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField fullWidth label={t('equipment.eq_name', 'اسم المعدة')} value={eqName} onChange={(e) => setEqName(e.target.value)} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} className="mt-2" />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEqModal(false)} sx={{ fontWeight: 700 }}>{t('equipment.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreateMaster} variant="contained" disabled={formLoading || !eqName} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>{t('equipment.initialize_btn', 'حفظ المعدة')}</Button>
        </DialogActions>
      </Dialog>

      {/* MAINTENANCE MODAL */}
      <Dialog open={openMaintModal} onClose={() => setOpenMaintModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#e11d48' }}>{t('equipment.maint_modal_title', 'تسجيل صيانة')}</DialogTitle>
        <DialogContent className="pt-2 space-y-5">
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField fullWidth type="date" label={t('equipment.maint_date', 'تاريخ الصيانة')} value={maintForm.date} onChange={(e) => setMaintForm({...maintForm, date: e.target.value})} variant="outlined" InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: 2 } }} className="mt-2" />
          <TextField fullWidth multiline rows={4} label={t('equipment.maint_notes', 'تفاصيل الصيانة')} value={maintForm.notes} onChange={(e) => setMaintForm({...maintForm, notes: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenMaintModal(false)} sx={{ fontWeight: 700 }}>{t('equipment.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreateMaintenance} variant="contained" disabled={formLoading || !maintForm.date || !maintForm.notes} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#e11d48', '&:hover': { bgcolor: '#be123c' } }}>{t('equipment.maint_save', 'حفظ سجل الصيانة')}</Button>
        </DialogActions>
      </Dialog>

      {/* USAGE MODAL */}
      <Dialog open={openUsageModal} onClose={() => setOpenUsageModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#3b82f6' }}>{t('equipment.usage_modal_title', 'تسجيل تشغيل')}</DialogTitle>
        <DialogContent className="pt-2 space-y-5">
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField fullWidth type="date" label={t('equipment.usage_date', 'تاريخ التشغيل')} value={usageForm.date} onChange={(e) => setUsageForm({...usageForm, date: e.target.value})} variant="outlined" InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: 2 } }} className="mt-2" />
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField fullWidth type="number" label={t('equipment.usage_hours', 'ساعات التشغيل')} value={usageForm.hours_used} onChange={(e) => setUsageForm({...usageForm, hours_used: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label={t('equipment.usage_fuel', 'استهلاك الوقود (اختياري)')} value={usageForm.fuel_consumption} onChange={(e) => setUsageForm({...usageForm, fuel_consumption: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2 } }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenUsageModal(false)} sx={{ fontWeight: 700 }}>{t('equipment.cancel', 'إلغاء')}</Button>
          <Button onClick={handleCreateUsage} variant="contained" disabled={formLoading || !usageForm.date || !usageForm.hours_used} sx={{ borderRadius: 2, px: 4, fontWeight: 700, bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>{t('equipment.usage_save', 'حفظ السجل')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default FleetManager;
