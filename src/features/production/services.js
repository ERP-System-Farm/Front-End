import api from '../../services/api'

export const getEngineers = async () => (await api.get('users/engineers')).data

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
export const getSeasons = async () => {
  const res = await api.get('reports/seasons/')
  let seasons = res.data?.results || res.data || []

  // Auto-create basic seasons if none exist
  if (seasons.length === 0) {
    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]
    
    for (const year of years) {
      try {
        const newSeason = await api.post('reports/seasons/', {
          name: year.toString(),
          start_date: `${year}-01-01`,
          end_date: `${year}-12-31`,
          status: 'OPEN',
        })
        seasons.push(newSeason.data || newSeason)
      } catch (err) {
        console.error(`Failed to auto-create season ${year}:`, err)
      }
    }
  }
  
  return seasons
}
