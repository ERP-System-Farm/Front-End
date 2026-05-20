import api from '../../services/api';

export const getEquipmentList = async () => (await api.get('equipment/list')).data;
export const createEquipment = async (data) => (await api.post('equipment/list', data)).data;
export const getEquipmentDetails = async (id) => (await api.get(`equipment/${id}`)).data;
export const logMaintenance = async (data) => (await api.post('equipment/maintenance', data)).data;
export const logUsage = async (data) => (await api.post('equipment/usage', data)).data;
export const logOilChange = async (data) => (await api.post('equipment/oil-changes', data)).data;
export const getOilAlerts = async () => (await api.get('equipment/oil-alerts')).data;

