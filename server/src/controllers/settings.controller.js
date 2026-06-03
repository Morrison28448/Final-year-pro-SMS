const settingsService = require('../services/settings.service')
const { success, badRequest } = require('../utils/response')

const getSchoolProfile = async (req, res, next) => {
  try {
    const school = await settingsService.getSchoolProfile(req.user.school_id)
    return success(res, { school }, 'School profile fetched')
  } catch (err) { next(err) }
}

const updateSchoolProfile = async (req, res, next) => {
  try {
    const school = await settingsService.updateSchoolProfile(req.user.school_id, req.body)
    return success(res, { school }, 'School profile updated')
  } catch (err) { next(err) }
}

const updateProfile = async (req, res, next) => {
  try {
    const user = await settingsService.updateProfile(req.user.id, req.body)
    return success(res, { user }, 'Profile updated')
  } catch (err) { next(err) }
}

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return badRequest(res, 'currentPassword and newPassword are required')
    }
    if (newPassword.length < 8) {
      return badRequest(res, 'New password must be at least 8 characters')
    }
    await settingsService.changePassword(req.user.id, currentPassword, newPassword)
    return success(res, {}, 'Password changed successfully')
  } catch (err) { next(err) }
}

module.exports = { getSchoolProfile, updateSchoolProfile, updateProfile, changePassword }
