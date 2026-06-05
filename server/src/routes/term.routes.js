const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const {
  getTerms, getTermById, createTerm, updateTerm, deleteTerm,
  getAssessmentSheet, saveAssessmentScores,
  getTerminalReport,
  downloadTemplate, uploadScores,
} = require('../controllers/term.controller')

router.use(protect)

// ── Term management (school_admin only) ───────────────────────────────────────
router.get('/',         restrictTo('school_admin'),          getTerms)
router.post('/',        restrictTo('school_admin'),          createTerm)
router.get('/:id',      restrictTo('school_admin', 'teacher'), getTermById)
router.put('/:id',      restrictTo('school_admin'),          updateTerm)
router.delete('/:id',   restrictTo('school_admin'),          deleteTerm)

// ── Terminal report (school_admin + teacher) ──────────────────────────────────
router.get('/:id/report', restrictTo('school_admin', 'teacher'), getTerminalReport)

// ── Score entry per assessment (teacher + school_admin) ───────────────────────
router.get( '/assessment/:assessmentId/sheet',    restrictTo('school_admin', 'teacher'), getAssessmentSheet)
router.post('/assessment/:assessmentId/scores',   restrictTo('school_admin', 'teacher'), saveAssessmentScores)
router.get( '/assessment/:assessmentId/template', restrictTo('school_admin', 'teacher'), downloadTemplate)
router.post('/assessment/:assessmentId/upload',   restrictTo('school_admin', 'teacher'), uploadScores)

module.exports = router
