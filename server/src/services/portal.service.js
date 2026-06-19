const { supabase } = require('../config/supabase')

/**
 * Resolve the logged-in user to their full profile (student or teacher record).
 */
const getPortalProfile = async (user) => {
  if (user.role === 'student') {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id, admission_number, gender, date_of_birth,
        guardian_name, guardian_phone, address,
        classes ( id, name, section ),
        users ( first_name, last_name, email, phone )
      `)
      .eq('user_id', user.id)
      .eq('school_id', user.school_id)
      .single()

    if (error || !data) {
      const err = new Error('Student profile not found')
      err.status = 404
      throw err
    }
    return { role: 'student', ...data }
  }

  if (user.role === 'teacher') {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id, employee_id, qualification, specialization,
        users ( first_name, last_name, email, phone )
      `)
      .eq('user_id', user.id)
      .eq('school_id', user.school_id)
      .single()

    if (error || !data) {
      const err = new Error('Teacher profile not found')
      err.status = 404
      throw err
    }
    return { role: 'teacher', ...data }
  }

  if (user.role === 'parent') {
    return {
      role: 'parent',
      user_id: user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
    }
  }

  return { role: user.role, user_id: user.id }
}

/**
 * Normalise phone for guardian matching.
 */
const normalisePhone = (value) =>
  (value || '').replace(/\D/g, '').slice(-10)

/**
 * Find students linked to a parent (same school, guardian phone or name match).
 */
const getLinkedStudents = async (user) => {
  const parentPhone = normalisePhone(user.phone)
  const parentName  = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase()

  const { data, error } = await supabase
    .from('students')
    .select(`
      id, admission_number, guardian_name, guardian_phone,
      users ( first_name, last_name ),
      classes ( id, name, section )
    `)
    .eq('school_id', user.school_id)

  if (error) throw new Error(error.message)

  const children = (data || []).filter((s) => {
    const gPhone = normalisePhone(s.guardian_phone)
    const gName  = (s.guardian_name || '').trim().toLowerCase()
    if (parentPhone && gPhone && parentPhone === gPhone) return true
    if (parentName && gName && (gName === parentName || gName.includes(parentName))) return true
    return false
  })

  return { children }
}

/**
 * Parent: attendance for a linked child.
 */
const getChildAttendance = async (user, studentId, { startDate, endDate } = {}) => {
  const { children } = await getLinkedStudents(user)
  if (!children.some((c) => c.id === studentId)) {
    const err = new Error('Student not linked to this parent account')
    err.status = 403
    throw err
  }

  let query = supabase
    .from('attendance')
    .select(`
      id, attendance_date, status, remarks,
      classes ( name, section )
    `)
    .eq('school_id', user.school_id)
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })

  if (startDate) query = query.gte('attendance_date', startDate)
  if (endDate)   query = query.lte('attendance_date', endDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const records = data || []
  const total   = records.length
  const present = records.filter((r) => r.status === 'present').length
  const absent  = records.filter((r) => r.status === 'absent').length
  const late    = records.filter((r) => r.status === 'late').length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

  return { records, summary: { total, present, absent, late, rate } }
}

/**
 * Parent: exam results for a linked child.
 */
const getChildResults = async (user, studentId) => {
  const { children } = await getLinkedStudents(user)
  const child = children.find((c) => c.id === studentId)
  if (!child) {
    const err = new Error('Student not linked to this parent account')
    err.status = 403
    throw err
  }

  const { data, error } = await supabase
    .from('results')
    .select(`
      id, score, grade, remarks,
      exams    ( id, name, exam_date ),
      subjects ( id, name, code )
    `)
    .eq('school_id', user.school_id)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const byExam = {}
  ;(data || []).forEach((r) => {
    const eid = r.exams?.id
    if (!byExam[eid]) {
      byExam[eid] = {
        exam_id:   eid,
        exam_name: r.exams?.name,
        exam_date: r.exams?.exam_date,
        subjects:  [],
        total:     0,
        average:   0,
      }
    }
    byExam[eid].subjects.push({
      subject_name: r.subjects?.name,
      subject_code: r.subjects?.code,
      score:        r.score,
      grade:        r.grade,
    })
  })

  Object.values(byExam).forEach((e) => {
    const scores = e.subjects.map((s) => parseFloat(s.score || 0))
    e.total   = scores.reduce((a, b) => a + b, 0)
    e.average = scores.length > 0 ? Math.round((e.total / scores.length) * 10) / 10 : 0
  })

  return {
    student: child,
    exams: Object.values(byExam).sort((a, b) =>
      new Date(b.exam_date || 0) - new Date(a.exam_date || 0)
    ),
  }
}

