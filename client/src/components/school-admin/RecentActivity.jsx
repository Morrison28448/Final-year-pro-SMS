import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/helpers'

const TYPE_CONFIG = {
  student: { icon: '🎓', color: 'bg-blue-100 text-blue-700',   label: 'Student enrolled' },
  teacher: { icon: '👨‍🏫', color: 'bg-purple-100 text-purple-700', label: 'Teacher added' },
}

/**
 * RecentActivity — scrollable activity feed
 * Props: activity (array), loading (bool)
 */
const RecentActivity = ({ activity = [], loading = false }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
      <p className="text-xs text-gray-500 mt-0.5">Latest enrollments and additions</p>
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    ) : activity.length === 0 ? (
      <EmptyState
        icon="📋"
        title="No activity yet"
        description="Students and teachers will appear here once added."
      />
    ) : (
      <ul className="divide-y divide-gray-50">
        {activity.map((item) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.student
          return (
            <li key={`${item.type}-${item.id}`} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.color}`}>
                {cfg.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {cfg.label} · {item.detail}
                </p>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-400 shrink-0 mt-0.5">
                {formatDate(item.date)}
              </p>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)

export default RecentActivity
