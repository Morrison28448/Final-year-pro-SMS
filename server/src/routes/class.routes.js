const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignSubjectsToClass,
} = require('../controllers/class.controller')

router.use(protect)
router.use(restrictTo('school_admin', 'teacher'))

// ── Classes ───────────────────────────────────────────────────────────────────
router.get('/classes',                                    getClasses)
router.post('/classes',    restrictTo('school_admin'),    createClass)
router.put('/classes/:id', restrictTo('school_admin'),    updateClass)
router.delete('/classes/:id', restrictTo('school_admin'), deleteClass)
router.post('/classes/:id/subjects', restrictTo('school_admin'), assignSubjectsToClass)

// ── Subjects ──────────────────────────────────────────────────────────────────
router.get('/subjects',                                    getSubjects)
router.post('/subjects',    restrictTo('school_admin'),    createSubject)
router.put('/subjects/:id', restrictTo('school_admin'),    updateSubject)
router.delete('/subjects/:id', restrictTo('school_admin'), deleteSubject)

module.exports = router
