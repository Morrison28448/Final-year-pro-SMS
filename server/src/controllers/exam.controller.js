const examService = require('../services/exam.service')
const { success, created, badRequest } = require('../utils/response')

// ── Exams ─────────────────────────────────────────────────────────────────────

const getExams = async (req, res, next) => {
  try {
    const { classId, page = 1, limit = 20 } = req.query
    const result = await examService.getExams({ schoolId: req.user.school_id, classId, page, limit })
    return success(res, result, 'Exams fetched')
  } catch (err) { next(err) }
}

const getExamById = async (req, res, next) => {
  try {
    const exam = await examService.getExamById(req.user.school_id, req.params.id)
    return success(res, { exam }, 'Exam fetched')
  } catch (err) { next(err) }
}

const createExam = async (req, res, next) => {
  try {
    const { name, classId, examDate } = req.body
    if (!name) return badRequest(res, 'name is required')
    const exam = await examService.createExam(req.user.school_id, { name, classId, examDate })
    return created(res, { exam }, 'Exam created')
  } catch (err) { next(err) }
}

const updateExam = async (req, res, next) => {
  try {
    const exam = await examService.updateExam(req.user.school_id, req.params.id, req.body)
    return success(res, { exam }, 'Exam updated')
  } catch (err) { next(err) }
}

const deleteExam = async (req, res, next) => {
  try {
    await examService.deleteExam(req.user.school_id, req.params.id)
    return success(res, {}, 'Exam deleted')
  } catch (err) { next(err) }
}

// ── Results ───────────────────────────────────────────────────────────────────

const getExamResults = async (req, res, next) => {
  try {
    const results = await examService.getExamResults({
      schoolId: req.user.school_id,
      examId:   req.params.id,
    })
    return success(res, { results }, 'Results fetched')
  } catch (err) { next(err) }
}

const getResultSheet = async (req, res, next) => {
  try {
    const sheet = await examService.getResultSheet({
      schoolId: req.user.school_id,
      examId:   req.params.id,
    })
    return success(res, sheet, 'Result sheet fetched')
  } catch (err) { next(err) }
}

const saveResults = async (req, res, next) => {
  try {
    const { entries } = req.body
    if (!Array.isArray(entries) || entries.length === 0) {
      return badRequest(res, 'entries array is required')
    }
    const results = await examService.saveResults({
      schoolId: req.user.school_id,
      examId:   req.params.id,
      entries,
    })
    return success(res, { results }, 'Results saved successfully')
  } catch (err) { next(err) }
}

const getStudentResults = async (req, res, next) => {
  try {
    const results = await examService.getStudentResults({
      schoolId:  req.user.school_id,
      studentId: req.params.studentId,
    })
    return success(res, { results }, 'Student results fetched')
  } catch (err) { next(err) }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getClasses = async (req, res, next) => {
  try {
    const classes = await examService.getClassesForSchool(req.user.school_id)
    return success(res, { classes }, 'Classes fetched')
  } catch (err) { next(err) }
}

const getSubjectsForClass = async (req, res, next) => {
  try {
    const subjects = await examService.getSubjectsForClass(req.user.school_id, req.params.classId)
    return success(res, { subjects }, 'Subjects fetched')
  } catch (err) { next(err) }
}

module.exports = {
  getExams, getExamById, createExam, updateExam, deleteExam,
  getExamResults, getResultSheet, saveResults, getStudentResults,
  getClasses, getSubjectsForClass,
}
