/**
 * Select — styled select dropdown
 * Forwards all native select props.
 */
const Select = ({ className = '', error = false, children, ...props }) => (
  <select
    className={`w-full px-3 py-2.5 border rounded-lg text-sm transition
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
      ${className}`}
    {...props}
  >
    {children}
  </select>
)

export default Select
