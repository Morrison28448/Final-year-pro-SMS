/**
 * Consistent API response helpers
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data })

const created = (res, data = {}, message = 'Created') =>
  success(res, data, message, 201)

const error = (res, message = 'Something went wrong', statusCode = 500) =>
  res.status(statusCode).json({ success: false, message })

const badRequest = (res, message) => error(res, message, 400)
const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401)
const forbidden = (res, message = 'Forbidden') => error(res, message, 403)
const notFound = (res, message = 'Not found') => error(res, message, 404)

module.exports = { success, created, error, badRequest, unauthorized, forbidden, notFound }
