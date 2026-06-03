const studentService = require('../services/student.service')
const { success, created, badRequest } = require('../utils/response')

/** GET /api/students?page&limit&search&classId */
const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', classId = '' } = req.query
    const result = await studentService.getStudents({
      schoolId: req.user.school_id,
      page, limit, search, classId,
    })
    return success(res, result, 'Students fetched')
  } catch (err) { next(err) }
}

/** GET /api/students/:id */
const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.user.school_id, req.params.id)
    return success(res, { student }, 'Student fetched')
  } catch (err) { next(err) }
}

/** POST /api/students — password is auto-generated, returned once */
const createStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body
    if (!firstName || !lastName || !email) {
      return badRequest(res, 'firstName, lastName and email are required')
    }
    const student = await studentService.createStudent(req.user.school_id, req.body)
    return created(res, {
      student,
      generatedPassword: student.generatedPassword,
    }, 'Student created successfully')
  } catch (err) { next(err) }
}

/** PUT /api/students/:id */
const updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(
      req.user.school_id, req.params.id, req.body
    )
    return success(res, { student }, 'Student updated successfully')
  } catch (err) { next(err) }
}

/** DELETE /api/students/:id */
const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.user.school_id, req.params.id)
    return success(res, {}, 'Student deleted successfully')
  } catch (err) { next(err) }
}

/** PATCH /api/students/:id/assign-class */
const assignClass = async (req, res, next) => {
  try {
    const { classId } = req.body
    const student = await studentService.assignClass(
      req.user.school_id, req.params.id, classId
    )
    return success(res, { student }, 'Class assigned successfully')
  } catch (err) { next(err) }
}

/** GET /api/students/classes — for dropdown in forms */
const getClasses = async (req, res, next) => {
  try {
    const classes = await studentService.getClassesForSchool(req.user.school_id)
    return success(res, { classes }, 'Classes fetched')
  } catch (err) { next(err) }
}

/** POST /api/students/:id/reset-password — generates new password, returns it once */
const resetStudentPassword = async (req, res, next) => {
  try {
    const result = await studentService.resetStudentPassword(req.user.school_id, req.params.id)
    return success(res, result, `Password reset for ${result.name}`)
  } catch (err) { next(err) }
}

module.exports = {
  getStudents, getStudentById, createStudent,
  updateStudent, deleteStudent, assignClass,
  getClasses, resetStudentPassword,
}
