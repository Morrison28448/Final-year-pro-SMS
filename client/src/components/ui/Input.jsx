/**
 * Input — styled text input
 * Forwards all native input props.
 */
const Input = ({ className = '', error = false, ...props }) => (
  <input
    className={`w-full px-3 py-2.5 border rounded-lg text-sm transition
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
      ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
      ${className}`}
    {...props}
  />
)

export default Input
