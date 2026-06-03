const bcrypt = require('bcryptjs')
const { supabase } = require('../config/supabase')
const { signToken } = require('../utils/jwt')

/**
 * Register a new school + school_admin account in one transaction.
 *
 * Steps:
 *  1. Check email is not already taken
 *  2. Create the school record
 *  3. Hash the password
 *  4. Create the school_admin user linked to that school
 *  5. Return token + safe user object
 */
const registerSchool = async ({ schoolName, firstName, lastName, email, password, phone }) => {
  // 1. Check for duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    const err = new Error('An account with this email already exists')
    err.status = 409
    throw err
  }

  // 2. Create school
  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .insert({ name: schoolName, email, phone })
    .select()
    .single()

  if (schoolError) throw new Error(schoolError.message)

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // 4. Create school_admin user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      school_id:  school.id,
      first_name: firstName,
      last_name:  lastName,
      email,
      password:   hashedPassword,
      role:       'school_admin',
      phone,
    })
    .select('id, email, role, school_id, first_name, last_name')
    .single()

  if (userError) {
    // Roll back school if user creation fails
    await supabase.from('schools').delete().eq('id', school.id)
    throw new Error(userError.message)
  }

  // 5. Sign token
  const token = signToken({ id: user.id, email: user.email, role: user.role, school_id: user.school_id })

  return { token, user: { ...user, school_name: school.name } }
}

/**
 * Login with email + password.
 * Works for all roles (super_admin, school_admin, teacher, student, parent).
 */
const loginUser = async ({ email, password }) => {
  // Fetch user + school name in one query via join
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, role, school_id, first_name, last_name, password, is_active,
      schools ( name )
    `)
    .eq('email', email)
    .single()

  if (error || !user) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }

  if (!user.is_active) {
    const err = new Error('Your account has been deactivated')
    err.status = 403
    throw err
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const err = new Error('Invalid email or password')
    err.status = 401
    throw err
  }

  // Sign token
  const token = signToken({
    id:        user.id,
    email:     user.email,
    role:      user.role,
    school_id: user.school_id,
  })

  // Return safe user object (no password)
  const { password: _pw, ...safeUser } = user
  return {
    token,
    user: {
      ...safeUser,
      school_name: user.schools?.name || null,
    },
  }
}

/**
 * Get the currently authenticated user's profile.
 */
const getMe = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, email, role, school_id, first_name, last_name, phone, is_active, created_at,
      schools ( name, logo_url )
    `)
    .eq('id', userId)
    .single()

  if (error || !user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }

  return {
    ...user,
    school_name: user.schools?.name || null,
    school_logo: user.schools?.logo_url || null,
  }
}

module.exports = { registerSchool, loginUser, getMe, searchSchools }

/**
 * Search active schools by name — used by the portal login page.
 * Returns only id, name, logo_url (no sensitive data).
 */
async function searchSchools(search = '') {
  let query = supabase
    .from('schools')
    .select('id, name, logo_url, email')
    .eq('is_active', true)
    .order('name')
    .limit(20)

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
