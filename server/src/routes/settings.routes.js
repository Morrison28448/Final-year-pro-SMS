const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const {
  getSchoolProfile, updateSchoolProfile,
  changePassword, updateProfile,
} = require('../controllers/settings.controller')

router.use(protect)

// School profile — school_admin only
router.get('/school',    restrictTo('school_admin'), getSchoolProfile)
router.put('/school',    restrictTo('school_admin'), updateSchoolProfile)

// Personal profile + password — any authenticated user
router.put('/profile',  updateProfile)
router.put('/password', changePassword)

module.exports = router
