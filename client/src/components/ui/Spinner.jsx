const SIZES = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-8 h-8 border-[3px]' }

const Spinner = ({ size = 'md', className = '' }) => (
  <div
    className={`rounded-full border-slate-200 border-t-indigo-600 animate-spin ${SIZES[size] || SIZES.md} ${className}`}
    role="status"
    aria-label="Loading"
  />
)

export default Spinner
