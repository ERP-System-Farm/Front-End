/**
 * NotificationSettingsPanel — ATLS Admin Panel
 * =============================================
 * Premium admin UI for the full Notification Management System.
 * 
 * Sections:
 *   1. Global Control (enable/disable + silence countdown)
 *   2. Emergency Silence (with timed duration picker)
 *   3. Delivery Channels (db, in-app, email/push/sms coming-soon)
 *   4. Polling Interval (segmented control)
 *   5. Notification Types (grouped by module, search/filter)
 *   6. Historical Notifications (hide / archive / purge)
 *   7. Diagnostics (debug logs toggle)
 *   8. Audit Log (last 100 entries, SUPER_ADMIN only)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../app/AuthContext';
import {
  activateEmergencySilence,
  archiveHistoricalNotifications,
  deactivateEmergencySilence,
  getNotificationAuditLog,
  getNotificationConfig,
  getNotificationRegistry,
  purgeHistoricalNotifications,
  updateNotificationConfig,
} from '../../features/notifications/notificationConfigService';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  AlertTriangle,
  Archive,
  Bell,
  BellOff,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Power,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Trash2,
  Volume2,
  VolumeX,
  Shield,
  Bug,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// ── Icon map for registry icons ───────────────────────────────────────────────
const ICON_MAP = {
  'cpu': Shield,
  'bell-ring': Bell,
  'clipboard-list': FileText,
  'file-text': FileText,
  'megaphone': Volume2,
  'message-circle': MessageSquare,
  'mail': Mail,
  'send': Send,
  'user-check': CheckCircle,
  'package': Database,
  'receipt': FileText,
  'calendar': Clock,
  'database': Database,
  'bell': Bell,
  'smartphone': Smartphone,
  'message-square': MessageSquare,
};

const getIcon = (name) => ICON_MAP[name] || Bell;

// ── Toggle Switch ─────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled = false, size = 'md' }) => {
  const sizes = {
    sm: { track: 'w-8 h-4',  thumb: 'w-3 h-3',  translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5',  translate: 'translate-x-5' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        s.track,
        checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span className={cn(
        'inline-block rounded-full bg-white shadow transition-transform duration-200 ms-0.5',
        s.thumb,
        checked ? s.translate : 'translate-x-0'
      )} />
    </button>
  );
};

// ── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, icon: Icon, children, accent = 'emerald', collapsible = false }) => {
  const [open, setOpen] = useState(true);
  const accentMap = {
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    red:     'text-red-600    dark:text-red-400    bg-red-500/10',
    amber:   'text-amber-600  dark:text-amber-400  bg-amber-500/10',
    blue:    'text-blue-600   dark:text-blue-400   bg-blue-500/10',
    purple:  'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    slate:   'text-slate-600  dark:text-slate-400  bg-slate-500/10',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div
        className={cn('flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800', collapsible && 'cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50')}
        onClick={collapsible ? () => setOpen(p => !p) : undefined}
      >
        {Icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', accentMap[accent] || accentMap.emerald)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {collapsible && (
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
        )}
      </div>
      {(!collapsible || open) && <div className="p-5">{children}</div>}
    </div>
  );
};

// ── Countdown display ─────────────────────────────────────────────────────────
const SilenceCountdown = ({ until }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!until) return;
    const tick = () => {
      const diff = new Date(until) - Date.now();
      if (diff <= 0) { setRemaining('انتهى'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  return <span className="font-mono text-red-500 dark:text-red-400 font-bold text-sm">{remaining}</span>;
};

// ── Purge Confirm Dialog ──────────────────────────────────────────────────────
const PurgeConfirmDialog = ({ onConfirm, onCancel, loading, isRTL }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
          {isRTL ? 'تأكيد الحذف النهائي' : 'Confirm Permanent Deletion'}
        </h3>
      </div>
      <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
        {isRTL
          ? 'سيتم حذف جميع الإشعارات من قاعدة البيانات بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.'
          : 'All notifications will be permanently deleted from the database. This action cannot be undone.'}
      </p>
      <p className="text-[12px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 mb-5">
        {isRTL ? '⚠ سيتم تسجيل هذا الإجراء في سجل التدقيق' : '⚠ This action will be logged in the audit trail'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {isRTL ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isRTL ? 'نعم، احذف نهائياً' : 'Yes, Delete Permanently'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Panel ────────────────────────────────────────────────────────────────
const NotificationSettingsPanel = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { fetchPollingConfig } = useNotifications();
  const isRTL = i18n.language === 'ar';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isReadOnly = !['SUPER_ADMIN', 'OWNER'].includes(user?.role);

  // ── State ─────────────────────────────────────────────────────────────────
  const [config, setConfig]               = useState(null);
  const [registry, setRegistry]           = useState(null);
  const [auditLog, setAuditLog]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [silenceDuration, setSilenceDuration] = useState(60);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeLoading, setPurgeLoading]   = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const auditRefreshRef = useRef(null);

  // ── Load config + registry ────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, reg, log] = await Promise.all([
        getNotificationConfig(),
        getNotificationRegistry(),
        isSuperAdmin ? getNotificationAuditLog() : Promise.resolve({ results: [] }),
      ]);
      setConfig(cfg);
      setRegistry(reg);
      setAuditLog(log.results || []);
    } catch (err) {
      toast.error(isRTL ? 'فشل تحميل إعدادات الإشعارات' : 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, isRTL]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Auto-refresh audit log every 30s when panel is open ──────────────────
  useEffect(() => {
    if (!isSuperAdmin) return;
    auditRefreshRef.current = setInterval(async () => {
      try {
        const log = await getNotificationAuditLog();
        setAuditLog(log.results || []);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(auditRefreshRef.current);
  }, [isSuperAdmin]);

  // ── Generic config update ────────────────────────────────────────────────
  const update = async (payload, savingKey = 'generic') => {
    if (isReadOnly) return;
    setSaving(savingKey);
    try {
      const updated = await updateNotificationConfig(payload);
      setConfig(updated);
      fetchPollingConfig(); // sync NotificationContext with new config
      toast.success(isRTL ? 'تم حفظ التغييرات' : 'Changes saved');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || (isRTL ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setSaving('');
    }
  };

  // ── Emergency silence ─────────────────────────────────────────────────────
  const handleActivateSilence = async () => {
    if (isReadOnly) return;
    setSaving('silence');
    try {
      await activateEmergencySilence(silenceDuration);
      await loadAll();
      fetchPollingConfig();
      toast.success(isRTL ? `تم تفعيل وضع الصمت لمدة ${silenceDuration} دقيقة` : `Emergency silence activated for ${silenceDuration} minutes`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed');
    } finally {
      setSaving('');
    }
  };

  const handleDeactivateSilence = async () => {
    if (isReadOnly) return;
    setSaving('silence');
    try {
      await deactivateEmergencySilence();
      await loadAll();
      fetchPollingConfig();
      toast.success(isRTL ? 'تم إلغاء وضع الصمت الطارئ' : 'Emergency silence deactivated');
    } catch {
      toast.error('Failed to deactivate silence');
    } finally {
      setSaving('');
    }
  };

  // ── Historical operations ─────────────────────────────────────────────────
  const handleArchive = async () => {
    if (isReadOnly) return;
    setArchiveLoading(true);
    try {
      const res = await archiveHistoricalNotifications();
      await loadAll();
      toast.success(isRTL ? `تم أرشفة ${res.archived_count} إشعار` : `Archived ${res.archived_count} notifications`);
    } catch {
      toast.error(isRTL ? 'فشل الأرشفة' : 'Archive failed');
    } finally {
      setArchiveLoading(false);
    }
  };

  const handlePurge = async () => {
    setPurgeLoading(true);
    try {
      const res = await purgeHistoricalNotifications();
      setShowPurgeConfirm(false);
      await loadAll();
      toast.success(isRTL ? `تم حذف ${res.purged_count} إشعار نهائياً` : `Permanently deleted ${res.purged_count} notifications`);
    } catch {
      toast.error(isRTL ? 'فشل الحذف النهائي' : 'Purge failed');
    } finally {
      setPurgeLoading(false);
    }
  };

  // ── Notification type toggle ──────────────────────────────────────────────
  const handleTypeToggle = (key, val) => {
    const newTypeConfig = { ...(config?.type_config || {}), [key]: val };
    update({ type_config: newTypeConfig }, `type_${key}`);
  };

  // ── Channel toggle ────────────────────────────────────────────────────────
  const handleChannelToggle = (key, val) => {
    const newChannels = { ...(config?.channels_config || {}), [key]: val };
    update({ channels_config: newChannels }, `channel_${key}`);
  };

  // ── Filter types by search ────────────────────────────────────────────────
  const filteredTypes = registry
    ? Object.entries(registry.notification_types || {}).filter(([key, meta]) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          key.includes(q) ||
          meta.label_en?.toLowerCase().includes(q) ||
          meta.label_ar?.includes(q) ||
          meta.module?.includes(q)
        );
      })
    : [];

  // Group by module
  const groupedTypes = filteredTypes.reduce((acc, [key, meta]) => {
    const mod = meta.module || 'other';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push([key, meta]);
    return acc;
  }, {});

  // ── Polling interval options ──────────────────────────────────────────────
  const INTERVAL_OPTIONS = [
    { value: 15,  label: '15s' },
    { value: 30,  label: '30s' },
    { value: 60,  label: '1m'  },
    { value: 120, label: '2m'  },
    { value: 300, label: '5m'  },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-500">{isRTL ? 'جاري تحميل إعدادات الإشعارات...' : 'Loading notification settings...'}</p>
        </div>
      </div>
    );
  }

  if (!config || !registry) return null;

  const isGloballyActive = config.is_globally_active;
  const isSilenced = config.is_silenced;

  return (
    <div className="space-y-5 max-w-4xl">
      {showPurgeConfirm && (
        <PurgeConfirmDialog
          onConfirm={handlePurge}
          onCancel={() => setShowPurgeConfirm(false)}
          loading={purgeLoading}
          isRTL={isRTL}
        />
      )}

      {/* ── Read-only banner ── */}
      {isReadOnly && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-medium">
          <Shield className="w-4 h-4 flex-shrink-0" />
          {isRTL ? 'أنت في وضع القراءة فقط. هذه الإعدادات تتطلب صلاحيات المالك أو مدير النظام الأعلى.' : 'You have read-only access. Changes require Owner or Super Admin role.'}
        </div>
      )}

      {/* ── SECTION 1: Global Control ── */}
      <SectionCard
        title={isRTL ? 'التحكم العام بالإشعارات' : 'Global Notification Control'}
        subtitle={isRTL ? 'مفتاح رئيسي لتشغيل أو إيقاف جميع الإشعارات' : 'Master switch for all notification delivery'}
        icon={isGloballyActive ? Bell : BellOff}
        accent={isGloballyActive ? 'emerald' : 'red'}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              {isRTL ? 'الإشعارات' : 'Notifications'}
            </span>
            <span className={cn('text-[12px] font-semibold mt-0.5', isGloballyActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
              {isSilenced
                ? (isRTL ? '🔇 وضع الصمت الطارئ مفعّل' : '🔇 Emergency silence active')
                : isGloballyActive
                  ? (isRTL ? '● نشطة' : '● Active')
                  : (isRTL ? '○ معطلة' : '○ Disabled')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isSilenced && config.emergency_silence_until && (
              <div className="text-right">
                <p className="text-[11px] text-slate-500 mb-0.5">{isRTL ? 'ينتهي خلال:' : 'Expires in:'}</p>
                <SilenceCountdown until={config.emergency_silence_until} />
              </div>
            )}
            <Toggle
              checked={config.notifications_enabled && !isSilenced}
              onChange={(val) => update({ notifications_enabled: val }, 'global')}
              disabled={isReadOnly || saving === 'global' || isSilenced}
              size="md"
            />
            {saving === 'global' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </div>
        </div>
      </SectionCard>

      {/* ── SECTION 2: Emergency Silence ── */}
      <SectionCard
        title={isRTL ? 'وضع الصمت الطارئ' : 'Emergency Silence Mode'}
        subtitle={isRTL ? 'تعطيل مؤقت للإشعارات مع انتهاء صلاحية تلقائي' : 'Temporarily disable notifications with auto-expiry'}
        icon={VolumeX}
        accent={isSilenced ? 'red' : 'slate'}
        collapsible
      >
        {isSilenced ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-[13px] font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {isRTL ? 'وضع الصمت الطارئ مفعّل' : 'Emergency silence is active'}
              </p>
              {config.emergency_silence_until && (
                <p className="text-[12px] text-red-600 dark:text-red-500 mt-1 flex items-center gap-1">
                  {isRTL ? 'ينتهي في:' : 'Expires at:'} <SilenceCountdown until={config.emergency_silence_until} />
                </p>
              )}
            </div>
            {!isReadOnly && (
              <button
                onClick={handleDeactivateSilence}
                disabled={saving === 'silence'}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {saving === 'silence' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                {isRTL ? 'إلغاء الصمت' : 'Deactivate Silence'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[13px] text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                {isRTL ? 'مدة الصمت:' : 'Silence for:'}
              </span>
              <div className="flex gap-1.5">
                {[15, 30, 60, 240, 1440].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSilenceDuration(m)}
                    disabled={isReadOnly}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors',
                      silenceDuration === m
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    {m < 60 ? `${m}m` : m === 60 ? '1h' : m === 240 ? '4h' : '24h'}
                  </button>
                ))}
              </div>
            </div>
            {!isReadOnly && (
              <button
                onClick={handleActivateSilence}
                disabled={saving === 'silence'}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {saving === 'silence' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <VolumeX className="w-3.5 h-3.5" />}
                {isRTL ? 'تفعيل الصمت' : 'Activate Silence'}
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── SECTION 3: Delivery Channels ── */}
      <SectionCard
        title={isRTL ? 'قنوات التوصيل' : 'Delivery Channels'}
        subtitle={isRTL ? 'تحكم في أين يتم توصيل الإشعارات' : 'Control where notifications are delivered'}
        icon={Activity}
        accent="blue"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(registry.delivery_channels || {}).map(([key, ch]) => {
            const ChIcon = getIcon(ch.icon);
            const isEnabled = ch.coming_soon ? false : (config.channels_config?.[key] ?? (key === 'db' || key === 'in_app'));
            const isComingSoon = ch.coming_soon;

            return (
              <div
                key={key}
                className={cn(
                  'flex items-start gap-3 p-3.5 rounded-xl border transition-colors',
                  isComingSoon
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                    : isEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  isComingSoon ? 'bg-slate-200 dark:bg-slate-700' : isEnabled ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800'
                )}>
                  <ChIcon className={cn('w-4 h-4', isComingSoon ? 'text-slate-400' : isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {isRTL ? ch.label_ar : ch.label_en}
                    </span>
                    {isComingSoon ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md whitespace-nowrap flex-shrink-0">
                        {isRTL ? 'قريباً' : 'Coming Soon'}
                      </span>
                    ) : (
                      <Toggle
                        checked={isEnabled}
                        onChange={(val) => handleChannelToggle(key, val)}
                        disabled={isReadOnly || saving === `channel_${key}`}
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {isRTL ? ch.description_ar : ch.description_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── SECTION 4: Polling Interval ── */}
      <SectionCard
        title={isRTL ? 'فترة الاستطلاع' : 'Polling Interval'}
        subtitle={isRTL ? 'كم مرة يتحقق الواجهة الأمامية من الإشعارات الجديدة' : 'How often the frontend checks for new notifications'}
        icon={RefreshCw}
        accent="blue"
        collapsible
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {INTERVAL_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                disabled={isReadOnly || saving === 'interval'}
                onClick={() => update({ polling_interval_seconds: value }, 'interval')}
                className={cn(
                  'px-4 py-2 rounded-xl text-[13px] font-bold transition-all border-2',
                  config.polling_interval_seconds === value
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                )}
              >
                {label}
              </button>
            ))}
            {saving === 'interval' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500 self-center" />}
          </div>
          {config.polling_interval_seconds < 30 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
                {isRTL ? 'فترة قصيرة جداً — قد تزيد الحمل على الخادم' : 'Very short interval — may increase server load'}
              </span>
            </div>
          )}
          <p className="text-[12px] text-slate-500">
            {isRTL
              ? `الجرس سيتحقق من الإشعارات كل ${config.polling_interval_seconds} ثانية`
              : `Bell refreshes every ${config.polling_interval_seconds}s — applies to all company users`}
          </p>
        </div>
      </SectionCard>

      {/* ── SECTION 5: Notification Types ── */}
      <SectionCard
        title={isRTL ? 'أنواع الإشعارات' : 'Notification Types'}
        subtitle={isRTL ? 'تفعيل أو تعطيل أنواع الإشعارات بشكل مستقل' : 'Enable or disable each notification type independently'}
        icon={Bell}
        accent="emerald"
      >
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={isRTL ? 'بحث في أنواع الإشعارات...' : 'Search notification types...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Grouped type list */}
        <div className="space-y-3">
          {Object.entries(groupedTypes).map(([module, types]) => {
            const moduleMeta = registry.module_labels?.[module] || {};
            const isExpanded = expandedModules[module] !== false;

            return (
              <div key={module} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => setExpandedModules(prev => ({ ...prev, [module]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    {isRTL ? moduleMeta.label_ar : moduleMeta.label_en || module}
                    <span className="ms-2 text-[11px] font-semibold text-slate-400">({types.length})</span>
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                </button>

                {/* Type rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {types.map(([key, meta]) => {
                      const TypeIcon = getIcon(meta.icon);
                      const isEnabled = config.type_config?.[key] !== false;
                      const isSavingThis = saving === `type_${key}`;

                      return (
                        <div
                          key={key}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 transition-colors',
                            isEnabled ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'
                          )}
                        >
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                            isEnabled ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'
                          )}>
                            <TypeIcon className={cn('w-3.5 h-3.5', isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                              {isRTL ? meta.label_ar : meta.label_en}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{key}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSavingThis && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
                            <Toggle
                              checked={isEnabled}
                              onChange={(val) => handleTypeToggle(key, val)}
                              disabled={isReadOnly || isSavingThis || !config.notifications_enabled}
                              size="sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filteredTypes.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRTL ? 'لا توجد أنواع مطابقة' : 'No matching notification types'}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── SECTION 6: Historical Notifications ── */}
      <SectionCard
        title={isRTL ? 'إدارة الإشعارات التاريخية' : 'Historical Notifications'}
        subtitle={isRTL ? 'إخفاء، أرشفة، أو حذف الإشعارات القديمة' : 'Hide, archive, or permanently delete past notifications'}
        icon={Archive}
        accent="amber"
      >
        <div className="space-y-4">
          {/* Hide toggle */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                {isRTL ? 'إخفاء الإشعارات من الواجهة' : 'Hide from Notification Center'}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isRTL ? 'تُخفى الإشعارات من المستخدمين مع الإبقاء عليها في قاعدة البيانات' : 'Notifications hidden from users but retained in DB'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saving === 'hide_hist' && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
              <Toggle
                checked={config.hide_historical}
                onChange={(val) => update({ hide_historical: val }, 'hide_hist')}
                disabled={isReadOnly || saving === 'hide_hist'}
              />
            </div>
          </div>

          {/* Archive button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                {isRTL ? 'أرشفة جميع الإشعارات' : 'Archive All Notifications'}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isRTL ? 'يبقى السجل في قاعدة البيانات لكن مخفياً عن المستخدمين' : 'Records remain in DB but hidden from users'}
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={handleArchive}
                disabled={archiveLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                {archiveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                {isRTL ? 'أرشفة الكل' : 'Archive All'}
              </button>
            )}
          </div>

          {/* Purge button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
            <div>
              <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">
                {isRTL ? 'حذف جميع الإشعارات نهائياً' : 'Purge All Notifications (Irreversible)'}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isRTL ? 'حذف دائم من قاعدة البيانات — لا يمكن التراجع عنه. يتطلب تأكيداً.' : 'Permanent hard delete from DB — cannot be undone. Requires confirmation.'}
              </p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setShowPurgeConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isRTL ? 'حذف نهائي' : 'Purge'}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── SECTION 7: Diagnostics ── */}
      {isSuperAdmin && (
        <SectionCard
          title={isRTL ? 'تشخيصات النظام' : 'Diagnostics'}
          subtitle={isRTL ? 'أدوات التصحيح والمراقبة المتقدمة' : 'Advanced debugging and monitoring tools'}
          icon={Bug}
          accent="purple"
          collapsible
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                {isRTL ? 'تفعيل سجلات التصحيح' : 'Enable Debug Logs'}
              </p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {isRTL
                  ? 'كل محاولة إنشاء إشعار تُكتب في سجل النشاط — قد يولّد كميات كبيرة من السجلات'
                  : 'Every notification creation attempt is written to ActivityLog — may generate verbose entries'}
              </p>
              {config.debug_logs_enabled && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-2 py-0.5 mt-1.5">
                  <Bug className="w-3 h-3" />
                  {isRTL ? 'وضع التصحيح مفعّل' : 'Debug mode active'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {saving === 'debug' && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
              <Toggle
                checked={config.debug_logs_enabled}
                onChange={(val) => update({ debug_logs_enabled: val }, 'debug')}
                disabled={saving === 'debug'}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── SECTION 8: Audit Log ── */}
      {isSuperAdmin && (
        <SectionCard
          title={isRTL ? 'سجل التدقيق' : 'Audit Log'}
          subtitle={isRTL ? 'آخر 100 تعديل على إعدادات الإشعارات — يتجدد تلقائياً كل 30 ثانية' : 'Last 100 config changes — auto-refreshes every 30s'}
          icon={Activity}
          accent="slate"
          collapsible
        >
          {auditLog.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{isRTL ? 'لا توجد سجلات بعد' : 'No audit entries yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-start py-2 px-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{isRTL ? 'الوقت' : 'Time'}</th>
                    <th className="text-start py-2 px-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{isRTL ? 'المنفّذ' : 'Actor'}</th>
                    <th className="text-start py-2 px-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{isRTL ? 'الإجراء' : 'Action'}</th>
                    <th className="text-start py-2 px-2 font-bold text-slate-500 uppercase tracking-wider text-[10px]">{isRTL ? 'التفاصيل' : 'Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-2 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', { hour12: false })}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {entry.actor || 'system'}
                        {entry.actor_role && (
                          <span className="ms-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold text-slate-500">
                            {entry.actor_role}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                          {entry.action}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};

export default NotificationSettingsPanel;
