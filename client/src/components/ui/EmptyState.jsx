const EmptyState = ({ icon = '📭', title = 'No data', description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-5">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export default EmptyState
