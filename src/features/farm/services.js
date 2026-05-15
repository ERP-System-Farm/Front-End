import api from '../../services/api';

export const getFarms = async () => {
    const response = await api.get('farm/farms');
    return response.data;
};

export const getCropTypes = async () => {
    const response = await api.get('farm/croptypes');
    return response.data;
};

export const getFarmStructure = async (farmId = null) => {
    const params = farmId ? { farm_id: farmId } : {};
    const response = await api.get('farm/structure', { params });
    return response.data;
};

export const createSector = async (data) => {
    const response = await api.post('farm/sectors', data);
    return response.data;
};

export const createPlot = async (data) => {
    const response = await api.post('farm/plots', data);
    return response.data;
};

export const updateSector = async (id, data) => (await api.put(`farm/sectors/${id}/`, data)).data;
export const deleteSector = async (id) => (await api.delete(`farm/sectors/${id}/`)).data;

export const updatePlot = async (id, data) => (await api.put(`farm/plots/${id}/`, data)).data;
export const deletePlot = async (id) => (await api.delete(`farm/plots/${id}/`)).data;

export const getPlotStats = async (id) => {
    const response = await api.get(`farm/plots/${id}/stats`);
    return response.data;
};

// ── LocationNode API (New Hierarchy) ─────────────────────────────────────────

export const getLocationTree = async () => {
    const response = await api.get('farm/location-tree/');
    return response.data;
};

export const createLocationNode = async (data) => {
    const response = await api.post('farm/location-nodes/', data);
    return response.data;
};

export const updateLocationNode = async (id, data) => {
    const response = await api.patch(`farm/location-nodes/${id}/`, data);
    return response.data;
};

export const deleteLocationNode = async (id) => {
    const response = await api.delete(`farm/location-nodes/${id}/`);
    return response.data;
};

