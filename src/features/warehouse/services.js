import api from '../../services/api';

export const getItems = async () => (await api.get('warehouse/items/')).data;
export const createItem = async (data) => (await api.post('warehouse/items/', data)).data;
export const updateItem = async (id, data) => (await api.put(`warehouse/items/${id}/`, data)).data;
export const deleteItem = async (id) => (await api.delete(`warehouse/items/${id}/`)).data;

export const getMovements = async (itemId) => {
    const params = itemId ? { item: itemId } : {};
    return (await api.get('warehouse/movements/', { params })).data;
};
export const createMovement = async (data) => (await api.post('warehouse/movements/', data)).data;
