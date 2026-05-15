import api from '../../services/api'

// Harvest Reports
export const getHarvestReports = async (params) =>
  (await api.get('production/harvest-reports/', { params })).data
export const getHarvestReport = async (id) =>
  (await api.get(`production/harvest-reports/${id}/`)).data
export const createHarvestReport = async (data) =>
  (await api.post('production/harvest-reports/', data)).data
export const updateHarvestReport = async (id, data) =>
  (await api.patch(`production/harvest-reports/${id}/`, data)).data
export const submitHarvestReport = async (id) =>
  (await api.post(`production/harvest-reports/${id}/submit/`)).data
export const finalizeHarvestReport = async (id) =>
  (await api.post(`production/harvest-reports/${id}/finalize/`)).data

// Sorting Reports
export const getSortingReports = async (params) =>
  (await api.get('production/sorting-reports/', { params })).data
export const createSortingReport = async (data) =>
  (await api.post('production/sorting-reports/', data)).data
export const finalizeSortingReport = async (id) =>
  (await api.post(`production/sorting-reports/${id}/finalize/`)).data

// Master Data Helpers (for production flows)
export const getSeasons = async () => (await api.get('reports/seasons/')).data
// Note: We might need specific endpoints for the new Master Data models if they aren't covered by generic options.
// For now, assuming standard Master Data can be fetched via reports/options or dedicated endpoints.
