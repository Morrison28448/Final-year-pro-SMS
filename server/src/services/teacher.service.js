const bcrypt = require('bcryptjs')
const { supabase } = require('../config/supabase')
const generatePassword = require('../utils/generatePassword')

const getTeachers = async ({ schoolId, page = 1, limit = 10, search = '' }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('teachers')
    .select(`
      id, employee_id, qualification, specialization, created_at,
      users ( id, first_name, last_name, email, phone, is_active )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  let teachers = data || []
  if (search) {
    const term = search.toLowerCase()
    teachers = teachers.filter((t) => {
      const name  = `${t.users?.first_name} ${t.users?.last_name}`.toLowerCase()
      const email = (t.users?.email || '').toLowerCase()
      const empId = (t.employee_id || '').toLowerCase()
      return name.includes(term) || email.includes(term) || empId.includes(term)
    })
  }

  return {
    teachers,
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

const getTeacherById = async (schoolId, teacherId) => {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      users ( id, first_name, last_name, email, phone, is_active )
    `)
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('Teacher not found')
    err.status = 404
    throw err
  }
  return data
}

const createTeacher = async (schoolId, payload) => {
  const {
    firstName, lastName, email,
    phone, employeeId, qualification, specialization,
  } = payload

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

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      school_id:  schoolId,
      first_name: firstName,
      last_name:  lastName,
      email,
      password:   hashedPassword,
      role:       'teacher',
      phone,
    })
    .select('id, first_name, last_name, email')
    .single()

  if (userErr) throw new Error(userErr.message)

  const { data: teacher, error: teacherErr } = await supabase
    .from('teachers')
    .insert({
      school_id:      schoolId,
      user_id:        user.id,
      employee_id:    employeeId    || null,
      qualification:  qualification || null,
      specialization: specialization || null,
    })
    .select(`*, users ( id, first_name, last_name, email, phone )`)
    .single()

  if (teacherErr) {
    await supabase.from('users').delete().eq('id', user.id)
    throw new Error(teacherErr.message)
  }

  // Return teacher + plain password (shown once to admin)
  return { ...teacher, generatedPassword: plainPassword }
}

const updateTeacher = async (schoolId, teacherId, payload) => {
  const {
    firstName, lastName, phone,
    employeeId, qualification, specialization,
  } = payload

  const { data: existing, error: fetchErr } = await supabase
    .from('teachers')
    .select('id, user_id')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !existing) {
    const err = new Error('Teacher not found')
    err.status = 404
    throw err
  }

  const userUpdates = {}
  if (firstName !== undefined) userUpdates.first_name = firstName
  if (lastName  !== undefined) userUpdates.last_name  = lastName
  if (phone     !== undefined) userUpdates.phone      = phone

  if (Object.keys(userUpdates).length > 0) {
    await supabase.from('users').update(userUpdates).eq('id', existing.user_id)
  }

  const teacherUpdates = {}
  if (employeeId    !== undefined) teacherUpdates.employee_id    = employeeId
  if (qualification !== undefined) teacherUpdates.qualification  = qualification
  if (specialization !== undefined) teacherUpdates.specialization = specialization

  const { data, error } = await supabase
    .from('teachers')
    .update(teacherUpdates)
    .eq('id', teacherId)
    .select(`*, users ( id, first_name, last_name, email, phone )`)
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteTeacher = async (schoolId, teacherId) => {
  const { data: teacher, error: fetchErr } = await supabase
    .from('teachers')
    .select('id, user_id')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !teacher) {
    const err = new Error('Teacher not found')
    err.status = 404
    throw err
  }

  await supabase.from('teachers').delete().eq('id', teacherId)
  await supabase.from('users').delete().eq('id', teacher.user_id)
  return { id: teacherId }
}

module.exports = { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher }


/**
 * Reset a teacher's password — generates a new one and returns it plain.
 * Only the school admin can do this.
 */
const resetTeacherPassword = async (schoolId, teacherId) => {
  const { data: teacher, error: fetchErr } = await supabase
    .from('teachers')
    .select('id, user_id, users ( first_name, last_name, email )')
    .eq('id', teacherId)
    .eq('school_id', schoolId)
    .single()

  if (fetchErr || !teacher) {
    const err = new Error('Teacher not found')
    err.status = 404
    throw err
  }

  const plainPassword  = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', teacher.user_id)

  if (updateErr) throw new Error(updateErr.message)

  return {
    teacherId,
    name:              `${teacher.users?.first_name} ${teacher.users?.last_name}`,
    email:             teacher.users?.email,
    generatedPassword: plainPassword,
  }
}

module.exports = {
  getTeachers, getTeacherById, createTeacher,
  updateTeacher, deleteTeacher, resetTeacherPassword,
}
