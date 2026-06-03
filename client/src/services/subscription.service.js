import api from '../api/axios'

/** GET /api/subscriptions — current subscription + available plans */
export const fetchSubscription = async () => {
  const { data } = await api.get('/subscriptions')
  return data // { subscription, plans }
}

/**
 * POST /api/subscriptions/initialize
 * Demo mode: instantly activates the subscription, no redirect needed.
 */
export const initializePayment = async (planKey) => {
  const { data } = await api.post('/subscriptions/initialize', { planKey })
  return data // { subscription, plan, reference, message }
}

/** GET /api/subscriptions/history */
export const fetchPaymentHistory = async () => {
  const { data } = await api.get('/subscriptions/history')
  return data.history
}
