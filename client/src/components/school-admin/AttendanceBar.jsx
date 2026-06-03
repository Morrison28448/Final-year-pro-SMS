/**
 * AttendanceBar — visual breakdown of today's attendance
 * Props: present, absent, late, total, rate, loading
 */
const AttendanceBar = ({ present = 0, absent = 0, late = 0, total = 0, rate = 0, loading = false }) => {
  const presentPct = total > 0 ? (present / total) * 100 : 0
  const absentPct  = total > 0 ? (absent  / total) * 100 : 0
  const latePct    = total > 0 ? (late    / total) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Today's Attendance</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {loading ? (
          <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" />
        ) : (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{rate}%</p>
            <p className="text-xs text-gray-500">attendance rate</p>
          </div>
        )}
      </div>

      {/* Stacked progress bar */}
      {loading ? (
        <div className="h-3 bg-gray-100 rounded-full animate-pulse mb-4" />
      ) : total === 0 ? (
        <div className="h-3 bg-gray-100 rounded-full mb-4" />
      ) : (
        <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
          {presentPct > 0 && (
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${presentPct}%` }}
              title={`Present: ${present}`}
            />
          )}
          {latePct > 0 && (
            <div
              className="bg-yellow-400 transition-all duration-500"
              style={{ width: `${latePct}%` }}
              title={`Late: ${late}`}
            />
          )}
          {absentPct > 0 && (
            <div
              className="bg-red-400 transition-all duration-500"
              style={{ width: `${absentPct}%` }}
              title={`Absent: ${absent}`}
            />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Present', value: present, color: 'bg-green-500',  text: 'text-green-700' },
          { label: 'Late',    value: late,    color: 'bg-yellow-400', text: 'text-yellow-700' },
          { label: 'Absent',  value: absent,  color: 'bg-red-400',    text: 'text-red-700' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
            <div>
              {loading ? (
                <div className="w-8 h-4 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className={`text-sm font-semibold ${text}`}>{value}</p>
              )}
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttendanceBar
