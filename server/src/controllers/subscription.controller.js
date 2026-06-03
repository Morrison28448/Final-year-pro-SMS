const subscriptionService = require('../services/subscription.service')
const { success, badRequest } = require('../utils/response')

/** GET /api/subscriptions */
const getSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.getSubscription(req.user.school_id)
    return success(res, result, 'Subscription fetched')
  } catch (err) { next(err) }
}

/** POST /api/subscriptions/initialize */
const initializePayment = async (req, res, next) => {
  try {
    const { planKey } = req.body
    if (!planKey) return badRequest(res, 'planKey is required (basic, standard, premium)')

    const result = await subscriptionService.initializePayment({
      schoolId: req.user.school_id,
      email:    req.user.email,
      planKey,
    })
    return success(res, result, 'Payment initialized')
  } catch (err) { next(err) }
}

/** GET /api/subscriptions/verify/:ref */
const verifyPayment = async (req, res, next) => {
  try {
    const result = await subscriptionService.verifyPayment({
      schoolId:  req.user.school_id,
      reference: req.params.ref,
    })
    return success(res, result, 'Payment verified and subscription activated')
  } catch (err) { next(err) }
}

/** GET /api/subscriptions/history */
const getPaymentHistory = async (req, res, next) => {
  try {
    const history = await subscriptionService.getPaymentHistory({
      schoolId: req.user.school_id,
      email:    req.user.email,
    })
    return success(res, { history }, 'Payment history fetched')
  } catch (err) { next(err) }
}

/** POST /api/subscriptions/webhook */
const paystackWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature']
    // Raw body needed for HMAC — express.json() parses it, so we re-stringify
    const rawBody = JSON.stringify(req.body)
    await subscriptionService.handleWebhook(rawBody, signature)
    // Paystack expects a 200 response quickly
    return res.status(200).json({ received: true })
  } catch (err) {
    // Don't expose webhook errors — just log and return 200
    console.error('[WEBHOOK ERROR]', err.message)
    return res.status(200).json({ received: true })
  }
}

module.exports = {
  getSubscription,
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  paystackWebhook,
}
