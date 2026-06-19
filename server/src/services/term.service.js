const { supabase } = require('../config/supabase')

// ─────────────────────────────────────────────────────────────────────────────
// TERMS
// ─────────────────────────────────────────────────────────────────────────────

const getTerms = async (schoolId) => {
  const { data, error } = await supabase
    .from('terms')
    .select(`
      id, name, academic_year, academic_year_id, term_number, is_active, results_published, created_at,
      academic_years ( id, name ),
      term_assessments ( id, name, weight, max_score, sort_order )
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map((t) => ({
    ...t,
    academic_year_label: t.academic_years?.name || t.academic_year || null,
    assessments: (t.term_assessments || []).sort((a, b) => a.sort_order - b.sort_order),
    total_weight: (t.term_assessments || []).reduce((s, a) => s + parseFloat(a.weight), 0),
  }))
}

const getTermById = async (schoolId, termId) => {
  const { data, error } = await supabase
    .from('terms')
    .select(`
      id, name, academic_year, academic_year_id, term_number, is_active, results_published, created_at,
      academic_years ( id, name ),
      term_assessments ( id, name, weight, max_score, sort_order )
    `)
    .eq('id', termId)
    .eq('school_id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('Term not found'); err.status = 404; throw err
  }
  return {
    ...data,
    academic_year_label: data.academic_years?.name || data.academic_year || null,
    assessments: (data.term_assessments || []).sort((a, b) => a.sort_order - b.sort_order),
  }
}

/**
 * Toggle results_published for a term.
 */
const publishTerm = async (schoolId, termId, publish) => {
  const { data, error } = await supabase
    .from('terms')
    .update({ results_published: publish })
    .eq('id', termId)
    .eq('school_id', schoolId)
    .select('id, name, results_published')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const createTerm = async (schoolId, { name, academicYear, assessments }) => {
  if (!name?.trim()) {
    const err = new Error('Term name is required'); err.status = 400; throw err
  }
  if (!assessments || assessments.length === 0) {
    const err = new Error('At least one assessment component is required'); err.status = 400; throw err
  }

  // Validate weights sum to 100
  const totalWeight = assessments.reduce((s, a) => s + parseFloat(a.weight || 0), 0)
  if (Math.abs(totalWeight - 100) > 0.01) {
    const err = new Error(`Assessment weights must sum to 100%. Current sum: ${totalWeight}%`)
    err.status = 400; throw err
  }

  // Create term
  const { data: term, error: termErr } = await supabase
    .from('terms')
    .insert({ school_id: schoolId, name, academic_year: academicYear || null })
    .select('id, name, academic_year, is_active, created_at')
    .single()

  if (termErr) throw new Error(termErr.message)

  // Create assessments
  const rows = assessments.map((a, i) => ({
    school_id:  schoolId,
    term_id:    term.id,
    name:       a.name,
    weight:     parseFloat(a.weight),
    max_score:  parseFloat(a.maxScore || 100),
    sort_order: i,
  }))

  const { data: created, error: aErr } = await supabase
    .from('term_assessments')
    .insert(rows)
    .select('id, name, weight, max_score, sort_order')

  if (aErr) {
    await supabase.from('terms').delete().eq('id', term.id)
    throw new Error(aErr.message)
  }

  return {
    ...term,
    assessments: (created || []).sort((a, b) => a.sort_order - b.sort_order),
    total_weight: 100,
  }
}

const updateTerm = async (schoolId, termId, { name, academicYear, isActive, resultsPublished }) => {
  const updates = {}
  if (name             !== undefined) updates.name              = name
  if (academicYear     !== undefined) updates.academic_year     = academicYear
  if (isActive         !== undefined) updates.is_active         = isActive
  if (resultsPublished !== undefined) updates.results_published = resultsPublished

  const { data, error } = await supabase
    .from('terms')
    .update(updates)
    .eq('id', termId)
    .eq('school_id', schoolId)
    .select('id, name, academic_year, is_active, results_published')
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteTerm = async (schoolId, termId) => {
  const { error } = await supabase
    .from('terms')
    .delete()
    .eq('id', termId)
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return { id: termId }
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT RESULT ENTRY (teacher flow)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the result entry sheet for a specific assessment + class + subject.
 * Returns all students in the class with existing scores pre-filled.
 * If caller is a teacher, verifies they are assigned to this subject in this class.
 */
const getAssessmentSheet = async ({ schoolId, assessmentId, classId, subjectId, userId, userRole }) => {
  // Enforce teacher-subject restriction
  if (userRole === 'teacher') {
    const { supabase: sb } = require('../config/supabase')
    const { data: teacher } = await sb
      .from('teachers').select('id').eq('user_id', userId).eq('school_id', schoolId).single()

    if (!teacher) {
      const err = new Error('Teacher profile not found'); err.status = 403; throw err
    }

    const { data: assignment } = await sb
      .from('class_subjects')
      .select('id')
      .eq('school_id', schoolId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('teacher_id', teacher.id)
      .single()

    if (!assignment) {
      const err = new Error('You are not assigned to this subject in this class')
      err.status = 403; throw err
    }
  }
  // Verify assessment belongs to school
  const { data: assessment, error: aErr } = await supabase
    .from('term_assessments')
    .select('id, name, weight, max_score, term_id, terms ( id, name, academic_year )')
    .eq('id', assessmentId)
    .eq('school_id', schoolId)
    .single()

  if (aErr || !assessment) {
    const err = new Error('Assessment not found'); err.status = 404; throw err
  }

  // Verify subject is assigned to this class
  const { data: classSubject } = await supabase
    .from('class_subjects')
    .select('id, subjects ( id, name, code )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('subject_id', subjectId)
    .single()

  // Get all students in the class
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, admission_number, users ( first_name, last_name )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('admission_number')

  if (sErr) throw new Error(sErr.message)

  // Get existing scores for this assessment + subject + class
  const studentIds = (students || []).map((s) => s.id)
  let existingMap = {}

  if (studentIds.length > 0) {
    const { data: existing } = await supabase
      .from('results')
      .select('id, student_id, score, grade, remarks')
      .eq('school_id', schoolId)
      .eq('term_assessment_id', assessmentId)
      .eq('subject_id', subjectId)
      .in('student_id', studentIds)

    ;(existing || []).forEach((r) => { existingMap[r.student_id] = r })
  }

  const sheet = (students || []).map((s) => ({
    student_id:       s.id,
    admission_number: s.admission_number,
    first_name:       s.users?.first_name,
    last_name:        s.users?.last_name,
    result_id:        existingMap[s.id]?.id     || null,
    score:            existingMap[s.id]?.score  ?? '',
    grade:            existingMap[s.id]?.grade  || '',
    remarks:          existingMap[s.id]?.remarks || '',
  }))

  return {
    assessment: {
      id:        assessment.id,
      name:      assessment.name,
      weight:    assessment.weight,
      max_score: assessment.max_score,
      term:      assessment.terms,
    },
    subject:  classSubject?.subjects || { id: subjectId },
    class_id: classId,
    sheet,
  }
}

/**
 * Save scores for one assessment + subject + class (teacher entry).
 * Enforces teacher-subject restriction for teacher role.
 */
const saveAssessmentScores = async ({ schoolId, assessmentId, subjectId, entries, userId, userRole }) => {
  if (!entries || entries.length === 0) {
    const err = new Error('No entries provided'); err.status = 400; throw err
  }

  // Enforce teacher restriction
  if (userRole === 'teacher') {
    const { supabase: sb } = require('../config/supabase')
    const { data: teacher } = await sb
      .from('teachers').select('id').eq('user_id', userId).eq('school_id', schoolId).single()

    if (!teacher) {
      const err = new Error('Teacher profile not found'); err.status = 403; throw err
    }

    // Find any class_subjects row for this assessment's class + subject assigned to this teacher
    // We need the class_id from the students' class
    const firstStudentId = entries[0]?.student_id
    if (firstStudentId) {
      const { supabase: sb2 } = require('../config/supabase')
      const { data: student } = await sb2
        .from('students').select('class_id').eq('id', firstStudentId).single()

      if (student?.class_id) {
        const { data: assignment } = await sb2
          .from('class_subjects')
          .select('id')
          .eq('school_id', schoolId)
          .eq('class_id', student.class_id)
          .eq('subject_id', subjectId)
          .eq('teacher_id', teacher.id)
          .single()

        if (!assignment) {
          const err = new Error('You are not assigned to this subject in this class')
          err.status = 403; throw err
        }
      }
    }
  }

  // Verify assessment exists
  const { data: assessment } = await supabase
    .from('term_assessments')
    .select('id, weight, max_score, term_id')
    .eq('id', assessmentId)
    .eq('school_id', schoolId)
    .single()

  if (!assessment) {
    const err = new Error('Assessment not found'); err.status = 404; throw err
  }

  // Fetch existing records for this assessment + subject
  const studentIds = entries.map((e) => e.student_id)
  const { data: existing } = await supabase
    .from('results')
    .select('id, student_id')
    .eq('school_id', schoolId)
    .eq('term_assessment_id', assessmentId)
    .eq('subject_id', subjectId)
    .in('student_id', studentIds)

  const existingMap = {}
  ;(existing || []).forEach((r) => { existingMap[r.student_id] = r.id })

  const toInsert = []
  const toUpdate = []

  entries.forEach((e) => {
    const score = parseFloat(e.score)
    if (isNaN(score)) return
    const grade = computeGrade(score, assessment.max_score)
    const row = {
      school_id:           schoolId,
      term_assessment_id:  assessmentId,
      subject_id:          subjectId,
      student_id:          e.student_id,
      score,
      grade,
      remarks: e.remarks || null,
    }
    if (existingMap[e.student_id]) {
      toUpdate.push({ id: existingMap[e.student_id], score, grade, remarks: row.remarks })
    } else {
      toInsert.push(row)
    }
  })

  const results = []

  if (toInsert.length > 0) {
    const { data, error } = await supabase.from('results').insert(toInsert).select('id, student_id, score, grade')
    if (error) throw new Error(error.message)
    results.push(...(data || []))
  }

  for (const rec of toUpdate) {
    const { data, error } = await supabase
      .from('results')
      .update({ score: rec.score, grade: rec.grade, remarks: rec.remarks })
      .eq('id', rec.id)
      .select('id, student_id, score, grade')
      .single()
    if (error) throw new Error(error.message)
    if (data) results.push(data)
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMINAL REPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the terminal report for a class in a term.
 * For each student × subject:
 *   terminal_score = Σ (assessment_score / max_score × weight)
 */
const getTerminalReport = async ({ schoolId, termId, classId }) => {
  // Get all assessments for the term
  const { data: assessments, error: aErr } = await supabase
    .from('term_assessments')
    .select('id, name, weight, max_score, sort_order')
    .eq('term_id', termId)
    .eq('school_id', schoolId)
    .order('sort_order')

  if (aErr) throw new Error(aErr.message)
  if (!assessments?.length) return { students: [], assessments: [], subjects: [] }

  // Get all students in class
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, admission_number, users ( first_name, last_name )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('admission_number')

  if (sErr) throw new Error(sErr.message)

  // Get all subjects for this class
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects ( id, name, code )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)

  const subjects = (classSubjects || []).map((cs) => cs.subjects)
  const assessmentIds = assessments.map((a) => a.id)
  const studentIds    = (students || []).map((s) => s.id)

  if (studentIds.length === 0 || subjects.length === 0) {
    return { students: [], assessments, subjects }
  }

  // Fetch all results for this term + class
  const { data: results, error: rErr } = await supabase
    .from('results')
    .select('student_id, subject_id, score, term_assessment_id')
    .eq('school_id', schoolId)
    .in('term_assessment_id', assessmentIds)
    .in('student_id', studentIds)

  if (rErr) throw new Error(rErr.message)

  // Build lookup: student_id → subject_id → assessment_id → score
  const lookup = {}
  ;(results || []).forEach((r) => {
    if (!lookup[r.student_id]) lookup[r.student_id] = {}
    if (!lookup[r.student_id][r.subject_id]) lookup[r.student_id][r.subject_id] = {}
    lookup[r.student_id][r.subject_id][r.term_assessment_id] = parseFloat(r.score || 0)
  })

  // Compute terminal score per student per subject
  const report = (students || []).map((student) => {
    const subjectScores = subjects.map((sub) => {
      const scores = {}
      let terminalScore = 0
      let allEntered = true

      assessments.forEach((a) => {
        const raw = lookup[student.id]?.[sub.id]?.[a.id]
        scores[a.id] = raw !== undefined ? raw : null
        if (raw === undefined) { allEntered = false }
        if (raw !== undefined) {
          terminalScore += (raw / parseFloat(a.max_score)) * parseFloat(a.weight)
        }
      })

      const terminal = Math.round(terminalScore * 100) / 100
      return {
        subject_id:     sub.id,
        subject_name:   sub.name,
        subject_code:   sub.code,
        scores,            // { [assessmentId]: raw_score }
        terminal_score: terminal,
        grade:          computeGrade(terminal, 100),
        all_entered:    allEntered,
      }
    })

    const enteredSubjects = subjectScores.filter((s) => s.all_entered)
    const totalTerminal   = enteredSubjects.reduce((s, sub) => s + sub.terminal_score, 0)
    const average         = enteredSubjects.length > 0
      ? Math.round((totalTerminal / enteredSubjects.length) * 100) / 100
      : 0

    return {
      student_id:       student.id,
      admission_number: student.admission_number,
      first_name:       student.users?.first_name,
      last_name:        student.users?.last_name,
      subjects:         subjectScores,
      total_terminal:   Math.round(totalTerminal * 100) / 100,
      average,
      overall_grade:    computeGrade(average, 100),
    }
  })

  // Sort by average descending (class ranking)
  report.sort((a, b) => b.average - a.average)
  report.forEach((s, i) => { s.rank = i + 1 })

  return { students: report, assessments, subjects }
}

// ─────────────────────────────────────────────────────────────────────────────
// XLSX TEMPLATE GENERATION (server-side CSV for download)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate CSV content for score entry template.
 * Returns a CSV string the client can download as .csv / open in Excel.
 */
const generateScoreTemplate = async ({ schoolId, assessmentId, classId, subjectId }) => {
  const sheet = await getAssessmentSheet({ schoolId, assessmentId, classId, subjectId })

  const header = [
    'Admission Number',
    'First Name',
    'Last Name',
    `Score (max ${sheet.assessment.max_score})`,
    'Remarks (optional)',
  ]

  const rows = sheet.sheet.map((s) => [
    s.admission_number || '',
    s.first_name || '',
    s.last_name  || '',
    s.score !== '' ? s.score : '',
    s.remarks || '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return {
    csv,
    filename: `scores_${sheet.assessment.name}_${sheet.subject?.name || subjectId}.csv`,
    assessment: sheet.assessment,
    subject:    sheet.subject,
  }
}

/**
 * Parse uploaded CSV and return entries array.
 * Expected columns: admission_number, score, remarks (optional)
 */
const parseScoreCSV = async ({ schoolId, classId, csvText }) => {
  const lines = csvText.trim().split('\n').filter(Boolean)
  if (lines.length < 2) {
    const err = new Error('CSV must have a header row and at least one data row')
    err.status = 400; throw err
  }

  // Get students in class indexed by admission_number
  const { data: students } = await supabase
    .from('students')
    .select('id, admission_number')
    .eq('school_id', schoolId)
    .eq('class_id', classId)

  const admMap = {}
  ;(students || []).forEach((s) => {
    if (s.admission_number) admMap[s.admission_number.trim()] = s.id
  })

  // Skip header row, parse data rows
  const entries = []
  const errors  = []

  lines.slice(1).forEach((line, i) => {
    // Handle quoted CSV
    const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g)?.map((c) =>
      c.startsWith('"') ? c.slice(1, -1).replace(/""/g, '"') : c.trim()
    ) || []

    const admNo   = cols[0]?.trim()
    const score   = cols[3]?.trim()  // column index 3 = Score
    const remarks = cols[4]?.trim()  // column index 4 = Remarks

    if (!admNo) { errors.push(`Row ${i + 2}: Missing admission number`); return }
    if (!admMap[admNo]) { errors.push(`Row ${i + 2}: Admission number "${admNo}" not found in this class`); return }

    const parsedScore = parseFloat(score)
    if (score && isNaN(parsedScore)) { errors.push(`Row ${i + 2}: Invalid score "${score}" for ${admNo}`); return }

    if (score && !isNaN(parsedScore)) {
      entries.push({ student_id: admMap[admNo], score: parsedScore, remarks: remarks || null })
    }
  })

  return { entries, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute letter grade. Score is relative to max (converted to 100 scale internally).
 */
const computeGrade = (score, max = 100) => {
  const pct = (score / max) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  return 'F'
}

module.exports = {
  getTerms, getTermById, createTerm, updateTerm, deleteTerm, publishTerm,
  getAssessmentSheet, saveAssessmentScores,
  getTerminalReport,
  generateScoreTemplate, parseScoreCSV,
  computeGrade,
}
