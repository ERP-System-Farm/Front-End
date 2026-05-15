import api from '../../services/api';

export const getNotifications = async (unreadOnly = false) => {
  const params = unreadOnly ? '?unread=true' : '';
  const response = await api.get(`notifications/${params}`);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`notifications/${id}/read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('notifications/read-all/');
  return response.data;
};
