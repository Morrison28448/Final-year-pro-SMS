const superAdminService = require('../services/superAdmin.service')
const { success, notFound } = require('../utils/response')

/**
 * GET /api/super-admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await superAdminService.getDashboardStats()
    return success(res, { stats }, 'Stats fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/super-admin/schools
 * Query params: page, limit, search
 */
const getAllSchools = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const result = await superAdminService.getAllSchools({ page, limit, search })
    return success(res, result, 'Schools fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/super-admin/schools/:id
 */
const getSchoolById = async (req, res, next) => {
  try {
    const school = await superAdminService.getSchoolById(req.params.id)
    return success(res, { school }, 'School fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/super-admin/schools/:id/toggle-status
 */
const toggleSchoolStatus = async (req, res, next) => {
  try {
    const school = await superAdminService.toggleSchoolStatus(req.params.id)
    const msg = school.is_active ? 'School activated' : 'School deactivated'
    return success(res, { school }, msg)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/super-admin/users
 * Query: page, limit, search, role
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query
    const result = await superAdminService.getAllUsers({ page, limit, search, role })
    return success(res, result, 'Users fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/super-admin/billing
 * Query: page, limit, status
 */
const getBillingOverview = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query
    const result = await superAdminService.getBillingOverview({ page, limit, status })
    return success(res, result, 'Billing overview fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getDashboardStats,
  getAllSchools,
  getSchoolById,
  toggleSchoolStatus,
  getAllUsers,
  getBillingOverview,
}
