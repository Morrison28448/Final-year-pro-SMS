import { useState, useCallback } from 'react'
import { getErrorMessage } from '../utils/helpers'

/**
 * useApi — generic hook for API calls with loading + error state
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(myServiceFn)
 *   useEffect(() => { execute(arg1, arg2) }, [])
 *
 * Or for manual triggers (e.g. button click):
 *   const { loading, execute } = useApi(deleteSchool)
 *   <button onClick={() => execute(id)}>Delete</button>
 */
const useApi = (apiFn, initialData = null) => {
  const [data, setData]       = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFn(...args)
        setData(result)
        return result
      } catch (err) {
        const msg = getErrorMessage(err)
        setError(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFn]
  )

  const reset = useCallback(() => {
    setData(initialData)
    setError(null)
    setLoading(false)
  }, [initialData])

  return { data, loading, error, execute, reset, setData }
}

export default useApi
