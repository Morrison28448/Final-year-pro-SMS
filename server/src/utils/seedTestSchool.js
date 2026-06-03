/**
 * Seeds a test school + school_admin account.
 * Run once: node src/utils/seedTestSchool.js
 */
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SCHOOL = {
  name:  'Greenfield Academy',
  email: 'admin@greenfield.com',
  phone: '+234 800 000 0001',
}

const ADMIN = {
  first_name: 'John',
  last_name:  'Doe',
  email:      'admin@greenfield.com',
  password:   'Admin@12345',
  role:       'school_admin',
}

const seed = async () => {
  console.log('Seeding test school...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', ADMIN.email)
    .single()

  if (existing) {
    console.log(`School admin already exists: ${existing.email}`)
    process.exit(0)
  }

  // Create school
  const { data: school, error: schoolErr } = await supabase
    .from('schools')
    .insert(SCHOOL)
    .select()
    .single()

  if (schoolErr) {
    console.error('Failed to create school:', schoolErr.message)
    process.exit(1)
  }

  console.log(`✅ School created: ${school.name} (${school.id})`)

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN.password, 12)

  // Create school_admin user
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ ...ADMIN, password: hashedPassword, school_id: school.id })
    .select('id, email, role')
    .single()

  if (userErr) {
    console.error('Failed to create admin:', userErr.message)
    // Roll back school
    await supabase.from('schools').delete().eq('id', school.id)
    process.exit(1)
  }

  // Seed default modules for the school
  const modules = ['attendance', 'exams', 'library', 'transport']
  await supabase.from('school_modules').insert(
    modules.map((m) => ({ school_id: school.id, module_name: m, is_enabled: true }))
  )

  console.log('✅ School admin created:')
  console.log(`   Email:    ${user.email}`)
  console.log(`   Password: ${ADMIN.password}`)
  console.log(`   Role:     ${user.role}`)
  console.log(`   School:   ${school.name}`)
  console.log('\n📋 Default modules seeded: attendance, exams, library, transport')
  process.exit(0)
}

seed()
