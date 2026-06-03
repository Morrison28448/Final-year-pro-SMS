const authService = require('../services/auth.service')
const { success, created, badRequest } = require('../utils/response')

/**
 * GET /api/auth/schools?search=
 * Public — returns active schools for the portal login dropdown.
 */
const searchSchools = async (req, res, next) => {
  try {
    const { search = '' } = req.query
    const schools = await authService.searchSchools(search)
    return success(res, { schools }, 'Schools fetched')
  } catch (err) { next(err) }
}

/**
 * POST /api/auth/register
 * Register a new school + school_admin
 */
const register = async (req, res, next) => {
  try {
    const { schoolName, firstName, lastName, email, password, phone } = req.body

    // Basic validation
    if (!schoolName || !firstName || !lastName || !email || !password) {
      return badRequest(res, 'schoolName, firstName, lastName, email and password are required')
    }

    if (password.length < 8) {
      return badRequest(res, 'Password must be at least 8 characters')
    }

    const result = await authService.registerSchool({
      schoolName, firstName, lastName, email, password, phone,
    })

    return created(res, result, 'School registered successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/login
 * Login any user (all roles)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return badRequest(res, 'Email and password are required')
    }

    const result = await authService.loginUser({ email, password })

    return success(res, result, 'Login successful')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id)
    return success(res, { user }, 'Profile fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, getMe, searchSchools }