/**
 * Get the student's own attendance records.
 */
const getMyAttendance = async (user, { startDate, endDate } = {}) => {
  // Resolve student profile ID from user ID
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', user.school_id)
    .single()

  if (!student) {
    return { records: [], summary: { total: 0, present: 0, absent: 0, late: 0, rate: 0 } }
  }

  let query = supabase
    .from('attendance')
    .select(`
      id, attendance_date, status, remarks,
      classes ( name, section )
    `)
    .eq('school_id', user.school_id)
    .eq('student_id', student.id)
    .order('attendance_date', { ascending: false })

  if (startDate) query = query.gte('attendance_date', startDate)
  if (endDate)   query = query.lte('attendance_date', endDate)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const records = data || []
  const total   = records.length
  const present = records.filter((r) => r.status === 'present').length
  const absent  = records.filter((r) => r.status === 'absent').length
  const late    = records.filter((r) => r.status === 'late').length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

  return { records, summary: { total, present, absent, late, rate } }
}

/**
 * Get the student's own results — computed as weighted terminal scores.
 * Groups by term → subject → shows one terminal score per subject (not raw assessment scores).
 */
const getMyResults = async (user) => {
  const { data: student } = await supabase
    .from('students')
    .select('id, admission_number, classes ( id, name )')
    .eq('user_id', user.id)
    .eq('school_id', user.school_id)
    .single()

  if (!student) return { student: null, terms: [] }

  // Fetch all result rows for this student (assessment-based, term_assessment_id set)
  const { data: rawResults, error: rErr } = await supabase
    .from('results')
    .select(`
      id, score, grade, remarks,
      subject_id,
      subjects ( id, name, code ),
      term_assessment_id,
      term_assessments (
        id, name, weight, max_score,
        term_id,
        terms ( id, name, term_number, results_published, academic_year_id,
          academic_years ( id, name )
        )
      )
    `)
    .eq('school_id', user.school_id)
    .eq('student_id', student.id)
    .not('term_assessment_id', 'is', null)
    .order('created_at', { ascending: false })

  if (rErr) throw new Error(rErr.message)

  // Only show results where the term has results_published = true
  const publishedTermIds = new Set()
  ;(rawResults || []).forEach((r) => {
    if (r.term_assessments?.terms?.results_published) {
      publishedTermIds.add(r.term_assessments.terms.id)
    }
  })
  const visibleResults = (rawResults || []).filter((r) =>
    publishedTermIds.has(r.term_assessments?.terms?.id)
  )

  // Build lookup: termId → subjectId → assessmentId → { score, weight, maxScore }
  const termMap = {}   // termId → { termInfo, subjectId → { subjectInfo, assessments: [] } }

  ;(visibleResults).forEach((r) => {
    const ta   = r.term_assessments
    const term = ta?.terms
    if (!ta || !term) return

    const termId    = term.id
    const subjectId = r.subject_id

    if (!termMap[termId]) {
      termMap[termId] = {
        term_id:            termId,
        term_name:          term.name,
        term_number:        term.term_number,
        academic_year_id:   term.academic_year_id,
        academic_year_name: term.academic_years?.name || null,
        subjects:           {},
      }
    }

    if (!termMap[termId].subjects[subjectId]) {
      termMap[termId].subjects[subjectId] = {
        subject_id:   r.subjects?.id,
        subject_name: r.subjects?.name,
        subject_code: r.subjects?.code,
        components:   [],   // raw assessment scores
      }
    }

    termMap[termId].subjects[subjectId].components.push({
      assessment_name: ta.name,
      weight:          parseFloat(ta.weight),
      max_score:       parseFloat(ta.max_score),
      raw_score:       parseFloat(r.score),
    })
  })

  // Compute weighted terminal score per subject per term
  const terms = Object.values(termMap).map((term) => {
    const subjects = Object.values(term.subjects).map((sub) => {
      // terminal = Σ (raw / max × weight)
      const terminal = sub.components.reduce((sum, c) => {
        return sum + (c.raw_score / c.max_score) * c.weight
      }, 0)
      const rounded = Math.round(terminal * 10) / 10

      return {
        subject_id:      sub.subject_id,
        subject_name:    sub.subject_name,
        subject_code:    sub.subject_code,
        terminal_score:  rounded,
        grade:           computeTerminalGrade(rounded),
        components:      sub.components,  // kept for detail view
      }
    })

    const entered  = subjects.filter((s) => s.terminal_score > 0)
    const average  = entered.length > 0
      ? Math.round((entered.reduce((s, sub) => s + sub.terminal_score, 0) / entered.length) * 10) / 10
      : 0

    return {
      term_id:            term.term_id,
      term_name:          term.term_name,
      term_number:        term.term_number,
      academic_year_name: term.academic_year_name,
      subjects,
      average,
      overall_grade:      computeTerminalGrade(average),
    }
  })

  // Sort by term_number within each academic year, newest year first
  terms.sort((a, b) => {
    if (a.academic_year_name !== b.academic_year_name) {
      return (b.academic_year_name || '').localeCompare(a.academic_year_name || '')
    }
    return (a.term_number || 0) - (b.term_number || 0)
  })

  return {
    student: { ...student, class_name: student.classes?.name },
    terms,
  }
}

