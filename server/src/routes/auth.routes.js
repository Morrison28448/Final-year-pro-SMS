const express = require('express')
const router = express.Router()

const { register, login, getMe, searchSchools } = require('../controllers/auth.controller')
const { protect } = require('../middleware/protect')

// GET  /api/auth/schools?search=  — public school search for portal login
router.get('/schools', searchSchools)

// POST /api/auth/register  — create school + school_admin
router.post('/register', register)

// POST /api/auth/login     — login any role
router.post('/login', login)

// GET  /api/auth/me        — get current user (protected)
router.get('/me', protect, getMe)

module.exports = router
