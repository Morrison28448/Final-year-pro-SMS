const portalService = require('../services/portal.service')
const { success } = require('../utils/response')

const getPortalProfile = async (req, res, next) => {
  try {
    const profile = await portalService.getPortalProfile(req.user)
    return success(res, { profile }, 'Profile fetched')
  } catch (err) { next(err) }
}

const getMyAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const data = await portalService.getMyAttendance(req.user, { startDate, endDate })
    return success(res, data, 'Attendance fetched')
  } catch (err) { next(err) }
}

const getMyResults = async (req, res, next) => {
  try {
    const data = await portalService.getMyResults(req.user)
    return success(res, data, 'Results fetched')
  } catch (err) { next(err) }
}

const getMyTimetable = async (req, res, next) => {
  try {
    const data = await portalService.getMyTimetable(req.user)
    return success(res, data, 'Timetable fetched')
  } catch (err) { next(err) }
}

const getMyClasses = async (req, res, next) => {
  try {
    const data = await portalService.getMyClasses(req.user)
    return success(res, data, 'Classes fetched')
  } catch (err) { next(err) }
}

const getMyStudents = async (req, res, next) => {
  try {
    const data = await portalService.getMyStudents(req.user)
    return success(res, data, 'Students fetched')
  } catch (err) { next(err) }
}

const getMyChildren = async (req, res, next) => {
  try {
    const data = await portalService.getLinkedStudents(req.user)
    return success(res, data, 'Children fetched')
  } catch (err) { next(err) }
}

const getChildAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const data = await portalService.getChildAttendance(
      req.user,
      req.params.studentId,
      { startDate, endDate }
    )
    return success(res, data, 'Child attendance fetched')
  } catch (err) { next(err) }
}

const getChildResults = async (req, res, next) => {
  try {
    const data = await portalService.getChildResults(req.user, req.params.studentId)
    return success(res, data, 'Child results fetched')
  } catch (err) { next(err) }
}

const getSchoolModules = async (req, res, next) => {
  try {
    const modules = await portalService.getSchoolModules(req.user)
    return success(res, { modules }, 'Modules fetched')
  } catch (err) { next(err) }
}

module.exports = {
  getPortalProfile,
  getMyAttendance,
  getMyResults,
  getMyTimetable,
  getMyClasses,
  getMyStudents,
  getMyChildren,
  getChildAttendance,
  getChildResults,
  getSchoolModules,
}
