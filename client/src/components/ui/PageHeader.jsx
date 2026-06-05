/**
 * PageHeader — page title, subtitle, optional action
 */
const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

export default PageHeader
