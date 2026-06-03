import api from '../api/axios'

/**
 * Fetch platform-wide stats for the super admin dashboard.
 * GET /api/super-admin/stats
 */
export const fetchDashboardStats = async () => {
  const { data } = await api.get('/super-admin/stats')
  return data.stats
}

/**
 * Fetch paginated list of all schools.
 * GET /api/super-admin/schools?page=1&limit=10&search=
 */
export const fetchAllSchools = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const { data } = await api.get('/super-admin/schools', {
    params: { page, limit, search },
  })
  return data // { schools, pagination }
}

/**
 * Fetch a single school by ID.
 * GET /api/super-admin/schools/:id
 */
export const fetchSchoolById = async (id) => {
  const { data } = await api.get(`/super-admin/schools/${id}`)
  return data.school
}

/**
 * Toggle a school's active/inactive status.
 * PATCH /api/super-admin/schools/:id/toggle-status
 */
export const toggleSchoolStatus = async (id) => {
  const { data } = await api.patch(`/super-admin/schools/${id}/toggle-status`)
  return data.school
}

/**
 * Fetch paginated platform users.
 * GET /api/super-admin/users
 */
export const fetchAllUsers = async ({ page = 1, limit = 10, search = '', role = '' } = {}) => {
  const { data } = await api.get('/super-admin/users', {
    params: { page, limit, search, role },
  })
  return data
}

/**
 * Fetch platform billing overview.
 * GET /api/super-admin/billing
 */
export const fetchBillingOverview = async ({ page = 1, limit = 10, status = '' } = {}) => {
  const { data } = await api.get('/super-admin/billing', {
    params: { page, limit, status },
  })
  return data
}
