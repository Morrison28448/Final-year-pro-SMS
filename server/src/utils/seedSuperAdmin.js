/**
 * Run once to create the super_admin account.
 * Usage: node src/utils/seedSuperAdmin.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUPER_ADMIN = {
  first_name: 'Super',
  last_name:  'Admin',
  email:      'superadmin@sms.com',
  password:   'SuperAdmin@123',
  role:       'super_admin',
  school_id:  null,
}

const seed = async () => {
  console.log('Seeding super admin...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', SUPER_ADMIN.email)
    .single()

  if (existing) {
    console.log(`Super admin already exists: ${existing.email}`)
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 12)

  const { data, error } = await supabase
    .from('users')
    .insert({ ...SUPER_ADMIN, password: hashedPassword })
    .select('id, email, role')
    .single()

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Super admin created:')
  console.log(`   Email:    ${data.email}`)
  console.log(`   Password: ${SUPER_ADMIN.password}`)
  console.log(`   Role:     ${data.role}`)
  process.exit(0)
}

seed()
