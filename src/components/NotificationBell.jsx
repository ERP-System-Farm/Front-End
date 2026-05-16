import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Button, Divider, useTheme } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useTranslation } from 'react-i18next';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../features/notifications/services';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isRTL = i18n.language === 'ar';
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const open = Boolean(anchorEl);

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
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        fetchNotifications();
      } catch (err) { console.error(err); }
    }
    if (notification.link) {
      navigate(notification.link);
    }
    handleClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notifications.just_now', 'الآن');
    if (mins < 60) return `${mins} ${t('notifications.minutes_ago', 'د')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t('notifications.hours_ago', 'س')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('notifications.days_ago', 'ي')}`;
  };

  return (
    <>
      <IconButton onClick={handleClick} sx={{ mx: 0.5 }}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon sx={{ color: '#64748b' }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { width: 340, maxHeight: 420, borderRadius: '14px', mt: 1.5 } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#1e293b' }}>
            {t('notifications.title', 'الإشعارات')}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />} onClick={handleMarkAllRead} sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'none' }}>
              {t('notifications.mark_all_read', 'تعليم الكل كمقروء')}
            </Button>
          )}
        </Box>

        {/* Notification Items */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
              {t('notifications.empty', 'لا توجد إشعارات')}
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: n.is_read ? 'transparent' : (isDark ? '#064e3b' : '#f0fdf4'), // emerald-900 in dark
                borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f8fafc',
                '&:hover': { bgcolor: n.is_read ? (isDark ? '#1e293b' : '#f8fafc') : (isDark ? '#065f46' : '#dcfce7') },
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: n.is_read ? 500 : 700, color: isDark ? '#f8fafc' : '#334155', lineHeight: 1.4 }}>
                  {i18n.language === 'ar' ? n.message_ar : n.message_en}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8', mt: 0.5 }}>
                  {getTimeAgo(n.created_at)}
                </Typography>
              </Box>
              {!n.is_read && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a', flexShrink: 0, ml: 1 }} />
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
