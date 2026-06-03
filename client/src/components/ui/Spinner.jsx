/**
 * Spinner — loading indicator
 * Props: size ('sm' | 'md' | 'lg'), className
 */
const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-[3px]',
  lg: 'w-10 h-10 border-4',
}

const Spinner = ({ size = 'md', className = '' }) => (
  <div
    className={`${SIZES[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    role="status"
    aria-label="Loading"
  />
)

export default Spinner
