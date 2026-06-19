const termService = require('../services/term.service')
const { success, created, badRequest } = require('../utils/response')

// ── Terms ─────────────────────────────────────────────────────────────────────

const getTerms = async (req, res, next) => {
  try {
    const terms = await termService.getTerms(req.user.school_id)
    return success(res, { terms }, 'Terms fetched')
  } catch (err) { next(err) }
}

const getTermById = async (req, res, next) => {
  try {
    const term = await termService.getTermById(req.user.school_id, req.params.id)
    return success(res, { term }, 'Term fetched')
  } catch (err) { next(err) }
}

const createTerm = async (req, res, next) => {
  try {
    const { name, academicYear, assessments } = req.body
    if (!name) return badRequest(res, 'name is required')
    const term = await termService.createTerm(req.user.school_id, { name, academicYear, assessments })
    return created(res, { term }, 'Term created')
  } catch (err) { next(err) }
}

const updateTerm = async (req, res, next) => {
  try {
    const term = await termService.updateTerm(req.user.school_id, req.params.id, req.body)
    return success(res, { term }, 'Term updated')
  } catch (err) { next(err) }
}

const deleteTerm = async (req, res, next) => {
  try {
    await termService.deleteTerm(req.user.school_id, req.params.id)
    return success(res, {}, 'Term deleted')
  } catch (err) { next(err) }
}

// ── Assessment score entry ────────────────────────────────────────────────────

const getAssessmentSheet = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query
    if (!classId)   return badRequest(res, 'classId is required')
    if (!subjectId) return badRequest(res, 'subjectId is required')
    const sheet = await termService.getAssessmentSheet({
      schoolId:     req.user.school_id,
      assessmentId: req.params.assessmentId,
      classId,
      subjectId,
      userId:       req.user.id,
      userRole:     req.user.role,
    })
    return success(res, sheet, 'Assessment sheet fetched')
  } catch (err) { next(err) }
}

const saveAssessmentScores = async (req, res, next) => {
  try {
    const { subjectId, entries } = req.body
    if (!subjectId) return badRequest(res, 'subjectId is required')
    if (!Array.isArray(entries) || entries.length === 0) return badRequest(res, 'entries array is required')
    const results = await termService.saveAssessmentScores({
      schoolId:     req.user.school_id,
      assessmentId: req.params.assessmentId,
      subjectId,
      entries,
      userId:       req.user.id,
      userRole:     req.user.role,
    })
    return success(res, { results }, 'Scores saved')
  } catch (err) { next(err) }
}

// ── Terminal report ───────────────────────────────────────────────────────────

const getTerminalReport = async (req, res, next) => {
  try {
    const { classId } = req.query
    if (!classId) return badRequest(res, 'classId is required')
    const report = await termService.getTerminalReport({
      schoolId: req.user.school_id,
      termId:   req.params.id,
      classId,
    })
    return success(res, report, 'Terminal report generated')
  } catch (err) { next(err) }
}

// ── CSV template download ─────────────────────────────────────────────────────

const downloadTemplate = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query
    if (!classId)   return badRequest(res, 'classId is required')
    if (!subjectId) return badRequest(res, 'subjectId is required')
    const result = await termService.generateScoreTemplate({
      schoolId:     req.user.school_id,
      assessmentId: req.params.assessmentId,
      classId,
      subjectId,
    })
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    return res.send(result.csv)
  } catch (err) { next(err) }
}

// ── CSV upload + parse ────────────────────────────────────────────────────────

const uploadScores = async (req, res, next) => {
  try {
    const { classId, subjectId, csvText } = req.body
    if (!classId)   return badRequest(res, 'classId is required')
    if (!subjectId) return badRequest(res, 'subjectId is required')
    if (!csvText)   return badRequest(res, 'csvText is required')

    const { entries, errors } = await termService.parseScoreCSV({
      schoolId: req.user.school_id,
      classId,
      csvText,
    })

    if (errors.length > 0 && entries.length === 0) {
      return badRequest(res, `CSV parsing failed: ${errors.join('; ')}`)
    }

    const results = await termService.saveAssessmentScores({
      schoolId:     req.user.school_id,
      assessmentId: req.params.assessmentId,
      subjectId,
      entries,
      userId:       req.user.id,
      userRole:     req.user.role,
    })

    return success(res, { results, warnings: errors }, `${results.length} scores saved${errors.length ? `, ${errors.length} row(s) skipped` : ''}`)
  } catch (err) { next(err) }
}

const publishTerm = async (req, res, next) => {
  try {
    const publish = req.body.publish !== false // default true
    const term = await termService.publishTerm(req.user.school_id, req.params.id, publish)
    const msg = publish ? `Results published for "${term.name}"` : `Results unpublished for "${term.name}"`
    return success(res, { term }, msg)
  } catch (err) { next(err) }
}

module.exports = {
  getTerms, getTermById, createTerm, updateTerm, deleteTerm,
  getAssessmentSheet, saveAssessmentScores,
  getTerminalReport,
  downloadTemplate, uploadScores,
  publishTerm,
}
