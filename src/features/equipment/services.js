import api from '../../services/api';

export const getEquipmentList = async () => (await api.get('equipment/')).data;
export const createEquipment = async (data) => (await api.post('equipment/', data)).data;
export const getEquipmentDetails = async (id) => (await api.get(`equipment/${id}`)).data;
export const getEquipmentProfile = async (id) => (await api.get(`equipment/profile/${id}/`)).data;
export const logEquipmentTransaction = async (data) => (await api.post('equipment/logs/', data)).data;
export const getPendingAlerts = async () => (await api.get('equipment/alerts/')).data;
export const resolveAlert = async (id) => (await api.post(`equipment/alerts/${id}/resolve/`)).data;
export const updateEquipment = async (id, data) => {
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
  return (await api.patch(`equipment/${id}/`, data, { headers })).data;
};
export const deleteEquipment = async (id) => (await api.delete(`equipment/${id}/`)).data;

// Compatibility aliases
export const logMaintenance = async (data) => (await api.post('equipment/maintenance', data)).data;
export const logUsage = async (data) => (await api.post('equipment/usage', data)).data;
export const logOilChange = async (data) => (await api.post('equipment/oil-changes', data)).data;
export const getOilAlerts = async () => (await api.get('equipment/oil-alerts')).data;


