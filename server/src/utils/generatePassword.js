/**
 * Generates a strong random password.
 * Format: 2 uppercase + 2 digits + 4 lowercase + 1 special = 9 chars
 * Example: "Gk7mxpq2!"
 *
 * Always meets common password requirements:
 *  - At least 8 characters
 *  - At least 1 uppercase
 *  - At least 1 lowercase
 *  - At least 1 digit
 *  - At least 1 special character
 */
const generatePassword = () => {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'   // no I, O (confusing)
  const lower   = 'abcdefghjkmnpqrstuvwxyz'     // no i, l, o
  const digits  = '23456789'                     // no 0, 1 (confusing)
  const special = '@#$!%'

  const pick = (str) => str[Math.floor(Math.random() * str.length)]

  const parts = [
    pick(upper),
    pick(upper),
    pick(digits),
    pick(digits),
    pick(lower),
    pick(lower),
    pick(lower),
    pick(lower),
    pick(special),
  ]

  // Shuffle to avoid predictable pattern
  for (let i = parts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }

  return parts.join('')
}

module.exports = generatePassword
