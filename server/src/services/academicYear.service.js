const { supabase } = require('../config/supabase')

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC YEARS
// ─────────────────────────────────────────────────────────────────────────────

const getAcademicYears = async (schoolId) => {
  const { data, error } = await supabase
    .from('academic_years')
    .select(`
      id, name, start_date, end_date, is_active, is_closed, created_at,
      terms (
        id, name, term_number,
        term_assessments ( id, name, weight, max_score, sort_order )
      )
    `)
    .eq('school_id', schoolId)
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []).map((y) => ({
    ...y,
    terms: (y.terms || [])
      .sort((a, b) => a.term_number - b.term_number)
      .map((t) => ({
        ...t,
        assessments: (t.term_assessments || []).sort((a, b) => a.sort_order - b.sort_order),
        total_weight: (t.term_assessments || []).reduce((s, a) => s + parseFloat(a.weight), 0),
      })),
  }))
}

const getAcademicYearById = async (schoolId, yearId) => {
  const { data, error } = await supabase
    .from('academic_years')
    .select(`
      id, name, start_date, end_date, is_active, is_closed, created_at,
      terms (
        id, name, term_number, academic_year_id,
        term_assessments ( id, name, weight, max_score, sort_order )
      )
    `)
    .eq('id', yearId)
    .eq('school_id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('Academic year not found'); err.status = 404; throw err
  }

  return {
    ...data,
    terms: (data.terms || [])
      .sort((a, b) => a.term_number - b.term_number)
      .map((t) => ({
        ...t,
        assessments: (t.term_assessments || []).sort((a, b) => a.sort_order - b.sort_order),
        total_weight: (t.term_assessments || []).reduce((s, a) => s + parseFloat(a.weight), 0),
      })),
  }
}

/**
 * Create an academic year with its terms and assessment components in one call.
 *
 * payload: {
 *   name: "2025/2026",
 *   startDate, endDate,
 *   terms: [
 *     {
 *       name: "First Semester",
 *       termNumber: 1,
 *       assessments: [{ name: "Midterm", weight: 30, maxScore: 100 }, { name: "Final", weight: 70, maxScore: 100 }]
 *     },
 *     { name: "Second Semester", termNumber: 2, assessments: [...] }
 *   ]
 * }
 */
const createAcademicYear = async (schoolId, payload) => {
  const { name, startDate, endDate, terms: termDefs } = payload

  if (!name?.trim()) {
    const err = new Error('Academic year name is required'); err.status = 400; throw err
  }
  if (!termDefs || termDefs.length === 0) {
    const err = new Error('At least one term is required'); err.status = 400; throw err
  }

  // Validate each term's weights sum to 100
  for (const t of termDefs) {
    const total = (t.assessments || []).reduce((s, a) => s + parseFloat(a.weight || 0), 0)
    if (Math.abs(total - 100) > 0.01) {
      const err = new Error(
        `Term "${t.name}": assessment weights must sum to 100%. Current: ${total}%`
      )
      err.status = 400; throw err
    }
  }

  // Create academic year
  const { data: year, error: yearErr } = await supabase
    .from('academic_years')
    .insert({ school_id: schoolId, name, start_date: startDate || null, end_date: endDate || null })
    .select('id, name, start_date, end_date, is_active, is_closed')
    .single()

  if (yearErr) throw new Error(yearErr.message)

  // Create terms + assessments
  const createdTerms = []
  for (const termDef of termDefs) {
    const { data: term, error: tErr } = await supabase
      .from('terms')
      .insert({
        school_id:        schoolId,
        academic_year_id: year.id,
        name:             termDef.name,
        term_number:      termDef.termNumber || 1,
      })
      .select('id, name, term_number')
      .single()

    if (tErr) throw new Error(tErr.message)

    // Create assessments for this term
    const assessmentRows = (termDef.assessments || []).map((a, i) => ({
      school_id:  schoolId,
      term_id:    term.id,
      name:       a.name,
      weight:     parseFloat(a.weight),
      max_score:  parseFloat(a.maxScore || 100),
      sort_order: i,
    }))

    const { data: assessments, error: aErr } = await supabase
      .from('term_assessments')
      .insert(assessmentRows)
      .select('id, name, weight, max_score, sort_order')

    if (aErr) throw new Error(aErr.message)

    createdTerms.push({
      ...term,
      assessments: (assessments || []).sort((a, b) => a.sort_order - b.sort_order),
      total_weight: 100,
    })
  }

  return { ...year, terms: createdTerms }
}

