const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const portalController = require('../controllers/portal.controller')

router.use(protect)

// ── Shared ────────────────────────────────────────────────────────────────────
router.get('/me', portalController.getPortalProfile)

// School module flags (all school members)
router.get(
  '/modules',
  restrictTo('school_admin', 'teacher', 'student', 'parent'),
  portalController.getSchoolModules
)

// ── Student routes ────────────────────────────────────────────────────────────
router.get('/my-attendance',  restrictTo('student'), portalController.getMyAttendance)
router.get('/my-results',     restrictTo('student'), portalController.getMyResults)
router.get('/my-timetable',   restrictTo('student'), portalController.getMyTimetable)

// ── Teacher routes ────────────────────────────────────────────────────────────
router.get('/my-classes',     restrictTo('teacher'), portalController.getMyClasses)
router.get('/my-students',    restrictTo('teacher'), portalController.getMyStudents)

// ── Parent routes ─────────────────────────────────────────────────────────────
router.get('/my-children', restrictTo('parent'), portalController.getMyChildren)
router.get(
  '/children/:studentId/attendance',
  restrictTo('parent'),
  portalController.getChildAttendance
)
router.get(
  '/children/:studentId/results',
  restrictTo('parent'),
  portalController.getChildResults
)

module.exports = router
