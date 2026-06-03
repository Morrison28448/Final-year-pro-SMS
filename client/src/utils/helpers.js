/**
 * Capitalise the first letter of a string
 */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1)

/**
 * Format a date string to a readable format
 * e.g. "2024-01-15" → "Jan 15, 2024"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}

/**
 * Get initials from a full name
 * e.g. "John Doe" → "JD"
 */
export const getInitials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

/**
 * Extract a readable error message from an axios error
 */
export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'
