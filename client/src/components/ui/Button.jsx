/**
 * Button — consistent action button
 *
 * Props: variant ('primary' | 'secondary' | 'ghost' | 'danger'), size ('sm' | 'md' | 'lg'), className, ...rest
 */
const VARIANTS = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
}

const SIZES = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => (
  <button
    className={`btn ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
)

export default Button
