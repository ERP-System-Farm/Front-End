/**
 * NotificationBell — ATLS Design System
 *
 * Fully rewritten to eliminate Material UI dependency.
 * Uses: Tailwind CSS + Shadcn Popover + Lucide icons.
 *
 * All logic preserved:
 *   - fetchNotifications (polls every 60s)
 *   - markNotificationRead
 *   - markAllNotificationsRead
 *   - navigate to notification link
 *   - getTimeAgo helper
 *   - RTL support
 *   - unread count badge
 *   - empty state
 */
import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../features/notifications/services';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { cn } from '../lib/utils';

// ── Time ago helper ───────────────────────────────────────────────────────────
const useTimeAgo = () => {
  const { t } = useTranslation();
  return (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return t('notifications.just_now', 'Just now');
    if (mins < 60) return `${mins}${t('notifications.minutes_ago', 'm')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t('notifications.hours_ago', 'h')}`;
    return `${Math.floor(hours / 24)}${t('notifications.days_ago', 'd')}`;
  };
};

// ── Component ─────────────────────────────────────────────────────────────────
const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const getTimeAgo = useTimeAgo();
  const isRTL = i18n.language === 'ar';

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        fetchNotifications();
      } catch (err) {
        console.error(err);
      }
    }
    if (notification.link) navigate(notification.link);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger — Bell button */}
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label={t('notifications.title', 'Notifications')}
        >
          <Bell className="w-4 h-4" />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span
              className="absolute top-1 end-1 min-w-[16px] h-4 px-0.5
                         bg-red-500 text-white text-[9px] font-bold
                         rounded-full flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* Popover panel */}
      <PopoverContent
        align={isRTL ? 'start' : 'end'}
        sideOffset={8}
        className="w-80 p-0 overflow-hidden shadow-xl"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-foreground">
              {t('notifications.title', 'Notifications')}
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-[11px] font-semibold
                         text-green-600 dark:text-green-400
                         hover:text-green-700 dark:hover:text-green-300
                         transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              {t('notifications.mark_all_read', 'Mark all read')}
            </button>
          )}
        </div>

        {/* ── Notification list ───────────────────────────────────── */}
        <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800
                              flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-[13px] font-semibold text-muted-foreground">
                {t('notifications.empty', 'No notifications yet')}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                {t('notifications.empty_desc', "You're all caught up!")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full text-start px-4 py-3 flex items-start gap-3',
                    'transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    !n.is_read && 'bg-green-50/60 dark:bg-green-950/20'
                  )}
                >
                  {/* Unread dot indicator */}
                  <div className="flex-shrink-0 mt-[7px]">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      n.is_read ? 'bg-transparent' : 'bg-green-500'
                    )} />
                  </div>

                  {/* Message + timestamp */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-[13px] leading-snug text-foreground',
                      n.is_read ? 'font-normal opacity-80' : 'font-semibold'
                    )}>
                      {i18n.language === 'ar' ? n.message_ar : n.message_en}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {getTimeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
