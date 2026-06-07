/**
 * NotificationContext — ATLS-V2
 * ================================
 * Central controller for all notification state and polling.
 *
 * Replaces the ad-hoc setInterval in NotificationBell.jsx.
 * All components that need notifications consume this context
 * instead of managing their own polling timers.
 *
 * Polling lifecycle:
 *   1. On mount (when user is logged in), fetch /api/notifications/config/
 *      → reads { enabled, polling_interval_seconds, hide_historical }
 *   2. If enabled=false → clears any running interval, sets state
 *   3. If enabled=true  → starts polling at configured interval
 *   4. Backend gate middleware returns 204 when disabled → detected and
 *      stops polling automatically as a secondary safeguard
 *   5. Config is re-fetched periodically (every 5 min) to detect admin changes
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../app/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../features/notifications/services';
import api from '../services/api';

// ── Context & Hook ────────────────────────────────────────────────────────────

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return ctx;
};

// ── Config re-fetch interval (to pick up admin changes) ───────────────────────
const CONFIG_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ── Provider ──────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Notification state ──────────────────────────────────────────────────────
  const [notifications, setNotifications]         = useState([]);
  const [unreadCount, setUnreadCount]             = useState(0);
  const [loading, setLoading]                     = useState(false);

  // ── Config state (from /api/notifications/config/) ─────────────────────────
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pollingInterval, setPollingInterval]           = useState(60); // seconds
  const [isHideHistorical, setIsHideHistorical]         = useState(false);
  const [isSilenced, setIsSilenced]                     = useState(false);
  const [silenceUntil, setSilenceUntil]                 = useState(null);

  // ── Refs for intervals (avoids stale closure issues) ───────────────────────
  const pollingTimerRef     = useRef(null);
  const configTimerRef      = useRef(null);
  const pollingIntervalRef  = useRef(pollingInterval);
  const enabledRef          = useRef(notificationsEnabled);

  // Keep refs in sync
  useEffect(() => { pollingIntervalRef.current = pollingInterval; }, [pollingInterval]);
  useEffect(() => { enabledRef.current = notificationsEnabled; }, [notificationsEnabled]);

  // ── Fetch polling config ────────────────────────────────────────────────────
  const fetchPollingConfig = useCallback(async () => {
    if (!user) return;
    try {
      const resp = await api.get('notifications/config/');
      if (resp.status === 204) {
        setNotificationsEnabled(false);
        return;
      }
      const data = resp.data;
      setNotificationsEnabled(data.enabled ?? true);
      setPollingInterval(data.polling_interval_seconds ?? 60);
      setIsHideHistorical(data.hide_historical ?? false);
      setIsSilenced(data.is_silenced ?? false);
      setSilenceUntil(data.emergency_silence_until ?? null);
    } catch (err) {
      if (err?.response?.status === 204) {
        setNotificationsEnabled(false);
      }
      // Fail silently — keep existing state
    }
  }, [user]);

  // ── Fetch notifications ─────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user || !enabledRef.current) return;

    setLoading(true);
    try {
      const resp = await api.get('notifications/');

      // HTTP 204 means backend gate has disabled notifications
      if (resp.status === 204) {
        setNotificationsEnabled(false);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = resp.data || {};

      // Backend-side disabled/hidden flags
      if (data.notifications_disabled || data.notifications_hidden) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      // 204 in axios error path (some axios versions throw for 204)
      if (err?.response?.status === 204) {
        setNotificationsEnabled(false);
        setNotifications([]);
        setUnreadCount(0);
      }
      // Other errors: keep existing state, don't spam console
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Mark single notification as read ───────────────────────────────────────
  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* fail silently */ }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* fail silently */ }
  }, []);

  // ── Start / restart polling timer ───────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = setInterval(
      () => fetchNotifications(),
      pollingIntervalRef.current * 1000
    );
  }, [fetchNotifications]);

  // ── Stop polling timer ──────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // ── Effect: manage polling based on enabled state + user ───────────────────
  useEffect(() => {
    if (!user) {
      stopPolling();
      return;
    }

    if (!notificationsEnabled) {
      // Notifications disabled — clear any existing polling
      stopPolling();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch immediately then start interval
    fetchNotifications();
    startPolling();

    return () => stopPolling();
  }, [user, notificationsEnabled, pollingInterval, fetchNotifications, startPolling, stopPolling]);

  // ── Effect: fetch config on mount + periodic config refresh ────────────────
  useEffect(() => {
    if (!user) {
      if (configTimerRef.current) clearInterval(configTimerRef.current);
      return;
    }
    fetchPollingConfig();
    configTimerRef.current = setInterval(fetchPollingConfig, CONFIG_REFRESH_INTERVAL_MS);
    return () => {
      if (configTimerRef.current) clearInterval(configTimerRef.current);
    };
  }, [user, fetchPollingConfig]);

  // ── Context value ───────────────────────────────────────────────────────────
  const value = {
    // Data
    notifications,
    unreadCount,
    loading,
    // Config state
    notificationsEnabled,
    pollingInterval,
    isHideHistorical,
    isSilenced,
    silenceUntil,
    // Actions
    fetchNotifications,
    fetchPollingConfig,
    markRead,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
