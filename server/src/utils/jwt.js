const jwt = require('jsonwebtoken')
const env = require('../config/env')

/**
 * Sign a JWT token for a user
 * @param {object} payload - { id, email, role, school_id }
 * @returns {string} signed JWT
 */
const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET)

module.exports = { signToken, verifyToken }
