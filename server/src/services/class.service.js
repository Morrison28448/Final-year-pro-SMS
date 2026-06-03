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
      class_subjects ( id, subjects ( id, name ) )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('name')
    .range(from, to)

  if (error) throw new Error(error.message)

  const classes = (data || []).map((c) => ({
    ...c,
    student_count: c.students?.length || 0,
    subject_count: c.class_subjects?.length || 0,
    subjects: (c.class_subjects || []).map((cs) => cs.subjects),
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
    err.status = 400
    throw err
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
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

const createSubject = async (schoolId, { name, code }) => {
  if (!name) {
    const err = new Error('Subject name is required')
    err.status = 400
    throw err
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

// ── Class-Subject assignments ─────────────────────────────────────────────────

const assignSubjectsToClass = async (schoolId, classId, subjectIds) => {
  // Remove existing assignments for this class
  await supabase
    .from('class_subjects')
    .delete()
    .eq('school_id', schoolId)
    .eq('class_id', classId)

  if (!subjectIds || subjectIds.length === 0) return []

  const rows = subjectIds.map((sid) => ({
    school_id:  schoolId,
    class_id:   classId,
    subject_id: sid,
  }))

  const { data, error } = await supabase
    .from('class_subjects')
    .insert(rows)
    .select('id, subject_id, subjects ( id, name, code )')

  if (error) throw new Error(error.message)
  return data || []
}

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  assignSubjectsToClass,
}
