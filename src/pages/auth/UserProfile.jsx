import React, { useState, useMemo } from 'react';
import { Card, Button, TextField, Avatar, Tabs, Tab, Box, Alert, CircularProgress, LinearProgress } from '@mui/material';
import { useAuth } from '../../app/AuthContext';
import { updateMe, updatePassword } from '../../features/auth/services';
import { useTranslation } from 'react-i18next';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import { getActivityLogs } from '../../features/auth/services';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (<Box sx={{ pt: 3, px: { xs: 1, md: 3 } }}>{children}</Box>)}
    </div>
  );
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '#e2e8f0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'ضعيفة جداً', color: '#ef4444' },
    { label: 'ضعيفة', color: '#f97316' },
    { label: 'متوسطة', color: '#eab308' },
    { label: 'جيدة', color: '#22c55e' },
    { label: 'قوية جداً', color: '#16a34a' },
  ];
  const idx = Math.min(score, 5) - 1;
  return { score: (score / 5) * 100, label: levels[Math.max(idx, 0)]?.label || '', color: levels[Math.max(idx, 0)]?.color || '#e2e8f0' };
};

const UserProfile = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);
  
  // Identity Tab
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', phones: user?.phones ? user.phones.join(', ') : '' });
  const [identityMsg, setIdentityMsg] = useState({ type: '', text: '' });

  // Security Tab
  const [secLoading, setSecLoading] = useState(false);
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [secMsg, setSecMsg] = useState({ type: '', text: '' });

  const passwordStrength = useMemo(() => getPasswordStrength(passwords.new_password), [passwords.new_password]);

  // Activity Log
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  React.useEffect(() => {
    if (tabIndex === 2) fetchLogs();
  }, [tabIndex]);

  const handleUpdateIdentity = async () => {
    setLoading(true); setIdentityMsg({ type: '', text: '' });
    try {
      const payload = { name: formData.name, phones: formData.phones.split(',').map(s => s.trim()).filter(Boolean) };
      await updateMe(payload);
      setIdentityMsg({ type: 'success', text: t('profile.update_success', 'تم تحديث البيانات بنجاح!') });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { setIdentityMsg({ type: 'error', text: t('profile.update_error', 'حدث خطأ أثناء التحديث.') }); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecMsg({ type: '', text: '' });
    if (passwords.new_password !== passwords.confirm_password) {
      return setSecMsg({ type: 'error', text: t('profile.passwords_mismatch', 'كلمات المرور غير متطابقة') });
    }
    if (passwords.new_password.length < 8) {
      return setSecMsg({ type: 'error', text: t('profile.password_too_short', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل') });
    }
    setSecLoading(true);
    try {
      await updatePassword({ old_password: passwords.old_password, new_password: passwords.new_password });
      setSecMsg({ type: 'success', text: t('profile.password_success', 'تم تغيير كلمة المرور بنجاح') });
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setSecMsg({ type: 'error', text: err.response?.data?.detail || t('profile.password_error', 'الرقم السري القديم غير صحيح') });
    } finally {
      setSecLoading(false);
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t('profile.never', 'لم يتم بعد');
    return new Date(dateStr).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-green-600/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex gap-5 items-center z-10 relative">
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#16a34a', fontSize: 32, fontWeight: 'black', border: '4px solid rgba(255,255,255,0.1)' }}>
            {user.name[0].toUpperCase()}
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2 mb-1">
              {user.name} <VerifiedUserIcon fontSize="small" sx={{ color: '#4ade80' }} />
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">{user.email}</p>
            <div className="inline-block mt-3 px-3 py-1 bg-white/10 rounded-lg text-xs font-bold tracking-widest uppercase text-green-400 border border-green-400/20">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>
        {/* Meta info */}
        <div className="flex gap-6 mt-4 sm:mt-0 z-10 relative">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <CalendarTodayIcon sx={{ fontSize: 14 }} />
            <div>
              <p className="font-bold text-slate-300">{t('profile.joined', 'تاريخ الانضمام')}</p>
              <p>{formatDate(user.date_joined)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <AccessTimeIcon sx={{ fontSize: 14 }} />
            <div>
              <p className="font-bold text-slate-300">{t('profile.last_login', 'آخر تسجيل دخول')}</p>
              <p>{formatDate(user.last_login)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card elevation={0} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-2">
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTabs-indicator': { backgroundColor: '#16a34a', height: 3 } }}>
          <Tab icon={<BadgeIcon />} iconPosition="start" label={t('profile.tab_identity', 'البيانات الشخصية')} sx={{ textTransform: 'none', fontWeight: 700, '&.Mui-selected': { color: '#16a34a' } }} />
          <Tab icon={<SecurityIcon />} iconPosition="start" label={t('profile.tab_security', 'الأمان والمرور')} sx={{ textTransform: 'none', fontWeight: 700, '&.Mui-selected': { color: '#16a34a' } }} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label={t('profile.tab_activity', 'سجل النشاط')} sx={{ textTransform: 'none', fontWeight: 700, '&.Mui-selected': { color: '#16a34a' } }} />
          <Tab icon={<SettingsIcon />} iconPosition="start" label={t('profile.tab_settings', 'الإعدادات')} sx={{ textTransform: 'none', fontWeight: 700, '&.Mui-selected': { color: '#16a34a' } }} />
        </Tabs>

        {/* Identity Tab */}
        <TabPanel value={tabIndex} index={0}>
          <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
            {identityMsg.text && <Alert severity={identityMsg.type}>{identityMsg.text}</Alert>}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.full_name', 'الاسم الكامل')}</label>
              <TextField fullWidth value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} variant="outlined" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.contact_numbers', 'أرقام التواصل')}</label>
              <TextField fullWidth value={formData.phones} onChange={e => setFormData({...formData, phones: e.target.value})} variant="outlined" placeholder="0501234567" helperText={t('profile.phones_helper', 'أدخل الأرقام مفصولة بفاصلة')} />
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.email_label', 'البريد الإلكتروني')}</p>
                <p className="text-sm font-semibold text-slate-700">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.role_label', 'الدور الوظيفي')}</p>
                <p className="text-sm font-semibold text-slate-700">{user.role.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.joined', 'تاريخ الانضمام')}</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(user.date_joined)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('profile.last_login', 'آخر تسجيل دخول')}</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(user.last_login)}</p>
              </div>
            </div>

            <Button variant="contained" disabled={loading} onClick={handleUpdateIdentity} sx={{ py: 1.5, px: 4, borderRadius: '10px', bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, fontWeight: 'bold' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : t('profile.update_btn', 'حفظ التغييرات')}
            </Button>
          </div>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabIndex} index={1}>
          <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium">
              {t('profile.password_warning', 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل. نوصي باستخدام حروف، أرقام، ورموز لتأمين حسابك.')}
            </div>
            {secMsg.text && <Alert severity={secMsg.type} sx={{ borderRadius: '10px' }}>{secMsg.text}</Alert>}
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.old_password', 'كلمة المرور الحالية')}</label>
                <TextField fullWidth type="password" required value={passwords.old_password} onChange={e => setPasswords({...passwords, old_password: e.target.value})} variant="outlined" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.new_password', 'كلمة المرور الجديدة')}</label>
                <TextField fullWidth type="password" required value={passwords.new_password} onChange={e => setPasswords({...passwords, new_password: e.target.value})} variant="outlined" />
                {passwords.new_password && (
                  <div className="mt-2">
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': { bgcolor: passwordStrength.color, borderRadius: 3 },
                      }}
                    />
                    <p className="text-xs font-bold mt-1" style={{ color: passwordStrength.color }}>
                      {t('profile.password_strength', 'قوة كلمة المرور')}: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">{t('profile.confirm_password', 'تأكيد كلمة المرور')}</label>
                <TextField fullWidth type="password" required value={passwords.confirm_password} onChange={e => setPasswords({...passwords, confirm_password: e.target.value})} variant="outlined" />
              </div>
              <Button type="submit" variant="contained" disabled={secLoading} sx={{ py: 1.5, px: 4, borderRadius: '10px', bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' }, fontWeight: 'bold', width: '100%' }}>
                {secLoading ? <CircularProgress size={24} color="inherit" /> : t('profile.change_password_btn', 'تحديث كلمة المرور')}
              </Button>
            </form>
          </div>
        </TabPanel>

        {/* Activity Log Tab */}
        <TabPanel value={tabIndex} index={2}>
          <div className="max-w-4xl mx-auto space-y-4 pt-4 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{t('profile.activity_history', 'سجل العمليات الأخير')}</h3>
              <Button size="small" onClick={fetchLogs} startIcon={<HistoryIcon />} sx={{ color: '#16a34a' }}>
                {t('profile.refresh', 'تحديث')}
              </Button>
            </div>

            {logsLoading ? (
              <div className="flex flex-col items-center py-12">
                <CircularProgress size={40} sx={{ color: '#16a34a', mb: 2 }} />
                <p className="text-slate-500 font-medium">{t('profile.loading_logs', 'جاري تحميل السجلات...')}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <HistoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
                <p className="text-slate-500 font-bold">{t('profile.no_logs', 'لا توجد سجلات نشاط حتى الآن')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-green-200 hover:shadow-md transition-all group">
                    <div className={`mt-1 p-2 rounded-xl flex items-center justify-center ${
                      log.module === 'Warehouse' ? 'bg-amber-100 text-amber-600' :
                      log.module === 'Farm' ? 'bg-green-100 text-green-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <HistoryIcon fontSize="small" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">{log.action}</p>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                          {log.module}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <CalendarTodayIcon sx={{ fontSize: 10 }} /> {formatDate(log.created_at)}
                        {log.ip_address && <span className="mx-2">•</span>}
                        {log.ip_address && <span className="opacity-60">{log.ip_address}</span>}
                      </p>
                      {user.role === 'SUPER_ADMIN' && log.user_name && (
                         <p className="text-[10px] text-green-600 font-bold mt-1 uppercase">
                           By: {log.user_name}
                         </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabIndex} index={3}>
           <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
             <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
               <div>
                 <h4 className="font-bold text-slate-800 mb-1">{t('profile.language', 'لغة النظام')}</h4>
                 <p className="text-sm text-slate-500">{t('profile.language_desc', 'قم بالتبديل بين العربية والإنجليزية.')}</p>
               </div>
               <Button variant="outlined" onClick={toggleLanguage} sx={{ borderRadius: '8px', color: '#64748b', borderColor: '#cbd5e1', fontWeight: 'bold', px: 3 }}>
                 {i18n.language === 'ar' ? 'English' : 'عربي'}
               </Button>
             </div>
           </div>
        </TabPanel>
      </Card>
    </div>
  );
};
export default UserProfile;
