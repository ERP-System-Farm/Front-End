import api from '../../services/api';

export const getOliveRecords = async (plotId) => {
    const params = plotId ? { plot: plotId } : {};
    const response = await api.get('olive/records', { params });
    return response.data;
};

export const createOliveRecord = async (data) => {
    const response = await api.post('olive/records', data);
    return response.data;
};

export const updateOliveRecord = async (id, data) => {
    const response = await api.put(`olive/records/${id}`, data);
    return response.data;
};
