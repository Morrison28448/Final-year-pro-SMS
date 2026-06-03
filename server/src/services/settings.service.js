const bcrypt = require('bcryptjs')
const { supabase } = require('../config/supabase')

const getSchoolProfile = async (schoolId) => {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, email, phone, address, logo_url, is_active, created_at')
    .eq('id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('School not found')
    err.status = 404
    throw err
  }
  return data
}

const updateSchoolProfile = async (schoolId, { name, email, phone, address, logoUrl }) => {
  const updates = {}
  if (name     !== undefined) updates.name     = name
  if (email    !== undefined) updates.email    = email
  if (phone    !== undefined) updates.phone    = phone
  if (address  !== undefined) updates.address  = address
  if (logoUrl  !== undefined) updates.logo_url = logoUrl

  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', schoolId)
    .select('id, name, email, phone, address, logo_url, is_active')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const updateProfile = async (userId, { firstName, lastName, phone }) => {
  const updates = {}
  if (firstName !== undefined) updates.first_name = firstName
  if (lastName  !== undefined) updates.last_name  = lastName
  if (phone     !== undefined) updates.phone      = phone

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, first_name, last_name, email, phone, role')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const changePassword = async (userId, currentPassword, newPassword) => {
  // Fetch current hashed password
  const { data: user, error } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .single()

  if (error || !user) {
    const err = new Error('User not found')
    err.status = 404
    throw err
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password)
  if (!isMatch) {
    const err = new Error('Current password is incorrect')
    err.status = 400
    throw err
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId)

  if (updateErr) throw new Error(updateErr.message)
  return true
}

module.exports = { getSchoolProfile, updateSchoolProfile, updateProfile, changePassword }
