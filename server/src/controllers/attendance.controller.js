const attendanceService = require('../services/attendance.service')
const { success, badRequest } = require('../utils/response')

/** GET /api/attendance?date&classId&page&limit */
const getAttendance = async (req, res, next) => {
  try {
    const { date, classId, page = 1, limit = 50 } = req.query
    const result = await attendanceService.getAttendance({
      schoolId: req.user.school_id,
      date, classId, page, limit,
    })
    return success(res, result, 'Attendance records fetched')
  } catch (err) { next(err) }
}

/** GET /api/attendance/sheet?classId&date */
const getClassAttendanceSheet = async (req, res, next) => {
  try {
    const { classId, date } = req.query
    if (!classId) return badRequest(res, 'classId is required')
    if (!date)    return badRequest(res, 'date is required (YYYY-MM-DD)')

    const sheet = await attendanceService.getClassAttendanceSheet({
      schoolId: req.user.school_id,
      classId, date,
    })
    return success(res, sheet, 'Attendance sheet fetched')
  } catch (err) { next(err) }
}

/** POST /api/attendance/mark */
const markAttendance = async (req, res, next) => {
  try {
    const { classId, date, records } = req.body
    if (!classId) return badRequest(res, 'classId is required')
    if (!date)    return badRequest(res, 'date is required')
    if (!Array.isArray(records) || records.length === 0) {
      return badRequest(res, 'records array is required')
    }

    const result = await attendanceService.markAttendance({
      schoolId: req.user.school_id,
      classId, date, records,
    })
    return success(res, { records: result }, 'Attendance marked successfully')
  } catch (err) { next(err) }
}

/** PATCH /api/attendance/:id */
const updateAttendanceRecord = async (req, res, next) => {
  try {
    const { status, remarks } = req.body
    const record = await attendanceService.updateAttendanceRecord(
      req.user.school_id, req.params.id, { status, remarks }
    )
    return success(res, { record }, 'Attendance record updated')
  } catch (err) { next(err) }
}

/** GET /api/attendance/stats?classId&studentId&startDate&endDate */
const getAttendanceStats = async (req, res, next) => {
  try {
    const { classId, studentId, startDate, endDate } = req.query
    const stats = await attendanceService.getAttendanceStats({
      schoolId: req.user.school_id,
      classId, studentId, startDate, endDate,
    })
    return success(res, { stats }, 'Attendance stats fetched')
  } catch (err) { next(err) }
}

/** GET /api/attendance/student/:studentId?startDate&endDate */
const getStudentReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const report = await attendanceService.getStudentAttendanceReport({
      schoolId:  req.user.school_id,
      studentId: req.params.studentId,
      startDate, endDate,
    })
    return success(res, report, 'Student attendance report fetched')
  } catch (err) { next(err) }
}

/** GET /api/attendance/classes */
const getClasses = async (req, res, next) => {
  try {
    const classes = await attendanceService.getClassesForSchool(req.user.school_id)
    return success(res, { classes }, 'Classes fetched')
  } catch (err) { next(err) }
}

module.exports = {
  getAttendance,
  getClassAttendanceSheet,
  markAttendance,
  updateAttendanceRecord,
  getAttendanceStats,
  getStudentReport,
  getClasses,
}
