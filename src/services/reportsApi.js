import api from './api'

export const reportsApi = {
  // Tasks
  getTasks: (params) => api.get('/reports/tasks/', { params }),
  getTask: (id) => api.get(`/reports/tasks/${id}/`),
  createTask: (data) => api.post('/reports/tasks/', data),
  updateTask: (id, data) => api.put(`/reports/tasks/${id}/`, data),
  deleteTask: (id) => api.delete(`/reports/tasks/${id}/`),
  getTasksSummary: (params) => api.get('/reports/tasks/summary/', { params }),
  exportTasks: (params) => api.get('/reports/tasks/export/', { params, responseType: 'blob' }),

  // Task Actions
  submitTask: (id) => api.post(`/reports/tasks/${id}/submit/`),
  reviewTask: (id) => api.post(`/reports/tasks/${id}/review/`),
  approveTask: (id) => api.post(`/reports/tasks/${id}/approve/`),
  rejectTask: (id, reason) =>
    api.post(`/reports/tasks/${id}/reject/`, { rejection_reason: reason }),

  getOperationsAnalytics: (params) => api.get('/reports/analytics/operations/', { params }),
  getWorkersAnalytics: (params) => api.get('/reports/analytics/workers/', { params }),
  getCostAnalytics: () => api.get('/analytics/costs/'),
  getKpiAnalytics: () => api.get('/analytics/kpi/'),
  getTrendsAnalytics: () => api.get('/analytics/trends/'),
  getProductivityAnalytics: () => api.get('/analytics/productivity/'),
  getComparisonAnalytics: () => api.get('/analytics/comparison/'),
  getDashboardAnalytics: () => api.get('/analytics/dashboard/'),
  getSmartInsights: () => api.get('/analytics/insights/'),

  // Fertilization
  getFertilizations: (params) => api.get('/reports/fertilization/', { params }),
  getFertilization: (id) => api.get(`/reports/fertilization/${id}/`),
  createFertilization: (data) => api.post('/reports/fertilization/', data),
  updateFertilization: (id, data) => api.put(`/reports/fertilization/${id}/`, data),
  deleteFertilization: (id) => api.delete(`/reports/fertilization/${id}/`),

  // Irrigation
  getIrrigations: (params) => api.get('/reports/irrigation/', { params }),
  getIrrigation: (id) => api.get(`/reports/irrigation/${id}/`),
  createIrrigation: (data) => api.post('/reports/irrigation/', data),
  updateIrrigation: (id, data) => api.put(`/reports/irrigation/${id}/`, data),
  deleteIrrigation: (id) => api.delete(`/reports/irrigation/${id}/`),

  // Operations (Dropdown data)
  getOperations: (params) => api.get('/reports/operations/', { params }),
  createOperation: (data) => api.post('/reports/operations/', data),
  updateOperation: (id, data) => api.put(`/reports/operations/${id}/`, data),
  deleteOperation: (id) => api.delete(`/reports/operations/${id}/`),

  // Custom Fields
  getCustomFields: (params) => api.get('/reports/custom-fields/', { params }),
  createCustomField: (data) => api.post('/reports/custom-fields/', data),
  updateCustomField: (id, data) => api.put(`/reports/custom-fields/${id}/`, data),
  deleteCustomField: (id) => api.delete(`/reports/custom-fields/${id}/`),

  // Custom Field Values
  getCustomFieldValues: (params) => api.get('/reports/custom-field-values/', { params }),
  createCustomFieldValue: (data) => api.post('/reports/custom-field-values/', data),
  updateCustomFieldValue: (id, data) => api.put(`/reports/custom-field-values/${id}/`, data),
  deleteCustomFieldValue: (id) => api.delete(`/reports/custom-field-values/${id}/`),

  // Attachments
  getLaborEntries: (params) => api.get('/reports/labor/', { params }),
  createLaborEntry: (data) => api.post('/reports/labor/', data),
  getAttachments: (params) => api.get('/reports/attachments/', { params }),
  createAttachment: (data) => api.post('/reports/attachments/', data),

  // Dropdown Options (Legacy - Read Only)
  getOptions: (category) => api.get('/reports/options/', { params: { category } }),

  getVarieties: (params) => api.get('/reports/varieties/', { params }),
  createVariety: (data) => api.post('/reports/varieties/', data),
  updateVariety: (id, data) => api.put(`/reports/varieties/${id}/`, data),
  deleteVariety: (id) => api.delete(`/reports/varieties/${id}/`),

  getUnits: (params) => api.get('/reports/units/', { params }),
  createUnit: (data) => api.post('/reports/units/', data),
  updateUnit: (id, data) => api.put(`/reports/units/${id}/`, data),
  deleteUnit: (id) => api.delete(`/reports/units/${id}/`),

  getContractors: (params) => api.get('/reports/contractors/', { params }),
  createContractor: (data) => api.post('/reports/contractors/', data),
  updateContractor: (id, data) => api.put(`/reports/contractors/${id}/`, data),
  deleteContractor: (id) => api.delete(`/reports/contractors/${id}/`),

  // Additional APIS for Autocompletes
  getUsers: () => api.get('/users'),
  getEngineers: () => api.get('/users/engineers'),
  getSectors: () => api.get('/farm/sectors'),
  getFarmHierarchy: () => api.get('/farm/hierarchy'),
  // Type-filtered LocationNode queries — use instead of hierarchy for form dropdowns
  getLocationNodes: (type, parentId = null) => {
    const params = { type }
    if (parentId) params.parent = parentId
    return api.get('/farm/location-nodes/', { params })
  },
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  },
}
