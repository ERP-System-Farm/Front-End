import api from '../../services/api'

export const getReports = async (engineerId, locationId) => {
  const params = {}
  if (engineerId) params.engineer = engineerId
  if (locationId) params.location = locationId
  return (await api.get('/reports/tasks/', { params })).data
}

export const createReport = async (data) => (await api.post('/reports/tasks/', data)).data
export const getKpi = async () => (await api.get('/analytics/kpi/')).data

export const getVarieties = async () => (await api.get('/reports/varieties/')).data
export const getUnits = async () => (await api.get('/reports/units/')).data
export const getContractors = async () => (await api.get('/reports/contractors/')).data
