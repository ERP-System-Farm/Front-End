/**
 * Notification Config Service — ATLS-V2
 * ========================================
 * API call wrappers for the admin notification management endpoints.
 * Used exclusively by NotificationSettingsPanel.jsx.
 */

import api from '../../services/api';

// ── Admin Config Endpoints ───────────────────────────────────────────────────

/** Fetch full NotificationConfig for the company. SUPER_ADMIN / OWNER / MANAGER */
export const getNotificationConfig = () =>
  api.get('admin/notification-config/').then(r => r.data);

/**
 * Update one or more fields of NotificationConfig.
 * Payload can include:
 *   notifications_enabled, type_config, channels_config,
 *   polling_interval_seconds, debug_logs_enabled, hide_historical
 */
export const updateNotificationConfig = (payload) =>
  api.patch('admin/notification-config/', payload).then(r => r.data);

/** Get the NOTIFICATION_REGISTRY + DELIVERY_CHANNELS + module labels. */
export const getNotificationRegistry = () =>
  api.get('admin/notification-config/registry/').then(r => r.data);

/** Get the last 100 ActivityLog entries for the notifications module. */
export const getNotificationAuditLog = () =>
  api.get('admin/notification-config/audit-log/').then(r => r.data);

// ── Emergency Silence ────────────────────────────────────────────────────────

/**
 * Activate emergency silence mode.
 * @param {number} minutes - Duration in minutes (1-1440)
 */
export const activateEmergencySilence = (minutes) =>
  api.post('admin/notification-config/silence/', { minutes }).then(r => r.data);

/** Deactivate emergency silence mode immediately. */
export const deactivateEmergencySilence = () =>
  api.delete('admin/notification-config/silence/').then(r => r.data);

// ── Historical Notification Management ──────────────────────────────────────

/**
 * Archive all notifications for the company.
 * Sets is_archived=True — data is retained in DB but hidden from users.
 */
export const archiveHistoricalNotifications = () =>
  api.post('admin/notification-config/historical/archive/').then(r => r.data);

/**
 * Hard-delete all notifications for the company.
 * Requires confirmed=true. This action is irreversible.
 */
export const purgeHistoricalNotifications = () =>
  api.post('admin/notification-config/historical/purge/', { confirmed: true }).then(r => r.data);

// ── User-Facing Polling Config ───────────────────────────────────────────────

/** Lightweight config for any authenticated user. Used by NotificationContext. */
export const getPollingConfig = () =>
  api.get('notifications/config/').then(r => r.data);
