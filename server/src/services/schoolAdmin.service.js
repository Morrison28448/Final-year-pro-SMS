const { supabase } = require('../config/supabase')

// ── Available modules every school can toggle ─────────────────────────────────
const AVAILABLE_MODULES = ['attendance', 'exams', 'library', 'transport']

/**
 * Get school admin dashboard stats for a specific school.
 * Returns: students, teachers, classes, today's attendance summary.
 */
const getDashboardStats = async (schoolId) => {
  const today = new Date().toISOString().split('T')[0]

  const [studentsRes, teachersRes, classesRes, attendanceRes, subjectRes] =
    await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),

      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),

      supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),

      supabase
        .from('attendance')
        .select('status')
        .eq('school_id', schoolId)
        .eq('attendance_date', today),

      supabase
        .from('subjects')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId),
    ])

  // Attendance breakdown for today
  const attendanceRecords = attendanceRes.data || []
  const present = attendanceRecords.filter((a) => a.status === 'present').length
  const absent  = attendanceRecords.filter((a) => a.status === 'absent').length
  const late    = attendanceRecords.filter((a) => a.status === 'late').length
  const total   = attendanceRecords.length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

  return {
    students:  studentsRes.count  || 0,
    teachers:  teachersRes.count  || 0,
    classes:   classesRes.count   || 0,
    subjects:  subjectRes.count   || 0,
    attendance: { present, absent, late, total, rate },
  }
}

/**
 * Get recent activity for the school.
 * Pulls the 5 most recently enrolled students + 5 most recently added teachers.
 */
const getRecentActivity = async (schoolId) => {
  const [studentsRes, teachersRes] = await Promise.all([
    supabase
      .from('students')
      .select(`
        id, admission_number, created_at,
        users ( first_name, last_name, email ),
        classes ( name )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('teachers')
      .select(`
        id, employee_id, created_at,
        users ( first_name, last_name, email )
      `)
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentStudents = (studentsRes.data || []).map((s) => ({
    id:       s.id,
    type:     'student',
    name:     `${s.users?.first_name} ${s.users?.last_name}`,
    detail:   s.classes?.name || 'No class',
    meta:     s.admission_number,
    date:     s.created_at,
  }))

  const recentTeachers = (teachersRes.data || []).map((t) => ({
    id:     t.id,
    type:   'teacher',
    name:   `${t.users?.first_name} ${t.users?.last_name}`,
    detail: t.users?.email,
    meta:   t.employee_id,
    date:   t.created_at,
  }))

  // Merge and sort by date descending, return top 8
  return [...recentStudents, ...recentTeachers]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)
}

/**
 * Get all module toggle states for a school.
 * If a module row doesn't exist yet, it defaults to enabled.
 */
const getModules = async (schoolId) => {
  const { data, error } = await supabase
    .from('school_modules')
    .select('module_name, is_enabled')
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)

  // Build a map of existing DB rows
  const dbMap = {}
  ;(data || []).forEach((m) => { dbMap[m.module_name] = m.is_enabled })

  // Return all available modules, defaulting missing ones to enabled
  return AVAILABLE_MODULES.map((name) => ({
    module_name: name,
    is_enabled:  dbMap[name] !== undefined ? dbMap[name] : true,
  }))
}

/**
 * Toggle a single module on/off for a school.
 * Uses insert-or-update to avoid relying on upsert constraint naming.
 */
const toggleModule = async (schoolId, moduleName) => {
  if (!AVAILABLE_MODULES.includes(moduleName)) {
    const err = new Error(`Invalid module: ${moduleName}`)
    err.status = 400
    throw err
  }

  // Get current state (default true if not set)
  const { data: existing } = await supabase
    .from('school_modules')
    .select('id, is_enabled')
    .eq('school_id', schoolId)
    .eq('module_name', moduleName)
    .single()

  const currentState = existing?.is_enabled !== undefined ? existing.is_enabled : true
  const newState     = !currentState

  if (existing?.id) {
    // Update existing row
    const { data, error } = await supabase
      .from('school_modules')
      .update({ is_enabled: newState })
      .eq('id', existing.id)
      .select('module_name, is_enabled')
      .single()
    if (error) throw new Error(error.message)
    return data
  } else {
    // Insert new row
    const { data, error } = await supabase
      .from('school_modules')
      .insert({ school_id: schoolId, module_name: moduleName, is_enabled: newState })
      .select('module_name, is_enabled')
      .single()
    if (error) throw new Error(error.message)
    return data
  }
}

/**
 * Bulk update all module states for a school.
 * Uses insert-or-update per row to avoid upsert constraint issues.
 */
const updateModules = async (schoolId, modules) => {
  const validModules = modules.filter((m) => AVAILABLE_MODULES.includes(m.module_name))

  for (const m of validModules) {
    const { data: existing } = await supabase
      .from('school_modules')
      .select('id')
      .eq('school_id', schoolId)
      .eq('module_name', m.module_name)
      .single()

    if (existing?.id) {
      await supabase
        .from('school_modules')
        .update({ is_enabled: Boolean(m.is_enabled) })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('school_modules')
        .insert({ school_id: schoolId, module_name: m.module_name, is_enabled: Boolean(m.is_enabled) })
    }
  }

  return getModules(schoolId)
}

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getModules,
  toggleModule,
  updateModules,
  AVAILABLE_MODULES,
}
