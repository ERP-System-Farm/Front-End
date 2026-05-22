import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Button,
  TextField,
  Avatar,
  Tabs,
  Tab,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useAuth } from '../../app/AuthContext';
import { updateMe, updatePassword } from '../../features/auth/services';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { toast } from 'sonner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { reportsApi } from '../../services/reportsApi';
import { getAbsoluteFileUrl } from '../../lib/utils';


// Material Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CampaignIcon from '@mui/icons-material/Campaign';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LaunchIcon from '@mui/icons-material/Launch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SpaIcon from '@mui/icons-material/Spa';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import WorkIcon from '@mui/icons-material/Work';


const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (
        <Box sx={{ pt: 3, px: { xs: 1, md: 3 } }}>{children}</Box>
      )}
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
  return {
    score: (score / 5) * 100,
    label: levels[Math.max(idx, 0)]?.label || '',
    color: levels[Math.max(idx, 0)]?.color || '#e2e8f0'
  };
};

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [tabIndex, setTabIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Identity Form State
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phones: user?.phones ? user.phones.join(', ') : ''
  });
  const [identityMsg, setIdentityMsg] = useState({ type: '', text: '' });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let avatarUrl = '';
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

      if (cloudName && uploadPreset) {
        // Upload to Cloudinary
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', uploadPreset);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: fd }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Upload failed');
        }
        const data = await res.json();
        avatarUrl = data.secure_url;
      } else {
        // Local upload fallback
        const res = await reportsApi.uploadFile(file);
        const uploadedUrl = res.data?.file_url || res.data?.url || '';
        avatarUrl = uploadedUrl;
      }

      if (avatarUrl) {
        const updatedUser = await updateMe({ avatar_url: avatarUrl });
        setUser(updatedUser);
        toast.success(isRTL ? "تم تحديث الصورة الشخصية بنجاح" : "Avatar updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رفع الصورة الشخصية" : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    try {
      const updatedUser = await updateMe({ avatar_url: "" });
      setUser(updatedUser);
      toast.success(isRTL ? "تم حذف الصورة الشخصية بنجاح" : "Avatar removed successfully");
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل حذف الصورة الشخصية" : "Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  };


  // Security Form State
  const [secLoading, setSecLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [secMsg, setSecMsg] = useState({ type: '', text: '' });

  // Visibility Toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() =>
    getPasswordStrength(passwords.new_password),
    [passwords.new_password]
  );

  // Activity Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Notifications / Announcements
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // Employee Profile & Documents / Requests State
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [newLeave, setNewLeave] = useState({
    leave_type: 'annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [openDocDialog, setOpenDocDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({
    document_type: 'national_id',
    issue_date: '',
    expiry_date: '',
    notes: '',
    document_file: null
  });
  const [docLoading, setDocLoading] = useState(false);

  const fetchEmployeeData = async () => {
    setEmployeeLoading(true);
    try {
      const res = await api.get('/hr/employees/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const matched = list.find(emp => emp.email === user.email);
      if (matched) {
        setEmployeeProfile(matched);
        fetchLeaveRequests();
      }
    } catch (err) {
      console.error("Error fetching employee details:", err);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    setLeavesLoading(true);
    try {
      const res = await api.get('/hr/leaves/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setLeaveRequests(list);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    } finally {
      setLeavesLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.document_file) {
      toast.error(isRTL ? "الرجاء اختيار ملف المستند أولاً" : "Please select a file first");
      return;
    }
    setDocLoading(true);
    try {
      const fd = new FormData();
      fd.append("employee", employeeProfile.id);
      fd.append("document_type", newDoc.document_type);
      fd.append("issue_date", newDoc.issue_date);
      fd.append("expiry_date", newDoc.expiry_date);
      fd.append("notes", newDoc.notes);
      fd.append("document_file", newDoc.document_file);

      await api.post('/hr/documents/', fd);
      toast.success(isRTL ? "تم رفع المستند بنجاح وهو قيد المراجعة" : "Document uploaded successfully and is under review");
      setOpenDocDialog(false);
      setNewDoc({
        document_type: 'national_id',
        issue_date: '',
        expiry_date: '',
        notes: '',
        document_file: null
      });
      fetchEmployeeData();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? "فشل رفع المستند" : "Failed to upload document");
    } finally {
      setDocLoading(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setLeavesLoading(true);
    try {
      await api.post('/hr/leaves/', {
        leave_type: newLeave.leave_type,
        start_date: newLeave.start_date,
        end_date: newLeave.end_date,
        reason: newLeave.reason
      });
      toast.success(isRTL ? "تم تقديم طلب الإجازة بنجاح وهو قيد المراجعة" : "Leave request submitted successfully and is pending review");
      setOpenLeaveDialog(false);
      setNewLeave({
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      fetchLeaveRequests();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || "";
      toast.error(isRTL ? `فشل تقديم طلب الإجازة: ${detail}` : `Failed to submit leave request: ${detail}`);
    } finally {
      setLeavesLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      // Assuming getActivityLogs endpoint or similar
      const res = await api.get('auth/activity-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setNotifsLoading(true);
    try {
      const res = await api.get('notifications/');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    if (tabIndex === 0) {
      fetchNotifications();
    } else if (tabIndex === 2) {
      fetchLeaveRequests();
    } else if (tabIndex === 4) {
      fetchLogs();
    }
  }, [tabIndex]);

  const handleUpdateIdentity = async () => {
    setLoading(true);
    setIdentityMsg({ type: '', text: '' });
    try {
      const payload = {
        name: formData.name,
        phones: formData.phones.split(',').map(s => s.trim()).filter(Boolean)
      };
      await updateMe(payload);
      setIdentityMsg({
        type: 'success',
        text: t('profile.update_success', 'تم تحديث البيانات بنجاح!')
      });
      toast.success(isRTL ? "تم تحديث البيانات الشخصية بنجاح" : "Identity details updated successfully!");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setIdentityMsg({
        type: 'error',
        text: t('profile.update_error', 'حدث خطأ أثناء التحديث.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecMsg({ type: '', text: '' });

    if (passwords.new_password !== passwords.confirm_password) {
      return setSecMsg({
        type: 'error',
        text: t('profile.passwords_mismatch', 'كلمات المرور غير متطابقة')
      });
    }
    if (passwords.new_password.length < 8) {
      return setSecMsg({
        type: 'error',
        text: t('profile.password_too_short', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      });
    }

    setSecLoading(true);
    try {
      await updatePassword({
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      setSecMsg({
        type: 'success',
        text: t('profile.password_success', 'تم تغيير كلمة المرور بنجاح')
      });
      toast.success(isRTL ? "تم تغيير كلمة المرور بنجاح" : "Password updated successfully");
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setSecMsg({
        type: 'error',
        text: err.response?.data?.detail || t('profile.password_error', 'الرقم السري القديم غير صحيح')
      });
    } finally {
      setSecLoading(false);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.patch('notifications/read-all/');
      toast.success(isRTL ? "تم تحديد جميع الإشعارات كمقروءة" : "All notifications marked as read");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleNotifAsRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/read/`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
    toast.info(next === 'ar' ? "تم تغيير اللغة للعربية" : "Language set to English");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t('profile.never', 'لم يتم بعد');
    return new Date(dateStr).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Time-based Greetings
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isRTL ? 'صباح الخير' : 'Good Morning';
    if (hour < 18) return isRTL ? 'طاب يومك' : 'Good Afternoon';
    return isRTL ? 'مساء الخير' : 'Good Evening';
  };

  // Dynamic Shortcuts Based on Roles to facilitate project usage
  const getRoleShortcuts = () => {
    const role = user?.role || 'ENGINEER';
    const common = [
      { label: isRTL ? 'الصفحة الرئيسية' : 'Dashboard', path: '/dashboard', icon: <DashboardIcon className="text-emerald-500" />, color: 'bg-emerald-500/10' },
    ];

    if (role === 'SUPER_ADMIN' || role === 'OWNER') {
      return [
        ...common,
        { label: isRTL ? 'لوحة التحكم الإدارية' : 'Admin Controls', path: '/dashboard?tab=admin', icon: <SettingsIcon className="text-amber-500" />, color: 'bg-amber-500/10' },
        { label: isRTL ? 'الهيكل والمزرعة' : 'Farm Structure', path: '/farm', icon: <SpaIcon className="text-green-500" />, color: 'bg-green-500/10' },
        { label: isRTL ? 'المستودع والمخازن' : 'Inventory Ledger', path: '/warehouse', icon: <InventoryIcon className="text-blue-500" />, color: 'bg-blue-500/10' },
        { label: isRTL ? 'الحسابات والمالية' : 'Finance Dashboard', path: '/accounting', icon: <AccountBalanceWalletIcon className="text-purple-500" />, color: 'bg-purple-500/10' },
      ];
    }

    if (role === 'MANAGER') {
      return [
        ...common,
        { label: isRTL ? 'الهيكل والمزرعة' : 'Farm Structure', path: '/farm', icon: <SpaIcon className="text-green-500" />, color: 'bg-green-500/10' },
        { label: isRTL ? 'المستودع والمخازن' : 'Inventory Ledger', path: '/warehouse', icon: <InventoryIcon className="text-blue-500" />, color: 'bg-blue-500/10' },
        { label: isRTL ? 'إدارة الأسطول والمعدات' : 'Fleet Manager', path: '/fleet', icon: <SpeedIcon className="text-indigo-500" />, color: 'bg-indigo-500/10' },
      ];
    }

    // Default Engineers & standard users
    return [
      ...common,
      { label: isRTL ? 'الهيكل والمزرعة' : 'Farm Structure', path: '/farm', icon: <SpaIcon className="text-green-500" />, color: 'bg-green-500/10' },
      { label: isRTL ? 'جدول المهام اليومية' : 'Daily Task Reports', path: '/dashboard', icon: <AssessmentIcon className="text-orange-500" />, color: 'bg-orange-500/10' },
    ];
  };

  // Mock announcement board for live news updates if empty
  const mockAnnouncements = [
    {
      id: 'm1',
      title_ar: 'تحديث منصة أطلس الموحدة v2.5',
      title_en: 'Atlas unified system upgrade v2.5',
      desc_ar: 'إضافة إمكانية إستيراد وتصدير بيانات الهياكل والمستودعات عبر ملفات JSON للتحكم الفائق بالسوبر أدمن.',
      desc_en: 'Enabled full bulk import and export of farm metadata via JSON files for elevated super administration.',
      badge_ar: 'تحديث النظام',
      badge_en: 'Core Upgrade',
      color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    },
    {
      id: 'm2',
      title_ar: 'بدء جدولة أعمال الري الذاتي للقطاع الشمالي',
      title_en: 'Automated irrigation cycle for North Sector',
      desc_ar: 'الرجاء من مهندسي الحقل مطابقة تقارير الرطوبة مع سجلات البوابة الإلكترونية قبل الحصاد.',
      desc_en: 'Field engineers are kindly requested to verify moisture indexes on agricultural reports before harvest.',
      badge_ar: 'العمليات الحقلية',
      badge_en: 'Operations',
      color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    },
    {
      id: 'm3',
      title_ar: 'تحقيق أرقام قياسية لإنتاج زيت الزيتون',
      title_en: 'Record breaking Olive Oil extraction',
      desc_ar: 'زاد معدل إنتاج الزيت المعصور بنسبة 18٪ عن الموسم المنصرم نتيجة تقنيات التسميد الذكي الجديدة.',
      desc_en: 'Extraction yield increased by 18% compared to last season due to smart smart organic fertilization cycles.',
      badge_ar: 'تقارير الحصاد',
      badge_en: 'Yield Metrics',
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    }
  ];

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 w-full space-y-6 text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ─── 1. TOP PREMIUM USER INFO PROFILE BLOCK ─── */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-6 select-none">

        {/* Dynamic mesh graphics */}
        <div className="absolute top-[-50%] left-[-10%] w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-10%] w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-5 items-center z-10 relative text-center sm:text-left rtl:sm:text-right w-full sm:w-auto">
          <div className="relative group cursor-pointer">
            <Avatar
              src={user.avatar_url ? getAbsoluteFileUrl(user.avatar_url) : undefined}
              sx={{
                width: 90,
                height: 90,
                bgcolor: '#10b981',
                fontSize: 36,
                fontWeight: 'black',
                border: '4px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
              }}
              className="hover:scale-105 transition-transform duration-300"
            >
              {user.name[0].toUpperCase()}
            </Avatar>
            {/* Hover overlay camera icon */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <PhotoCameraIcon className="text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span>{user.name}</span>
              <VerifiedUserIcon className="text-emerald-400 w-6 h-6 animate-pulse" />
            </h1>
            <p className="text-slate-400 font-semibold text-sm md:text-base mb-2">{user.email}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-xs font-black uppercase tracking-wider text-emerald-400">
                {user.role.replace('_', ' ')}
              </span>
              
              {/* Photo controls */}
              <button
                onClick={() => document.getElementById('avatar-input-main')?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {uploading ? (
                  <CircularProgress size={12} color="inherit" />
                ) : (
                  <PhotoCameraIcon sx={{ fontSize: 14 }} />
                )}
                <span>{isRTL ? "تغيير الصورة" : "Change Photo"}</span>
              </button>
              {user.avatar_url && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 transition-colors cursor-pointer"
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                  <span>{isRTL ? "حذف الصورة" : "Remove"}</span>
                </button>
              )}
            </div>
            {/* Hidden fallback input */}
            <input
              id="avatar-input-main"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
          </div>
        </div>


        {/* Action / Meta Panel */}
        <div className="flex flex-wrap justify-center gap-4 lg:gap-6 z-10 relative w-full sm:w-auto">

          <div className="flex gap-4.5 bg-white/5 border border-white/8 rounded-2xl p-4.5">
            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <CalendarTodayIcon className="text-emerald-400 w-4.5 h-4.5" />
              <div>
                <p className="font-bold text-slate-200">{t('profile.joined', 'تاريخ الانضمام')}</p>
                <p className="text-slate-400 font-semibold mt-0.5">{formatDate(user.date_joined)}</p>
              </div>
            </div>

            <div className="w-[1px] bg-white/10 self-stretch" />

            <div className="flex items-center gap-2.5 text-slate-400 text-xs">
              <AccessTimeIcon className="text-emerald-400 w-4.5 h-4.5" />
              <div>
                <p className="font-bold text-slate-200">{t('profile.last_login', 'آخر تسجيل دخول')}</p>
                <p className="text-slate-400 font-semibold mt-0.5">{formatDate(user.last_login)}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─── 2. TABS NAVIGATION ─── */}
      <Card elevation={0} className="border border-border bg-card shadow-sm rounded-3xl overflow-hidden p-2.5">
        <Tabs
          value={tabIndex}
          onChange={(e, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#10b981', height: 3.5, borderRadius: '4px' },
            '& .MuiTab-root': { color: 'var(--color-muted-foreground)', minHeight: 52, py: 1 }
          }}
        >
          <Tab icon={<DashboardIcon />} iconPosition="start" label={isRTL ? 'لوحة التحكم الشخصية' : 'My Dashboard'} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
          <Tab icon={<BadgeIcon />} iconPosition="start" label={t('profile.tab_identity', 'البيانات الشخصية')} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
          <Tab icon={<WorkIcon />} iconPosition="start" label={isRTL ? 'ملفي الوظيفي والطلبات' : 'Employment & Requests'} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
          <Tab icon={<SecurityIcon />} iconPosition="start" label={t('profile.tab_security', 'الأمان والحماية')} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label={t('profile.tab_activity', 'سجل العمليات')} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
          <Tab icon={<SettingsIcon />} iconPosition="start" label={t('profile.tab_settings', 'الإعدادات')} sx={{ textTransform: 'none', fontWeight: 800, '&.Mui-selected': { color: '#10b981' } }} />
        </Tabs>

        {/* ─── TAB 0: DASHBOARD & QUICK ACTIONS WORKSPACE ─── */}
        <TabPanel value={tabIndex} index={0}>
          <Grid container spacing={4} className="pb-8 pt-2">

            {/* Left Column (60%): Quick Links & Profile Summary */}
            <Grid item xs={12} lg={7} className="space-y-6">

              {/* Personalized Greetings Box */}
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

                <h3 className="text-xl sm:text-2xl font-black text-foreground mb-1.5">
                  {getGreeting()}، {user.name} 👋
                </h3>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                  {isRTL
                    ? 'أهلاً بك في منصتك الشخصية! يمكنك هنا إدارة بياناتك الشخصية، واستخدام روابط الوصول السريع أدناه للانتقال لأقسام المزرعة بسهولة تامة.'
                    : 'Welcome back to your workspace! Complete your tasks, update settings, or use the dynamic shortcuts below to visit various departments.'}
                </p>
              </div>

              {/* Dynamic Quick Access Cards */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <DashboardIcon className="w-5 h-5 text-emerald-500" />
                    <span>{isRTL ? 'روابط الوصول السريع المخصصة' : 'Quick Access Shortcuts'}</span>
                  </h4>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    {isRTL ? 'حسب دورك الوظيفي' : 'Based on role'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getRoleShortcuts().map((shortcut, idx) => (
                    <a
                      key={idx}
                      href={shortcut.path}
                      className="group flex items-center justify-between p-4.5 bg-card hover:bg-muted border border-border hover:border-emerald-500/25 rounded-2xl transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${shortcut.color} group-hover:scale-110 transition-transform`}>
                          {shortcut.icon}
                        </div>
                        <span className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          {shortcut.label}
                        </span>
                      </div>
                      <LaunchIcon className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="p-5 bg-muted/40 border border-border rounded-3xl space-y-3.5">
                <h4 className="text-sm font-extrabold text-foreground">{isRTL ? 'خصائص الحساب الفنية' : 'Technical Specifications'}</h4>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-card border border-border/80 p-3.5 rounded-2xl">
                    <span className="text-muted-foreground block mb-0.5">{isRTL ? 'هوية المستخدم (UUID)' : 'User UUID'}</span>
                    <span className="font-mono text-foreground break-all text-[11px] block">{user.id}</span>
                  </div>

                  <div className="bg-card border border-border/80 p-3.5 rounded-2xl">
                    <span className="text-muted-foreground block mb-0.5">{isRTL ? 'نوع الصلاحيات' : 'Role Permissions'}</span>
                    <span className="text-emerald-500 font-extrabold uppercase">{user.role}</span>
                  </div>
                </div>
              </div>

            </Grid>

            {/* Right Column (40%): Live Operations Feed & Notifications Feed */}
            <Grid item xs={12} lg={5} className="space-y-6">

              {/* Dynamic Notification and Updates Header */}
              <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/85">
                  <h4 className="text-base font-black text-foreground flex items-center gap-2.5">
                    <NotificationsIcon className="text-emerald-500" />
                    <span>{isRTL ? 'أحدث المستجدات والإشعارات' : 'Announcements & Notifications'}</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </h4>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={fetchNotifications}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title={isRTL ? 'تحديث الإشعارات' : 'Refresh Updates'}
                    >
                      <RefreshIcon className="w-4.5 h-4.5" />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="p-1.5 rounded-lg hover:bg-muted text-emerald-500 hover:text-emerald-600 cursor-pointer transition-colors"
                        title={isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                      >
                        <MarkChatReadIcon className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time server notifications list */}
                {notifsLoading ? (
                  <div className="flex flex-col items-center py-6">
                    <CircularProgress size={30} className="text-emerald-500 mb-2" />
                    <p className="text-xs text-muted-foreground font-semibold">{isRTL ? 'جاري جلب آخر التحديثات...' : 'Syncing notifications...'}</p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && markSingleNotifAsRead(notif.id)}
                        className={`group relative p-3.5 border rounded-2xl transition-all duration-200 cursor-pointer text-xs ${notif.is_read
                          ? 'bg-card border-border/80 hover:bg-muted/30 text-muted-foreground'
                          : 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground font-semibold shadow-xs'
                          }`}
                      >
                        {/* Unread circle */}
                        {!notif.is_read && (
                          <span className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}

                        <p className="text-xs leading-relaxed pr-6 rtl:pr-0 rtl:pl-6 text-foreground font-bold">
                          {isRTL ? notif.message_ar : notif.message_en}
                        </p>

                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                          <span>{formatDate(notif.created_at)}</span>
                          <span className="uppercase text-[9px] font-black tracking-wider bg-muted border border-border px-1.5 py-0.5 rounded-md">
                            {notif.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <CheckCircleIcon className="w-10 h-10 text-emerald-500/30 mb-2" />
                    <p className="text-xs text-muted-foreground font-extrabold">{isRTL ? 'لا توجد إشعارات معلقة' : 'No pending notifications'}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{isRTL ? 'كل شيء يبدو في حالة ممتازة!' : 'Everything is working cleanly!'}</p>
                  </div>
                )}

                {/* System Announcements Board (Always available news feed) */}
                <div className="space-y-3 pt-3 border-t border-border/85">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-muted-foreground">
                    <CampaignIcon className="w-4.5 h-4.5 text-emerald-500" />
                    <span>{isRTL ? 'أخبار وتحديثات المنشأة الزراعية' : 'Farm News & Announcements'}</span>
                  </div>

                  <div className="space-y-3">
                    {mockAnnouncements.map((announce) => (
                      <div key={announce.id} className="p-4 bg-muted/40 border border-border rounded-2xl hover:border-emerald-500/15 transition-all text-xs">
                        <div className="flex justify-between items-start mb-1.5">
                          <h5 className="font-extrabold text-foreground group-hover:text-emerald-500 transition-colors">
                            {isRTL ? announce.title_ar : announce.title_en}
                          </h5>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${announce.color}`}>
                            {isRTL ? announce.badge_ar : announce.badge_en}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-[11px]">
                          {isRTL ? announce.desc_ar : announce.desc_en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </Grid>

          </Grid>
        </TabPanel>

        {/* ─── TAB 1: IDENTITY PERSONAL DETAILS FORM ─── */}
        <TabPanel value={tabIndex} index={1}>
          <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
            {identityMsg.text && (
              <Alert severity={identityMsg.type} className="rounded-2xl border border-emerald-500/10">
                {identityMsg.text}
              </Alert>
            )}

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                {t('profile.full_name', 'الاسم الكامل')}
              </label>
              <TextField
                fullWidth
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-bg-card)',
                    '&.Mui-focused fieldset': { borderColor: '#10b981' }
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                {t('profile.contact_numbers', 'أرقام التواصل')}
              </label>
              <TextField
                fullWidth
                value={formData.phones}
                onChange={e => setFormData({ ...formData, phones: e.target.value })}
                variant="outlined"
                placeholder="0501234567"
                helperText={t('profile.phones_helper', 'أدخل الأرقام مفصولة بفاصلة')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '16px',
                    backgroundColor: 'var(--color-bg-card)',
                    '&.Mui-focused fieldset': { borderColor: '#10b981' }
                  }
                }}
              />
            </div>

            {/* Read-only account parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4.5 bg-muted/40 rounded-3xl border border-border">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('profile.email_label', 'البريد الإلكتروني')}
                </p>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('profile.role_label', 'الدور الوظيفي')}
                </p>
                <p className="text-sm font-semibold text-foreground">{user.role.replace('_', ' ')}</p>
              </div>

              <div className="h-[1px] bg-border sm:col-span-2 my-1" />

              <div>
                <p className="text-xs font-bold text-muted-foreground tracking-wider mb-1">
                  {t('profile.joined', 'تاريخ الانضمام')}
                </p>
                <p className="text-xs font-bold text-foreground">{formatDate(user.date_joined)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground tracking-wider mb-1">
                  {t('profile.last_login', 'آخر تسجيل دخول')}
                </p>
                <p className="text-xs font-bold text-foreground">{formatDate(user.last_login)}</p>
              </div>
            </div>

            <Button
              variant="contained"
              disabled={loading}
              onClick={handleUpdateIdentity}
              sx={{
                py: 1.8,
                px: 5,
                borderRadius: '16px',
                bgcolor: '#10b981',
                boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.3)',
                '&:hover': { bgcolor: '#059669' },
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('profile.update_btn', 'حفظ التغييرات')}
            </Button>
          </div>
        </TabPanel>

        {/* ─── TAB 2: EMPLOYMENT PROFILE, DOCUMENTS, & REQUESTS ─── */}
        <TabPanel value={tabIndex} index={2}>
          {employeeLoading ? (
            <div className="flex flex-col items-center py-12">
              <CircularProgress size={40} className="text-emerald-500 mb-2" />
              <p className="text-muted-foreground font-semibold">{t('profile.loading_employment', 'جاري تحميل الملف الوظيفي...')}</p>
            </div>
          ) : !employeeProfile ? (
            <div className="text-center py-12 bg-muted/40 rounded-3xl border-2 border-dashed border-border/80 max-w-xl mx-auto">
              <WorkIcon className="w-12 h-12 text-muted-foreground/30 mb-2.5" />
              <p className="text-muted-foreground font-bold text-sm">
                {isRTL 
                  ? 'لا يوجد ملف موظف مرتبط بحسابك الحالي لعرض تفاصيل التعيين والرواتب.' 
                  : 'No active employee profile is linked to your current account to display employment and salary details.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pt-2 pb-8">
              {/* Profile details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Card 1: Job Info */}
                <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-xs">
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                    <WorkIcon className="text-emerald-500 w-5 h-5" />
                    <span>{isRTL ? 'معلومات التعيين والوظيفة' : 'Employment Details'}</span>
                  </h3>
                  
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'المسمى الوظيفي' : 'Job Title'}</span>
                      <span className="font-bold text-foreground">{employeeProfile.position || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'القسم' : 'Department'}</span>
                      <span className="font-bold text-foreground">{employeeProfile.department || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'تاريخ التعيين' : 'Hire Date'}</span>
                      <span className="font-semibold text-foreground">{employeeProfile.hire_date ? formatDate(employeeProfile.hire_date) : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'حالة العمل' : 'Status'}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase ${
                        employeeProfile.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {isRTL 
                          ? (employeeProfile.status === 'active' ? 'نشط' : 'في إجازة') 
                          : employeeProfile.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Financial Info */}
                <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-xs">
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
                    <AccountBalanceWalletIcon className="text-emerald-500 w-5 h-5" />
                    <span>{isRTL ? 'تفاصيل الراتب والأجور' : 'Financial Details'}</span>
                  </h3>
                  
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'الراتب الشهري' : 'Monthly Salary'}</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        {employeeProfile.monthly_salary 
                          ? `${Number(employeeProfile.monthly_salary).toLocaleString(isRTL ? 'ar-EG' : 'en-US')} ${isRTL ? 'جنيه مصري' : 'EGP'}` 
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'ساعات العمل القياسية' : 'Standard Work Hours'}</span>
                      <span className="font-bold text-foreground">{employeeProfile.standard_work_hours || 8} {isRTL ? 'ساعات / يوم' : 'hours / day'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'أجر الساعة التقديري' : 'Estimated Hourly Rate'}</span>
                      <span className="font-semibold text-foreground">
                        {employeeProfile.monthly_salary 
                          ? `${((Number(employeeProfile.monthly_salary) / 30) / (employeeProfile.standard_work_hours || 8)).toFixed(2)} ${isRTL ? 'جنيه / ساعة' : 'EGP / hr'}` 
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-semibold">{isRTL ? 'العملة' : 'Currency'}</span>
                      <span className="font-bold text-muted-foreground">{isRTL ? 'جنيه مصري (EGP)' : 'Egyptian Pound (EGP)'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Leave Requests & Documents grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Leave Requests section */}
                <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-border/60 pb-3">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                      <CalendarTodayIcon className="text-emerald-500 w-5 h-5" />
                      <span>{isRTL ? 'طلبات الإجازة' : 'Leave Requests'}</span>
                    </h3>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setOpenLeaveDialog(true)}
                      sx={{
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#059669' },
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      {isRTL ? 'طلب إجازة' : 'Request Leave'}
                    </Button>
                  </div>

                  {leavesLoading ? (
                    <div className="flex justify-center py-6">
                      <CircularProgress size={30} className="text-emerald-500" />
                    </div>
                  ) : leaveRequests.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 border border-dashed border-border rounded-2xl">
                      <p className="text-xs text-muted-foreground font-bold">{isRTL ? 'لا توجد طلبات إجازة نشطة' : 'No active leave requests'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {leaveRequests.map((req) => (
                        <div key={req.id} className="p-3.5 bg-muted/30 border border-border/70 rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-foreground">
                              {isRTL 
                                ? (req.leave_type === 'annual' ? 'سنوية' : req.leave_type === 'sick' ? 'مرضية' : 'شخصية')
                                : req.leave_type_display || req.leave_type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg font-bold border text-[10px] uppercase ${
                              req.status === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : req.status === 'rejected' 
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {isRTL 
                                ? (req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'معلق') 
                                : req.status_display || req.status}
                            </span>
                          </div>
                          <div className="text-muted-foreground font-semibold flex items-center gap-1">
                            <CalendarTodayIcon className="w-3.5 h-3.5" />
                            <span>{req.start_date} ← {req.end_date}</span>
                          </div>
                          {req.reason && (
                            <p className="text-[11px] text-muted-foreground bg-card border border-border/50 p-2 rounded-xl">
                              <span className="font-bold text-foreground block mb-0.5">{isRTL ? 'السبب:' : 'Reason:'}</span>
                              {req.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents section */}
                <div className="p-6 bg-card border border-border rounded-3xl space-y-4 shadow-xs">
                  <div className="flex justify-between items-center border-b border-border/60 pb-3">
                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                      <BadgeIcon className="text-emerald-500 w-5 h-5" />
                      <span>{isRTL ? 'الوثائق والمستندات' : 'My Documents'}</span>
                    </h3>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setOpenDocDialog(true)}
                      sx={{
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#059669' },
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      {isRTL ? 'رفع مستند' : 'Upload Document'}
                    </Button>
                  </div>

                  {employeeProfile.documents && employeeProfile.documents.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {employeeProfile.documents.map((doc) => (
                        <div key={doc.id} className="p-3.5 bg-muted/30 border border-border/70 rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-foreground">
                              {isRTL 
                                ? (doc.document_type === 'national_id' ? 'بطاقة الرقم القومي' : doc.document_type === 'academic_degree' ? 'شهادة التخرج' : doc.document_type === 'training_cert' ? 'شهادة تدريب' : 'عقد العمل')
                                : doc.document_type_display || doc.document_type}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg font-bold border text-[10px] uppercase ${
                              doc.is_verified 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {isRTL 
                                ? (doc.is_verified ? 'معتمد' : 'تحت المراجعة') 
                                : (doc.is_verified ? 'Verified' : 'Pending')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[10px]">
                            {doc.issue_date && (
                              <div>
                                <span className="font-semibold block">{isRTL ? 'تاريخ الإصدار' : 'Issue Date'}</span>
                                <span className="font-bold text-foreground">{doc.issue_date}</span>
                              </div>
                            )}
                            {doc.expiry_date && (
                              <div>
                                <span className="font-semibold block">{isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}</span>
                                <span className="font-bold text-foreground">{doc.expiry_date}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-border/30">
                            {doc.document_file ? (
                              <a
                                href={doc.document_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-extrabold text-[11px]"
                              >
                                <LaunchIcon className="w-3.5 h-3.5" />
                                <span>{isRTL ? 'عرض المستند' : 'View File'}</span>
                              </a>
                            ) : (
                              <span className="text-muted-foreground/60">{isRTL ? 'لا يوجد ملف' : 'No file'}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/20 border border-dashed border-border rounded-2xl">
                      <p className="text-xs text-muted-foreground font-bold">{isRTL ? 'لا توجد مستندات مرفوعة' : 'No documents uploaded'}</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </TabPanel>

        {/* ─── TAB 3: SECURITY & PASSWORDS WITH VISIBILITY EYE TOGGLES ─── */}
        <TabPanel value={tabIndex} index={3}>
          <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-amber-800 dark:text-amber-400 p-4.5 rounded-2xl text-xs font-semibold leading-relaxed">
              {t('profile.password_warning', 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل. نوصي باستخدام حروف، أرقام، ورموز لتأمين حسابك.')}
            </div>

            {secMsg.text && (
              <Alert severity={secMsg.type} sx={{ borderRadius: '16px' }}>
                {secMsg.text}
              </Alert>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">

              {/* Current Password with Toggle */}
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  {t('profile.old_password', 'كلمة المرور الحالية')}
                </label>
                <TextField
                  fullWidth
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={passwords.old_password}
                  onChange={e => setPasswords({ ...passwords, old_password: e.target.value })}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end">
                          {showOldPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      backgroundColor: 'var(--color-bg-card)',
                      '&.Mui-focused fieldset': { borderColor: '#10b981' }
                    }
                  }}
                />
              </div>

              {/* New Password with Toggle */}
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  {t('profile.new_password', 'كلمة المرور الجديدة')}
                </label>
                <TextField
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={passwords.new_password}
                  onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      backgroundColor: 'var(--color-bg-card)',
                      '&.Mui-focused fieldset': { borderColor: '#10b981' }
                    }
                  }}
                />

                {/* Strength Meter bar */}
                {passwords.new_password && (
                  <div className="mt-3">
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
                    <p className="text-xs font-bold mt-1.5" style={{ color: passwordStrength.color }}>
                      {t('profile.password_strength', 'قوة كلمة المرور')}: {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password with Toggle */}
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">
                  {t('profile.confirm_password', 'تأكيد كلمة المرور الجديدة')}
                </label>
                <TextField
                  fullWidth
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={passwords.confirm_password}
                  onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      backgroundColor: 'var(--color-bg-card)',
                      '&.Mui-focused fieldset': { borderColor: '#10b981' }
                    }
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="contained"
                disabled={secLoading}
                sx={{
                  py: 1.8,
                  px: 5,
                  borderRadius: '16px',
                  bgcolor: '#334155',
                  boxShadow: '0 8px 20px -4px rgba(51, 65, 85, 0.3)',
                  '&:hover': { bgcolor: '#1e293b' },
                  fontWeight: 'bold',
                  width: '100%',
                  textTransform: 'none'
                }}
              >
                {secLoading ? <CircularProgress size={24} color="inherit" /> : t('profile.change_password_btn', 'تحديث كلمة المرور')}
              </Button>

            </form>
          </div>
        </TabPanel>

        {/* ─── TAB 4: TRACE/ACTIVITY HISTORY LOGS ─── */}
        <TabPanel value={tabIndex} index={4}>
          <div className="max-w-3xl mx-auto space-y-4 pt-4 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-foreground">{t('profile.activity_history', 'سجل العمليات الأخير')}</h3>
              <Button
                size="small"
                onClick={fetchLogs}
                startIcon={<RefreshIcon />}
                sx={{ color: '#10b981', fontWeight: 'bold' }}
              >
                {t('profile.refresh', 'تحديث')}
              </Button>
            </div>

            {logsLoading ? (
              <div className="flex flex-col items-center py-12">
                <CircularProgress size={40} className="text-emerald-500 mb-2" />
                <p className="text-muted-foreground font-semibold">{t('profile.loading_logs', 'جاري تحميل السجلات...')}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-muted/40 rounded-3xl border-2 border-dashed border-border/80">
                <HistoryIcon className="w-12 h-12 text-muted-foreground/30 mb-2.5" />
                <p className="text-muted-foreground font-bold">{t('profile.no_logs', 'لا توجد سجلات نشاط حتى الآن')}</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4.5 bg-card border border-border rounded-2xl hover:border-emerald-500/15 hover:shadow-xs transition-all group"
                  >
                    <div className={`mt-1 p-2.5 rounded-xl flex items-center justify-center ${log.module === 'Warehouse' ? 'bg-amber-500/10 text-amber-600' :
                      log.module === 'Farm' ? 'bg-green-500/10 text-green-600' :
                        'bg-slate-500/10 text-slate-600'
                      }`}>
                      <HistoryIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          {log.action}
                        </p>

                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-muted border border-border text-muted-foreground rounded-md">
                          {log.module}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <CalendarTodayIcon className="w-3.5 h-3.5" />
                        <span>{formatDate(log.created_at)}</span>
                        {log.ip_address && <span className="mx-2 opacity-50">•</span>}
                        {log.ip_address && <span className="opacity-75">{log.ip_address}</span>}
                      </p>

                      {user.role === 'SUPER_ADMIN' && log.user_name && (
                        <p className="text-[10px] text-emerald-500 font-extrabold mt-1.5 uppercase">
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

        {/* ─── TAB 5: GENERAL PREFERENCES & SETTINGS ─── */}
        <TabPanel value={tabIndex} index={5}>
          <div className="max-w-xl mx-auto space-y-6 pt-4 pb-8">
            <div className="flex items-center justify-between p-5 border border-border rounded-3xl bg-muted/30">
              <div>
                <h4 className="font-bold text-foreground mb-1">{t('profile.language', 'لغة النظام')}</h4>
                <p className="text-xs font-semibold text-muted-foreground">{t('profile.language_desc', 'قم بالتبديل بين العربية والإنجليزية.')}</p>
              </div>
              <Button
                variant="outlined"
                onClick={toggleLanguage}
                sx={{
                  borderRadius: '12px',
                  color: 'var(--color-muted-foreground)',
                  borderColor: 'var(--color-border)',
                  fontWeight: 'bold',
                  px: 4.5,
                  py: 1.2
                }}
              >
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
          </div>
        </TabPanel>

      </Card>

      {/* ─── LEAVE REQUEST DIALOG ─── */}
      <Dialog
        open={openLeaveDialog}
        onClose={() => setOpenLeaveDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            bgcolor: 'var(--color-background)',
            p: 1.5
          }
        }}
      >
        <DialogTitle className="font-black text-foreground text-center">
          {isRTL ? 'تقديم طلب إجازة جديد' : 'New Leave Request'}
        </DialogTitle>
        <form onSubmit={handleSubmitLeave}>
          <DialogContent className="space-y-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel id="leave-type-label" className="text-muted-foreground font-bold">
                {isRTL ? 'نوع الإجازة' : 'Leave Type'}
              </InputLabel>
              <Select
                labelId="leave-type-label"
                value={newLeave.leave_type}
                onChange={e => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                label={isRTL ? 'نوع الإجازة' : 'Leave Type'}
                sx={{ borderRadius: '14px' }}
              >
                <MenuItem value="annual">{isRTL ? 'إجازة سنوية' : 'Annual Leave'}</MenuItem>
                <MenuItem value="sick">{isRTL ? 'إجازة مرضية' : 'Sick Leave'}</MenuItem>
                <MenuItem value="personal">{isRTL ? 'إجازة شخصية' : 'Personal Leave'}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={isRTL ? 'تاريخ البدء' : 'Start Date'}
              type="date"
              value={newLeave.start_date}
              onChange={e => setNewLeave({ ...newLeave, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            <TextField
              fullWidth
              label={isRTL ? 'تاريخ الانتهاء' : 'End Date'}
              type="date"
              value={newLeave.end_date}
              onChange={e => setNewLeave({ ...newLeave, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            <TextField
              fullWidth
              label={isRTL ? 'سبب الإجازة' : 'Reason'}
              multiline
              rows={3}
              value={newLeave.reason}
              onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
              placeholder={isRTL ? 'تفاصيل إضافية للطلب...' : 'Explain the reason...'}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button
              onClick={() => setOpenLeaveDialog(false)}
              sx={{
                borderRadius: '12px',
                color: 'var(--color-muted-foreground)',
                fontWeight: 'bold'
              }}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={leavesLoading}
              sx={{
                borderRadius: '12px',
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                fontWeight: 'bold',
                px: 3
              }}
            >
              {leavesLoading ? <CircularProgress size={20} color="inherit" /> : (isRTL ? 'تقديم الطلب' : 'Submit')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── DOCUMENT UPLOAD DIALOG ─── */}
      <Dialog
        open={openDocDialog}
        onClose={() => setOpenDocDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: '1px solid var(--color-border)',
            bgcolor: 'var(--color-background)',
            p: 1.5
          }
        }}
      >
        <DialogTitle className="font-black text-foreground text-center">
          {isRTL ? 'رفع وثيقة جديدة' : 'Upload Document'}
        </DialogTitle>
        <form onSubmit={handleAddDocument}>
          <DialogContent className="space-y-4">
            <FormControl fullWidth variant="outlined">
              <InputLabel id="doc-type-label" className="text-muted-foreground font-bold">
                {isRTL ? 'نوع الوثيقة' : 'Document Type'}
              </InputLabel>
              <Select
                labelId="doc-type-label"
                value={newDoc.document_type}
                onChange={e => setNewDoc({ ...newDoc, document_type: e.target.value })}
                label={isRTL ? 'نوع الوثيقة' : 'Document Type'}
                sx={{ borderRadius: '14px' }}
              >
                <MenuItem value="national_id">{isRTL ? 'بطاقة الرقم القومي' : 'National ID'}</MenuItem>
                <MenuItem value="academic_degree">{isRTL ? 'شهادة التخرج/الأكاديمية' : 'Academic Degree'}</MenuItem>
                <MenuItem value="training_cert">{isRTL ? 'شهادة دورة/تدريب' : 'Training Certificate'}</MenuItem>
                <MenuItem value="contract">{isRTL ? 'عقد العمل المبرم' : 'Employment Contract'}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={isRTL ? 'تاريخ الإصدار' : 'Issue Date'}
              type="date"
              value={newDoc.issue_date}
              onChange={e => setNewDoc({ ...newDoc, issue_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            <TextField
              fullWidth
              label={isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}
              type="date"
              value={newDoc.expiry_date}
              onChange={e => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            <TextField
              fullWidth
              label={isRTL ? 'ملاحظات' : 'Notes'}
              multiline
              rows={2}
              value={newDoc.notes}
              onChange={e => setNewDoc({ ...newDoc, notes: e.target.value })}
              placeholder={isRTL ? 'ملاحظات إضافية...' : 'Any optional notes...'}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted-foreground">
                {isRTL ? 'ملف المستند (PDF أو صورة)' : 'Document File (PDF or Image)'}
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setNewDoc({ ...newDoc, document_file: e.target.files[0] })}
                className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20"
              />
            </div>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button
              onClick={() => setOpenDocDialog(false)}
              sx={{
                borderRadius: '12px',
                color: 'var(--color-muted-foreground)',
                fontWeight: 'bold'
              }}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={docLoading}
              variant="contained"
              sx={{
                borderRadius: '12px',
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                fontWeight: 'bold',
                px: 3
              }}
            >
              {docLoading ? <CircularProgress size={20} color="inherit" /> : (isRTL ? 'رفع المستند' : 'Upload')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </div>
  );
};

export default UserProfile;
