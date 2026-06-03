const { supabase } = require('../config/supabase')
const bcrypt = require('bcryptjs')
const generatePassword = require('../utils/generatePassword')

/**
 * Get paginated, searchable list of students for a school.
 */
const getStudents = async ({ schoolId, page = 1, limit = 10, search = '', classId = '' }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('students')
    .select(`
      id, admission_number, gender, date_of_birth, guardian_name, guardian_phone, created_at,
      users   ( id, first_name, last_name, email, phone, is_active ),
      classes ( id, name, section )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (classId) query = query.eq('class_id', classId)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  // If search term, filter in JS (Supabase doesn't support cross-table ilike easily)
  let students = data || []
  if (search) {
    const term = search.toLowerCase()
    students = students.filter((s) => {
      const name  = `${s.users?.first_name} ${s.users?.last_name}`.toLowerCase()
      const email = (s.users?.email || '').toLowerCase()
      const admNo = (s.admission_number || '').toLowerCase()
      return name.includes(term) || email.includes(term) || admNo.includes(term)
    })
  }

  return {
    students,
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Get a single student by ID (must belong to the school).
 */
const getStudentById = async (schoolId, studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users   ( id, first_name, last_name, email, phone, is_active ),
      classes ( id, name, section )
    `)
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('Student not found')
    err.status = 404
    throw err
  }
  return data
}

/**
 * Create a new student — creates a user account + student profile.
 * Auto-generates a secure password and returns it in plain text
 * so the school admin can share it with the student.
 */
const createStudent = async (schoolId, payload) => {
  const {
    firstName, lastName, email,
    phone, gender, dateOfBirth, classId,
    guardianName, guardianPhone, address, admissionNumber,
  } = payload

  // Check email uniqueness
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    const err = new Error('A user with this email already exists')
    err.status = 409
    throw err
  }

  // Auto-generate a secure password
  const plainPassword  = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  // Create user account
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      school_id:  schoolId,
      first_name: firstName,
      last_name:  lastName,
      email,
      password:   hashedPassword,
      role:       'student',
      phone,
    })
    .select('id, first_name, last_name, email')
    .single()

  if (userErr) throw new Error(userErr.message)

  // Create student profile
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      school_id:        schoolId,
      user_id:          user.id,
      class_id:         classId || null,
      admission_number: admissionNumber || null,
      gender:           gender || null,
      date_of_birth:    dateOfBirth || null,
      guardian_name:    guardianName || null,
      guardian_phone:   guardianPhone || null,
      address:          address || null,
    })
    .select(`
      *,
      users   ( id, first_name, last_name, email, phone ),
      classes ( id, name, section )
    `)
    .single()

  if (studentErr) {
    await supabase.from('users').delete().eq('id', user.id)
    throw new Error(studentErr.message)
  }

  // Return student + plain password (shown once to admin)
  return { ...student, generatedPassword: plainPassword }
}

/**
 * Update student profile + user account fields.
 */
const updateStudent = async (schoolId, studentId, payload) => {
  const {
    firstName, lastName, phone,
    gender, dateOfBirth, classId,
    guardianName, guardianPhone, address, admissionNumber,
  } = payload

  // Verify student belongs to school
  const { data: existing, error: fetchErr } = await supabase
    .from('students')
    .select('id, user_id')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !existing) {
    const err = new Error('Student not found')
    err.status = 404
    throw err
  }

  // Update user fields
  const userUpdates = {}
  if (firstName !== undefined) userUpdates.first_name = firstName
  if (lastName  !== undefined) userUpdates.last_name  = lastName
  if (phone     !== undefined) userUpdates.phone      = phone

  if (Object.keys(userUpdates).length > 0) {
    const { error: userErr } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', existing.user_id)
    if (userErr) throw new Error(userErr.message)
  }

  // Update student profile fields
  const studentUpdates = {}
  if (gender           !== undefined) studentUpdates.gender           = gender
  if (dateOfBirth      !== undefined) studentUpdates.date_of_birth    = dateOfBirth
  if (classId          !== undefined) studentUpdates.class_id         = classId || null
  if (guardianName     !== undefined) studentUpdates.guardian_name    = guardianName
  if (guardianPhone    !== undefined) studentUpdates.guardian_phone   = guardianPhone
  if (address          !== undefined) studentUpdates.address          = address
  if (admissionNumber  !== undefined) studentUpdates.admission_number = admissionNumber

  const { data, error: studentErr } = await supabase
    .from('students')
    .update(studentUpdates)
    .eq('id', studentId)
    .select(`
      *,
      users   ( id, first_name, last_name, email, phone ),
      classes ( id, name, section )
    `)
    .single()

  if (studentErr) throw new Error(studentErr.message)
  return data
}

/**
 * Delete a student — removes student profile + user account.
 */
const deleteStudent = async (schoolId, studentId) => {
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, user_id')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !student) {
    const err = new Error('Student not found')
    err.status = 404
    throw err
  }

  // Delete student profile (cascade handles related records)
  const { error: deleteErr } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)

  if (deleteErr) throw new Error(deleteErr.message)

  // Delete user account
  await supabase.from('users').delete().eq('id', student.user_id)

  return { id: studentId }
}

/**
 * Assign or change a student's class.
 */
const assignClass = async (schoolId, studentId, classId) => {
  // Verify class belongs to school
  if (classId) {
    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('school_id', schoolId)
      .single()

    if (!cls) {
      const err = new Error('Class not found')
      err.status = 404
      throw err
    }
  }

  const { data, error } = await supabase
    .from('students')
    .update({ class_id: classId || null })
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .select(`
      id, admission_number,
      users   ( first_name, last_name ),
      classes ( id, name, section )
    `)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Get all classes for a school (used in student form dropdowns).
 */
const getClassesForSchool = async (schoolId) => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, section')
    .eq('school_id', schoolId)
    .order('name')

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Reset a student's password — generates a new one and returns it plain.
 * Only the school admin can do this.
 */
const resetStudentPassword = async (schoolId, studentId) => {
  // Verify student belongs to school
  const { data: student, error: fetchErr } = await supabase
    .from('students')
    .select('id, user_id, users ( first_name, last_name, email )')
    .eq('id', studentId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !student) {
    const err = new Error('Student not found')
    err.status = 404
    throw err
  }

  const plainPassword  = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', student.user_id)

  if (updateErr) throw new Error(updateErr.message)

  return {
    studentId,
    name:              `${student.users?.first_name} ${student.users?.last_name}`,
    email:             student.users?.email,
    generatedPassword: plainPassword,
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  assignClass,
  getClassesForSchool,
  resetStudentPassword,
}
