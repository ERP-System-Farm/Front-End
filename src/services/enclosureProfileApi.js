import api from './api'

/**
 * Enclosure Operational Profile API
 * Entity-centric endpoints for detailed asset tracking.
 */
const enclosureProfileApi = {
  /**
   * Fetch high-level summary (metadata + header metrics)
   */
  getProfile: (id) => api.get(`/farm/location-nodes/${id}/profile/`),

  /**
   * Fetch paginated operational timeline (OperationLog events)
   */
  getTimeline: (id, params = {}) => api.get(`/farm/location-nodes/${id}/timeline/`, { params }),

  /**
   * Update high-level enclosure profile data
   */
  updateProfile: (id, data) => api.patch(`/farm/location-nodes/${id}/profile/`, data),

  /**
   * Fetch aggregated analytics (cost trend, operation distribution)
   */
  getAnalytics: (id) => api.get(`/farm/location-nodes/${id}/analytics/`),
}

export default enclosureProfileApi
