const classService = require('../services/class.service')
const { success, created, badRequest } = require('../utils/response')

// ── Classes ───────────────────────────────────────────────────────────────────

const getClasses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const result = await classService.getClasses({ schoolId: req.user.school_id, page, limit })
    return success(res, result, 'Classes fetched')
  } catch (err) { next(err) }
}

const createClass = async (req, res, next) => {
  try {
    const cls = await classService.createClass(req.user.school_id, req.body)
    return created(res, { class: cls }, 'Class created')
  } catch (err) { next(err) }
}

const updateClass = async (req, res, next) => {
  try {
    const cls = await classService.updateClass(req.user.school_id, req.params.id, req.body)
    return success(res, { class: cls }, 'Class updated')
  } catch (err) { next(err) }
}

const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.user.school_id, req.params.id)
    return success(res, {}, 'Class deleted')
  } catch (err) { next(err) }
}

// ── Subjects ──────────────────────────────────────────────────────────────────

const getSubjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const result = await classService.getSubjects({ schoolId: req.user.school_id, page, limit })
    return success(res, result, 'Subjects fetched')
  } catch (err) { next(err) }
}

const createSubject = async (req, res, next) => {
  try {
    const subject = await classService.createSubject(req.user.school_id, req.body)
    return created(res, { subject }, 'Subject created')
  } catch (err) { next(err) }
}

const updateSubject = async (req, res, next) => {
  try {
    const subject = await classService.updateSubject(req.user.school_id, req.params.id, req.body)
    return success(res, { subject }, 'Subject updated')
  } catch (err) { next(err) }
}

const deleteSubject = async (req, res, next) => {
  try {
    await classService.deleteSubject(req.user.school_id, req.params.id)
    return success(res, {}, 'Subject deleted')
  } catch (err) { next(err) }
}

// ── Assign subjects to class ──────────────────────────────────────────────────

const assignSubjectsToClass = async (req, res, next) => {
  try {
    const { subjectIds } = req.body
    if (!Array.isArray(subjectIds)) return badRequest(res, 'subjectIds must be an array')
    const assignments = await classService.assignSubjectsToClass(
      req.user.school_id, req.params.id, subjectIds
    )
    return success(res, { assignments }, 'Subjects assigned to class')
  } catch (err) { next(err) }
}

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignSubjectsToClass,
}
