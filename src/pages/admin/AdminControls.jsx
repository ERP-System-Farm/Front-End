import React, { useState, useEffect, useRef } from 'react';
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
import StorageIcon      from '@mui/icons-material/Storage';
import CloudUploadIcon  from '@mui/icons-material/CloudUpload';
import DeleteSweepIcon  from '@mui/icons-material/DeleteSweep';
import CodeIcon         from '@mui/icons-material/Code';
import InfoIcon         from '@mui/icons-material/Info';
import LockIcon         from '@mui/icons-material/Lock';
import SpaIcon          from '@mui/icons-material/Spa';
import ForestIcon       from '@mui/icons-material/Forest';
import { useAuth } from '../../app/AuthContext';
import api from '../../services/api';
import { Switch, FormControlLabel, Divider } from '@mui/material';
import { toast } from 'sonner';

const AdminControls = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [activeTab, setActiveTab] = useState('security');

  const [cmsData, setCmsData] = useState({
    hero_title_en: '', hero_title_ar: '',
    hero_text_en: '',  hero_text_ar: '',
    palm_text_en: '',  palm_text_ar: '',
    olive_text_en: '', olive_text_ar: '',
    logo_text_en: '',  logo_text_ar: '',
    logo_url: '',
    about_title_en: '', about_title_ar: '',
    about_text_en: '', about_text_ar: '',
    features_title_en: '', features_title_ar: '',
    contact_title_en: '', contact_title_ar: '',
    contact_text_en: '', contact_text_ar: '',
    contact_email: '', contact_phone: ''
  });
  const [cmsLoading, setCmsLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Deletion Dialog for user
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Data Injection & Purge states
  const [injectDialogOpen, setInjectDialogOpen] = useState(false);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedModuleName, setSelectedModuleName] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [activeSchemaGuide, setActiveSchemaGuide] = useState('farm');

  const [farmSettings, setFarmSettings] = useState({
    enable_sector: true,
    enable_stage: true,
    enable_enclosure: true,
    allow_stage_without_sector: false,
    allow_enclosure_without_stage: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [passwordResets, setPasswordResets] = useState([]);
  const [resetsLoading, setResetsLoading] = useState(false);

  const isRTL = i18n.language === 'ar';

  useEffect(() => { 
    fetchUsers(); 
    fetchCMS(); 
    fetchFarmSettings(); 
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') {
      fetchPasswordResets();
    }
  }, []);

  const fetchPasswordResets = async () => {
    setResetsLoading(true);
    try {
      const res = await api.get('auth/admin/password-resets');
      setPasswordResets(res.data);
    } catch (err) {
      console.error("Failed fetching resets", err);
    } finally {
      setResetsLoading(false);
    }
  };

  const handleApproveReset = async (id) => {
    try {
      await api.post(`auth/admin/password-resets/${id}/approve`);
      toast.success(isRTL ? "تمت الموافقة على طلب استعادة كلمة المرور بنجاح ✓" : "Password reset request approved successfully ✓");
      fetchPasswordResets();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل الموافقة على الطلب" : "Failed to approve request");
    }
  };

  const handleRejectReset = async (id) => {
    try {
      await api.post(`auth/admin/password-resets/${id}/reject`);
      toast.warning(isRTL ? "تم رفض وإلغاء طلب استعادة كلمة المرور" : "Password reset request rejected and canceled");
      fetchPasswordResets();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رفض الطلب" : "Failed to reject request");
    }
  };

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
      toast.success(t('common.save', 'تم حفظ التحديث ✓'));
    } catch (err) {
      console.error('Failed updating setting', err);
      fetchFarmSettings();
      toast.error(t('common.error', 'حدث خطأ أثناء الحفظ'));
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
    try { 
      await updateCMSContent(cmsData); 
      toast.success(t('common.save', 'تم الحفظ بنجاح ✓'));
    }
    catch { 
      toast.error(t('common.error', 'فشل الحفظ'));
    }
    finally { setCmsLoading(false); }
  };

  const handleApprove    = async (id) => { try { await approveUser(id);    fetchUsers(); toast.success('تم تفعيل المستخدم'); } catch (err) { console.error(err); } };
  const handleDeactivate = async (id) => { try { await deactivateUser(id); fetchUsers(); toast.warning('تم إلغاء تفعيل المستخدم'); } catch (err) { console.error(err); } };
  const handleDelete     = (id) => { 
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try { 
      await deleteUser(userToDelete); 
      fetchUsers(); 
      toast.success('تم حذف العضو بشكل نهائي');
    } catch(err) { 
      console.error(err); 
      toast.error('فشل في حذف المستخدم');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try { 
      await updateUserRole(id, newRole); 
      fetchUsers(); 
      toast.success('تم تحديث صلاحية المستخدم بنجاح');
    } catch(err) { 
      console.error(err); 
      toast.error('فشل في تحديث الدور');
    }
  };

  // Data management functions
  const openInjectDialog = (moduleKey, moduleName) => {
    setSelectedModule(moduleKey);
    setSelectedModuleName(moduleName);
    setJsonContent('');
    setInjectDialogOpen(true);
  };

  const openPurgeDialog = (moduleKey, moduleName) => {
    setSelectedModule(moduleKey);
    setSelectedModuleName(moduleName);
    setPurgeConfirmText('');
    setPurgeDialogOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setJsonContent(JSON.stringify(parsed, null, 2));
        toast.success(isRTL ? 'تم قراءة ملف الـ JSON وتنسيقه بنجاح ✓' : 'JSON read and formatted successfully ✓');
      } catch (err) {
        toast.error(isRTL ? 'ملف الـ JSON غير صالح أو معطوب!' : 'Invalid JSON file structure!');
      }
    };
    reader.readAsText(file);
  };

  const handleInjectData = async () => {
    if (!jsonContent.trim()) {
      toast.error(isRTL ? 'يرجى إدخال محتوى الـ JSON أولاً.' : 'Please enter JSON content first.');
      return;
    }

    try {
      setUploadLoading(true);
      const parsedData = JSON.parse(jsonContent);
      
      const response = await api.post('admin/data-management', {
        module: selectedModule,
        data: parsedData
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setInjectDialogOpen(false);
        fetchUsers(); // Refresh users list just in case
      } else {
        toast.error(response.data.error || 'Failed to inject data.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || (isRTL ? 'تنسيق JSON غير صالح أو حدث خطأ أثناء التمرير.' : 'Invalid JSON format or server error.'));
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePurgeData = async () => {
    if (purgeConfirmText !== 'DELETE') {
      toast.error(isRTL ? 'يرجى كتابة كلمة DELETE للتأكيد.' : 'Please type DELETE to confirm.');
      return;
    }

    try {
      setUploadLoading(true);
      const response = await api.delete('admin/data-management', {
        data: { module: selectedModule }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setPurgeDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(response.data.error || 'Failed to delete data.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Server error occurred during deletion.');
    } finally {
      setUploadLoading(false);
    }
  };

  const schemaTemplates = {
    farm: `[
  {
    "name": "القطاع الشمالي",
    "type": "SECTOR",
    "parent_name": null
  },
  {
    "name": "حقل النخيل A1",
    "type": "ENCLOSURE",
    "parent_name": "القطاع الشمالي",
    "area_hectares": 12.5,
    "tree_count": 450
  }
]`,
    users: `[
  {
    "name": "أحمد المدير",
    "email": "manager@example.com",
    "role": "MANAGER",
    "password": "securepassword123"
  }
]`,
    reports: `[
  {
    "report_date": "2026-05-15",
    "location_name": "حقل النخيل A1",
    "variety_name": "مجدول",
    "engineer_email": "admin@example.com",
    "company_workers": 10,
    "contractor_workers": 5,
    "logs": [
      {
        "operation_name": "حصاد",
        "actual_productivity": 150.5,
        "notes": "حصاد عالي الجودة"
      }
    ]
  }
]`,
    finance: `[
  {
    "type": "REVENUE",
    "amount": 25000.0,
    "date": "2026-05-15",
    "notes": "بيع محصول التمور"
  },
  {
    "type": "EXPENSE",
    "amount": 4200.0,
    "category": "fuel",
    "date": "2026-05-16",
    "notes": "وقود الجرارات الزراعية"
  }
]`,
    warehouse: `[
  {
    "warehouse_name": "المستودع الرئيسي للسماد",
    "location": "القطاع الشمالي",
    "item_name": "سماد يوريا نتروجين",
    "category": "fertilizers",
    "quantity": 150.0,
    "unit": "كيس"
  }
]`,
    equipment: `[
  {
    "name": "جرار فيات 90-90 زراعي",
    "maintenances": [
      {
        "date": "2026-05-10",
        "notes": "تغيير زيت وفلتر هيدروليك"
      }
    ],
    "usages": [
      {
        "date": "2026-05-12",
        "hours_used": 6.5,
        "fuel_consumption": 24.0
      }
    ]
  }
]`
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
            {t('admin.title', 'لوحة إدارة النظام')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'slate.500', mt: 1, fontWeight: 500 }}>
            {t('admin.subtitle', 'إدارة المستخدمين والموافقات وتفضيلات النظام وتغذية وحذف البيانات.')}
          </Typography>
        </Box>
      </Box>

      <div className="bg-white border-b border-slate-200 mb-8 rounded-t-3xl px-4 shadow-sm border">
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)} 
          indicatorColor="primary" 
          textColor="primary" 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { fontWeight: 800, py: 3, fontSize: '0.95rem' } }}
        >
          <Tab value="security" icon={<VerifiedUserIcon />} iconPosition="start" label={t('admin.tab_security', 'الصلاحيات والمستخدمين')} />
          <Tab value="farm" icon={<SettingsIcon />} iconPosition="start" label="إعدادات المزرعة" />
          {currentUser?.role === 'SUPER_ADMIN' && <Tab value="cms" icon={<ViewQuiltIcon />} iconPosition="start" label={t('admin.tab_cms', 'إدارة الواجهة')} />}
          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER') && <Tab value="data" icon={<StorageIcon />} iconPosition="start" label="إدارة وحقن البيانات" />}
          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') && <Tab value="password_resets" icon={<LockIcon />} iconPosition="start" label="طلبات استعادة كلمة المرور" />}
        </Tabs>
      </div>

      {error && <Alert severity="error" className="mb-4">{error}</Alert>}

      {/* ── SECURITY TAB ─────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card elevation={0} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('admin.search_placeholder', 'البحث عن طريق الاسم أو البريد...')}
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
                  <InputLabel id="role-filter-label">{t('admin.filter_role', 'تصفية حسب الصلاحية')}</InputLabel>
                  <Select
                    labelId="role-filter-label"
                    value={roleFilter}
                    label={t('admin.filter_role', 'تصفية حسب الصلاحية')}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    sx={{ bgcolor: 'white', borderRadius: '10px' }}
                  >
                    <MenuItem value="ALL">{t('common.all', 'الكل')}</MenuItem>
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
                  <InputLabel id="status-filter-label">{t('admin.filter_status', 'تصفية حسب الحالة')}</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label={t('admin.filter_status', 'تصفية حسب الحالة')}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ bgcolor: 'white', borderRadius: '10px' }}
                  >
                    <MenuItem value="ALL">{t('common.all', 'الكل')}</MenuItem>
                    <MenuItem value="PENDING">{t('admin.pending', 'قيد الانتظار والمراجعة')}</MenuItem>
                    <MenuItem value="ACTIVE">{t('admin.active', 'نشط وعامل')}</MenuItem>
                    <MenuItem value="DEACTIVATED">{t('admin.deactivated_filter', 'غير نشط')}</MenuItem>
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
                  {t('common.clear', 'تفريغ')}
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
                {t('admin.no_users_found', 'لم يتم العثور على مستخدمين متطابقين.')}
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
                      width: 48, height: 48, borderRadius: '50%', border: '2px solid #f1f5f9', 
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
                        <Chip label={t('admin.awaiting', 'في انتظار الموافقة')} color="warning" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="small" 
                          onClick={() => handleApprove(u.id)} 
                          sx={{ borderRadius: 2, fontSize: '0.75rem' }}
                        >
                          {t('admin.approve_btn', 'موافقة')}
                        </Button>
                      </Box>
                    ) : (
                      <Chip 
                        label={u.is_active ? t('admin.permit_active', 'نشط') : t('admin.deactivated', 'ملغى التفعيل')} 
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
                        {t('admin.deactivate_btn', 'إلغاء التنشيط')}
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
                        {t('admin.delete_btn', 'حذف نهائي')}
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
          {t('admin.delete_title', 'تأكيد حذف الحساب')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.confirm_delete_msg', 'هل أنت متأكد تمامًا من رغبتك في حذف هذا العضو بشكل نهائي من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
            {t('common.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ fontWeight: 'bold', borderRadius: '10px' }}>
            {t('admin.delete_confirm_btn', 'نعم، احذفه للأبد')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── FARM SETTINGS TAB ──────────────────────────── */}
      {activeTab === 'farm' && (
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
      {activeTab === 'cms' && currentUser?.role === 'SUPER_ADMIN' && (
        <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <ViewQuiltIcon color="primary" fontSize="large" /> {t('admin.cms_title', 'إدارة وتخصيص الصفحة الرئيسية')}
          </h2>
          <Typography variant="body2" sx={{ color: 'slate.500', mb: 6 }}>
            {isRTL 
              ? 'قم بتخصيص محتوى ونصوص الصفحة الرئيسية بالكامل. التغييرات تنعكس مباشرة في نافذة المعاينة الحية على اليسار.' 
              : 'Customize the landing page details dynamically. Updates appear instantly in the live mockup preview viewport on the left.'}
          </Typography>

          <Grid container spacing={6}>
            {/* Input Form Column */}
            <Grid item xs={12} lg={6} className="space-y-6">
              {/* Brand & Logo Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-violet-600 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                  {isRTL ? 'إعدادات الهوية واللوجو' : 'Identity & Logo Settings'}
                </p>
                <TextField fullWidth label={isRTL ? 'اسم الشعار بالإنجليزية' : 'Brand Name (EN)'} value={cmsData.logo_text_en || ''} onChange={(e) => setCmsData({...cmsData, logo_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'اسم الشعار بالعربية' : 'Brand Name (AR)'} value={cmsData.logo_text_ar || ''} onChange={(e) => setCmsData({...cmsData, logo_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'رابط صورة اللوجو (اختياري)' : 'Logo Image URL (Optional)'} value={cmsData.logo_url || ''} onChange={(e) => setCmsData({...cmsData, logo_url: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Hero Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-sky-600 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  {isRTL ? 'قسم الترحيب (Hero Section)' : 'Hero Section & Landing Headline'}
                </p>
                <TextField fullWidth label={isRTL ? 'العنوان الرئيسي بالإنجليزية' : 'Hero Title (EN)'} value={cmsData.hero_title_en || ''} onChange={(e) => setCmsData({...cmsData, hero_title_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'العنوان الرئيسي بالعربية' : 'Hero Title (AR)'} value={cmsData.hero_title_ar || ''} onChange={(e) => setCmsData({...cmsData, hero_title_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={2} label={isRTL ? 'الوصف الفرعي بالإنجليزية' : 'Hero Description (EN)'} value={cmsData.hero_text_en || ''} onChange={(e) => setCmsData({...cmsData, hero_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={2} label={isRTL ? 'الوصف الفرعي بالعربية' : 'Hero Description (AR)'} value={cmsData.hero_text_ar || ''} onChange={(e) => setCmsData({...cmsData, hero_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Crops Showcase Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-emerald-600 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  {isRTL ? 'قسم النخيل والتمور' : 'Palm & Dates Unit'}
                </p>
                <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع النخيل بالإنجليزية' : 'Palm Unit Description (EN)'} value={cmsData.palm_text_en} onChange={(e) => setCmsData({...cmsData, palm_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع النخيل بالعربية' : 'وصف قطاع النخيل بالعربية'} value={cmsData.palm_text_ar} onChange={(e) => setCmsData({...cmsData, palm_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box className="space-y-4">
                <p className="font-bold text-amber-500 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  {isRTL ? 'قسم الزيتون' : 'Olive & Oil Unit'}
                </p>
                <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع الزيتون بالإنجليزية' : 'Olive Unit Description (EN)'} value={cmsData.olive_text_en} onChange={(e) => setCmsData({...cmsData, olive_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع الزيتون بالعربية' : 'وصف قطاع الزيتون بالعربية'} value={cmsData.olive_text_ar} onChange={(e) => setCmsData({...cmsData, olive_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* About Us Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-indigo-500 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  {isRTL ? 'قسم عن الشركة (About Us Section)' : 'About Us & Mission Section'}
                </p>
                <TextField fullWidth label={isRTL ? 'عنوان قسم عن الشركة بالإنجليزية' : 'About Title (EN)'} value={cmsData.about_title_en || ''} onChange={(e) => setCmsData({...cmsData, about_title_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'عنوان قسم عن الشركة بالعربية' : 'About Title (AR)'} value={cmsData.about_title_ar || ''} onChange={(e) => setCmsData({...cmsData, about_title_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={3} label={isRTL ? 'وصف قسم عن الشركة بالإنجليزية' : 'About Description (EN)'} value={cmsData.about_text_en || ''} onChange={(e) => setCmsData({...cmsData, about_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={3} label={isRTL ? 'وصف قسم عن الشركة بالعربية' : 'About Description (AR)'} value={cmsData.about_text_ar || ''} onChange={(e) => setCmsData({...cmsData, about_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Features Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-teal-600 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  {isRTL ? 'قسم المميزات التقنية (Features Grid Section)' : 'Technical Features Grid Headline'}
                </p>
                <TextField fullWidth label={isRTL ? 'عنوان قسم المميزات بالإنجليزية' : 'Features Section Title (EN)'} value={cmsData.features_title_en || ''} onChange={(e) => setCmsData({...cmsData, features_title_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'عنوان قسم المميزات بالعربية' : 'Features Section Title (AR)'} value={cmsData.features_title_ar || ''} onChange={(e) => setCmsData({...cmsData, features_title_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Contact Us Settings */}
              <Box className="space-y-4">
                <p className="font-bold text-rose-500 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  {isRTL ? 'قسم اتصل بنا ودعوة التسجيل (Contact Us & Call to Action)' : 'Contact Us & Sign up CTA'}
                </p>
                <TextField fullWidth label={isRTL ? 'عنوان قسم اتصل بنا بالإنجليزية' : 'Contact Title (EN)'} value={cmsData.contact_title_en || ''} onChange={(e) => setCmsData({...cmsData, contact_title_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'عنوان قسم اتصل بنا بالعربية' : 'Contact Title (AR)'} value={cmsData.contact_title_ar || ''} onChange={(e) => setCmsData({...cmsData, contact_title_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={3} label={isRTL ? 'الوصف الفرعي بالإنجليزية' : 'Contact Subtext (EN)'} value={cmsData.contact_text_en || ''} onChange={(e) => setCmsData({...cmsData, contact_text_en: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth multiline rows={3} label={isRTL ? 'الوصف الفرعي بالعربية' : 'Contact Subtext (AR)'} value={cmsData.contact_text_ar || ''} onChange={(e) => setCmsData({...cmsData, contact_text_ar: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'البريد الإلكتروني المباشر' : 'Direct Email Address'} value={cmsData.contact_email || ''} onChange={(e) => setCmsData({...cmsData, contact_email: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                <TextField fullWidth label={isRTL ? 'الهاتف المباشر' : 'Direct Phone Number'} value={cmsData.contact_phone || ''} onChange={(e) => setCmsData({...cmsData, contact_phone: e.target.value})} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
              </Box>

              <div className="mt-8 text-right">
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleUpdateCMS} 
                  disabled={cmsLoading} 
                  sx={{ px: 6, py: 1.8, borderRadius: 3, fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 8px 24px -6px rgba(59, 130, 246, 0.4)' }}
                >
                  {cmsLoading ? <CircularProgress size={24} color="inherit" /> : (isRTL ? 'حفظ ونشر التعديلات ✓' : 'Deploy Layout Changes ✓')}
                </Button>
              </div>
            </Grid>

            {/* HIGH FIDELITY INTERACTIVE LIVE PREVIEW VIEWPORT MOCKUP */}
            <Grid item xs={12} lg={6}>
              <Box sx={{ 
                borderRadius: '32px', 
                bgcolor: '#080b13', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                p: 4, 
                position: 'sticky', 
                top: 24,
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8)',
                color: 'white',
                minHeight: 620,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'Outfit, Inter, sans-serif'
              }}>
                {/* Viewport header controls */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#eab308' }} />
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  </Box>
                  <Chip 
                    label={isRTL ? 'معاينة حية للمتصفح' : 'Live Mockup Preview'} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 800, fontSize: '0.65rem' }} 
                  />
                </Box>

                {/* Brand Logo Navigation mockup preview */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {cmsData.logo_url ? (
                      <Box component="img" src={cmsData.logo_url} sx={{ width: 18, height: 18, borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ width: 18, height: 18, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#10b981' }}>
                        <SpaIcon sx={{ color: 'white', fontSize: 11 }} />
                      </Box>
                    )}
                    <Typography sx={{ fontWeight: 900, fontSize: '0.75rem', color: 'white' }}>
                      {isRTL 
                        ? (cmsData.logo_text_ar || 'أطلس سيوة') 
                        : (cmsData.logo_text_en || 'Atlas Farm')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                      {isRTL ? 'الرئيسية' : 'Home'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                      {isRTL ? 'من نحن' : 'About'}
                    </Typography>
                  </Box>
                </Box>

                {/* Hero preview segment */}
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: '99px', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', mb: 2 }}>
                    <Box sx={{ width: 6, height: 6, bgcolor: '#10b981', borderRadius: '50%' }} />
                    <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 900, fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                      NEXT-GEN ERPI ENGINE
                    </Typography>
                  </Box>

                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 900, 
                      color: 'white', 
                      mb: 2, 
                      lineHeight: 1.2, 
                      letterSpacing: '-0.02em',
                      px: 2
                    }}
                  >
                    {isRTL 
                      ? (cmsData.hero_title_ar || 'الزراعة الدقيقة، أعيد تعريفها.') 
                      : (cmsData.hero_title_en || 'Precision Agriculture, Redefined.')}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.5)', 
                      fontSize: '0.75rem', 
                      lineHeight: 1.6, 
                      maxWidth: 320, 
                      mx: 'auto',
                      px: 2
                    }}
                  >
                    {isRTL 
                      ? (cmsData.hero_text_ar || 'إدارة مجالات النخيل والزيتون والمحاصيل الزراعية بسلاسة تامة.') 
                      : (cmsData.hero_text_en || 'Seamlessly manage Palm and Olive field structures.')}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3 }}>
                    <Box sx={{ px: 3, py: 1, borderRadius: '8px', bgcolor: '#10b981', color: 'white', fontSize: '0.7rem', fontWeight: 900 }}>
                      {isRTL ? 'ابدأ الآن' : 'Get Started'}
                    </Box>
                    <Box sx={{ px: 3, py: 1, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>
                      {isRTL ? 'اقرأ المزيد' : 'Learn More'}
                    </Box>
                  </Box>
                </Box>

                {/* Crops cards preview segment */}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Palm Card preview */}
                  <Grid item xs={6}>
                    <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SpaIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        <Typography sx={{ fontWeight: 950, fontSize: '0.7rem', color: '#10b981' }}>
                          {isRTL ? 'قطاع النخيل' : 'Palm'}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', lineHeight: 1.5 }}>
                        {isRTL 
                          ? (cmsData.palm_text_ar || 'تتبع كل شجرة أم و فسيلة.') 
                          : (cmsData.palm_text_en || 'Track Every Mother Tree & Offshoot.')}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Olive Card preview */}
                  <Grid item xs={6}>
                    <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ForestIcon sx={{ color: '#fbbf24', fontSize: 16 }} />
                        <Typography sx={{ fontWeight: 950, fontSize: '0.7rem', color: '#fbbf24' }}>
                          {isRTL ? 'قطاع الزيتون' : 'Olive'}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', lineHeight: 1.5 }}>
                        {isRTL 
                          ? (cmsData.olive_text_ar || 'عمليات حصاد متزامنة.') 
                          : (cmsData.olive_text_en || 'Synchronized Harvest Operations.')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Footer preview segment */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)', mt: 3 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                    © 2026 {isRTL ? (cmsData.logo_text_ar || 'أطلس سيوة') : (cmsData.logo_text_en || 'Atlas Farm')}
                  </Typography>
                  <Box sx={{ width: 18, height: 18, borderRadius: '4px', bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SpaIcon sx={{ color: 'white', fontSize: 10 }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* ── STORAGE AND DATA MANAGEMENT TAB ───────────── */}
      {activeTab === 'data' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER') && (
        <div className="space-y-8 animate-fadeIn">
          {/* Intro disclaimer */}
          <Alert severity="info" icon={<InfoIcon />} className="p-4 rounded-2xl border border-blue-200/50 bg-blue-50/20 text-slate-800">
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
              {isRTL ? 'لوحة التحكم وإدارة أصول قاعدة البيانات (Data Management Console)' : 'Storage & Database Data Management Console'}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.9 }}>
              {isRTL 
                ? 'تتيح لك هذه اللوحة المتقدمة إمكانية مسح وحذف البيانات لقطاعات معينة بالكامل لغايات التهيئة، أو إعادة حقنها عبر ملفات JSON لتبسيط إدارة وترحيل البيانات وتجربة النظام بسهولة فائقة.' 
                : 'This advanced dashboard allows you to wipe database modules selectively for maintenance, or inject structured mock/migration data via JSON files effortlessly.'}
            </Typography>
          </Alert>

          {/* Module Selection Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Farm Structure */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center mb-4">
                  <StorageIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'الهيكل التنظيمي (Farm Structure)' : 'Farm Structure'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'إدارة الحواش، الحقول، القطاعات، العقد الجغرافية، والبيانات التعريفية للمزرعة.' 
                    : 'Manage enclosures, fields, sectors, location nodes, and layout profiles.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>

            {/* Card 2: Users & Permissions */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <VerifiedUserIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'المستخدمين والصلاحيات (Users)' : 'Users & Permissions'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'إدارة وحذف حسابات المهندسين والمحاسبين ومدراء المخازن والعمال.' 
                    : 'Manage agricultural engineers, accountants, managers, and roles.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('users', isRTL ? 'حسابات المستخدمين' : 'Users & Permissions')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('users', isRTL ? 'حسابات المستخدمين' : 'Users & Permissions')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>

            {/* Card 3: Daily Task Reports & Operations */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <StorageIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'التقارير اليومية والتشغيل (Reports)' : 'Reports & Operations'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'التقارير اليومية للمهندسين، سجل الأنشطة، كشف الإنتاجية، وسجلات العمالة.' 
                    : 'Daily operational tasks, activities, productivity logs, and labor.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('reports', isRTL ? 'التقارير وسجلات التشغيل' : 'Reports & Operations')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('reports', isRTL ? 'التقارير وسجلات التشغيل' : 'Reports & Operations')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>

            {/* Card 4: Accounting & Finances */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                  <StorageIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'الحسابات والمعاملات (Accounting)' : 'Finances & Accounting'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'الأرباح والخسائر، سجل الإيرادات، كشف المصروفات، وأجور العمالة.' 
                    : 'Financial revenue ledger, expenses categories, and salary registries.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('finance', isRTL ? 'المعاملات المالية والحسابات' : 'Finances & Accounting')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('finance', isRTL ? 'المعاملات المالية والحسابات' : 'Finances & Accounting')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>

            {/* Card 5: Warehouse & Stock movements */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                  <StorageIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'المستودعات والمخازن (Warehouse)' : 'Warehouse & Stock'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'المستودعات النشطة، كشف المواد والأسمدة والمبيدات، وحركات التوريد والصرف.' 
                    : 'Active warehouses, pesticide and fertilizer items, and stock movement logs.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('warehouse', isRTL ? 'المستودعات والمخزون' : 'Warehouse & Stock')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('warehouse', isRTL ? 'المستودعات والمخزون' : 'Warehouse & Stock')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>

            {/* Card 6: Equipment & Fleet */}
            <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                  <StorageIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                  {isRTL ? 'الأسطول والمعدات (Fleet)' : 'Equipment & Fleet'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                  {isRTL 
                    ? 'الجرارات والآليات، سجل التشغيل اليومي، وجدول الصيانة الدورية.' 
                    : 'Fleet tractors and utilities, daily usage logs, and maintenance events.'}
                </Typography>
              </div>
              <div className="flex gap-2.5">
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="success" 
                  startIcon={<CloudUploadIcon />}
                  onClick={() => openInjectDialog('equipment', isRTL ? 'الأسطول والمعدات' : 'Equipment & Fleet')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حقن JSON' : 'Inject'}
                </Button>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => openPurgeDialog('equipment', isRTL ? 'الأسطول والمعدات' : 'Equipment & Fleet')}
                  sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  {isRTL ? 'حذف بالكامل' : 'Purge'}
                </Button>
              </div>
            </Card>
          </div>

          {/* JSON Schema Format Guides Panel */}
          <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card mt-8">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <CodeIcon className="text-green-600" />
              <span>{isRTL ? 'دليل بنية ملفات الـ JSON لكل قسم' : 'JSON Schema Struct Guides'}</span>
            </h3>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              {isRTL 
                ? 'اضغط على التبويبات بالأسفل لعرض البنية البرمجية المتوقعة وصيغ الإدخال المطلوبة لملف الـ JSON لكل قسم لتجنب الأخطاء أثناء حقن البيانات.' 
                : 'Click on the tabs below to inspect the expected JSON structure and format keys for each database module to prevent validation errors.'}
            </Typography>

            <Tabs 
              value={activeSchemaGuide} 
              onChange={(e, val) => setActiveSchemaGuide(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab value="farm" label={isRTL ? 'الهيكل التنظيمي' : 'Farm Struct'} />
              <Tab value="users" label={isRTL ? 'المستخدمين' : 'Users'} />
              <Tab value="reports" label={isRTL ? 'التقارير اليومية' : 'Reports'} />
              <Tab value="finance" label={isRTL ? 'المعاملات المالية' : 'Finances'} />
              <Tab value="warehouse" label={isRTL ? 'المخازن والمواد' : 'Warehouse'} />
              <Tab value="equipment" label={isRTL ? 'المعدات والصيانة' : 'Fleet'} />
            </Tabs>

            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl overflow-x-auto relative">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(schemaTemplates[activeSchemaGuide]);
                  toast.success(isRTL ? 'تم نسخ التنسيق بنجاح ✓' : 'Schema copied to clipboard ✓');
                }}
                className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg transition-all focus:outline-none"
              >
                {isRTL ? 'نسخ التنسيق' : 'Copy'}
              </button>
              <pre className="font-mono text-xs leading-relaxed max-h-[300px] overflow-y-auto">
                {schemaTemplates[activeSchemaGuide]}
              </pre>
            </div>
          </Card>
        </div>
      )}

      {/* ── PASSWORD RESET APPROVALS TAB ────────────────── */}
      {activeTab === 'password_resets' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') && (
        <div className="space-y-6 animate-fadeIn">
          <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} elevation={0}>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <LockIcon color="primary" fontSize="large" /> {isRTL ? 'طلبات استرداد كلمة المرور المعلقة' : 'Pending Password Recovery Requests'}
            </h2>
            <Typography variant="body2" sx={{ color: 'slate.500', mb: 6 }}>
              {isRTL 
                ? 'تظهر هنا جميع طلبات استعادة كلمة المرور التي قدمها المستخدمون. يمكنك مراجعة وتأكيد طلباتهم وتزويدهم بالرمز بعد الموافقة لإتاحة إعادة التعيين.' 
                : 'Review password reset requests filed by users. Once approved, the user can verify their token and proceed to set a new password.'}
            </Typography>

            {resetsLoading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress sx={{ color: '#16a34a' }} />
              </Box>
            ) : passwordResets.length === 0 ? (
              <Box textAlign="center" py={8} className="bg-white border border-dashed border-slate-200 rounded-3xl">
                <Typography color="textSecondary" fontWeight="bold">
                  {isRTL ? 'لا توجد طلبات استعادة كلمة مرور معلقة حالياً.' : 'No pending password reset requests at the moment.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {passwordResets.map(r => (
                  <Card 
                    key={r.id} 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      border: '1px solid #e2e8f0', 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' }, 
                      alignItems: { xs: 'flex-start', md: 'center' }, 
                      justifyContent: 'space-between', 
                      borderRadius: 4, 
                      gap: 3,
                      '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf450' },
                      transition: 'all 0.2s'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                      <Box sx={{ 
                        width: 52, height: 52, borderRadius: '16px', border: '2px solid #e2e8f0', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        bgcolor: r.is_approved ? '#f0fdf4' : '#fffbeb', color: r.is_approved ? '#16a34a' : '#d97706' 
                      }}>
                        <LockIcon fontSize="medium" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          {r.email}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{isRTL ? 'تم الطلب في:' : 'Requested at:'} {new Date(r.created_at).toLocaleString('ar-EG')}</span>
                          <span>&bull;</span>
                          <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {isRTL ? `الرمز: ${r.code}` : `Code: ${r.code}`}
                          </span>
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                      {r.is_approved ? (
                        <Chip 
                          label={isRTL ? 'تمت الموافقة ✓' : 'Approved ✓'} 
                          color="success" 
                          size="medium" 
                          sx={{ fontWeight: 800, borderRadius: 2 }} 
                        />
                      ) : (
                        <>
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="medium"
                            onClick={() => handleApproveReset(r.id)} 
                            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
                          >
                            {isRTL ? 'موافقة وتفعيل' : 'Approve & Activate'}
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="medium"
                            onClick={() => handleRejectReset(r.id)} 
                            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
                          >
                            {isRTL ? 'رفض وإلغاء' : 'Reject'}
                          </Button>
                        </>
                      )}
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Card>
        </div>
      )}

      {/* JSON DATA INJECTION DIALOG */}
      <Dialog
        open={injectDialogOpen}
        onClose={() => !uploadLoading && setInjectDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'black', color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon className="text-green-600" />
          <span>{isRTL ? `حقن سجلات JSON في ${selectedModuleName}` : `Inject JSON data in ${selectedModuleName}`}</span>
        </DialogTitle>
        <DialogContent className="space-y-4">
          <DialogContentText className="text-sm font-medium">
            {isRTL 
              ? 'يمكنك سحب وإسقاط ملف .json، أو تصفحه، أو لصق البيانات المنسقة مباشرة في المربع أدناه للبدء في حقن السجلات.'
              : 'You can drag and drop a .json file, browse, or paste formatting directly in the box below to start injecting records.'}
          </DialogContentText>

          {/* Drag & Drop File Browse trigger */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-green-500 hover:bg-green-50/10 cursor-pointer rounded-2xl p-6 text-center transition-all duration-300"
          >
            <CloudUploadIcon className="w-10 h-10 text-slate-400 mb-2" />
            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
              {isRTL ? 'اضغط هنا لتصفح ورفع ملف JSON من جهازك' : 'Click here to browse and select a JSON file'}
            </Typography>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".json" 
              className="hidden" 
            />
          </div>

          <TextField
            multiline
            rows={12}
            fullWidth
            placeholder="[ ... paste your JSON here ... ]"
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            disabled={uploadLoading}
            variant="outlined"
            inputProps={{ className: 'font-mono text-xs' }}
            sx={{ 
              bgcolor: '#f8fafc',
              borderRadius: '16px',
              '& .MuiOutlinedInput-notchedOutline': { borderRadius: '16px' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInjectDialogOpen(false)} disabled={uploadLoading} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleInjectData} 
            color="success" 
            variant="contained" 
            disabled={uploadLoading}
            sx={{ fontWeight: 'bold', borderRadius: '12px', minWidth: 120 }}
          >
            {uploadLoading ? <CircularProgress size={20} color="inherit" /> : (isRTL ? 'تأكيد الحقن' : 'Confirm Injection')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DOUBLE CONFIRMATION PURGE DIALOG */}
      <Dialog
        open={purgeDialogOpen}
        onClose={() => !uploadLoading && setPurgeDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 'black', color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteSweepIcon />
          <span>{isRTL ? `حذف وتطهير قسم: ${selectedModuleName}` : `Purge and Wipe Module: ${selectedModuleName}`}</span>
        </DialogTitle>
        <DialogContent className="space-y-4">
          <Alert severity="warning" className="rounded-xl">
            {isRTL 
              ? 'تحذير: هذا الإجراء مدمر وسيقوم بمسح وحذف جميع البيانات والسجلات في هذا القسم لجميع مستخدمي الشركة نهائيًا.'
              : 'Warning: This action is highly destructive and will wipe all data logs under this module for all users permanently.'}
          </Alert>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            {isRTL 
              ? `لتأكيد رغبتك بالمسح، يرجى كتابة كلمة DELETE بالأحرف الكبيرة في المربع بالأسفل:`
              : `To confirm this destructive action, please type the word DELETE in uppercase below:`}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="DELETE"
            value={purgeConfirmText}
            onChange={(e) => setPurgeConfirmText(e.target.value)}
            disabled={uploadLoading}
            variant="outlined"
            inputProps={{ className: 'font-mono uppercase font-bold text-center' }}
            sx={{ borderRadius: '10px', '& .MuiOutlinedInput-notchedOutline': { borderRadius: '10px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPurgeDialogOpen(false)} disabled={uploadLoading} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
            {isRTL ? 'تراجع' : 'Cancel'}
          </Button>
          <Button 
            onClick={handlePurgeData} 
            color="error" 
            variant="contained" 
            disabled={uploadLoading || purgeConfirmText !== 'DELETE'}
            sx={{ fontWeight: 'bold', borderRadius: '12px', minWidth: 120 }}
          >
            {uploadLoading ? <CircularProgress size={20} color="inherit" /> : (isRTL ? 'حذف نهائي مدمر' : 'Confirm Wipe')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminControls;
