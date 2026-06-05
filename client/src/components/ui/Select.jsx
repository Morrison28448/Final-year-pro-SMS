const Select = ({ className = '', error = false, children, ...props }) => (
  <select
    className={`select-field ${error ? 'input-field-error' : ''} ${className}`}
    {...props}
  >
    {children}
  </select>
)

export default Select
