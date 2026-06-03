import api from '../api/axios'

/** GET /api/school-admin/stats */
export const fetchSchoolStats = async () => {
  const { data } = await api.get('/school-admin/stats')
  return data.stats
}

/** GET /api/school-admin/activity */
export const fetchRecentActivity = async () => {
  const { data } = await api.get('/school-admin/activity')
  return data.activity
}

/** GET /api/school-admin/modules */
export const fetchModules = async () => {
  const { data } = await api.get('/school-admin/modules')
  return data.modules
}

/** PATCH /api/school-admin/modules/:moduleName/toggle */
export const toggleModule = async (moduleName) => {
  const { data } = await api.patch(`/school-admin/modules/${moduleName}/toggle`)
  return data.module
}
