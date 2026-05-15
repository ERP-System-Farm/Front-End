import React, { useState, useEffect } from 'react';
import { 
  Button, Card, Chip, Alert, CircularProgress, Tabs, Tab, TextField, MenuItem, 
  Select, FormControl, InputLabel, InputAdornment, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Box, Typography, useTheme, useMediaQuery 
} from '@mui/material';
import { Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getUsersList, approveUser, deactivateUser, getCMSContent, updateCMSContent, deleteUser, updateUserRole } from '../../features/auth/services';
import { useTranslation } from 'react-i18next';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ViewQuiltIcon    from '@mui/icons-material/ViewQuilt';
import SettingsIcon     from '@mui/icons-material/Settings';
import { useAuth } from '../../app/AuthContext';
import api from '../../services/api';
import { Switch, FormControlLabel, Divider } from '@mui/material';

const AdminControls = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [cmsData, setCmsData] = useState({
    hero_title_en: '', hero_title_ar: '',
    hero_text_en: '',  hero_text_ar: '',
    palm_text_en: '',  palm_text_ar: '',
    olive_text_en: '', olive_text_ar: ''
  });
  const [cmsLoading, setCmsLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Deletion Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [farmSettings, setFarmSettings] = useState({
    enable_sector: true,
    enable_stage: true,
    enable_enclosure: true,
    allow_stage_without_sector: false,
    allow_enclosure_without_stage: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => { fetchUsers(); fetchCMS(); fetchFarmSettings(); }, []);

  const fetchFarmSettings = async () => {
    try {
      const res = await api.get('farm/settings/');
      setFarmSettings(res.data);
    } catch (err) {
      console.error('Failed fetching farm settings', err);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    const updated = { ...farmSettings, [key]: value };
    setFarmSettings(updated);
    try {
      await api.patch('farm/settings/', { [key]: value });
    } catch (err) {
      console.error('Failed updating setting', err);
      // Rollback on error
      fetchFarmSettings();
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await getUsersList()); }
    catch { setError(t('admin.error_fetch')); }
    finally { setLoading(false); }
  };

  const fetchCMS = async () => {
    try { setCmsData(await getCMSContent()); }
    catch (err) { console.error('Failed fetching CMS', err); }
  };

  const handleUpdateCMS = async () => {
    setCmsLoading(true);
    try { await updateCMSContent(cmsData); alert(t('common.save') + ' ✓'); }
    catch { alert(t('common.error')); }
    finally { setCmsLoading(false); }
  };

  const handleApprove    = async (id) => { try { await approveUser(id);    fetchUsers(); } catch (err) { console.error(err); } };
  const handleDeactivate = async (id) => { try { await deactivateUser(id); fetchUsers(); } catch (err) { console.error(err); } };
  const handleDelete     = (id) => { 
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try { 
      await deleteUser(userToDelete); 
      fetchUsers(); 
    } catch(err) { 
      console.error(err); 
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try { await updateUserRole(id, newRole); fetchUsers(); } catch(err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = !u.is_approved;
    else if (statusFilter === 'ACTIVE') matchesStatus = u.is_approved && u.is_active;
    else if (statusFilter === 'DEACTIVATED') matchesStatus = !u.is_active;

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <Box sx={{ p: { xs: 2, sm: 4, md: 8 }, width: '100%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyItems: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 6, gap: 4 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'slate.900', tracking: '-0.02em', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 3, color: '#334155', display: 'flex' }}>
              <VerifiedUserIcon fontSize="large" />
            </Box>
            {t('admin.title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'slate.500', mt: 1, fontWeight: 500 }}>{t('admin.subtitle')}</Typography>
        </Box>
      </Box>

      <div className="bg-white border-b border-slate-200 mb-8 rounded-t-3xl px-4 shadow-sm border">
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary" sx={{ '& .MuiTab-root': { fontWeight: 800, py: 3, fontSize: '1rem' } }}>
          <Tab icon={<VerifiedUserIcon />} iconPosition="start" label={t('admin.tab_security')} />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="إعدادات المزرعة" />
          {currentUser?.role === 'SUPER_ADMIN' && <Tab icon={<ViewQuiltIcon />}    iconPosition="start" label={t('admin.tab_cms')} />}
        </Tabs>
      </div>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}      {/* ── SECURITY TAB ─────────────────────────────── */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <Card elevation={0} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('admin.search_placeholder', 'Search by name or email...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: 'slate.400' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderRadius: '10px' } }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="role-filter-label">{t('admin.filter_role', 'Filter by Role')}</InputLabel>
                  <Select
                    labelId="role-filter-label"
                    value={roleFilter}
                    label={t('admin.filter_role', 'Filter by Role')}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    sx={{ bgcolor: 'white', borderRadius: '10px' }}
                  >
                    <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="MANAGER">Manager</MenuItem>
                    <MenuItem value="ENGINEER">Engineer</MenuItem>
                    <MenuItem value="ACCOUNTANT">Accountant</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="WAREHOUSE">Warehouse</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">{t('admin.filter_status', 'Filter by Status')}</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label={t('admin.filter_status', 'Filter by Status')}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ bgcolor: 'white', borderRadius: '10px' }}
                  >
                    <MenuItem value="ALL">{t('common.all', 'All')}</MenuItem>
                    <MenuItem value="PENDING">{t('admin.pending', 'Pending Approval')}</MenuItem>
                    <MenuItem value="ACTIVE">{t('admin.active', 'Active')}</MenuItem>
                    <MenuItem value="DEACTIVATED">{t('admin.deactivated_filter', 'Deactivated')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button 
                  fullWidth 
                  variant="text" 
                  startIcon={<FilterListIcon />} 
                  onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
                  sx={{ color: 'slate.600', fontWeight: 'bold' }}
                >
                  {t('common.clear', 'Clear')}
                </Button>
              </Grid>
            </Grid>
          </Card>

          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: '#16a34a' }} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box textAlign="center" py={8} className="bg-white border border-dashed border-slate-200 rounded-3xl">
              <Typography color="textSecondary" fontWeight="bold">
                {t('admin.no_users_found', 'No users matching your search.')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredUsers.map(u => (
                <Card 
                  key={u.id} 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    border: '1px solid #e2e8f0', 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' }, 
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    justifyContent: 'space-between', 
                    borderRadius: 4, 
                    gap: 2,
                    '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf450' },
                    transition: 'all 0.2s'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      w: 48, h: 48, borderRadius: '50%', border: '2px solid #f1f5f9', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      bgcolor: '#f8fafc', fontWeight: 800, color: '#1e293b' 
                    }}>
                      {u.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{u.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {u.email} &bull; <Box component="span" sx={{ color: '#16a34a' }}>{u.role}</Box>
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                    flexWrap: 'wrap'
                  }}>
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <FormControl size="small" sx={{ minWidth: 110 }}>
                        <Select 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 700, height: 36 }}
                        >
                          <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                          <MenuItem value="OWNER">Owner</MenuItem>
                          <MenuItem value="MANAGER">Manager</MenuItem>
                          <MenuItem value="ENGINEER">Engineer</MenuItem>
                          <MenuItem value="ACCOUNTANT">Accountant</MenuItem>
                          <MenuItem value="HR">HR</MenuItem>
                          <MenuItem value="WAREHOUSE">Warehouse</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                    
                    {!u.is_approved ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={t('admin.awaiting')} color="warning" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small" 
                          onClick={() => handleApprove(u.id)} 
                          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                        >
                          {t('admin.approve_btn')}
                        </Button>
                      </Box>
                    ) : (
                      <Chip 
                        label={u.is_active ? t('admin.permit_active') : t('admin.deactivated')} 
                        color={u.is_active ? "success" : "error"} 
                        size="small" 
                        variant={u.is_active ? "filled" : "outlined"}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    )}

                    {u.is_active && u.role !== 'SUPER_ADMIN' && (
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small" 
                        onClick={() => handleDeactivate(u.id)} 
                        sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                      >
                        {t('admin.deactivate_btn')}
                      </Button>
                    )}

                    {currentUser?.role === 'SUPER_ADMIN' && u.id !== currentUser?.id && (
                      <Button 
                        variant="text" 
                        color="error" 
                        size="small" 
                        onClick={() => handleDelete(u.id)} 
                        sx={{ minWidth: 0, px: 1, fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {t('admin.delete_btn', 'Delete')}
                      </Button>
                    )}
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 5 }, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'black', color: 'slate.800' }}>
          {t('admin.delete_title', 'Confirm Deletion')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.confirm_delete_msg', 'Are you sure you want to permanently delete this user? This action cannot be undone.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ fontWeight: 'bold', borderRadius: '10px' }}>
            {t('admin.delete_confirm_btn', 'Delete Permanently')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── FARM SETTINGS TAB ──────────────────────────── */}
      {activeTab === 1 && (
        <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <SettingsIcon color="primary" fontSize="large" /> إعدادات هيكل المزرعة
          </h2>
          
          <Box className="space-y-8">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>مستويات المواقع</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>تحكم في المستويات التي تظهر في نماذج التقارير والتحليلات.</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: farmSettings.enable_sector ? '#f0fdf4' : '#f8fafc' }}>
                    <FormControlLabel
                      control={<Switch checked={farmSettings.enable_sector} onChange={(e) => handleUpdateSetting('enable_sector', e.target.checked)} color="success" />}
                      label={<Typography sx={{ fontWeight: 700 }}>تفعيل القطاعات (Sectors)</Typography>}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: farmSettings.enable_stage ? '#f0fdf4' : '#f8fafc' }}>
                    <FormControlLabel
                      control={<Switch checked={farmSettings.enable_stage} onChange={(e) => handleUpdateSetting('enable_stage', e.target.checked)} color="success" />}
                      label={<Typography sx={{ fontWeight: 700 }}>تفعيل المراحل (Stages)</Typography>}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: farmSettings.enable_enclosure ? '#f0fdf4' : '#f8fafc' }}>
                    <FormControlLabel
                      control={<Switch checked={farmSettings.enable_enclosure} onChange={(e) => handleUpdateSetting('enable_enclosure', e.target.checked)} color="success" />}
                      label={<Typography sx={{ fontWeight: 700 }}>تفعيل الحوشات (Enclosures)</Typography>}
                    />
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: '#1e293b' }}>قواعد الهيكل المتقدمة</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>إعدادات متقدمة للتحكم في كيفية ترابط المستويات ببعضها.</Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <FormControlLabel
                      control={<Switch checked={farmSettings.allow_stage_without_sector} onChange={(e) => handleUpdateSetting('allow_stage_without_sector', e.target.checked)} />}
                      label={<Typography sx={{ fontWeight: 700 }}>السماح بمراحل بدون قطاع</Typography>}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <FormControlLabel
                      control={<Switch checked={farmSettings.allow_enclosure_without_stage} onChange={(e) => handleUpdateSetting('allow_enclosure_without_stage', e.target.checked)} />}
                      label={<Typography sx={{ fontWeight: 700 }}>السماح بحوشات بدون مرحلة</Typography>}
                    />
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Card>
      )}

      {/* ── CMS TAB ──────────────────────────────────── */}
      {activeTab === 2 && currentUser?.role === 'SUPER_ADMIN' && (
        <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
          <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><ViewQuiltIcon color="primary" fontSize="large" /> {t('admin.cms_title')}</h2>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6} className="space-y-5">
              <p className="font-bold text-sky-600 uppercase tracking-widest text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500"></div>{t('admin.hero_section')}</p>
              <TextField fullWidth label={t('admin.hero_title_en')} value={cmsData.hero_title_en} onChange={(e) => setCmsData({...cmsData, hero_title_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              <TextField fullWidth label={t('admin.hero_title_ar')} value={cmsData.hero_title_ar} onChange={(e) => setCmsData({...cmsData, hero_title_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              <TextField fullWidth multiline rows={3} label={t('admin.hero_text_en')} value={cmsData.hero_text_en} onChange={(e) => setCmsData({...cmsData, hero_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              <TextField fullWidth multiline rows={3} label={t('admin.hero_text_ar')} value={cmsData.hero_text_ar} onChange={(e) => setCmsData({...cmsData, hero_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
            </Grid>
            <Grid item xs={12} md={6} className="space-y-5">
              <p className="font-bold text-emerald-600 uppercase tracking-widest text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>{t('admin.palm_section')}</p>
              <TextField fullWidth multiline rows={3} label={t('admin.palm_text_en')} value={cmsData.palm_text_en} onChange={(e) => setCmsData({...cmsData, palm_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              <TextField fullWidth multiline rows={3} label={t('admin.palm_text_ar')} value={cmsData.palm_text_ar} onChange={(e) => setCmsData({...cmsData, palm_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              
              <Box sx={{ my: 4, height: '1px', bgcolor: 'slate.100' }} />

              <p className="font-bold text-amber-500 uppercase tracking-widest text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div>{t('admin.olive_section')}</p>
              <TextField fullWidth multiline rows={3} label={t('admin.olive_text_en')} value={cmsData.olive_text_en} onChange={(e) => setCmsData({...cmsData, olive_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
              <TextField fullWidth multiline rows={3} label={t('admin.olive_text_ar')} value={cmsData.olive_text_ar} onChange={(e) => setCmsData({...cmsData, olive_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 2.5 } }} />
            </Grid>
          </Grid>
          <div className="mt-10 pt-6 border-t border-slate-100 text-right">
            <Button variant="contained" color="primary" onClick={handleUpdateCMS} disabled={cmsLoading} sx={{ px: 8, py: 1.5, borderRadius: 3, fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}>
              {cmsLoading ? <CircularProgress size={24} color="inherit" /> : t('admin.deploy_btn')}
            </Button>
          </div>
        </Card>
      )}
    </Box>
  );
};

export default AdminControls;
