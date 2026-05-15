import { useEffect, useState } from 'react'

import enclosureProfileApi from '../../../../services/enclosureProfileApi'

/**
 * Hook to fetch and manage high-level enclosure profile data.
 */
export const useEnclosureProfile = (id) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await enclosureProfileApi.getProfile(id)
        setProfile(response.data)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  return { profile, loading, error }
}

/**
 * Hook to fetch and manage the paginated operational timeline.
 */
export const useEnclosureTimeline = (id, filters = {}) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [JSON.stringify(filters)])

  useEffect(() => {
    if (!id) return

    const fetchTimeline = async () => {
      try {
        setLoading(true)
        const response = await enclosureProfileApi.getTimeline(id, { ...filters, page })

        if (page === 1) {
          setEvents(response.data.results || [])
        } else {
          setEvents((prev) => [...prev, ...(response.data.results || [])])
        }

        setHasMore(!!response.data.next)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load timeline')
      } finally {
        setLoading(false)
      }
    }

    fetchTimeline()
  }, [id, page, JSON.stringify(filters)])

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1)
    }
  }

  return { events, loading, error, hasMore, loadMore }
}

/**
 * Hook to fetch aggregated enclosure analytics.
 */
export const useEnclosureAnalytics = (id) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await enclosureProfileApi.getAnalytics(id)
        setAnalytics(response.data)
        setError(null)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [id])

  return { analytics, loading, error }
}
