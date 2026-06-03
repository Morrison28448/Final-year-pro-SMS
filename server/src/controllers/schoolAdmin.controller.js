const schoolAdminService = require('../services/schoolAdmin.service')
const { success, badRequest } = require('../utils/response')

/**
 * GET /api/school-admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await schoolAdminService.getDashboardStats(req.user.school_id)
    return success(res, { stats }, 'Stats fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/school-admin/activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const activity = await schoolAdminService.getRecentActivity(req.user.school_id)
    return success(res, { activity }, 'Activity fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/school-admin/modules
 */
const getModules = async (req, res, next) => {
  try {
    const modules = await schoolAdminService.getModules(req.user.school_id)
    return success(res, { modules }, 'Modules fetched')
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/school-admin/modules/:moduleName/toggle
 */
const toggleModule = async (req, res, next) => {
  try {
    const { moduleName } = req.params
    const module = await schoolAdminService.toggleModule(req.user.school_id, moduleName)
    const msg = module.is_enabled
      ? `${moduleName} module enabled`
      : `${moduleName} module disabled`
    return success(res, { module }, msg)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/school-admin/modules
 * Body: { modules: [{ module_name, is_enabled }] }
 */
const updateModules = async (req, res, next) => {
  try {
    const { modules } = req.body
    if (!Array.isArray(modules)) {
      return badRequest(res, 'modules must be an array')
    }
    const updated = await schoolAdminService.updateModules(req.user.school_id, modules)
    return success(res, { modules: updated }, 'Modules updated')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getModules,
  toggleModule,
  updateModules,
}
