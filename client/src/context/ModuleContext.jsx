import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { fetchSchoolModules } from '../services/portal.service'
import { MODULE_ROUTES } from '../utils/constants'

const ModuleContext = createContext({
  modules: [],
  loading: true,
  isModuleEnabled: () => true,
  isPathAllowed: () => true,
})

export const ModuleProvider = ({ children }) => {
  const { user, isAuthenticated, isSuperAdmin } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!isAuthenticated || isSuperAdmin || !user?.school_id) {
      setModules([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchSchoolModules()
      setModules(data || [])
    } catch {
      setModules([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isSuperAdmin, user?.school_id])

  useEffect(() => { load() }, [load])

  const enabledMap = useMemo(() => {
    const map = {}
    ;(modules || []).forEach((m) => {
      map[m.module_name] = m.is_enabled
    })
    return map
  }, [modules])

  const isModuleEnabled = useCallback(
    (name) => enabledMap[name] !== false,
    [enabledMap]
  )

  const isPathAllowed = useCallback(
    (path) => {
      if (isSuperAdmin || !user?.school_id) return true
      for (const [moduleName, paths] of Object.entries(MODULE_ROUTES)) {
        if (paths.some((p) => path === p || path.startsWith(`${p}/`))) {
          return isModuleEnabled(moduleName)
        }
      }
      return true
    },
    [isSuperAdmin, user?.school_id, isModuleEnabled]
  )

  return (
    <ModuleContext.Provider value={{ modules, loading, isModuleEnabled, isPathAllowed, refreshModules: load }}>
      {children}
    </ModuleContext.Provider>
  )
}

export const useModules = () => useContext(ModuleContext)

export default ModuleContext
