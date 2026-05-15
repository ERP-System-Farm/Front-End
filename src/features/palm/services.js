import api from '../../services/api';

export const getPalmRecords = async (plotId) => {
    const params = plotId ? { plot: plotId } : {};
    const response = await api.get('palm/records', { params });
    return response.data;
};

export const createPalmRecord = async (data) => {
    const response = await api.post('palm/records', data);
    return response.data;
};

export const updatePalmRecord = async (id, data) => {
    const response = await api.put(`palm/records/${id}`, data);
    return response.data;
};
