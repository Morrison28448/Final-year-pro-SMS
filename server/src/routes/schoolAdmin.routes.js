const express = require('express')
const router  = express.Router()

const { protect, restrictTo }  = require('../middleware/protect')
const {
  getDashboardStats,
  getRecentActivity,
  getModules,
  toggleModule,
  updateModules,
} = require('../controllers/schoolAdmin.controller')

// All school-admin routes require authentication + school_admin role
router.use(protect)
router.use(restrictTo('school_admin'))

router.get('/stats',                          getDashboardStats)
router.get('/activity',                       getRecentActivity)
router.get('/modules',                        getModules)
router.patch('/modules/:moduleName/toggle',   toggleModule)
router.put('/modules',                        updateModules)

module.exports = router