/** Grade from weighted terminal percentage */
const computeTerminalGrade = (score) => {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

/**
 * Get the student's class subjects (acts as a simple timetable).
 */
const getMyTimetable = async (user) => {
  const { data: student } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('user_id', user.id)
    .eq('school_id', user.school_id)
    .single()

  if (!student?.class_id) return { subjects: [] }

  const { data, error } = await supabase
    .from('class_subjects')
    .select(`
      subjects ( id, name, code ),
      teachers (
        users ( first_name, last_name )
      )
    `)
    .eq('school_id', user.school_id)
    .eq('class_id', student.class_id)

  if (error) throw new Error(error.message)

  return {
    subjects: (data || []).map((cs) => ({
      id:           cs.subjects?.id,
      name:         cs.subjects?.name,
      code:         cs.subjects?.code,
      teacher_name: cs.teachers?.users
        ? `${cs.teachers.users.first_name} ${cs.teachers.users.last_name}`
        : null,
    })),
  }
}

/**
 * Get classes assigned to a teacher via class_subjects.
 */
const getMyClasses = async (user) => {
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', user.school_id)
    .single()

  if (!teacher) return { classes: [] }

  const { data, error } = await supabase
    .from('class_subjects')
    .select(`
      classes ( id, name, section ),
      subjects ( id, name, code )
    `)
    .eq('school_id', user.school_id)
    .eq('teacher_id', teacher.id)

  if (error) throw new Error(error.message)

  // Group by class
  const byClass = {}
  ;(data || []).forEach((cs) => {
    const cid = cs.classes?.id
    if (!byClass[cid]) {
      byClass[cid] = {
        class_id:   cid,
        class_name: cs.classes?.name,
        section:    cs.classes?.section,
        subjects:   [],
      }
    }
    if (cs.subjects) byClass[cid].subjects.push(cs.subjects)
  })

  return { classes: Object.values(byClass) }
}

/**
 * Get all students in the teacher's assigned classes.
 */
const getMyStudents = async (user) => {
  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', user.school_id)
    .single()

  if (!teacher) return { students: [] }

  // Get class IDs assigned to this teacher
  const { data: assignments } = await supabase
    .from('class_subjects')
    .select('class_id')
    .eq('school_id', user.school_id)
    .eq('teacher_id', teacher.id)

  const classIds = [...new Set((assignments || []).map((a) => a.class_id))]
  if (classIds.length === 0) return { students: [] }

  const { data, error } = await supabase
    .from('students')
    .select(`
      id, admission_number, gender,
      users ( first_name, last_name, email ),
      classes ( id, name, section )
    `)
    .eq('school_id', user.school_id)
    .in('class_id', classIds)
    .order('admission_number')

  if (error) throw new Error(error.message)
  return { students: data || [] }
}

const { getModules } = require('./schoolAdmin.service')

module.exports = {
  getPortalProfile,
  getMyAttendance,
  getMyResults,
  getMyTimetable,
  getMyClasses,
  getMyStudents,
  getLinkedStudents,
  getChildAttendance,
  getChildResults,
  getSchoolModules: async (user) => {
    if (!user.school_id) return []
    return getModules(user.school_id)
  },
}
