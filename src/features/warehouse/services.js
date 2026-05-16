import api from '../../services/api';

// Warehouse CRUD
export const getWarehouses = async () => (await api.get('warehouse/warehouses/')).data;
export const createWarehouse = async (data) => (await api.post('warehouse/warehouses/', data)).data;
export const updateWarehouse = async (id, data) => (await api.put(`warehouse/warehouses/${id}/`, data)).data;
export const deleteWarehouse = async (id) => (await api.delete(`warehouse/warehouses/${id}/`)).data;

// Items CRUD
export const getItems = async () => (await api.get('warehouse/items/')).data;
export const createItem = async (data) => (await api.post('warehouse/items/', data)).data;
export const updateItem = async (id, data) => (await api.put(`warehouse/items/${id}/`, data)).data;
export const deleteItem = async (id) => (await api.delete(`warehouse/items/${id}/`)).data;

// Movements CRUD
export const getMovements = async (itemId) => {
    const params = itemId ? { item: itemId } : {};
    return (await api.get('warehouse/movements/', { params })).data;
};
export const createMovement = async (data) => (await api.post('warehouse/movements/', data)).data;

// Users API (for responsible user selection)
export const getEngineers = async () => (await api.get('users/engineers')).data;
