/**
 * EmptyState — shown when a list/table has no data
 * Props: icon, title, description, action (optional JSX)
 */
const EmptyState = ({ icon = '📭', title = 'No data', description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState
