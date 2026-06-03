/**
 * ModuleToggleCard — single module enable/disable card
 *
 * Props:
 *  moduleName   string   — e.g. 'attendance'
 *  isEnabled    boolean
 *  onToggle     (moduleName) => void
 *  loading      boolean  — true while this specific module is toggling
 */

const MODULE_META = {
  attendance: {
    icon:        '✅',
    label:       'Attendance',
    description: 'Track daily student attendance and generate reports.',
    color:       'blue',
  },
  exams: {
    icon:        '📝',
    label:       'Exams & Results',
    description: 'Manage exams, record scores and publish results.',
    color:       'purple',
  },
  library: {
    icon:        '📚',
    label:       'Library',
    description: 'Coming soon — reserve for future library management.',
    color:       'yellow',
  },
  transport: {
    icon:        '🚌',
    label:       'Transport',
    description: 'Coming soon — reserve for future transport management.',
    color:       'green',
  },
}

const COLORS = {
  blue:   { ring: 'ring-blue-200',   badge: 'bg-blue-50 text-blue-700',   icon: 'bg-blue-100' },
  purple: { ring: 'ring-purple-200', badge: 'bg-purple-50 text-purple-700', icon: 'bg-purple-100' },
  yellow: { ring: 'ring-yellow-200', badge: 'bg-yellow-50 text-yellow-700', icon: 'bg-yellow-100' },
  green:  { ring: 'ring-green-200',  badge: 'bg-green-50 text-green-700',  icon: 'bg-green-100' },
}

const ModuleToggleCard = ({ moduleName, isEnabled, onToggle, loading = false }) => {
  const meta   = MODULE_META[moduleName] || { icon: '⚙️', label: moduleName, description: '', color: 'blue' }
  const colors = COLORS[meta.color] || COLORS.blue

  return (
    <div
      className={`bg-white rounded-xl border-2 p-5 transition-all duration-200
        ${isEnabled ? `border-gray-200 ${colors.ring}` : 'border-gray-100 opacity-70'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colors.icon}`}>
            {meta.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5
              ${isEnabled ? colors.badge : 'bg-gray-100 text-gray-500'}`}
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={() => !loading && onToggle(moduleName)}
          disabled={loading}
          aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${meta.label}`}
          className="relative shrink-0 mt-1 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-11 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 relative
              ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </div>
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed">{meta.description}</p>
    </div>
  )
}

export default ModuleToggleCard
