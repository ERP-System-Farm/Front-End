import React, { useState, useEffect, useRef } from 'react';
import {
  Button, Card, Chip, Alert, CircularProgress, TextField, MenuItem,
  Select, FormControl, InputLabel, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Box, Typography, useTheme, useMediaQuery,
  Checkbox, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText,
  ListItemSecondaryAction, Avatar, Switch, FormControlLabel, Divider,
  Tabs, Tab
} from '@mui/material';
import { Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getUsersList, approveUser, deactivateUser, getCMSContent, updateCMSContent, deleteUser, updateUserRole, getAppPermissions, getUserPermissions, updateUserPermissions } from '../../features/auth/services';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import SpaIcon from '@mui/icons-material/Spa';
import ForestIcon from '@mui/icons-material/Forest';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import CampaignIcon from '@mui/icons-material/Campaign';
import CommentIcon from '@mui/icons-material/Comment';
import FaceIcon from '@mui/icons-material/Face';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAuth } from '../../app/AuthContext';
import { useFeatures } from '../../contexts/FeatureToggleContext';
import SuperAdminDashboardView from '../../components/ui_stitches/SuperAdminDashboardView';
import SuperAdminHubOverview from '../../components/ui_stitches/SuperAdminHubOverview';
import MediaControlCenter from '../dashboard/MediaControlCenter';
import api from '../../services/api';
import { toast } from 'sonner';
import { getAbsoluteFileUrl, cn } from '../../lib/utils';
// ── ATLS Design System components (Phase 5 extraction) ──────────────
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminTabNav from '../../components/admin/AdminTabNav';
import AdminTabPanel from '../../components/admin/AdminTabPanel';
// ── Lucide Icons for Command Center ──────────────────────────────────
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  MessageSquare,
  CircleUserRound,
  Trash2,
  ImagePlay,
  Settings,
  Globe,
  Database,
  Lock,
  Search,
  Activity,
  Users,
  HardDriveDownload,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Cpu,
  X,
  CheckCircle2
} from 'lucide-react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file, resourceType = 'auto') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: fd }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }
  const data = await res.json();
  return { url: data.secure_url, type: data.resource_type };
}