const updateAcademicYear = async (schoolId, yearId, { name, startDate, endDate, isActive }) => {
  // If setting active, deactivate all others first
  if (isActive) {
    await supabase
      .from('academic_years')
      .update({ is_active: false })
      .eq('school_id', schoolId)
  }

  const updates = {}
  if (name      !== undefined) updates.name       = name
  if (startDate !== undefined) updates.start_date = startDate || null
  if (endDate   !== undefined) updates.end_date   = endDate   || null
  if (isActive  !== undefined) updates.is_active  = isActive

  const { data, error } = await supabase
    .from('academic_years')
    .update(updates)
    .eq('id', yearId)
    .eq('school_id', schoolId)
    .select('id, name, start_date, end_date, is_active, is_closed')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteAcademicYear = async (schoolId, yearId) => {
  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', yearId)
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return { id: yearId }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS LEVEL PROGRESSION
// ─────────────────────────────────────────────────────────────────────────────

const getClassLevels = async (schoolId) => {
  const { data, error } = await supabase
    .from('class_levels')
    .select(`
      id, level_order, is_graduating,
      classes ( id, name, section )
    `)
    .eq('school_id', schoolId)
    .order('level_order')

  if (error) throw new Error(error.message)
  return (data || []).map((cl) => ({
    id:            cl.id,
    level_order:   cl.level_order,
    is_graduating: cl.is_graduating,
    class_id:      cl.classes?.id,
    class_name:    cl.classes?.name,
    section:       cl.classes?.section,
  }))
}

/**
 * Save class progression order.
 * levels: [{ classId, levelOrder, isGraduating }]
 * Replaces all existing levels for the school.
 */
const saveClassLevels = async (schoolId, levels) => {
  // Delete existing
  await supabase.from('class_levels').delete().eq('school_id', schoolId)

  if (!levels || levels.length === 0) return []

  const rows = levels.map((l) => ({
    school_id:     schoolId,
    class_id:      l.classId,
    level_order:   l.levelOrder,
    is_graduating: l.isGraduating || false,
  }))

  const { data, error } = await supabase
    .from('class_levels')
    .insert(rows)
    .select(`
      id, level_order, is_graduating,
      classes ( id, name, section )
    `)

  if (error) throw new Error(error.message)

  return (data || [])
    .sort((a, b) => a.level_order - b.level_order)
    .map((cl) => ({
      id:            cl.id,
      level_order:   cl.level_order,
      is_graduating: cl.is_graduating,
      class_id:      cl.classes?.id,
      class_name:    cl.classes?.name,
      section:       cl.classes?.section,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ACADEMIC RECORDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all student academic records for an academic year.
 * Returns which class each student is in for that year.
 */
const getStudentRecordsForYear = async (schoolId, academicYearId) => {
  const { data, error } = await supabase
    .from('student_academic_records')
    .select(`
      id, status,
      students (
        id, admission_number,
        users ( first_name, last_name, email )
      ),
      classes ( id, name, section )
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .order('created_at')

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Enrol all current students into an academic year.
 * Each student is placed in their current class_id from the students table.
 * Called when an academic year is first activated.
 */
const enrolStudentsForYear = async (schoolId, academicYearId) => {
  // Get all active students
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('school_id', schoolId)

  if (sErr) throw new Error(sErr.message)

  const rows = (students || [])
    .filter((s) => s.class_id) // only students with a class
    .map((s) => ({
      school_id:        schoolId,
      student_id:       s.id,
      academic_year_id: academicYearId,
      class_id:         s.class_id,
      status:           'active',
    }))

  if (rows.length === 0) return []

  // Insert, ignore duplicates
  const { data, error } = await supabase
    .from('student_academic_records')
    .insert(rows)
    .select('id, student_id, class_id, status')

  if (error && error.code !== '23505') throw new Error(error.message)
  return data || []
}

/**
 * Promote all active students to the next class based on class_levels.
 * Students in the graduating class get status = 'graduated'.
 * Updates students.class_id to the new class.
 * Creates records for the new academic year.
 *
 * fromYearId: the year being closed
 * toYearId:   the new year being started
 */
const promoteStudents = async (schoolId, fromYearId, toYearId) => {
  // Get progression order
  const levels = await getClassLevels(schoolId)
  if (levels.length === 0) {
    const err = new Error('No class progression defined. Set up class levels first.')
    err.status = 400; throw err
  }

  // Build progression map: classId → next classId (or null for graduating)
  const progressionMap = {}
  const graduatingIds  = new Set()
  levels.forEach((l, i) => {
    if (l.is_graduating) {
      graduatingIds.add(l.class_id)
      progressionMap[l.class_id] = null
    } else {
      const next = levels[i + 1]
      progressionMap[l.class_id] = next?.class_id || null
    }
  })

  // Get active students in fromYear
  const { data: records, error: rErr } = await supabase
    .from('student_academic_records')
    .select('student_id, class_id')
    .eq('school_id', schoolId)
    .eq('academic_year_id', fromYearId)
    .eq('status', 'active')

  if (rErr) throw new Error(rErr.message)

  const promoted    = []
  const graduated   = []
  const newRecords  = []
  const studentUpdates = []

  for (const rec of (records || [])) {
    const nextClassId = progressionMap[rec.class_id]

    if (graduatingIds.has(rec.class_id)) {
      // Mark as graduated in old year
      graduated.push(rec.student_id)
      await supabase
        .from('student_academic_records')
        .update({ status: 'graduated' })
        .eq('student_id', rec.student_id)
        .eq('academic_year_id', fromYearId)
    } else if (nextClassId) {
      // Move to next class
      promoted.push(rec.student_id)
      studentUpdates.push({ id: rec.student_id, class_id: nextClassId })
      newRecords.push({
        school_id:        schoolId,
        student_id:       rec.student_id,
        academic_year_id: toYearId,
        class_id:         nextClassId,
        status:           'active',
      })
    }
    // else: class not in progression map — skip (not tracked)
  }

  // Update student.class_id in bulk (one by one — Supabase limitation)
  for (const u of studentUpdates) {
    await supabase.from('students').update({ class_id: u.class_id }).eq('id', u.id)
  }

  // Insert new year records
  if (newRecords.length > 0) {
    const { error: nrErr } = await supabase
      .from('student_academic_records')
      .insert(newRecords)
    if (nrErr && nrErr.code !== '23505') throw new Error(nrErr.message)
  }

  // Mark old year as closed
  await supabase
    .from('academic_years')
    .update({ is_closed: true, is_active: false })
    .eq('id', fromYearId)

  return {
    promoted:  promoted.length,
    graduated: graduated.length,
    skipped:   (records || []).length - promoted.length - graduated.length,
  }
}

/**
 * Get students for a specific class in a specific academic year.
 * Used by score entry to show historically correct student list.
 */
const getStudentsForClassInYear = async (schoolId, classId, academicYearId) => {
  // If academic year records exist, use them
  const { data: records } = await supabase
    .from('student_academic_records')
    .select(`
      student_id,
      students (
        id, admission_number,
        users ( first_name, last_name )
      )
    `)
    .eq('school_id', schoolId)
    .eq('academic_year_id', academicYearId)
    .eq('class_id', classId)
    .eq('status', 'active')

  if (records && records.length > 0) {
    return (records || []).map((r) => r.students)
  }

  // Fallback: use current students.class_id (for schools not yet using academic year tracking)
  const { data: students, error } = await supabase
    .from('students')
    .select('id, admission_number, users ( first_name, last_name )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('admission_number')

  if (error) throw new Error(error.message)
  return students || []
}

module.exports = {
  getAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getClassLevels,
  saveClassLevels,
  getStudentRecordsForYear,
  enrolStudentsForYear,
  promoteStudents,
  getStudentsForClassInYear,
}
