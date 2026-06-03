const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const env = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
}

// Fail fast if critical variables are missing
const required = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
required.forEach((key) => {
  if (!env[key]) {
    console.error(`[ENV ERROR] Missing required environment variable: ${key}`)
    process.exit(1)
  }
})

module.exports = env
