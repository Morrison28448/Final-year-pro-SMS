const express = require('express')
const router  = express.Router()

const { protect, restrictTo } = require('../middleware/protect')
const {
  getStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, assignClass,
  getClasses, resetStudentPassword,
} = require('../controllers/student.controller')

router.use(protect)
router.use(restrictTo('school_admin', 'teacher'))

router.get('/classes',                    getClasses)
router.get('/',                           getStudents)
router.get('/:id',                        getStudentById)
router.post('/',                          restrictTo('school_admin'), createStudent)
router.put('/:id',                        restrictTo('school_admin'), updateStudent)
router.delete('/:id',                     restrictTo('school_admin'), deleteStudent)
router.patch('/:id/assign-class',         restrictTo('school_admin'), assignClass)
router.post('/:id/reset-password',        restrictTo('school_admin'), resetStudentPassword)

module.exports = router
