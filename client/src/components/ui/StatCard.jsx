/**
 * StatCard — dashboard metric card
 */
const COLORS = {
  blue:   { icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100', trend: 'text-indigo-600' },
  green:  { icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100', trend: 'text-emerald-600' },
  yellow: { icon: 'bg-amber-50 text-amber-600 ring-amber-100', trend: 'text-amber-600' },
  red:    { icon: 'bg-red-50 text-red-600 ring-red-100', trend: 'text-red-600' },
  purple: { icon: 'bg-violet-50 text-violet-600 ring-violet-100', trend: 'text-violet-600' },
}

const StatCard = ({ title, value, icon, trend, color = 'blue', loading = false }) => {
  const c = COLORS[color] || COLORS.blue

  return (
    <div className="card card-hover p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ring-1 ${c.icon}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>

        {loading ? (
          <div className="mt-2 h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight tabular-nums">
            {value ?? '—'}
          </p>
        )}

        {trend && !loading && (
          <p className={`text-xs mt-1.5 font-medium ${c.trend}`}>{trend}</p>
        )}
      </div>
    </div>
  )
}

export default StatCard
