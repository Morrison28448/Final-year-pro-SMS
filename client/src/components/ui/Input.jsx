const Input = ({ className = '', error = false, ...props }) => (
  <input
    className={`input-field ${error ? 'input-field-error' : ''} ${className}`}
    {...props}
  />
)

export default Input
