const express = require('express')
const cors = require('cors')
const env = require('./config/env')

const logger = require('./middleware/logger')
const notFound = require('./middleware/notFound')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── Supabase DB health check ──────────────────────────────────────────────────
app.get('/api/health/db', async (req, res, next) => {
  try {
    const { supabase } = require('./config/supabase')

    const { error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(0)

    // PGRST116 = table not in schema cache yet — connection is still healthy
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    res.json({
      success: true,
      message: 'Supabase connection is healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'))
app.use('/api/super-admin',   require('./routes/superAdmin.routes'))
app.use('/api/school-admin',  require('./routes/schoolAdmin.routes'))
app.use('/api/students',      require('./routes/student.routes'))
app.use('/api/attendance',    require('./routes/attendance.routes'))
app.use('/api/exams',         require('./routes/exam.routes'))
app.use('/api/terms',         require('./routes/term.routes'))
app.use('/api/subscriptions', require('./routes/subscription.routes'))
app.use('/api/teachers',      require('./routes/teacher.routes'))
app.use('/api/academics',      require('./routes/class.routes'))
app.use('/api/academic-years', require('./routes/academicYear.routes'))
app.use('/api/settings',       require('./routes/settings.routes'))
app.use('/api/portal',         require('./routes/portal.routes'))

// ── Error handling (must be last) ─────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

module.exports = app
