import Spinner from '../ui/Spinner'

/**
 * AttendanceStatsCard — summary stats + daily trend bar chart
 * Props: stats { summary, dailyTrend }, loading
 */
const AttendanceStatsCard = ({ stats, loading = false }) => {
  const summary    = stats?.summary    || {}
  const dailyTrend = stats?.dailyTrend || []

  const maxTotal = Math.max(...dailyTrend.map((d) => d.total), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <h3 className="text-sm font-semibold text-gray-900">Attendance Overview</h3>

      {/* ── Summary pills ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Records', value: summary.total,   color: 'bg-gray-50   text-gray-900' },
            { label: 'Present',       value: summary.present, color: 'bg-green-50  text-green-700' },
            { label: 'Absent',        value: summary.absent,  color: 'bg-red-50    text-red-700' },
            { label: 'Late',          value: summary.late,    color: 'bg-yellow-50 text-yellow-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color}`}>
              <p className="text-2xl font-bold">{value ?? '—'}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Attendance rate ────────────────────────────────── */}
      {!loading && summary.total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Attendance Rate</span>
            <span className="font-semibold text-gray-900">{summary.rate}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${summary.rate >= 80 ? 'bg-green-500' : summary.rate >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ width: `${summary.rate}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Daily trend bar chart ──────────────────────────── */}
      {!loading && dailyTrend.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3">Daily Trend (last 30 days)</p>
          <div className="flex items-end gap-1 h-20 overflow-x-auto pb-1">
            {dailyTrend.map((day) => {
              const presentH = (day.present / maxTotal) * 100
              const lateH    = (day.late    / maxTotal) * 100
              const absentH  = (day.absent  / maxTotal) * 100
              return (
                <div
                  key={day.date}
                  className="flex flex-col-reverse gap-px shrink-0 w-4 group relative"
                  title={`${day.date}: P=${day.present} A=${day.absent} L=${day.late}`}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    {day.date}<br/>P:{day.present} A:{day.absent} L:{day.late}
                  </div>
                  {absentH  > 0 && <div className="bg-red-400 rounded-sm"    style={{ height: `${absentH}%` }} />}
                  {lateH    > 0 && <div className="bg-yellow-400 rounded-sm" style={{ height: `${lateH}%` }} />}
                  {presentH > 0 && <div className="bg-green-500 rounded-sm"  style={{ height: `${presentH}%` }} />}
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-2">
            {[
              { color: 'bg-green-500',  label: 'Present' },
              { color: 'bg-yellow-400', label: 'Late' },
              { color: 'bg-red-400',    label: 'Absent' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && dailyTrend.length === 0 && summary.total === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No attendance data for the selected period.
        </p>
      )}
    </div>
  )
}

export default AttendanceStatsCard
