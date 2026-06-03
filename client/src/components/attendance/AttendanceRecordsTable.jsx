import Badge      from '../ui/Badge'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/helpers'

const statusVariant = (status) => {
  if (status === 'present') return 'success'
  if (status === 'absent')  return 'danger'
  if (status === 'late')    return 'warning'
  return 'neutral'
}

/**
 * AttendanceRecordsTable — read-only list of attendance records
 * Props: records, loading, pagination, onPageChange
 */
const AttendanceRecordsTable = ({
  records = [],
  loading = false,
  pagination = {},
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No records found"
        description="No attendance records match the selected filters."
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((rec) => (
              <tr key={rec.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">
                    {rec.students?.users?.first_name} {rec.students?.users?.last_name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {rec.students?.admission_number || '—'}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {rec.classes?.name}
                  {rec.classes?.section ? ` · ${rec.classes.section}` : ''}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {formatDate(rec.attendance_date)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                    variant={statusVariant(rec.status)}
                  />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {rec.remarks || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceRecordsTable
