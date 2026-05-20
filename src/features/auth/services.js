import api from '../../services/api';

export const loginUser = async (credentials) => {
  const response = await api.post('auth/login', credentials);
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post('auth/register', data);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('auth/me');
  return response.data;
};

export const updateMe = async (data) => {
  const response = await api.patch('auth/me', data);
  return response.data;
};

export const updatePassword = async (data) => {
  const response = await api.patch('auth/me/security', data);
  return response.data;
};

export const getUsersList = async () => (await api.get('users')).data;
export const approveUser = async (id) => (await api.patch(`users/${id}/approve`)).data;
export const deactivateUser = async (id) => (await api.patch(`users/${id}/deactivate`)).data;
export const deleteUser = async (id) => (await api.delete(`users/${id}/delete`)).data;
export const updateUserRole = async (id, role) => (await api.patch(`users/${id}/role`, { role })).data;

export const getCMSContent = async () => (await api.get('admin/landing-content')).data;
export const updateCMSContent = async (payload) => (await api.patch('admin/landing-content', payload)).data;

// Activity Log Service
export const getActivityLogs = async (module = '') => {
  const response = await api.get(`auth/activity-logs${module ? `?module=${module}` : ''}`);
  return response.data;
};

// Permission Management Services
export const getAppPermissions = async () => (await api.get('auth/permissions')).data;
export const getUserPermissions = async (userId) => (await api.get(`users/${userId}/permissions`)).data;
export const updateUserPermissions = async (userId, permissions) => (await api.post(`users/${userId}/permissions`, { permissions })).data;
