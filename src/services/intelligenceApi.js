import api from './api';

export const intelligenceApi = {
  getSeasons: () => api.get('/reports/seasons/'),
  getCoverage: (params) => api.get('/reports/intelligence/coverage/', { params }),
  getIrrigationAnalytics: (params) => api.get('/reports/intelligence/irrigation/', { params }),
  getHarvestAnalytics: (params) => api.get('/reports/intelligence/harvest/', { params }),
  updateTreeCount: (nodeId, data) => api.patch(`/farm/location-nodes/${nodeId}/tree-count/`, data),
  getFarmHierarchy: () => api.get('/farm/location-tree/'),
};

export default intelligenceApi;
