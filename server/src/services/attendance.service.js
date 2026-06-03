const { supabase } = require('../config/supabase')

/**
 * Get attendance records for a school, optionally filtered by date / class.
 */
const getAttendance = async ({ schoolId, date, classId, page = 1, limit = 50 }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('attendance')
    .select(`
      id, attendance_date, status, remarks, created_at,
      students (
        id, admission_number,
        users ( first_name, last_name )
      ),
      classes ( id, name, section )
    `, { count: 'exact' })
    .eq('school_id', schoolId)
    .order('attendance_date', { ascending: false })
    .order('created_at',      { ascending: false })
    .range(from, to)

  if (date)    query = query.eq('attendance_date', date)
  if (classId) query = query.eq('class_id', classId)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    records: data || [],
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Get all students for a class on a given date, pre-populated with
 * their existing attendance record (if any) so the mark-attendance
 * form can show current status.
 */
const getClassAttendanceSheet = async ({ schoolId, classId, date }) => {
  // Fetch all students in the class
  const { data: students, error: studErr } = await supabase
    .from('students')
    .select(`
      id, admission_number,
      users ( first_name, last_name )
    `)
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('admission_number')

  if (studErr) throw new Error(studErr.message)

  // Fetch existing attendance records for this class + date
  const { data: existing, error: attErr } = await supabase
    .from('attendance')
    .select('student_id, status, remarks, id')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('attendance_date', date)

  if (attErr) throw new Error(attErr.message)

  // Map existing records by student_id for O(1) lookup
  const existingMap = {}
  ;(existing || []).forEach((r) => { existingMap[r.student_id] = r })

  // Merge: each student gets their current status or null
  const sheet = (students || []).map((s) => ({
    student_id:       s.id,
    admission_number: s.admission_number,
    first_name:       s.users?.first_name,
    last_name:        s.users?.last_name,
    attendance_id:    existingMap[s.id]?.id     || null,
    status:           existingMap[s.id]?.status  || null,
    remarks:          existingMap[s.id]?.remarks || '',
  }))

  return { date, classId, sheet }
}

/**
 * Bulk save attendance for a full class on a given date.
 * Strategy: fetch existing records first, then insert new ones and
 * update existing ones separately. This avoids relying on a DB-level
 * unique constraint for the ON CONFLICT clause.
 */
const markAttendance = async ({ schoolId, classId, date, records }) => {
  if (!records || records.length === 0) {
    const err = new Error('No attendance records provided')
    err.status = 400
    throw err
  }

  const VALID_STATUSES = ['present', 'absent', 'late']
  for (const r of records) {
    if (!VALID_STATUSES.includes(r.status)) {
      const err = new Error(`Invalid status "${r.status}". Must be present, absent or late.`)
      err.status = 400
      throw err
    }
  }

  // 1. Fetch existing records for this class + date
  const { data: existing, error: fetchErr } = await supabase
    .from('attendance')
    .select('id, student_id')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .eq('attendance_date', date)

  if (fetchErr) throw new Error(fetchErr.message)

  // Build lookup: student_id → existing record id
  const existingMap = {}
  ;(existing || []).forEach((r) => { existingMap[r.student_id] = r.id })

  const toInsert = []
  const toUpdate = []

  records.forEach((r) => {
    const row = {
      school_id:       schoolId,
      class_id:        classId,
      student_id:      r.student_id,
      attendance_date: date,
      status:          r.status,
      remarks:         r.remarks || null,
    }
    if (existingMap[r.student_id]) {
      toUpdate.push({ id: existingMap[r.student_id], status: r.status, remarks: r.remarks || null })
    } else {
      toInsert.push(row)
    }
  })

  const results = []

  // 2. Insert new records
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('attendance')
      .insert(toInsert)
      .select('id, student_id, status, attendance_date')
    if (error) throw new Error(error.message)
    results.push(...(data || []))
  }

  // 3. Update existing records one by one (Supabase doesn't support bulk update by different IDs)
  for (const rec of toUpdate) {
    const { data, error } = await supabase
      .from('attendance')
      .update({ status: rec.status, remarks: rec.remarks })
      .eq('id', rec.id)
      .select('id, student_id, status, attendance_date')
      .single()
    if (error) throw new Error(error.message)
    if (data) results.push(data)
  }

  return results
}

/**
 * Update a single attendance record.
 */
const updateAttendanceRecord = async (schoolId, attendanceId, { status, remarks }) => {
  const VALID_STATUSES = ['present', 'absent', 'late']
  if (status && !VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status "${status}"`)
    err.status = 400
    throw err
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({ status, remarks })
    .eq('id', attendanceId)
    .eq('school_id', schoolId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Get attendance statistics for a school.
 * Supports: overall, by class, by student, by date range.
 */
const getAttendanceStats = async ({ schoolId, classId, studentId, startDate, endDate }) => {
  let query = supabase
    .from('attendance')
    .select('status, attendance_date, class_id, student_id')
    .eq('school_id', schoolId)

  if (classId)   query = query.eq('class_id', classId)
  if (studentId) query = query.eq('student_id', studentId)
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

  // Daily breakdown — group by date
  const byDate = {}
  records.forEach((r) => {
    if (!byDate[r.attendance_date]) {
      byDate[r.attendance_date] = { date: r.attendance_date, present: 0, absent: 0, late: 0, total: 0 }
    }
    byDate[r.attendance_date][r.status]++
    byDate[r.attendance_date].total++
  })

  const dailyTrend = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30) // last 30 days

  return {
    summary: { total, present, absent, late, rate },
    dailyTrend,
  }
}

/**
 * Get attendance report for a specific student.
 */
const getStudentAttendanceReport = async ({ schoolId, studentId, startDate, endDate }) => {
  let query = supabase
    .from('attendance')
    .select(`
      id, attendance_date, status, remarks,
      classes ( name, section )
    `)
    .eq('school_id', schoolId)
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

  return {
    records,
    summary: { total, present, absent, late, rate },
  }
}

/**
 * Get list of classes for a school (used in attendance form dropdowns).
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

module.exports = {
  getAttendance,
  getClassAttendanceSheet,
  markAttendance,
  updateAttendanceRecord,
  getAttendanceStats,
  getStudentAttendanceReport,
  getClassesForSchool,
}
