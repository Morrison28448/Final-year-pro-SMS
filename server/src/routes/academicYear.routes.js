const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const c = require('../controllers/academicYear.controller')

router.use(protect)

// ── Academic Years ────────────────────────────────────────────────────────────
router.get('/',         restrictTo('school_admin', 'teacher'), c.getAcademicYears)
router.post('/',        restrictTo('school_admin'),             c.createAcademicYear)
router.get('/:id',      restrictTo('school_admin', 'teacher'), c.getAcademicYearById)
router.put('/:id',      restrictTo('school_admin'),             c.updateAcademicYear)
router.delete('/:id',   restrictTo('school_admin'),             c.deleteAcademicYear)

// ── Student enrolment + promotion ─────────────────────────────────────────────
router.post('/:id/enrol',   restrictTo('school_admin'), c.enrolStudents)
router.post('/:id/promote', restrictTo('school_admin'), c.promoteStudents)
router.get('/:id/students', restrictTo('school_admin', 'teacher'), c.getStudentRecords)

// ── Class level progression ───────────────────────────────────────────────────
router.get('/class-levels',  restrictTo('school_admin', 'teacher'), c.getClassLevels)
router.put('/class-levels',  restrictTo('school_admin'),             c.saveClassLevels)

module.exports = router
