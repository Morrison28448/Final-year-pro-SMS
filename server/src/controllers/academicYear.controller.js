const svc = require('../services/academicYear.service')
const { success, created, badRequest } = require('../utils/response')

const getAcademicYears    = async (req, res, next) => { try { return success(res, { years: await svc.getAcademicYears(req.user.school_id) }, 'Years fetched') } catch (e) { next(e) } }
const getAcademicYearById = async (req, res, next) => { try { return success(res, { year:  await svc.getAcademicYearById(req.user.school_id, req.params.id) }, 'Year fetched') } catch (e) { next(e) } }

const createAcademicYear  = async (req, res, next) => {
  try {
    const { name, startDate, endDate, terms } = req.body
    if (!name) return badRequest(res, 'name is required')
    if (!terms || terms.length === 0) return badRequest(res, 'At least one term is required')
    const year = await svc.createAcademicYear(req.user.school_id, { name, startDate, endDate, terms })
    return created(res, { year }, 'Academic year created')
  } catch (e) { next(e) }
}

const updateAcademicYear  = async (req, res, next) => { try { return success(res, { year: await svc.updateAcademicYear(req.user.school_id, req.params.id, req.body) }, 'Year updated') } catch (e) { next(e) } }
const deleteAcademicYear  = async (req, res, next) => { try { await svc.deleteAcademicYear(req.user.school_id, req.params.id); return success(res, {}, 'Year deleted') } catch (e) { next(e) } }

const getClassLevels      = async (req, res, next) => { try { return success(res, { levels: await svc.getClassLevels(req.user.school_id) }, 'Class levels fetched') } catch (e) { next(e) } }

const saveClassLevels     = async (req, res, next) => {
  try {
    const { levels } = req.body
    if (!Array.isArray(levels)) return badRequest(res, 'levels must be an array')
    return success(res, { levels: await svc.saveClassLevels(req.user.school_id, levels) }, 'Class levels saved')
  } catch (e) { next(e) }
}

const enrolStudents       = async (req, res, next) => {
  try {
    const records = await svc.enrolStudentsForYear(req.user.school_id, req.params.id)
    return success(res, { enrolled: records.length }, `${records.length} students enrolled`)
  } catch (e) { next(e) }
}

const promoteStudents     = async (req, res, next) => {
  try {
    const { toYearId } = req.body
    if (!toYearId) return badRequest(res, 'toYearId is required')
    const result = await svc.promoteStudents(req.user.school_id, req.params.id, toYearId)
    return success(res, result, `Promotion complete: ${result.promoted} promoted, ${result.graduated} graduated`)
  } catch (e) { next(e) }
}

const getStudentRecords   = async (req, res, next) => {
  try {
    const records = await svc.getStudentRecordsForYear(req.user.school_id, req.params.id)
    return success(res, { records }, 'Records fetched')
  } catch (e) { next(e) }
}

module.exports = {
  getAcademicYears, getAcademicYearById, createAcademicYear,
  updateAcademicYear, deleteAcademicYear,
  getClassLevels, saveClassLevels,
  enrolStudents, promoteStudents, getStudentRecords,
}
