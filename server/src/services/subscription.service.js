const { supabase } = require('../config/supabase')

// ── Subscription plans ────────────────────────────────────────────────────────
const PLANS = {
  basic: {
    name:        'Basic',
    amount:      15000,
    months:      1,
    description: 'Up to 200 students, core modules',
    features:    ['Student management', 'Attendance tracking', 'Basic reports'],
  },
  standard: {
    name:        'Standard',
    amount:      35000,
    months:      1,
    description: 'Up to 500 students, all modules',
    features:    ['Everything in Basic', 'Exams & results', 'Module toggles', 'Priority support'],
  },
  premium: {
    name:        'Premium',
    amount:      75000,
    months:      1,
    description: 'Unlimited students, priority support',
    features:    ['Everything in Standard', 'Unlimited students', 'Advanced analytics', 'Dedicated support'],
  },
}

// ── Helper: save/update subscription row ─────────────────────────────────────
const saveSubscription = async ({ schoolId, plan, reference }) => {
  const now       = new Date()
  const startDate = now.toISOString().split('T')[0]
  const endDate   = new Date(now)
  endDate.setMonth(endDate.getMonth() + plan.months)
  const endDateStr = endDate.toISOString().split('T')[0]

  // Check if a subscription row already exists for this school
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('school_id', schoolId)
    .single()

  let data, error

  if (existing?.id) {
    // Update existing row
    ;({ data, error } = await supabase
      .from('subscriptions')
      .update({
        plan_name:         plan.name,
        amount:            plan.amount,
        status:            'active',
        start_date:        startDate,
        end_date:          endDateStr,
        payment_reference: reference,
      })
      .eq('id', existing.id)
      .select()
      .single())
  } else {
    // Insert new row
    ;({ data, error } = await supabase
      .from('subscriptions')
      .insert({
        school_id:         schoolId,
        plan_name:         plan.name,
        amount:            plan.amount,
        status:            'active',
        start_date:        startDate,
        end_date:          endDateStr,
        payment_reference: reference,
      })
      .select()
      .single())
  }

  if (error) throw new Error(error.message)

  // Mark school as active
  await supabase
    .from('schools')
    .update({ is_active: true })
    .eq('id', schoolId)

  return data
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Get current subscription + available plans.
 */
const getSubscription = async (schoolId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)

  return {
    subscription: data || null,
    plans: Object.entries(PLANS).map(([key, plan]) => ({ key, ...plan })),
  }
}

/**
 * DUMMY: Instantly activate a subscription without any payment gateway.
 * In production, replace this with a real Paystack initialization.
 */
const initializePayment = async ({ schoolId, email, planKey }) => {
  const plan = PLANS[planKey]
  if (!plan) {
    const err = new Error(`Invalid plan: ${planKey}. Choose basic, standard or premium.`)
    err.status = 400
    throw err
  }

  // Generate a dummy reference
  const reference = `DEMO-${schoolId.slice(0, 8).toUpperCase()}-${Date.now()}`

  // Immediately activate — no redirect, no external call
  const subscription = await saveSubscription({ schoolId, plan, reference })

  return {
    subscription,
    plan,
    reference,
    message: `Successfully subscribed to ${plan.name} plan`,
  }
}

/**
 * Get payment / subscription history for a school.
 */
const getPaymentHistory = async ({ schoolId }) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Stub — kept so the route doesn't break.
 * In production this verifies a real Paystack reference.
 */
const verifyPayment = async ({ schoolId, reference }) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', schoolId)
    .eq('payment_reference', reference)
    .single()

  if (error || !data) {
    const err = new Error('Subscription not found for this reference')
    err.status = 404
    throw err
  }

  return { subscription: data }
}

/**
 * Stub webhook handler — no-op in demo mode.
 */
const handleWebhook = async () => ({ received: true })

module.exports = {
  getSubscription,
  initializePayment,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  PLANS,
}
