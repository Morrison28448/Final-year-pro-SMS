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
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Students</h2>
          {pagination.total !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">
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
            className="input-field w-52 py-2"
          />
          <button type="submit" className="btn-primary btn-sm">Search</button>
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
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Adm. No.</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Guardian</th>
                <th>Status</th>
                <th>Enrolled</th>
                {!readOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
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
