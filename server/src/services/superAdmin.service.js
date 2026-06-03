const { supabase } = require('../config/supabase')

/**
 * Get platform-wide stats for the super admin dashboard.
 * Returns: total schools, active/inactive counts, subscription stats, revenue.
 */
const getDashboardStats = async () => {
  // Run all queries in parallel
  const [schoolsRes, subscriptionsRes, usersRes] = await Promise.all([
    supabase
      .from('schools')
      .select('id, is_active', { count: 'exact' }),

    supabase
      .from('subscriptions')
      .select('status, amount'),

    supabase
      .from('users')
      .select('id', { count: 'exact' })
      .neq('role', 'super_admin'),
  ])

  if (schoolsRes.error)        throw new Error(schoolsRes.error.message)
  if (subscriptionsRes.error)  throw new Error(subscriptionsRes.error.message)
  if (usersRes.error)          throw new Error(usersRes.error.message)

  const schools       = schoolsRes.data       || []
  const subscriptions = subscriptionsRes.data  || []

  const totalSchools    = schoolsRes.count  || 0
  const activeSchools   = schools.filter((s) => s.is_active).length
  const inactiveSchools = totalSchools - activeSchools

  const activeSubs   = subscriptions.filter((s) => s.status === 'active').length
  const expiredSubs  = subscriptions.filter((s) => s.status === 'expired').length
  const cancelledSubs = subscriptions.filter((s) => s.status === 'cancelled').length

  const totalRevenue = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)

  return {
    schools: {
      total:    totalSchools,
      active:   activeSchools,
      inactive: inactiveSchools,
    },
    subscriptions: {
      active:    activeSubs,
      expired:   expiredSubs,
      cancelled: cancelledSubs,
    },
    revenue: {
      total: totalRevenue,
    },
    users: {
      total: usersRes.count || 0,
    },
  }
}

/**
 * Get paginated list of all schools with their subscription status.
 */
const getAllSchools = async ({ page = 1, limit = 10, search = '' }) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('schools')
    .select(`
      id, name, email, phone, is_active, created_at,
      subscriptions ( status, plan_name, end_date )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    schools: data || [],
    pagination: {
      total:       count || 0,
      page:        Number(page),
      limit:       Number(limit),
      totalPages:  Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Get a single school with full details.
 */
const getSchoolById = async (schoolId) => {
  const { data, error } = await supabase
    .from('schools')
    .select(`
      *,
      subscriptions ( * ),
      users ( id, role, is_active )
    `)
    .eq('id', schoolId)
    .single()

  if (error) {
    const err = new Error('School not found')
    err.status = 404
    throw err
  }

  // Summarise user counts by role
  const users = data.users || []
  const userSummary = {
    total:        users.length,
    school_admin: users.filter((u) => u.role === 'school_admin').length,
    teacher:      users.filter((u) => u.role === 'teacher').length,
    student:      users.filter((u) => u.role === 'student').length,
    parent:       users.filter((u) => u.role === 'parent').length,
  }

  return { ...data, userSummary }
}

/**
 * Toggle a school's active status.
 */
const toggleSchoolStatus = async (schoolId) => {
  const { data: school, error: fetchError } = await supabase
    .from('schools')
    .select('is_active')
    .eq('id', schoolId)
    .single()

  if (fetchError) {
    const err = new Error('School not found')
    err.status = 404
    throw err
  }

  const { data, error } = await supabase
    .from('schools')
    .update({ is_active: !school.is_active })
    .eq('id', schoolId)
    .select('id, name, is_active')
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Get paginated list of all platform users (excluding super_admin).
 */
const getAllUsers = async ({ page = 1, limit = 10, search = '', role = '' } = {}) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('users')
    .select(`
      id, email, first_name, last_name, role, phone, is_active, created_at,
      schools ( id, name )
    `, { count: 'exact' })
    .neq('role', 'super_admin')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    )
  }
  if (role) {
    query = query.eq('role', role)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    users: data || [],
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

/**
 * Platform-wide billing overview — all subscriptions with school info.
 */
const getBillingOverview = async ({ page = 1, limit = 10, status = '' } = {}) => {
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('subscriptions')
    .select(`
      id, plan_name, amount, status, start_date, end_date, payment_reference, created_at,
      schools ( id, name, email, is_active )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const subscriptions = data || []
  const summary = {
    totalRevenue: subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0),
    active:   subscriptions.filter((s) => s.status === 'active').length,
    expired:  subscriptions.filter((s) => s.status === 'expired').length,
    inactive: subscriptions.filter((s) => s.status === 'inactive').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
  }

  return {
    subscriptions,
    summary,
    pagination: {
      total:      count || 0,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

module.exports = {
  getDashboardStats,
  getAllSchools,
  getSchoolById,
  toggleSchoolStatus,
  getAllUsers,
  getBillingOverview,
}
