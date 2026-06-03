const express = require('express')
const router  = express.Router()

const { protect, restrictTo } = require('../middleware/protect')
const {
  getSubscription,
  initializePayment,
  verifyPayment,
  getPaymentHistory,
  paystackWebhook,
} = require('../controllers/subscription.controller')

// Webhook — no auth (Paystack calls this directly)
router.post('/webhook', paystackWebhook)

// All other routes require auth
router.use(protect)

// school_admin manages their own subscription
router.get('/',              restrictTo('school_admin'), getSubscription)
router.post('/initialize',   restrictTo('school_admin'), initializePayment)
router.get('/verify/:ref',   restrictTo('school_admin'), verifyPayment)
router.get('/history',       restrictTo('school_admin'), getPaymentHistory)

module.exports = router
