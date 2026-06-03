import { useState } from 'react'
import Badge      from '../ui/Badge'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { formatDate, getInitials } from '../../utils/helpers'

/**
 * StudentsTable
 *
 * Props:
 *  students        array
 *  loading         boolean
 *  pagination      { total, page, totalPages }
 *  search          string
 *  onSearch        (term) => void
 *  onPageChange    (page) => void
 *  onEdit          (student) => void
 *  onDelete        (student) => void
 *  onResetPassword (student) => void
 *  resetLoadingId  string | null   — id of student whose password is being reset
 *  readOnly        boolean         — hide edit/delete/reset (e.g. teacher view)
 */
const StudentsTable = ({
  students = [],
  loading = false,
  pagination = {},
  search = '',
  onSearch,
  onPageChange,
  onEdit,
  onDelete,
  onResetPassword,
  resetLoadingId = null,
  readOnly = false,
}) => {
  const [searchInput, setSearchInput] = useState(search)

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.(searchInput.trim())
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Students</h2>
          {pagination.total !== undefined && (
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.total} student{pagination.total !== 1 ? 's' : ''} enrolled
            </p>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, ID…"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="No students found"
          description={search ? `No results for "${search}"` : 'Add your first student to get started.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Adm. No.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guardian</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
                {!readOnly && (
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const firstName = student.users?.first_name || ''
                const lastName  = student.users?.last_name  || ''
                const isActive  = student.users?.is_active

                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {getInitials(firstName, lastName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">
                            {firstName} {lastName}
                          </p>
                          <p className="text-xs text-gray-400">{student.users?.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Admission number */}
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {student.admission_number || '—'}
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3">
                      {student.classes ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                          {student.classes.name}
                          {student.classes.section ? ` · ${student.classes.section}` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>

                    {/* Gender */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {student.gender || '—'}
                    </td>

                    {/* Guardian */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs">{student.guardian_name || '—'}</p>
                      <p className="text-gray-400 text-xs">{student.guardian_phone || ''}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        label={isActive ? 'Active' : 'Inactive'}
                        variant={isActive ? 'success' : 'danger'}
                      />
                    </td>

                    {/* Enrolled date */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(student.created_at)}
                    </td>

                    {!readOnly && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => onEdit?.(student)}
                            className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onResetPassword?.(student)}
                            disabled={resetLoadingId === student.id}
                            className="px-2.5 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 disabled:opacity-50 transition"
                          >
                            {resetLoadingId === student.id ? '…' : '🔑 Reset'}
                          </button>
                          <button
                            onClick={() => onDelete?.(student)}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────── */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
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

export default StudentsTable
