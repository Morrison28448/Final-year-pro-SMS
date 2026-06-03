/**
 * StatCard — reusable metric card for dashboards
 *
 * Props:
 *  title       string   — metric label
 *  value       string|number — main value
 *  icon        string   — emoji or icon character
 *  trend       string   — optional sub-text (e.g. "+3 this month")
 *  color       string   — tailwind color key: blue | green | yellow | red | purple
 *  loading     boolean
 */
const COLORS = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     text: 'text-red-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
}

const StatCard = ({ title, value, icon, trend, color = 'blue', loading = false }) => {
  const c = COLORS[color] || COLORS.blue

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 ${c.icon}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>

        {loading ? (
          <div className="mt-1.5 h-7 w-20 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-0.5">
            {value ?? '—'}
          </p>
        )}

        {trend && !loading && (
          <p className={`text-xs mt-1 font-medium ${c.text}`}>{trend}</p>
        )}
      </div>
    </div>
  )
}

export default StatCard
