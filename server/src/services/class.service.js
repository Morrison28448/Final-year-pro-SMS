const { supabase } = require('../config/supabase')

// ── Classes ───────────────────────────────────────────────────────────────────

const getClasses = async ({ schoolId, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  const { data, error, count } = await supabase
    .from('classes')
    .select(`
      id, name, section, created_at,
      students ( id ),
      class_subjects (
        id, subject_id, teacher_id,
        subjects  ( id, name, code ),
        teachers  ( id, users ( first_name, last_name ) )
      )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('name')
    .range(from, to)

  if (error) throw new Error(error.message)

  const classes = (data || []).map((c) => ({
    ...c,
    student_count: c.students?.length || 0,
    subject_count: c.class_subjects?.length || 0,
    subjects: (c.class_subjects || []).map((cs) => ({
      class_subject_id: cs.id,
      subject_id:       cs.subjects?.id,
      subject_name:     cs.subjects?.name,
      subject_code:     cs.subjects?.code,
      teacher_id:       cs.teacher_id,
      teacher_name:     cs.teachers?.users
        ? `${cs.teachers.users.first_name} ${cs.teachers.users.last_name}`
        : null,
    })),
  }))

  return {
    classes,
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

const createClass = async (schoolId, { name, section }) => {
  if (!name) {
    const err = new Error('Class name is required')
    err.status = 400; throw err
  }
  const { data, error } = await supabase
    .from('classes')
    .insert({ school_id: schoolId, name, section: section || null })
    .select('id, name, section, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const updateClass = async (schoolId, classId, { name, section }) => {
  const updates = {}
  if (name    !== undefined) updates.name    = name
  if (section !== undefined) updates.section = section || null

  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .eq('school_id', schoolId)
    .select('id, name, section, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteClass = async (schoolId, classId) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId)
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return { id: classId }
}

// ── Subjects ──────────────────────────────────────────────────────────────────

const getSubjects = async ({ schoolId, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  const { data, error, count } = await supabase
    .from('subjects')
    .select('id, name, code, created_at', { count: 'exact' })
    .eq('school_id', schoolId)
    .order('name')
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    subjects: data || [],
    pagination: { total: count || 0, page: Number(page), limit: Number(limit), totalPages: Math.ceil((count || 0) / limit) },
  }
}

const createSubject = async (schoolId, { name, code }) => {
  if (!name) {
    const err = new Error('Subject name is required')
    err.status = 400; throw err
  }
  const { data, error } = await supabase
    .from('subjects')
    .insert({ school_id: schoolId, name, code: code || null })
    .select('id, name, code, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const updateSubject = async (schoolId, subjectId, { name, code }) => {
  const updates = {}
  if (name !== undefined) updates.name = name
  if (code !== undefined) updates.code = code || null

  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', subjectId)
    .eq('school_id', schoolId)
    .select('id, name, code, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteSubject = async (schoolId, subjectId) => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return { id: subjectId }
}

// ── Class-Subject assignments (with teacher) ──────────────────────────────────

/**
 * Replace all subject assignments for a class.
 * subjectIds: array of subject UUIDs
 */
const assignSubjectsToClass = async (schoolId, classId, subjectIds) => {
  await supabase.from('class_subjects').delete().eq('school_id', schoolId).eq('class_id', classId)

  if (!subjectIds || subjectIds.length === 0) return []

  const rows = subjectIds.map((sid) => ({
    school_id: schoolId, class_id: classId, subject_id: sid,
  }))

  const { data, error } = await supabase
    .from('class_subjects')
    .insert(rows)
    .select('id, subject_id, subjects ( id, name, code )')

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Assign a teacher to a specific subject in a class.
 * Sets class_subjects.teacher_id for the matching row.
 * teacherId = null clears the assignment.
 */
const assignTeacherToSubject = async (schoolId, classId, subjectId, teacherId) => {
  // Verify teacher belongs to school
  if (teacherId) {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .eq('school_id', schoolId)
      .single()

    if (!teacher) {
      const err = new Error('Teacher not found in this school')
      err.status = 404; throw err
    }
  }

  const { data, error } = await supabase
    .from('class_subjects')
    .update({ teacher_id: teacherId || null })
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .select(`
      id, subject_id, teacher_id,
      subjects ( id, name, code ),
      teachers ( id, users ( first_name, last_name ) )
    `)
    .single()

  if (error) throw new Error(error.message)

  return {
    class_subject_id: data.id,
    subject_id:       data.subjects?.id,
    subject_name:     data.subjects?.name,
    subject_code:     data.subjects?.code,
    teacher_id:       data.teacher_id,
    teacher_name:     data.teachers?.users
      ? `${data.teachers.users.first_name} ${data.teachers.users.last_name}`
      : null,
  }
}

/**
 * Get all subjects assigned to a teacher in a specific class.
 * Used by score entry to enforce teacher-subject restriction.
 */
const getTeacherSubjectsForClass = async (schoolId, teacherId, classId) => {
  const { data, error } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects ( id, name, code )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('teacher_id', teacherId)

  if (error) throw new Error(error.message)
  return (data || []).map((cs) => cs.subjects)
}

/**
 * Get all classes a teacher is assigned to (has at least one subject).
 */
const getTeacherClasses = async (schoolId, teacherId) => {
  const { data, error } = await supabase
    .from('class_subjects')
    .select('class_id, classes ( id, name, section )')
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId)

  if (error) throw new Error(error.message)

  // Deduplicate by class_id
  const seen = new Set()
  return (data || [])
    .filter((cs) => { if (seen.has(cs.class_id)) return false; seen.add(cs.class_id); return true })
    .map((cs) => cs.classes)
}

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignSubjectsToClass, assignTeacherToSubject,
  getTeacherSubjectsForClass, getTeacherClasses,
}
