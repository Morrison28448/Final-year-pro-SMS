const { verifyToken } = require('../utils/jwt')
const { unauthorized, forbidden } = require('../utils/response')
const { supabase } = require('../config/supabase')

/**
 * protect — verifies JWT and attaches user to req.user
 * Use on any route that requires authentication.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided')
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    // Fetch fresh user from DB to catch deactivated accounts
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, school_id, first_name, last_name, is_active')
      .eq('id', decoded.id)
      .single()

    if (error || !user) {
      return unauthorized(res, 'User not found')
    }

    if (!user.is_active) {
      return forbidden(res, 'Account is deactivated')
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired')
    }
    if (err.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token')
    }
    next(err)
  }
}

/**
 * restrictTo — role-based access control
 * Must be used AFTER protect middleware.
 *
 * Usage: router.get('/admin', protect, restrictTo('super_admin'), handler)
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return forbidden(res, 'You do not have permission to perform this action')
  }
  next()
}

module.exports = { protect, restrictTo }
