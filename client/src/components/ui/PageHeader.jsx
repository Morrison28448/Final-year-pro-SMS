/**
 * PageHeader — page title, subtitle, optional action
 */
const PageHeader = ({ title, subtitle, action }) => (
  <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 transition-all">
    {/* Decorative background element */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    
    <div className="relative z-10">
      <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm font-medium text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
    
    {action && (
      <div className="relative z-10 shrink-0">
        {action}
      </div>
    )}
  </div>
)

export default PageHeader
