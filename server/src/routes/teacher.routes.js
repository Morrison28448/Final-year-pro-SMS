const express = require('express')
const router  = express.Router()
const { protect, restrictTo } = require('../middleware/protect')
const {
  getTeachers, getTeacherById, createTeacher,
  updateTeacher, deleteTeacher, resetTeacherPassword,
} = require('../controllers/teacher.controller')

router.use(protect)
router.use(restrictTo('school_admin'))

router.get('/',                        getTeachers)
router.get('/:id',                     getTeacherById)
router.post('/',                       createTeacher)
router.put('/:id',                     updateTeacher)
router.delete('/:id',                  deleteTeacher)
router.post('/:id/reset-password',     resetTeacherPassword)

module.exports = router
