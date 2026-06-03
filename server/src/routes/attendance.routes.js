const express = require('express')
const router  = express.Router()

const { protect, restrictTo } = require('../middleware/protect')
const {
  getAttendance,
  getClassAttendanceSheet,
  markAttendance,
  updateAttendanceRecord,
  getAttendanceStats,
  getStudentReport,
  getClasses,
} = require('../controllers/attendance.controller')

router.use(protect)
// school_admin and teacher can access all attendance routes
router.use(restrictTo('school_admin', 'teacher'))

// Order matters — specific paths before parameterised ones
router.get('/classes',              getClasses)
router.get('/sheet',                getClassAttendanceSheet)
router.get('/stats',                getAttendanceStats)
router.get('/student/:studentId',   getStudentReport)
router.get('/',                     getAttendance)
router.post('/mark',                markAttendance)
router.patch('/:id',                updateAttendanceRecord)

module.exports = router
