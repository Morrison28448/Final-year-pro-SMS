const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignSubjectsToClass, assignTeacherToSubject,
} = require('../controllers/class.controller')
const classService = require('../services/class.service')
const { success } = require('../utils/response')

router.use(protect)

// ── Teacher helpers (for score entry filtering) ───────────────────────────────

/**
 * GET /api/academics/my-classes
 * Returns all classes where the logged-in teacher is assigned to at least one subject.
 */
router.get('/my-classes', restrictTo('teacher'), async (req, res, next) => {
  try {
    // Resolve teacher profile id from user id
    const { supabase } = require('../config/supabase')
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('school_id', req.user.school_id)
      .single()

    if (!teacher) return success(res, { classes: [] }, 'No classes assigned')

    const classes = await classService.getTeacherClasses(req.user.school_id, teacher.id)
    return success(res, { classes }, 'Teacher classes fetched')
  } catch (err) { next(err) }
})

/**
 * GET /api/academics/my-subjects/:classId
 * Returns subjects the logged-in teacher is assigned to in a specific class.
 */
router.get('/my-subjects/:classId', restrictTo('teacher'), async (req, res, next) => {
  try {
    const { supabase } = require('../config/supabase')
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('school_id', req.user.school_id)
      .single()

    if (!teacher) return success(res, { subjects: [] }, 'No subjects assigned')

    const subjects = await classService.getTeacherSubjectsForClass(
      req.user.school_id, teacher.id, req.params.classId
    )
    return success(res, { subjects }, 'Teacher subjects fetched')
  } catch (err) { next(err) }
})

// ── Classes (school_admin only for mutations) ─────────────────────────────────
router.get('/classes',                                      restrictTo('school_admin', 'teacher'), getClasses)
router.post('/classes',                                     restrictTo('school_admin'),             createClass)
router.put('/classes/:id',                                  restrictTo('school_admin'),             updateClass)
router.delete('/classes/:id',                               restrictTo('school_admin'),             deleteClass)
router.post('/classes/:id/subjects',                        restrictTo('school_admin'),             assignSubjectsToClass)

/**
 * PATCH /api/academics/classes/:classId/subjects/:subjectId/teacher
 * Assign or unassign a teacher to a specific subject in a class.
 */
router.patch(
  '/classes/:classId/subjects/:subjectId/teacher',
  restrictTo('school_admin'),
  assignTeacherToSubject
)

// ── Subjects ──────────────────────────────────────────────────────────────────
router.get('/subjects',                                     restrictTo('school_admin', 'teacher'), getSubjects)
router.post('/subjects',                                    restrictTo('school_admin'),             createSubject)
router.put('/subjects/:id',                                 restrictTo('school_admin'),             updateSubject)
router.delete('/subjects/:id',                              restrictTo('school_admin'),             deleteSubject)

module.exports = router
