const { supabase } = require('../config/supabase')

// ─────────────────────────────────────────────────────────────────────────────
// EXAMS
// ─────────────────────────────────────────────────────────────────────────────

const getExams = async ({ schoolId, classId, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('exams')
    .select(`
      id, name, exam_date, created_at,
      classes ( id, name, section )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: false })
    .range(from, to)

  if (classId) query = query.eq('class_id', classId)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    exams: data || [],
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

const getExamById = async (schoolId, examId) => {
  const { data, error } = await supabase
    .from('exams')
    .select(`*, classes ( id, name, section )`)
    .eq('id', examId)
    .eq('school_id', schoolId)
    .single()

  if (error || !data) {
    const err = new Error('Exam not found')
    err.status = 404
    throw err
  }
  return data
}

const createExam = async (schoolId, { name, classId, examDate }) => {
  const { data, error } = await supabase
    .from('exams')
    .insert({
      school_id: schoolId,
      name,
      class_id:  classId  || null,
      exam_date: examDate || null,
    })
    .select(`*, classes ( id, name, section )`)
    .single()

  if (error) throw new Error(error.message)
  return data
}

const updateExam = async (schoolId, examId, { name, classId, examDate }) => {
  const updates = {}
  if (name     !== undefined) updates.name      = name
  if (classId  !== undefined) updates.class_id  = classId  || null
  if (examDate !== undefined) updates.exam_date = examDate || null

  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', examId)
    .eq('school_id', schoolId)
    .select(`*, classes ( id, name, section )`)
    .single()

  if (error) throw new Error(error.message)
  return data
}

const deleteExam = async (schoolId, examId) => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return { id: examId }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all results for an exam, grouped by student.
 */
const getExamResults = async ({ schoolId, examId }) => {
  const { data, error } = await supabase
    .from('results')
    .select(`
      id, score, grade, remarks,
      students (
        id, admission_number,
        users ( first_name, last_name )
      ),
      subjects ( id, name, code )
    `)
    .eq('school_id', schoolId)
    .eq('exam_id', examId)
    .order('created_at')

  if (error) throw new Error(error.message)

  // Group by student
  const byStudent = {}
  ;(data || []).forEach((r) => {
    const sid = r.students?.id
    if (!byStudent[sid]) {
      byStudent[sid] = {
        student_id:       sid,
        admission_number: r.students?.admission_number,
        first_name:       r.students?.users?.first_name,
        last_name:        r.students?.users?.last_name,
        subjects:         [],
        total:            0,
        average:          0,
      }
    }
    byStudent[sid].subjects.push({
      result_id:   r.id,
      subject_id:  r.subjects?.id,
      subject_name: r.subjects?.name,
      subject_code: r.subjects?.code,
      score:        r.score,
      grade:        r.grade,
      remarks:      r.remarks,
    })
  })

  // Compute totals and averages
  Object.values(byStudent).forEach((s) => {
    const scores = s.subjects.map((sub) => parseFloat(sub.score || 0))
    s.total   = scores.reduce((a, b) => a + b, 0)
    s.average = scores.length > 0 ? Math.round((s.total / scores.length) * 100) / 100 : 0
  })

  return Object.values(byStudent)
}

/**
 * Get result sheet for an exam — all students in the class with
 * their existing scores pre-filled (for the entry form).
 */
const getResultSheet = async ({ schoolId, examId }) => {
  // Get exam + class info
  const { data: exam, error: examErr } = await supabase
    .from('exams')
    .select('id, name, class_id, classes ( id, name )')
    .eq('id', examId)
    .eq('school_id', schoolId)
    .single()

  if (examErr || !exam) {
    const err = new Error('Exam not found')
    err.status = 404
    throw err
  }

  // Get subjects for the class
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects ( id, name, code )')
    .eq('school_id', schoolId)
    .eq('class_id', exam.class_id)

  const subjects = (classSubjects || []).map((cs) => cs.subjects)

  // Get students in the class
  const { data: students } = await supabase
    .from('students')
    .select('id, admission_number, users ( first_name, last_name )')
    .eq('school_id', schoolId)
    .eq('class_id', exam.class_id)
    .order('admission_number')

  // Get existing results for this exam
  const { data: existing } = await supabase
    .from('results')
    .select('student_id, subject_id, score, grade, remarks, id')
    .eq('school_id', schoolId)
    .eq('exam_id', examId)

  // Build lookup: "studentId_subjectId" → result
  const resultMap = {}
  ;(existing || []).forEach((r) => {
    resultMap[`${r.student_id}_${r.subject_id}`] = r
  })

  // Build sheet
  const sheet = (students || []).map((s) => ({
    student_id:       s.id,
    admission_number: s.admission_number,
    first_name:       s.users?.first_name,
    last_name:        s.users?.last_name,
    scores: subjects.map((sub) => {
      const key    = `${s.id}_${sub.id}`
      const result = resultMap[key]
      return {
        subject_id:   sub.id,
        subject_name: sub.name,
        subject_code: sub.code,
        result_id:    result?.id    || null,
        score:        result?.score ?? '',
        grade:        result?.grade || '',
        remarks:      result?.remarks || '',
      }
    }),
  }))

  return { exam, subjects, sheet }
}

/**
 * Bulk save results for an exam.
 * Uses fetch-then-insert/update to avoid relying on a DB unique constraint.
 * entries: [{ student_id, subject_id, score, grade?, remarks? }]
 */
const saveResults = async ({ schoolId, examId, entries }) => {
  if (!entries || entries.length === 0) {
    const err = new Error('No result entries provided')
    err.status = 400
    throw err
  }

  // 1. Fetch existing results for this exam
  const { data: existing, error: fetchErr } = await supabase
    .from('results')
    .select('id, student_id, subject_id')
    .eq('school_id', schoolId)
    .eq('exam_id', examId)

  if (fetchErr) throw new Error(fetchErr.message)

  // Build lookup: "studentId_subjectId" → existing record id
  const existingMap = {}
  ;(existing || []).forEach((r) => {
    existingMap[`${r.student_id}_${r.subject_id}`] = r.id
  })

  const toInsert = []
  const toUpdate = []

  entries.forEach((e) => {
    const score = parseFloat(e.score)
    const row = {
      school_id:  schoolId,
      exam_id:    examId,
      student_id: e.student_id,
      subject_id: e.subject_id,
      score,
      grade:   e.grade   || computeGrade(score),
      remarks: e.remarks || null,
    }
    const key = `${e.student_id}_${e.subject_id}`
    if (existingMap[key]) {
      toUpdate.push({ id: existingMap[key], score: row.score, grade: row.grade, remarks: row.remarks })
    } else {
      toInsert.push(row)
    }
  })

  const results = []

  // 2. Insert new results
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('results')
      .insert(toInsert)
      .select('id, student_id, subject_id, score, grade')
    if (error) throw new Error(error.message)
    results.push(...(data || []))
  }

  // 3. Update existing results
  for (const rec of toUpdate) {
    const { data, error } = await supabase
      .from('results')
      .update({ score: rec.score, grade: rec.grade, remarks: rec.remarks })
      .eq('id', rec.id)
      .select('id, student_id, subject_id, score, grade')
      .single()
    if (error) throw new Error(error.message)
    if (data) results.push(data)
  }

  return results
}

/**
 * Get a student's results across all exams.
 */
const getStudentResults = async ({ schoolId, studentId }) => {
  const { data, error } = await supabase
    .from('results')
    .select(`
      id, score, grade, remarks,
      exams    ( id, name, exam_date ),
      subjects ( id, name, code )
    `)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Compute letter grade from numeric score.
 */
const computeGrade = (score) => {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getClassesForSchool = async (schoolId) => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, section')
    .eq('school_id', schoolId)
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

const getSubjectsForClass = async (schoolId, classId) => {
  const { data, error } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects ( id, name, code )')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
  if (error) throw new Error(error.message)
  return (data || []).map((cs) => cs.subjects)
}

module.exports = {
  getExams, getExamById, createExam, updateExam, deleteExam,
  getExamResults, getResultSheet, saveResults, getStudentResults,
  getClassesForSchool, getSubjectsForClass, computeGrade,
}
