const express = require('express')
const router  = express.Router()

const { protect, restrictTo }  = require('../middleware/protect')
const {
  getDashboardStats,
  getAllSchools,
  getSchoolById,
  toggleSchoolStatus,
  getAllUsers,
  getBillingOverview,
} = require('../controllers/superAdmin.controller')

// All super-admin routes require authentication + super_admin role
router.use(protect)
router.use(restrictTo('super_admin'))

router.get('/stats',                       getDashboardStats)
router.get('/schools',                     getAllSchools)
router.get('/schools/:id',                 getSchoolById)
router.patch('/schools/:id/toggle-status', toggleSchoolStatus)
router.get('/users',                       getAllUsers)
router.get('/billing',                     getBillingOverview)

module.exports = router
