import { useEffect, useState } from 'react'

import { reportsApi } from '../../../services/reportsApi'

export function useReportOptions() {
  const [loading, setLoading] = useState(true)
  const [engineers, setEngineers] = useState([])
  const [operations, setOperations] = useState([])
  const [varieties, setVarieties] = useState([])
  const [units, setUnits] = useState([])
  const [contractors, setContractors] = useState([])

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const [engRes, opsRes, varRes, unitRes, conRes] = await Promise.allSettled([
          reportsApi.getEngineers(),
          reportsApi.getOperations(),
          reportsApi.getVarieties(),
          reportsApi.getUnits(),
          reportsApi.getContractors(),
        ])

        const r = (res) =>
          Array.isArray(res.value?.data)
            ? res.value.data
            : (res.value?.data?.results ?? res.value ?? [])

        if (!isMounted) return

        if (engRes.status === 'fulfilled') setEngineers(r(engRes))
        if (opsRes.status === 'fulfilled') setOperations(r(opsRes))
        if (varRes.status === 'fulfilled') setVarieties(r(varRes))
        if (unitRes.status === 'fulfilled') setUnits(r(unitRes))
        if (conRes.status === 'fulfilled') setContractors(r(conRes))
      } catch (e) {
        console.error('خطأ في تحميل بيانات النموذج:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    loading,
    engineers,
    operations,
    varieties,
    units,
    contractors,
  }
}
