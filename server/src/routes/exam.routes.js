const express = require('express')
const router  = express.Router()

const { protect, restrictTo } = require('../middleware/protect')
const {
  getExams, getExamById, createExam, updateExam, deleteExam,
  getExamResults, getResultSheet, saveResults, getStudentResults,
  getClasses, getSubjectsForClass,
} = require('../controllers/exam.controller')

router.use(protect)
router.use(restrictTo('school_admin', 'teacher'))

// ── Helper dropdowns ──────────────────────────────────────────────────────────
router.get('/classes',                          getClasses)
router.get('/classes/:classId/subjects',        getSubjectsForClass)

// ── Student results ───────────────────────────────────────────────────────────
router.get('/student/:studentId/results',       getStudentResults)

// ── Exams CRUD ────────────────────────────────────────────────────────────────
router.get('/',                                 getExams)
router.get('/:id',                              getExamById)
router.post('/',    restrictTo('school_admin'), createExam)
router.put('/:id',  restrictTo('school_admin'), updateExam)
router.delete('/:id', restrictTo('school_admin'), deleteExam)

// ── Results for an exam ───────────────────────────────────────────────────────
router.get('/:id/results',                      getExamResults)
router.get('/:id/sheet',                        getResultSheet)
router.post('/:id/results',                     saveResults)

module.exports = router
