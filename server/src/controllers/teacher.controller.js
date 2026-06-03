const teacherService = require('../services/teacher.service')
const { success, created, badRequest } = require('../utils/response')

const getTeachers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const result = await teacherService.getTeachers({ schoolId: req.user.school_id, page, limit, search })
    return success(res, result, 'Teachers fetched')
  } catch (err) { next(err) }
}

const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherById(req.user.school_id, req.params.id)
    return success(res, { teacher }, 'Teacher fetched')
  } catch (err) { next(err) }
}

const createTeacher = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body
    if (!firstName || !lastName || !email) {
      return badRequest(res, 'firstName, lastName and email are required')
    }
    const teacher = await teacherService.createTeacher(req.user.school_id, req.body)
    return created(res, { teacher, generatedPassword: teacher.generatedPassword }, 'Teacher created successfully')
  } catch (err) { next(err) }
}

const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.updateTeacher(req.user.school_id, req.params.id, req.body)
    return success(res, { teacher }, 'Teacher updated successfully')
  } catch (err) { next(err) }
}

const deleteTeacher = async (req, res, next) => {
  try {
    await teacherService.deleteTeacher(req.user.school_id, req.params.id)
    return success(res, {}, 'Teacher deleted successfully')
  } catch (err) { next(err) }
}

const resetTeacherPassword = async (req, res, next) => {
  try {
    const result = await teacherService.resetTeacherPassword(req.user.school_id, req.params.id)
    return success(res, result, `Password reset for ${result.name}`)
  } catch (err) { next(err) }
}

module.exports = { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, resetTeacherPassword }