const AdminControls = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Custom Permissions States
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermCodes, setSelectedPermCodes] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const [cmsData, setCmsData] = useState({
    hero_title_en: '', hero_title_ar: '',
    hero_text_en: '', hero_text_ar: '',
    palm_text_en: '', palm_text_ar: '',
    olive_text_en: '', olive_text_ar: '',
    logo_text_en: '', logo_text_ar: '',
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

  // Command Center Redesign States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [activityStream, setActivityStream] = useState([
    { id: 1, type: 'info', time: '00:30', text: 'تمت أرشفة قاعدة البيانات بنجاح لقسم الهيكل التنظيمي.' },
    { id: 2, type: 'warning', time: '00:25', text: 'محاولة دخول ناجحة للمستخدم Super Admin من عنوان IP جديد.' },
    { id: 3, type: 'info', time: '00:15', text: 'تمت الموافقة على تعديل دور المستخدم "أحمد المهندس" إلى MANAGER.' },
    { id: 4, type: 'error', time: '00:05', text: 'رمز استعادة كلمة مرور غير صالح للمستخدم user@atls.com.' },
    { id: 5, type: 'info', time: '23:50', text: 'تم تحديث تفضيلات SaaS لتطبيق ATLS-V2 بنجاح.' },
  ]);

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

  // New Tab States
  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annCategory, setAnnCategory] = useState('general');
  const [annIsPinned, setAnnIsPinned] = useState(false);
  const [annMediaUrl, setAnnMediaUrl] = useState('');
  const [annMediaType, setAnnMediaType] = useState(null); // 'IMAGE' | 'VIDEO' | 'FILE'
  const [annFileName, setAnnFileName] = useState('');
  const [annMediaUploading, setAnnMediaUploading] = useState(false);
  const annFileInputRef = useRef(null);

  // Comments
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Gallery (for Bulk Operations)
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Bulk Selection States
  const [selectedBulkUsers, setSelectedBulkUsers] = useState([]);
  const [selectedBulkAnnouncements, setSelectedBulkAnnouncements] = useState([]);
  const [selectedBulkComments, setSelectedBulkComments] = useState([]);
  const [selectedBulkMedia, setSelectedBulkMedia] = useState([]);

  const isRTL = i18n.language === 'ar';

  const { config, setConfig } = useFeatures();
  const [brandingData, setBrandingData] = useState({
    farm_name: 'مزرعة أطلس النموذجية',
    currency: 'جنيه مصري',
    primary_color: '#1E3A1E',
    accent_color: '#D4AF37',
    font: 'Cairo'
  });
  const [featureFlags, setFeatureFlags] = useState({
    accounting: true,
    hr: true,
    fleet: true,
    warehouse: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setBrandingData({
        farm_name: config.branding?.farm_name || '',
        currency: config.branding?.currency || '',
        primary_color: config.branding?.primary_color || '#1E3A1E',
        accent_color: config.branding?.accent_color || '#D4AF37',
        font: config.branding?.font || 'Cairo'
      });
      setFeatureFlags({
        accounting: config.features?.accounting ?? true,
        hr: config.features?.hr ?? true,
        fleet: config.features?.fleet ?? true,
        warehouse: config.features?.warehouse ?? true
      });
    }
  }, [config]);

  const handleInputChange = (field, value) => {
    setBrandingData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleFeature = async (featureKey, isEnabled) => {
    const updatedFeatures = { ...featureFlags, [featureKey]: isEnabled };
    setFeatureFlags(updatedFeatures);
    setConfig(prev => ({ ...prev, features: updatedFeatures }));

    try {
      const payloadKey = `feature_${featureKey}`;
      await api.patch('/admin/config/', { [payloadKey]: isEnabled });
      toast.success(isRTL ? "تم تحديث صلاحية الموديول بنجاح ✓" : "Feature toggle updated successfully ✓");
    } catch (error) {
      console.error("Failed to persist feature toggle.", error);
      toast.error(isRTL ? "فشل تحديث صلاحية الموديول" : "Failed to update feature toggle");
    }
  };

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const payload = {
        farm_name: brandingData.farm_name,
        primary_color: brandingData.primary_color,
        accent_color: brandingData.accent_color,
        active_font: brandingData.font,
        currency: brandingData.currency
      };

      await api.patch('/admin/config/', payload);
      setConfig(prev => ({ ...prev, branding: brandingData }));
      toast.success(isRTL ? "تم حفظ وتطبيق الهوية البصرية بنجاح ✓" : "Branding saved and applied successfully ✓");
    } catch (error) {
      console.error("Failed syncing branding options.", error);
      toast.error(isRTL ? "فشل حفظ وتطبيق الهوية البصرية" : "Failed to save branding configurations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigatePortal = (portalKey) => {
    const portalTabMapping = {
      branding: 'saas',
      master_data: 'farm',
      permissions: 'security',
      audit: 'bulk_ops',
      backup: 'data'
    };
    const targetTab = portalTabMapping[portalKey];
    if (targetTab) {
      setActiveTab(targetTab);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCMS();
    fetchFarmSettings();
    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER') {
      fetchPasswordResets();
    }
  }, []);

  // Command palette key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Export/Download Backup JSON
  const downloadBackupJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      branding: brandingData,
      featureFlags: featureFlags,
      farmSettings: farmSettings,
      usersCount: users.length,
      announcementsCount: announcements.length,
      passwordResetsCount: passwordResets.length
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `atls_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(isRTL ? "تم تصدير ملف النسخة الاحتياطية بنجاح ✓" : "Backup JSON exported successfully ✓");
  };

  const getCommandPaletteResults = () => {
    if (!commandSearch.trim()) {
      return {
        pages: [
          { key: 'overview', label: isRTL ? 'لوحة المراقبة المركزية' : 'Control Center' },
          { key: 'security', label: isRTL ? 'المستخدمين والصلاحيات' : 'Users & Permissions' },
          { key: 'saas', label: isRTL ? 'الهوية وتفعيل الموديولات' : 'SaaS Branding' },
        ],
        actions: [
          { type: 'backup', label: isRTL ? 'تصدير نسخة احتياطية للمنظومة' : 'Export JSON Backup' },
          { type: 'inject', label: isRTL ? 'حقن سجلات قاعدة البيانات' : 'Inject Database JSON' },
        ],
        users: []
      };
    }

    const query = commandSearch.toLowerCase();
    const pages = [];
    const actions = [];

    launchpadTabs.forEach(group => {
      group.items.forEach(item => {
        if (item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query)) {
          pages.push(item);
        }
      });
    });

    const allActions = [
      { type: 'backup', label: isRTL ? 'تصدير نسخة احتياطية للمنظومة' : 'Export JSON Backup' },
      { type: 'inject', label: isRTL ? 'حقن سجلات قاعدة البيانات' : 'Inject Database JSON' },
      { type: 'purge', label: isRTL ? 'حذف وتطهير موديولات البيانات' : 'Purge Database Modules' },
    ];
    allActions.forEach(act => {
      if (act.label.toLowerCase().includes(query) || act.type.toLowerCase().includes(query)) {
        actions.push(act);
      }
    });

    const matchedUsers = users.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    ).slice(0, 5);

    return { pages, actions, users: matchedUsers };
  };

  const launchpadTabs = [
    {
      group: isRTL ? 'إدارة الأعضاء والوصول' : 'Access & Identity',
      items: [
        { key: 'overview', icon: LayoutDashboard, label: isRTL ? 'لوحة المراقبة المركزية' : 'Control Center' },
        { key: 'security', icon: ShieldCheck, label: isRTL ? 'المستخدمين والصلاحيات' : 'Users & Permissions', badge: users.filter(u => !u.is_approved).length },
        { key: 'password_resets', icon: Lock, label: isRTL ? 'استعادة كلمة المرور' : 'Password Resets', badge: passwordResets.filter(r => !r.is_approved).length, roles: ['SUPER_ADMIN', 'OWNER', 'MANAGER'] },
      ]
    },
    {
      group: isRTL ? 'التواصل والمحتوى' : 'Communications',
      items: [
        { key: 'announcements', icon: Megaphone, label: isRTL ? 'إعلانات المنصة' : 'Announcements' },
        { key: 'comments', icon: MessageSquare, label: isRTL ? 'إدارة التعليقات' : 'Comments Moderation' },
        { key: 'avatars', icon: CircleUserRound, label: isRTL ? 'الأفاتار الشخصي' : 'User Avatars' },
      ]
    },
    {
      group: isRTL ? 'تخصيص وإعداد المزرعة' : 'Configurations',
      items: [
        { key: 'saas', icon: Settings, label: isRTL ? 'الهوية وتفعيل الموديولات' : 'SaaS & Branding', roles: ['SUPER_ADMIN', 'OWNER'] },
        { key: 'cms', icon: Globe, label: isRTL ? 'محتوى الصفحة الرئيسية' : 'CMS Configuration', roles: ['SUPER_ADMIN'] },
        { key: 'farm', icon: Settings, label: isRTL ? 'إعدادات المزرعة' : 'Farm Structure' },
      ]
    },
    {
      group: isRTL ? 'إدارة الملفات والأرشيف' : 'Media & Data',
      items: [
        { key: 'media_center', icon: ImagePlay, label: isRTL ? 'مركز التحكم بالوسائط' : 'Media Control Center' },
        { key: 'data', icon: Database, label: isRTL ? 'حقن وإدارة البيانات' : 'Data Management', roles: ['SUPER_ADMIN', 'OWNER'] },
      ]
    }
  ];

  const filteredLaunchpad = launchpadTabs.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true;
      return currentUser?.role && item.roles.includes(currentUser.role);
    })
  })).filter(group => group.items.length > 0);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'comments') {
      fetchComments();
      if (announcements.length === 0) {
        fetchAnnouncements();
      }
    } else if (activeTab === 'bulk_ops') {
      fetchAnnouncements();
      fetchComments();
      fetchGalleryItems();
    }
  }, [activeTab]);

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

  // Announcements Center CRUD
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const res = await api.get('announcements/');
      const data = res.data?.results || res.data || [];
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed fetching announcements', err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleTogglePin = async (ann) => {
    try {
      await api.patch(`announcements/${ann.id}/`, { is_pinned: !ann.is_pinned });
      toast.success(isRTL ? 'تم تحديث حالة التثبيت ✓' : 'Pin state updated successfully ✓');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل تحديث حالة التثبيت' : 'Failed to update pin state');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا الإعلان؟' : 'Are you sure you want to delete this announcement?')) {
      return;
    }
    try {
      await api.delete(`announcements/${id}/`);
      toast.success(isRTL ? 'تم حذف الإعلان بنجاح ✓' : 'Announcement deleted successfully ✓');
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل حذف الإعلان' : 'Failed to delete announcement');
    }
  };

  const handleOpenEditAnnouncement = (ann) => {
    setSelectedAnnouncement(ann);
    setAnnTitle(ann.title || '');
    setAnnBody(ann.body || '');
    setAnnCategory(ann.category || 'general');
    setAnnIsPinned(ann.is_pinned || false);

    if (ann.image_url) {
      setAnnMediaUrl(ann.image_url);
      setAnnMediaType('IMAGE');
      setAnnFileName('');
    } else if (ann.video_url) {
      setAnnMediaUrl(ann.video_url);
      setAnnMediaType('VIDEO');
      setAnnFileName('');
    } else if (ann.file_url) {
      setAnnMediaUrl(ann.file_url);
      setAnnMediaType('FILE');
      setAnnFileName(ann.file_name || 'attachment');
    } else {
      setAnnMediaUrl('');
      setAnnMediaType(null);
      setAnnFileName('');
    }
    setAnnouncementDialogOpen(true);
  };

  const handleOpenCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setAnnTitle('');
    setAnnBody('');
    setAnnCategory('general');
    setAnnIsPinned(false);
    setAnnMediaUrl('');
    setAnnMediaType(null);
    setAnnFileName('');
    setAnnouncementDialogOpen(true);
  };

  const handleAnnMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnnMediaUploading(true);
    try {
      let fileUrl = null;
      let fileTypeEnum = file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      let uploaded = false;

      if (CLOUD_NAME && UPLOAD_PRESET) {
        try {
          const resourceType = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'raw';
          const cldRes = await uploadToCloudinary(file, resourceType);
          fileUrl = cldRes.url;
          fileTypeEnum = cldRes.type === 'video' ? 'VIDEO' : cldRes.type === 'image' ? 'IMAGE' : 'FILE';
          uploaded = true;
        } catch (cldErr) {
          console.warn('Cloudinary upload failed, falling back to backend storage...', cldErr);
        }
      }

      if (!uploaded) {
        const fd = new FormData();
        fd.append('file', file);
        const backendRes = await api.post('/uploads/', fd);
        fileUrl = backendRes.data.file_url;
        uploaded = true;
      }

      if (fileUrl) {
        setAnnMediaUrl(fileUrl);
        setAnnMediaType(fileTypeEnum);
        setAnnFileName(file.name);
        toast.success(isRTL ? 'تم رفع المرفق بنجاح ✓' : 'Attachment uploaded successfully ✓');
      } else {
        throw new Error('Upload failed to return URL');
      }
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل رفع المرفق' : 'Attachment upload failed');
    } finally {
      setAnnMediaUploading(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!annTitle.trim()) {
      toast.error(isRTL ? 'يرجى إدخال عنوان الإعلان' : 'Please enter announcement title');
      return;
    }

    const payload = {
      title: annTitle.trim(),
      body: annBody.trim(),
      category: annCategory,
      is_pinned: annIsPinned,
      image_url: annMediaType === 'IMAGE' ? annMediaUrl : '',
      video_url: annMediaType === 'VIDEO' ? annMediaUrl : '',
      file_url: annMediaType === 'FILE' ? annMediaUrl : '',
      file_name: annMediaType === 'FILE' ? annFileName : '',
    };

    setAnnouncementsLoading(true);
    try {
      if (selectedAnnouncement) {
        await api.patch(`announcements/${selectedAnnouncement.id}/`, payload);
        toast.success(isRTL ? 'تم تحديث الإعلان بنجاح ✓' : 'Announcement updated successfully ✓');
      } else {
        await api.post('announcements/', payload);
        toast.success(isRTL ? 'تم نشر الإعلان بنجاح ✓' : 'Announcement posted successfully ✓');
      }
      setAnnouncementDialogOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل حفظ الإعلان' : 'Failed to save announcement');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // Comments Management
  const fetchComments = () => {
    setCommentsLoading(true);
    const list = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('atls_comments_')) {
          const annId = key.replace('atls_comments_', '');
          try {
            const comments = JSON.parse(localStorage.getItem(key)) || [];
            comments.forEach(c => {
              list.push({
                ...c,
                annId,
              });
            });
          } catch (e) {
            console.error('Error parsing comments', e);
          }
        }
      }
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCommentsList(list);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = (annId, commentId) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في حذف هذا التعليق؟' : 'Are you sure you want to delete this comment?')) {
      return;
    }
    const key = `atls_comments_${annId}`;
    try {
      const comments = JSON.parse(localStorage.getItem(key)) || [];
      const updated = comments.filter(c => c.id !== commentId);
      if (updated.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      toast.success(isRTL ? 'تم حذف التعليق بنجاح ✓' : 'Comment deleted successfully ✓');
      fetchComments();
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'فشل حذف التعليق' : 'Failed to delete comment');
    }
  };

  const handleBulkDeleteComments = (selectedIds) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من حذف ${selectedIds.length} تعليق؟` : `Are you sure you want to delete ${selectedIds.length} comments?`)) {
      return;
    }
    try {
      const groups = {};
      selectedIds.forEach(idStr => {
        const [annId, commentId] = idStr.split('_');
        if (!groups[annId]) groups[annId] = [];
        groups[annId].push(commentId);
      });

      Object.keys(groups).forEach(annId => {
        const key = `atls_comments_${annId}`;
        const comments = JSON.parse(localStorage.getItem(key)) || [];
        const toDeleteIds = groups[annId];
        const updated = comments.filter(c => !toDeleteIds.includes(c.id));
        if (updated.length === 0) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(updated));
        }
      });

      toast.success(isRTL ? 'تم حذف التعليقات المحددة بنجاح ✓' : 'Selected comments deleted successfully ✓');
      setSelectedBulkComments([]);
      fetchComments();
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'فشل حذف التعليقات' : 'Failed to delete comments');
    }
  };

  // Avatars Reset
  const handleResetAvatar = async (userId) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من رغبتك في إعادة تعيين الصورة الشخصية لهذا المستخدم؟' : 'Are you sure you want to reset this user\'s avatar?')) {
      return;
    }
    try {
      await api.patch(`users/${userId}/reset-avatar`);
      toast.success(isRTL ? 'تم إعادة تعيين الصورة الشخصية بنجاح ✓' : 'Avatar reset successfully ✓');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل إعادة تعيين الصورة الشخصية' : 'Failed to reset avatar');
    }
  };

  // Bulk Operations
  const fetchGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      const res = await api.get('reports/gallery/');
      const data = res.data?.results || res.data || [];
      setGalleryItems(data);
    } catch (err) {
      console.error('Failed to load gallery for bulk operations', err);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleBulkDeleteUsers = async (userIds) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من رغبتك في حذف ${userIds.length} مستخدم نهائياً؟` : `Are you sure you want to permanently delete ${userIds.length} users?`)) {
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const id of userIds) {
      try {
        await deleteUser(id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete user ${id}:`, err);
        failCount++;
      }
    }
    toast.success(isRTL ? `تم حذف ${successCount} مستخدم بنجاح.` : `Successfully deleted ${successCount} users.`);
    if (failCount > 0) {
      toast.error(isRTL ? `فشل حذف ${failCount} مستخدم.` : `Failed to delete ${failCount} users.`);
    }
    setSelectedBulkUsers([]);
    fetchUsers();
  };

  const handleBulkDeleteAnnouncements = async (annIds) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من رغبتك في حذف ${annIds.length} إعلان؟` : `Are you sure you want to delete ${annIds.length} announcements?`)) {
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const id of annIds) {
      try {
        await api.delete(`announcements/${id}/`);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete announcement ${id}:`, err);
        failCount++;
      }
    }
    toast.success(isRTL ? `تم حذف ${successCount} إعلان بنجاح.` : `Successfully deleted ${successCount} announcements.`);
    if (failCount > 0) {
      toast.error(isRTL ? `فشل حذف ${failCount} إعلان.` : `Failed to delete ${failCount} announcements.`);
    }
    setSelectedBulkAnnouncements([]);
    fetchAnnouncements();
  };

  const handleBulkDeleteMedia = async (mediaIds) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من رغبتك في حذف ${mediaIds.length} ملف من المعرض؟` : `Are you sure you want to delete ${mediaIds.length} media items from gallery?`)) {
      return;
    }
    let successCount = 0;
    let failCount = 0;
    for (const id of mediaIds) {
      try {
        await api.delete(`reports/gallery/${id}/`);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete media ${id}:`, err);
        failCount++;
      }
    }
    toast.success(isRTL ? `تم حذف ${successCount} ملف بنجاح.` : `Successfully deleted ${successCount} media items.`);
    if (failCount > 0) {
      toast.error(isRTL ? `فشل حذف ${failCount} ملف.` : `Failed to delete ${failCount} media items.`);
    }
    setSelectedBulkMedia([]);
    fetchGalleryItems();
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

  const handleApprove = async (id) => { try { await approveUser(id); fetchUsers(); toast.success('تم تفعيل المستخدم'); } catch (err) { console.error(err); } };
  const handleDeactivate = async (id) => { try { await deactivateUser(id); fetchUsers(); toast.warning('تم إلغاء تفعيل المستخدم'); } catch (err) { console.error(err); } };
  const handleDelete = (id) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete);
      fetchUsers();
      toast.success('تم حذف العضو بشكل نهائي');
    } catch (err) {
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
    } catch (err) {
      console.error(err);
      toast.error('فشل في تحديث الدور');
    }
  };

  const handleOpenPermissions = async (user) => {
    setSelectedUserForPerms(user);
    setPermissionsDialogOpen(true);
    setPermsLoading(true);
    try {
      const allPerms = await getAppPermissions();
      setAllPermissions(allPerms);
      const userPerms = await getUserPermissions(user.id);
      setSelectedPermCodes(userPerms);
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل تحميل الصلاحيات' : 'Failed to load permissions');
    } finally {
      setPermsLoading(false);
    }
  };

  const handleTogglePermission = (code) => {
    if (selectedPermCodes.includes(code)) {
      setSelectedPermCodes(selectedPermCodes.filter(c => c !== code));
    } else {
      setSelectedPermCodes([...selectedPermCodes, code]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;
    setPermsLoading(true);
    try {
      await updateUserPermissions(selectedUserForPerms.id, selectedPermCodes);
      toast.success(isRTL ? 'تم تحديث صلاحيات المستخدم بنجاح ✓' : 'User permissions updated successfully ✓');
      setPermissionsDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(isRTL ? 'فشل حفظ الصلاحيات' : 'Failed to save permissions');
    } finally {
      setPermsLoading(false);
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
]`,
    hr: `[
  {
    "name": "المهندس أحمد علي",
    "email": "ahmed.ali@example.com",
    "password": "securepass123"
  },
  {
    "name": "العامل محمد حسن",
    "worker_type": "COMPANY",
    "badge_number": "W001",
    "national_id": "29501011234567",
    "address": "العريش، سيناء",
    "monthly_salary": 6000.00,
    "standard_work_hours": 8,
    "status": "active"
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
    <div className="w-full max-w-[1500px] mx-auto px-2 sm:px-4 md:px-6 py-3 atls-page-enter" dir="rtl">

      {/* ── Page Header ─────────────────────────────────────── */}
      <AdminPageHeader
        title={t('admin.title', 'لوحة التحكم وإدارة النظام (Command Center)')}
        subtitle={t('admin.subtitle', 'وحدة التحكم المركزية بالمنظومة، حوكمة قاعدة البيانات، وإدارة الصلاحيات الشاملة.')}
        actions={
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            type="button"
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <Search className="h-4 w-4" />
            <span>البحث السريع عن الأوامر والأعضاء...</span>
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-700 font-mono select-none">Ctrl+K</kbd>
          </button>
        }
      />

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-semibold">{error}</div>}

      {/* ── Global System Status Bar ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl transition-all shadow-xs">
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">صحة النظام</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">ممتاز 99.9%</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">الأعضاء النشطين</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">{users.filter(u => u.is_active).length} / 50</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">قاعدة البيانات</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">4.5 / 10 GB</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Database className="h-4 w-4" />
          </div>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">آخر نسخ احتياطي</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">آمن ومحدث</span>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
            <HardDriveDownload className="h-4 w-4" />
          </div>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">بوابة الـ API</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">متصلة (v2)</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800/50 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">التدخلات المعلقة</span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 block mt-0.5">
              {users.filter(u => !u.is_approved).length + passwordResets.filter(r => !r.is_approved).length} طلبات
            </span>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Three Column Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Operations Launchpad */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-5">
            {/* Quick search launcher */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              type="button"
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-955 border border-slate-200/60 dark:border-slate-800 px-3 py-2 rounded-xl text-[11px] text-slate-400 dark:text-slate-500 font-bold transition-all cursor-pointer text-right"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                <span>البحث السريع عن أمر...</span>
              </div>
              <kbd className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded text-[9px] border border-slate-200 dark:border-slate-700 font-mono select-none">Ctrl+K</kbd>
            </button>

            {/* Launchpad Menu groups */}
            <div className="space-y-4">
              {filteredLaunchpad.map((group, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-2.5">
                    {group.group}
                  </span>
                  <div className="space-y-0.5">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveTab(item.key)}
                          type="button"
                          className={cn(
                            "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-r-2 border-emerald-500"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-800 dark:hover:text-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4", isActive ? "text-emerald-500" : "text-slate-400")} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/40 rounded-full flex-shrink-0 animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Dynamic Console Workspace */}
        <div className={cn(
          "col-span-12 space-y-6",
          activeTab === 'overview' ? "lg:col-span-6" : "lg:col-span-9"
        )}>

          <AdminTabPanel id="overview" active={activeTab === 'overview'}>

            {/* Widget 1: Live Platform Activity Stream (SOC Logs) */}
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono shadow-md text-right text-xs leading-relaxed">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Live Security Feed</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Real-time syslog sync</span>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-track-transparent">
                {activityStream.map(log => {
                  const dotColor = log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div key={log.id} className="flex items-start gap-2 text-slate-300">
                      <span className="text-slate-500 font-semibold flex-shrink-0">[{log.time}]</span>
                      <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
                      <span className="font-semibold text-slate-300 text-right">{log.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 2: Immediate Interventions & Approvals */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>التدخلات والمراجعات الأمنية الفورية</span>
              </h4>

              {/* Pending Users */}
              {users.filter(u => !u.is_approved).length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">طلبات تسجيل الأعضاء بانتظار الموافقة:</span>
                  {users.filter(u => !u.is_approved).slice(0, 3).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{u.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{u.email} &bull; {u.role}</span>
                      </div>
                      <button
                        onClick={() => handleApprove(u.id)}
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none"
                      >
                        موافقة
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Pending Password Resets */}
              {passwordResets.filter(r => !r.is_approved).length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block">طلبات استعادة كلمة المرور النشطة:</span>
                  {passwordResets.filter(r => !r.is_approved).slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-xl gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{r.email}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">الرمز: {r.code}</span>
                      </div>
                      <button
                        onClick={() => handleApproveReset(r.id)}
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none"
                      >
                        تأكيد
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {users.filter(u => !u.is_approved).length === 0 && passwordResets.filter(r => !r.is_approved).length === 0 ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>جميع المهام معالجة بالكامل، لا توجد طلبات معلقة حالياً ✓</span>
                </div>
              ) : null}
            </div>

            {/* Widget 3: Hardware Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">استهلاك قاعدة البيانات</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">45%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '45%' }} />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">4.5 / 10 GB مستهلك حالياً من حجم التخزين</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">جدولة الحفظ التلقائي</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800/80 w-fit">نشط ومؤمن ✓</span>
                </div>
                <HardDriveDownload className="h-8 w-8 text-blue-500 stroke-[1.2]" />
              </div>
            </div>

          </AdminTabPanel>

          {/* ── SAAS + BRANDING TAB ────────────────────────── */}
          <AdminTabPanel id="saas" active={activeTab === 'saas' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER')}>
            <SuperAdminDashboardView
              brandingData={brandingData}
              featureFlags={featureFlags}
              onToggleFeature={handleToggleFeature}
              onSaveBranding={handleSaveBranding}
              onInputChange={handleInputChange}
              isSaving={isSaving}
            />
          </AdminTabPanel>

          {/* ── SECURITY TAB ────────────────────────────────── */}
          <AdminTabPanel id="security" active={activeTab === 'security'}>
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

                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => handleOpenPermissions(u)}
                          sx={{ borderRadius: 2, fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          {isRTL ? 'إدارة الصلاحيات' : 'Permissions'}
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
          </AdminTabPanel>

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

          <Dialog
            open={permissionsDialogOpen}
            onClose={() => setPermissionsDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: { xs: 0, sm: 5 },
                p: { xs: 1, sm: 2 },
                maxHeight: { xs: '100%', sm: '90vh' },
                height: { xs: '100%', sm: 'auto' },
                margin: { xs: 0, sm: 2 },
                display: 'flex',
                flexDirection: 'column',
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 'black', color: 'slate.800', borderBottom: '1px solid #e2e8f0', pb: 2, px: { xs: 2, sm: 3 } }}>
              {isRTL ? `إدارة صلاحيات: ${selectedUserForPerms?.name}` : `Manage Permissions: ${selectedUserForPerms?.name}`}
            </DialogTitle>
            <DialogContent sx={{ mt: 2, flex: '1 1 auto', overflowY: 'auto', px: { xs: 2, sm: 3 }, pb: 4 }}>
              <DialogContentText sx={{ mb: 3 }}>
                {isRTL
                  ? 'قم بتفعيل أو إلغاء تفعيل صلاحيات محددة لهذا المستخدم لتجاوز الصلاحيات الافتراضية للدور.'
                  : 'Enable or disable specific permissions for this user to customize their access level.'}
              </DialogContentText>

              {permsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress sx={{ color: '#16a34a' }} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {allPermissions.map((perm) => {
                    const isChecked = selectedPermCodes.includes(perm.code);
                    return (
                      <Card
                        key={perm.id}
                        variant="outlined"
                        onClick={() => handleTogglePermission(perm.code)}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 3,
                          cursor: 'pointer',
                          borderColor: isChecked ? '#16a34a' : '#e2e8f0',
                          bgcolor: isChecked ? '#f0fdf450' : 'white',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#16a34a',
                            bgcolor: '#f0fdf430'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                              {perm.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                              {perm.description}
                            </Typography>
                          </Box>
                          {/* Custom CSS/Tailwind Toggle Switch */}
                          <div className="flex items-center flex-shrink-0" style={{ pointerEvents: 'none' }}>
                            <span
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isChecked ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isChecked 
                                    ? (isRTL ? '-translate-x-5' : 'translate-x-5') 
                                    : 'translate-x-0'
                                }`}
                              />
                            </span>
                          </div>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 }, pt: 2, borderTop: '1px solid #e2e8f0', bgcolor: 'background.paper', zIndex: 10, flex: '0 0 auto' }}>
              <Button onClick={() => setPermissionsDialogOpen(false)} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button
                onClick={handleSavePermissions}
                variant="contained"
                color="success"
                disabled={permsLoading}
                sx={{ fontWeight: 'bold', borderRadius: '10px' }}
              >
                {isRTL ? 'حفظ الصلاحيات' : 'Save Permissions'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Create / Edit Announcement Dialog */}
          <Dialog
            open={announcementDialogOpen}
            onClose={() => !announcementsLoading && setAnnouncementDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
          >
            <DialogTitle sx={{ fontWeight: 'black', color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon className="text-green-600" />
              <span>{selectedAnnouncement ? (isRTL ? 'تعديل الإعلان' : 'Edit Announcement') : (isRTL ? 'إنشاء إعلان جديد' : 'Create Announcement')}</span>
            </DialogTitle>
            <DialogContent className="space-y-4" sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label={isRTL ? 'العنوان' : 'Title'}
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                disabled={announcementsLoading}
                variant="outlined"
                InputProps={{ sx: { borderRadius: 3 } }}
                sx={{ mb: 2, mt: 1 }}
              />

              <TextField
                multiline
                rows={5}
                fullWidth
                label={isRTL ? 'محتوى الإعلان' : 'Content Body'}
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                disabled={announcementsLoading}
                variant="outlined"
                InputProps={{ sx: { borderRadius: 3 } }}
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="ann-category-label">{isRTL ? 'الفئة' : 'Category'}</InputLabel>
                    <Select
                      labelId="ann-category-label"
                      value={annCategory}
                      label={isRTL ? 'الفئة' : 'Category'}
                      onChange={(e) => setAnnCategory(e.target.value)}
                      disabled={announcementsLoading}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="general">{isRTL ? 'عام' : 'General'}</MenuItem>
                      <MenuItem value="alerts">{isRTL ? 'تنبيهات' : 'Alerts'}</MenuItem>
                      <MenuItem value="operational">{isRTL ? 'تشغيلي' : 'Operational'}</MenuItem>
                      <MenuItem value="news">{isRTL ? 'أخبار' : 'News'}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={annIsPinned}
                        onChange={(e) => setAnnIsPinned(e.target.checked)}
                        disabled={announcementsLoading}
                        color="success"
                      />
                    }
                    label={<Typography sx={{ fontWeight: 700 }}>{isRTL ? 'تثبيت الإعلان في الأعلى' : 'Pin Announcement at Top'}</Typography>}
                  />
                </Grid>
              </Grid>

              {/* Media Attachment Upload Section */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'slate.700' }}>
                  {isRTL ? 'مرفق وسائط أو ملف' : 'Media or Document Attachment'}
                </Typography>

                {annMediaUrl ? (
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                      {annMediaType === 'IMAGE' ? (
                        <Box component="img" src={getAbsoluteFileUrl(annMediaUrl)} sx={{ width: 60, height: 60, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                      ) : annMediaType === 'VIDEO' ? (
                        <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                          <PermMediaIcon sx={{ color: 'white' }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CodeIcon sx={{ color: '#64748b' }} />
                        </Box>
                      )}
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'slate.800', noWrap: true }}>
                          {annMediaType === 'IMAGE' ? (isRTL ? 'صورة مرفقة' : 'Attached Image') :
                            annMediaType === 'VIDEO' ? (isRTL ? 'فيديو مرفق' : 'Attached Video') :
                              annFileName || (isRTL ? 'مستند مرفق' : 'Attached File')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'slate.500', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {annMediaUrl}
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" color="error" size="small" onClick={() => { setAnnMediaUrl(''); setAnnMediaType(null); setAnnFileName(''); }} sx={{ borderRadius: 2 }}>
                      {isRTL ? 'إزالة' : 'Remove'}
                    </Button>
                  </Card>
                ) : (
                  <Box
                    onClick={() => !annMediaUploading && annFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-green-500 hover:bg-green-50/10 cursor-pointer rounded-2xl p-4 text-center transition-all duration-300"
                  >
                    {annMediaUploading ? (
                      <CircularProgress size={24} sx={{ color: '#16a34a', mb: 1 }} />
                    ) : (
                      <CloudUploadIcon className="w-8 h-8 text-slate-400 mb-1 mx-auto" />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                      {annMediaUploading ? (isRTL ? 'جاري رفع الملف...' : 'Uploading file...') : (isRTL ? 'اضغط لرفع صورة أو فيديو أو مستند' : 'Click to upload image, video or document')}
                    </Typography>
                    <input
                      type="file"
                      ref={annFileInputRef}
                      onChange={handleAnnMediaUpload}
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                    />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={() => setAnnouncementDialogOpen(false)} disabled={announcementsLoading} sx={{ fontWeight: 'bold', color: 'slate.500' }}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveAnnouncement}
                color="success"
                variant="contained"
                disabled={announcementsLoading}
                sx={{ fontWeight: 'bold', borderRadius: '12px', minWidth: 120 }}
              >
                {announcementsLoading ? <CircularProgress size={20} color="inherit" /> : (isRTL ? 'تأكيد الحفظ' : 'Confirm Save')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── ANNOUNCEMENTS TAB ────────────────────────── */}
          <AdminTabPanel id="announcements" active={activeTab === 'announcements'}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CampaignIcon color="success" fontSize="large" />
                    {isRTL ? "إدارة الإعلانات والمستجدات" : "Announcements & Bulletins"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'slate.500', mt: 0.5 }}>
                    {isRTL ? "قم بنشر وتثبيت وتعديل الإعلانات الهامة لموظفي الشركة." : "Publish, pin, and manage important announcements for company staff."}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CampaignIcon />}
                  onClick={handleOpenCreateAnnouncement}
                  sx={{ borderRadius: 3, fontWeight: 800, px: 3, py: 1 }}
                >
                  {isRTL ? "إضافة إعلان جديد" : "New Announcement"}
                </Button>
              </Box>

              {announcementsLoading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress sx={{ color: '#16a34a' }} />
                </Box>
              ) : announcements.length === 0 ? (
                <Box textAlign="center" py={8} className="border border-dashed border-slate-200 rounded-3xl">
                  <Typography color="textSecondary" fontWeight="bold">
                    {isRTL ? "لا توجد إعلانات منشورة حالياً." : "No announcements published at the moment."}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {announcements.map((ann) => (
                    <Grid item xs={12} md={6} key={ann.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          borderColor: ann.is_pinned ? '#16a34a' : '#e2e8f0',
                          bgcolor: ann.is_pinned ? '#f0fdf420' : 'white',
                          minHeight: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#16a34a',
                            boxShadow: '0 8px 30px -10px rgba(22, 163, 74, 0.15)'
                          }
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Chip
                              label={ann.category ? ann.category.toUpperCase() : 'GENERAL'}
                              size="small"
                              color="success"
                              variant={ann.is_pinned ? "filled" : "outlined"}
                              sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                            />
                            {ann.is_pinned && (
                              <Chip
                                icon={<PushPinIcon sx={{ fontSize: '12px !important' }} />}
                                label={isRTL ? "مثبت" : "Pinned"}
                                size="small"
                                color="success"
                                sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 900, color: 'slate.800', mb: 1 }}>
                            {ann.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color: 'slate.500',
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.6
                            }}
                          >
                            {ann.body}
                          </Typography>

                          {/* Media attachment indicator */}
                          {(ann.image_url || ann.video_url || ann.file_url) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: '#f8fafc', p: 1, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                              <PermMediaIcon color="action" sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ color: 'slate.600', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                {ann.image_url ? (isRTL ? "صورة مرفقة" : "Attached Image") :
                                  ann.video_url ? (isRTL ? "فيديو مرفق" : "Attached Video") :
                                    ann.file_name || (isRTL ? "مستند مرفق" : "Attached File")}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', pt: 2, mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'slate.400', fontWeight: 600 }}>
                            {isRTL ? `بواسطة: ${ann.published_by}` : `By: ${ann.published_by}`}
                            <br />
                            {new Date(ann.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB')}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleTogglePin(ann)}
                              sx={{ minWidth: 0, p: 1, color: ann.is_pinned ? '#16a34a' : 'slate.400' }}
                              title={isRTL ? "تثبيت / إلغاء التثبيت" : "Pin / Unpin"}
                            >
                              {ann.is_pinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              onClick={() => handleOpenEditAnnouncement(ann)}
                              sx={{ minWidth: 0, p: 1 }}
                              title={isRTL ? "تعديل" : "Edit"}
                            >
                              <EditIcon fontSize="small" />
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              sx={{ minWidth: 0, p: 1 }}
                              title={isRTL ? "حذف" : "Delete"}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          </AdminTabPanel>

          {/* ── COMMENTS MANAGEMENT TAB ─────────────────────── */}
          <AdminTabPanel id="comments" active={activeTab === 'comments'}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CommentIcon color="success" fontSize="large" />
                    {isRTL ? "إدارة تعليقات لوحة الإعلانات" : "Bulletin Board Comments"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'slate.500', mt: 0.5 }}>
                    {isRTL ? "استعراض وحذف تعليقات المستخدمين على منشورات الشركة." : "Review and delete user feedback comments left on company announcements."}
                  </Typography>
                </Box>
              </Box>

              {/* Bulk Deletion Card if comments selected */}
              {selectedBulkComments.length > 0 && (
                <Card sx={{ p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, color: '#991b1b', fontSize: '0.9rem' }}>
                    {isRTL ? `تم اختيار ${selectedBulkComments.length} تعليق للعملية الجماعية` : `${selectedBulkComments.length} comments selected for bulk action`}
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleBulkDeleteComments(selectedBulkComments)}
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    {isRTL ? "حذف كافة المحدد" : "Delete Selected"}
                  </Button>
                </Card>
              )}

              {commentsLoading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress sx={{ color: '#16a34a' }} />
                </Box>
              ) : commentsList.length === 0 ? (
                <Box textAlign="center" py={8} className="border border-dashed border-slate-200 rounded-3xl">
                  <Typography color="textSecondary" fontWeight="bold">
                    {isRTL ? "لا توجد تعليقات نشطة حالياً." : "No comments posted at the moment."}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {commentsList.map((c) => {
                    const targetAnn = announcements.find(a => String(a.id) === String(c.annId));
                    const annTitleStr = targetAnn ? targetAnn.title : (isRTL ? `إعلان #${c.annId}` : `Announcement #${c.annId}`);
                    const isChecked = selectedBulkComments.includes(`${c.annId}_${c.id}`);

                    return (
                      <Card
                        key={c.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3.5,
                          borderColor: isChecked ? '#ef4444' : '#e2e8f0',
                          bgcolor: isChecked ? '#fef2f240' : 'white',
                          '&:hover': {
                            borderColor: '#16a34a',
                            bgcolor: '#f0fdf410'
                          },
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => {
                            const val = `${c.annId}_${c.id}`;
                            if (isChecked) {
                              setSelectedBulkComments(selectedBulkComments.filter(id => id !== val));
                            } else {
                              setSelectedBulkComments([...selectedBulkComments, val]);
                            }
                          }}
                          color="error"
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, flexWrap: 'wrap' }}>
                          <Avatar sx={{ bgcolor: '#e2e8f0', color: 'slate.700', fontWeight: 800, width: 44, height: 44 }}>
                            {c.author_name ? c.author_name.charAt(0).toUpperCase() : '?'}
                          </Avatar>

                          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 850, color: 'slate.800' }}>
                                {c.author_name}
                              </Typography>
                              <Chip
                                label={c.author_role || 'STAFF'}
                                size="small"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#f1f5f9' }}
                              />
                              <Typography variant="caption" sx={{ color: 'slate.400' }}>
                                {new Date(c.created_at).toLocaleString(isRTL ? 'ar-EG' : 'en-GB')}
                              </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ color: 'slate.600', mt: 0.5, fontWeight: 500 }}>
                              {c.body}
                            </Typography>

                            <Typography variant="caption" sx={{ color: 'slate.400', mt: 0.5, display: 'block', fontWeight: 600 }}>
                              {isRTL ? "على المنشور: " : "On: "}
                              <span style={{ color: '#16a34a', fontWeight: 700 }}>{annTitleStr}</span>
                            </Typography>
                          </Box>
                        </Box>

                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteComment(c.annId, c.id)}
                          sx={{ minWidth: 0, px: 2, borderRadius: 2, fontWeight: 700 }}
                        >
                          {isRTL ? "حذف" : "Delete"}
                        </Button>
                      </Card>
                    );
                  })}
                </List>
              )}
            </Card>
          </AdminTabPanel>

          {/* ── USER AVATARS CONTROL TAB ───────────────────── */}
          <AdminTabPanel id="avatars" active={activeTab === 'avatars'}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }} elevation={0}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FaceIcon color="success" fontSize="large" />
                  {isRTL ? "التحكم في الصور الشخصية (الأفاتار)" : "User Avatars Management"}
                </Typography>
                <Typography variant="body2" sx={{ color: 'slate.500', mt: 0.5 }}>
                  {isRTL ? "استعراض وإعادة تعيين الصور الشخصية لكافة الأعضاء في الشركة." : "Inspect and reset profile pictures for all user accounts."}
                </Typography>
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress sx={{ color: '#16a34a' }} />
                </Box>
              ) : users.length === 0 ? (
                <Box textAlign="center" py={8} className="border border-dashed border-slate-200 rounded-3xl">
                  <Typography color="textSecondary" fontWeight="bold">
                    {isRTL ? "لا يوجد مستخدمون لعرضهم." : "No users to display."}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {users.map((u) => (
                    <Grid item xs={12} sm={6} md={4} key={u.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#16a34a',
                            boxShadow: '0 6px 20px -8px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Avatar
                          src={getAbsoluteFileUrl(u.avatar_url)}
                          alt={u.name}
                          sx={{
                            width: 80,
                            height: 80,
                            mb: 2,
                            border: u.avatar_url ? '3px solid #16a34a' : '3px solid #e2e8f0',
                            fontSize: '1.8rem',
                            fontWeight: 800
                          }}
                        >
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </Avatar>

                        <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'slate.800', mb: 0.5 }}>
                          {u.name}
                        </Typography>

                        <Typography variant="body2" sx={{ color: 'slate.500', mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                          {u.email}
                        </Typography>

                        <Chip
                          label={u.role}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.65rem', mb: 2 }}
                        />

                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          disabled={!u.avatar_url}
                          onClick={() => handleResetAvatar(u.id)}
                          startIcon={<FaceIcon />}
                          sx={{
                            borderRadius: 2.5,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            width: '100%',
                            py: 0.8,
                            '&.Mui-disabled': {
                              bgcolor: '#f1f5f9',
                              color: '#94a3b8',
                              border: '1px solid #e2e8f0'
                            }
                          }}
                        >
                          {isRTL ? "إعادة تعيين الصورة" : "Reset Photo"}
                        </Button>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Card>
          </AdminTabPanel>

          {/* ── BULK OPERATIONS TAB ───────────────────────── */}
          <AdminTabPanel id="bulk_ops" active={activeTab === 'bulk_ops'}>
            <Card sx={{ p: 4, borderRadius: 5, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }} elevation={0}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: 'slate.800', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <DeleteSweepIcon color="error" fontSize="large" />
                  {isRTL ? "لوحة العمليات الجماعية والتطهير" : "Bulk Operations & Purges"}
                </Typography>
                <Typography variant="body2" sx={{ color: 'slate.500', mt: 0.5 }}>
                  {isRTL ? "إجراء عمليات حذف جماعي متعددة للمستخدمين، الإعلانات، التعليقات، والوسائط." : "Perform multi-select mass purges on users, announcements, comments, and media files."}
                </Typography>
              </Box>

              <Box className="space-y-4">
                {/* 1. Users Accordion */}
                <Accordion sx={{ borderRadius: 3, border: '1px solid #e2e8f0', '&:before': { display: 'none' }, boxShadow: 'none', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                      <VerifiedUserIcon color="primary" />
                      <Typography sx={{ fontWeight: 800 }}>
                        {isRTL ? `المستخدمين (${users.length})` : `Users (${users.length})`}
                      </Typography>
                      {selectedBulkUsers.length > 0 && (
                        <Chip label={isRTL ? `تم تحديد ${selectedBulkUsers.length}` : `${selectedBulkUsers.length} selected`} size="small" color="error" sx={{ fontWeight: 800 }} />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBulkUsers.length === users.length && users.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBulkUsers(users.map(u => u.id));
                              } else {
                                setSelectedBulkUsers([]);
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{isRTL ? "تحديد الكل" : "Select All"}</Typography>}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={selectedBulkUsers.length === 0}
                        onClick={() => handleBulkDeleteUsers(selectedBulkUsers)}
                        startIcon={<DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        {isRTL ? "حذف الأعضاء المحددين" : "Delete Selected Users"}
                      </Button>
                    </Box>
                    <List sx={{ maxH: 300, overflowY: 'auto', bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}>
                      {users.map(u => {
                        const isChecked = selectedBulkUsers.includes(u.id);
                        return (
                          <ListItem key={u.id} dense sx={{ borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedBulkUsers(selectedBulkUsers.filter(id => id !== u.id));
                                } else {
                                  setSelectedBulkUsers([...selectedBulkUsers, u.id]);
                                }
                              }}
                            />
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{u.name}</Typography>}
                              secondary={<Typography sx={{ fontSize: '0.75rem', color: 'slate.500' }}>{u.email} &bull; {u.role}</Typography>}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* 2. Announcements Accordion */}
                <Accordion sx={{ borderRadius: 3, border: '1px solid #e2e8f0', '&:before': { display: 'none' }, boxShadow: 'none', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                      <CampaignIcon color="success" />
                      <Typography sx={{ fontWeight: 800 }}>
                        {isRTL ? `الإعلانات (${announcements.length})` : `Announcements (${announcements.length})`}
                      </Typography>
                      {selectedBulkAnnouncements.length > 0 && (
                        <Chip label={isRTL ? `تم تحديد ${selectedBulkAnnouncements.length}` : `${selectedBulkAnnouncements.length} selected`} size="small" color="error" sx={{ fontWeight: 800 }} />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBulkAnnouncements.length === announcements.length && announcements.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBulkAnnouncements(announcements.map(a => a.id));
                              } else {
                                setSelectedBulkAnnouncements([]);
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{isRTL ? "تحديد الكل" : "Select All"}</Typography>}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={selectedBulkAnnouncements.length === 0}
                        onClick={() => handleBulkDeleteAnnouncements(selectedBulkAnnouncements)}
                        startIcon={<DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        {isRTL ? "حذف الإعلانات المحددة" : "Delete Selected"}
                      </Button>
                    </Box>
                    <List sx={{ maxH: 300, overflowY: 'auto', bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}>
                      {announcements.map(a => {
                        const isChecked = selectedBulkAnnouncements.includes(a.id);
                        return (
                          <ListItem key={a.id} dense sx={{ borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedBulkAnnouncements(selectedBulkAnnouncements.filter(id => id !== a.id));
                                } else {
                                  setSelectedBulkAnnouncements([...selectedBulkAnnouncements, a.id]);
                                }
                              }}
                            />
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{a.title}</Typography>}
                              secondary={<Typography sx={{ fontSize: '0.75rem', color: 'slate.500' }}>{new Date(a.created_at).toLocaleDateString()} &bull; {a.category}</Typography>}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* 3. Comments Accordion */}
                <Accordion sx={{ borderRadius: 3, border: '1px solid #e2e8f0', '&:before': { display: 'none' }, boxShadow: 'none', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                      <CommentIcon color="action" />
                      <Typography sx={{ fontWeight: 800 }}>
                        {isRTL ? `التعليقات (${commentsList.length})` : `Comments (${commentsList.length})`}
                      </Typography>
                      {selectedBulkComments.length > 0 && (
                        <Chip label={isRTL ? `تم تحديد ${selectedBulkComments.length}` : `${selectedBulkComments.length} selected`} size="small" color="error" sx={{ fontWeight: 800 }} />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBulkComments.length === commentsList.length && commentsList.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBulkComments(commentsList.map(c => `${c.annId}_${c.id}`));
                              } else {
                                setSelectedBulkComments([]);
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{isRTL ? "تحديد الكل" : "Select All"}</Typography>}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={selectedBulkComments.length === 0}
                        onClick={() => handleBulkDeleteComments(selectedBulkComments)}
                        startIcon={<DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        {isRTL ? "حذف التعليقات المحددة" : "Delete Selected"}
                      </Button>
                    </Box>
                    <List sx={{ maxH: 300, overflowY: 'auto', bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}>
                      {commentsList.map(c => {
                        const val = `${c.annId}_${c.id}`;
                        const isChecked = selectedBulkComments.includes(val);
                        const targetAnn = announcements.find(a => String(a.id) === String(c.annId));
                        const annTitleStr = targetAnn ? targetAnn.title : `Announcement #${c.annId}`;

                        return (
                          <ListItem key={c.id} dense sx={{ borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedBulkComments(selectedBulkComments.filter(id => id !== val));
                                } else {
                                  setSelectedBulkComments([...selectedBulkComments, val]);
                                }
                              }}
                            />
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{c.body}</Typography>}
                              secondary={<Typography sx={{ fontSize: '0.75rem', color: 'slate.500' }}>{c.author_name} &bull; {isRTL ? "على منشور: " : "On: "} {annTitleStr}</Typography>}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* 4. Media Accordion */}
                <Accordion sx={{ borderRadius: 3, border: '1px solid #e2e8f0', '&:before': { display: 'none' }, boxShadow: 'none', mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                      <PermMediaIcon color="action" />
                      <Typography sx={{ fontWeight: 800 }}>
                        {isRTL ? `معرض الوسائط والملفات (${galleryItems.length})` : `Media Gallery Files (${galleryItems.length})`}
                      </Typography>
                      {selectedBulkMedia.length > 0 && (
                        <Chip label={isRTL ? `تم تحديد ${selectedBulkMedia.length}` : `${selectedBulkMedia.length} selected`} size="small" color="error" sx={{ fontWeight: 800 }} />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, borderTop: '1px solid #f1f5f9', pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedBulkMedia.length === galleryItems.length && galleryItems.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBulkMedia(galleryItems.map(m => m.id));
                              } else {
                                setSelectedBulkMedia([]);
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{isRTL ? "تحديد الكل" : "Select All"}</Typography>}
                      />
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={selectedBulkMedia.length === 0}
                        onClick={() => handleBulkDeleteMedia(selectedBulkMedia)}
                        startIcon={<DeleteIcon />}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        {isRTL ? "حذف الوسائط المحددة" : "Delete Selected Media"}
                      </Button>
                    </Box>
                    <List sx={{ maxH: 300, overflowY: 'auto', bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}>
                      {galleryLoading ? (
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress size={20} sx={{ color: '#16a34a' }} />
                        </Box>
                      ) : galleryItems.map(m => {
                        const isChecked = selectedBulkMedia.includes(m.id);
                        return (
                          <ListItem key={m.id} dense sx={{ borderBottom: '1px solid #e2e8f0', '&:last-child': { borderBottom: 'none' } }}>
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedBulkMedia(selectedBulkMedia.filter(id => id !== m.id));
                                } else {
                                  setSelectedBulkMedia([...selectedBulkMedia, m.id]);
                                }
                              }}
                            />
                            {m.type === 'IMAGE' && m.url ? (
                              <Box component="img" src={getAbsoluteFileUrl(m.url)} sx={{ width: 36, height: 36, borderRadius: 1.5, objectFit: 'cover', mr: 2, border: '1px solid #e2e8f0' }} />
                            ) : (
                              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                <PermMediaIcon sx={{ color: '#64748b', fontSize: 16 }} />
                              </Box>
                            )}
                            <ListItemText
                              primary={<Typography sx={{ fontWeight: 800, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url ? m.url.split('/').pop() : ''}</Typography>}
                              secondary={<Typography sx={{ fontSize: '0.75rem', color: 'slate.500' }}>{m.type} &bull; {new Date(m.created_at || m.uploaded_at).toLocaleDateString()}</Typography>}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Card>
          </AdminTabPanel>

          {/* ── MEDIA CENTER TAB ───────────────────────────── */}
          <AdminTabPanel id="media_center" active={activeTab === 'media_center'}>
            <MediaControlCenter embedded={true} />
          </AdminTabPanel>

          {/* ── FARM SETTINGS TAB ──────────────────────────── */}
          <AdminTabPanel id="farm" active={activeTab === 'farm'}>
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
          </AdminTabPanel>

          {/* ── CMS TAB ──────────────────────────────────── */}
          <AdminTabPanel id="cms" active={activeTab === 'cms' && currentUser?.role === 'SUPER_ADMIN'}>
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
                    <TextField fullWidth label={isRTL ? 'اسم الشعار بالإنجليزية' : 'Brand Name (EN)'} value={cmsData.logo_text_en || ''} onChange={(e) => setCmsData({ ...cmsData, logo_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'اسم الشعار بالعربية' : 'Brand Name (AR)'} value={cmsData.logo_text_ar || ''} onChange={(e) => setCmsData({ ...cmsData, logo_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'رابط صورة اللوجو (اختياري)' : 'Logo Image URL (Optional)'} value={cmsData.logo_url || ''} onChange={(e) => setCmsData({ ...cmsData, logo_url: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Hero Settings */}
                  <Box className="space-y-4">
                    <p className="font-bold text-sky-600 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                      {isRTL ? 'قسم الترحيب (Hero Section)' : 'Hero Section & Landing Headline'}
                    </p>
                    <TextField fullWidth label={isRTL ? 'العنوان الرئيسي بالإنجليزية' : 'Hero Title (EN)'} value={cmsData.hero_title_en || ''} onChange={(e) => setCmsData({ ...cmsData, hero_title_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'العنوان الرئيسي بالعربية' : 'Hero Title (AR)'} value={cmsData.hero_title_ar || ''} onChange={(e) => setCmsData({ ...cmsData, hero_title_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'الوصف الفرعي بالإنجليزية' : 'Hero Description (EN)'} value={cmsData.hero_text_en || ''} onChange={(e) => setCmsData({ ...cmsData, hero_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'الوصف الفرعي بالعربية' : 'Hero Description (AR)'} value={cmsData.hero_text_ar || ''} onChange={(e) => setCmsData({ ...cmsData, hero_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Crops Showcase Settings */}
                  <Box className="space-y-4">
                    <p className="font-bold text-emerald-600 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      {isRTL ? 'قسم النخيل والتمور' : 'Palm & Dates Unit'}
                    </p>
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع النخيل بالإنجليزية' : 'Palm Unit Description (EN)'} value={cmsData.palm_text_en} onChange={(e) => setCmsData({ ...cmsData, palm_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع النخيل بالعربية' : 'وصف قطاع النخيل بالعربية'} value={cmsData.palm_text_ar} onChange={(e) => setCmsData({ ...cmsData, palm_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box className="space-y-4">
                    <p className="font-bold text-amber-500 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      {isRTL ? 'قسم الزيتون' : 'Olive & Oil Unit'}
                    </p>
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع الزيتون بالإنجليزية' : 'Olive Unit Description (EN)'} value={cmsData.olive_text_en} onChange={(e) => setCmsData({ ...cmsData, olive_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={2} label={isRTL ? 'وصف قطاع الزيتون بالعربية' : 'وصف قطاع الزيتون بالعربية'} value={cmsData.olive_text_ar} onChange={(e) => setCmsData({ ...cmsData, olive_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* About Us Settings */}
                  <Box className="space-y-4">
                    <p className="font-bold text-indigo-500 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      {isRTL ? 'قسم عن الشركة (About Us Section)' : 'About Us & Mission Section'}
                    </p>
                    <TextField fullWidth label={isRTL ? 'عنوان قسم عن الشركة بالإنجليزية' : 'About Title (EN)'} value={cmsData.about_title_en || ''} onChange={(e) => setCmsData({ ...cmsData, about_title_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'عنوان قسم عن الشركة بالعربية' : 'About Title (AR)'} value={cmsData.about_title_ar || ''} onChange={(e) => setCmsData({ ...cmsData, about_title_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={3} label={isRTL ? 'وصف قسم عن الشركة بالإنجليزية' : 'About Description (EN)'} value={cmsData.about_text_en || ''} onChange={(e) => setCmsData({ ...cmsData, about_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={3} label={isRTL ? 'وصف قسم عن الشركة بالعربية' : 'About Description (AR)'} value={cmsData.about_text_ar || ''} onChange={(e) => setCmsData({ ...cmsData, about_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Features Settings */}
                  <Box className="space-y-4">
                    <p className="font-bold text-teal-600 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                      {isRTL ? 'قسم المميزات التقنية (Features Grid Section)' : 'Technical Features Grid Headline'}
                    </p>
                    <TextField fullWidth label={isRTL ? 'عنوان قسم المميزات بالإنجليزية' : 'Features Section Title (EN)'} value={cmsData.features_title_en || ''} onChange={(e) => setCmsData({ ...cmsData, features_title_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'عنوان قسم المميزات بالعربية' : 'Features Section Title (AR)'} value={cmsData.features_title_ar || ''} onChange={(e) => setCmsData({ ...cmsData, features_title_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Contact Us Settings */}
                  <Box className="space-y-4">
                    <p className="font-bold text-rose-500 uppercase tracking-widest text-xs flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      {isRTL ? 'قسم اتصل بنا ودعوة التسجيل (Contact Us & Call to Action)' : 'Contact Us & Sign up CTA'}
                    </p>
                    <TextField fullWidth label={isRTL ? 'عنوان قسم اتصل بنا بالإنجليزية' : 'Contact Title (EN)'} value={cmsData.contact_title_en || ''} onChange={(e) => setCmsData({ ...cmsData, contact_title_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'عنوان قسم اتصل بنا بالعربية' : 'Contact Title (AR)'} value={cmsData.contact_title_ar || ''} onChange={(e) => setCmsData({ ...cmsData, contact_title_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={3} label={isRTL ? 'الوصف الفرعي بالإنجليزية' : 'Contact Subtext (EN)'} value={cmsData.contact_text_en || ''} onChange={(e) => setCmsData({ ...cmsData, contact_text_en: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth multiline rows={3} label={isRTL ? 'الوصف الفرعي بالعربية' : 'Contact Subtext (AR)'} value={cmsData.contact_text_ar || ''} onChange={(e) => setCmsData({ ...cmsData, contact_text_ar: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'البريد الإلكتروني المباشر' : 'Direct Email Address'} value={cmsData.contact_email || ''} onChange={(e) => setCmsData({ ...cmsData, contact_email: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
                    <TextField fullWidth label={isRTL ? 'الهاتف المباشر' : 'Direct Phone Number'} value={cmsData.contact_phone || ''} onChange={(e) => setCmsData({ ...cmsData, contact_phone: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: 3 } }} />
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
          </AdminTabPanel>

          {/* ── STORAGE AND DATA MANAGEMENT TAB ───────────── */}
          <AdminTabPanel id="data" active={activeTab === 'data' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER')} className="space-y-8">
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

              {/* Card 7: HR & Workers/Engineers */}
              <Card variant="outlined" className="p-6 rounded-3xl border-border bg-card flex flex-col justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                    <StorageIcon />
                  </div>
                  <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                    {isRTL ? 'العمال والمهندسين (HR)' : 'HR & Workers/Engineers'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, minHeight: 40 }}>
                    {isRTL
                      ? 'إدارة وحقن بيانات العمال الميدانيين وتعيين المهندسين الزراعيين وأجورهم.'
                      : 'Manage field laborers, roles, wages, and seed engineer accounts.'}
                  </Typography>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => openInjectDialog('hr', isRTL ? 'العمال والمهندسين' : 'HR & Workers/Engineers')}
                    sx={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}
                  >
                    {isRTL ? 'حقن JSON' : 'Inject'}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={() => openPurgeDialog('hr', isRTL ? 'العمال والمهندسين' : 'HR & Workers/Engineers')}
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
                <Tab value="hr" label={isRTL ? 'العمال والمهندسين' : 'HR & Workers'} />
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
          </AdminTabPanel>

          {/* ── PASSWORD RESET APPROVALS TAB ────────────────── */}
          <AdminTabPanel id="password_resets" active={activeTab === 'password_resets' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER')}>
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
          </AdminTabPanel>

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
        </div>

        {/* Right Side: Governance & Sensitive Operations (Persistent sidebar) */}
        {activeTab === 'overview' && (
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-5 text-slate-200 text-right transition-all">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">وحدة الحوكمة الأمني</h4>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Governance Console</span>
                </div>
              </div>

              {/* System Backups */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">تصدير وأرشفة البيانات</span>
                <button
                  onClick={downloadBackupJSON}
                  type="button"
                  className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <span>تحميل أرشيف JSON الكامل</span>
                  <HardDriveDownload className="h-4 w-4 text-blue-400" />
                </button>
              </div>

              {/* Database Injections */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block px-1">عمليات الحقن البرمجية</span>
                <button
                  onClick={() => openInjectDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure')}
                  type="button"
                  className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <span>حقن سجلات قاعدة البيانات</span>
                  <Terminal className="h-4 w-4 text-emerald-400" />
                </button>
              </div>

              {/* Database Wipe */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest block px-1">عمليات التهيئة والتطهير (خطير)</span>
                <button
                  onClick={() => openPurgeDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure')}
                  type="button"
                  className="w-full flex items-center justify-between bg-red-950/20 hover:bg-red-955 border border-red-900/60 hover:border-red-900 text-red-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  <span>حذف وتطهير البيانات الحالية</span>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
                <span className="text-[9px] text-slate-500 block leading-normal px-1">تحذير: هذه العمليات تقوم بتهيئة الجداول ومسح كل السجلات نهائياً من قاعدة البيانات.</span>
              </div>

              {/* Active Specs */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3 text-[10px] text-slate-400 font-bold space-y-1">
                <div className="flex justify-between">
                  <span>خادم قاعدة البيانات:</span>
                  <span className="text-slate-300 font-mono">PostgreSQL :5432</span>
                </div>
                <div className="flex justify-between">
                  <span>بروتوكول الأمان:</span>
                  <span className="text-slate-300 font-mono">TLS 1.3 SECURE</span>
                </div>
                <div className="flex justify-between">
                  <span>محرك التطبيق:</span>
                  <span className="text-slate-300 font-mono">GraphQL API v2</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Global Command Palette Dialog ─────────────────── */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-center pt-24 px-4 animate-fadeIn"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[480px] overflow-hidden shadow-2xl flex flex-col transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder={isRTL ? "ابحث عن أمر، صفحة، أو اسم عضو..." : "Search commands, pages, or user names..."}
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                className="w-full bg-transparent border-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-0 font-semibold"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {(() => {
                const results = getCommandPaletteResults();
                const hasResults = results.pages.length > 0 || results.actions.length > 0 || results.users.length > 0;

                if (!hasResults) {
                  return (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-bold text-xs">
                      {isRTL ? "لم يتم العثور على نتائج متطابقة." : "No matching commands or members found."}
                    </div>
                  );
                }

                return (
                  <>
                    {/* Pages Group */}
                    {results.pages.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-2">
                          {isRTL ? "صفحات النظام" : "System Screens"}
                        </span>
                        <div className="space-y-0.5">
                          {results.pages.map(p => (
                            <button
                              key={p.key}
                              onClick={() => {
                                setActiveTab(p.key);
                                setIsCommandPaletteOpen(false);
                                setCommandSearch('');
                              }}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-right cursor-pointer"
                            >
                              <LayoutDashboard className="h-4 w-4 text-slate-400" />
                              <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Group */}
                    {results.actions.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-2">
                          {isRTL ? "العمليات التنفيذية" : "Administrative Operations"}
                        </span>
                        <div className="space-y-0.5">
                          {results.actions.map(a => (
                            <button
                              key={a.type}
                              onClick={() => {
                                if (a.type === 'backup') downloadBackupJSON();
                                else if (a.type === 'inject') openInjectDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure');
                                else if (a.type === 'purge') openPurgeDialog('farm', isRTL ? 'الهيكل التنظيمي للمزرعة' : 'Farm Structure');
                                setIsCommandPaletteOpen(false);
                                setCommandSearch('');
                              }}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-right cursor-pointer"
                            >
                              <Terminal className="h-4 w-4 text-slate-400" />
                              <span>{a.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users Group */}
                    {results.users.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-2">
                          {isRTL ? "أعضاء المنظومة" : "Platform Members"}
                        </span>
                        <div className="space-y-0.5">
                          {results.users.map(user => (
                            <button
                              key={user.id}
                              onClick={() => {
                                handleOpenPermissions(user);
                                setIsCommandPaletteOpen(false);
                                setCommandSearch('');
                              }}
                              type="button"
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-right cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <CircleUserRound className="h-4 w-4 text-slate-400" />
                                <span>{user.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{user.email} &bull; {user.role}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer tips */}
            <div className="bg-slate-50 dark:bg-slate-955 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold flex justify-between">
              <span>{isRTL ? "اضغط ESC للإغلاق" : "Press ESC to close"}</span>
              <span>{isRTL ? "Enter للاختيار" : "Enter to select"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControls;
