import { useState } from 'react'
import Badge      from '../ui/Badge'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/helpers'

/**
 * Map subscription status → Badge variant
 */
const subVariant = (status) => {
  const map = {
    active:    'success',
    inactive:  'neutral',
    expired:   'warning',
    cancelled: 'danger',
  }
  return map[status] || 'neutral'
}

/**
 * SchoolsTable
 *
 * Props:
 *  schools      array
 *  loading      boolean
 *  pagination   { total, page, totalPages }
 *  onPageChange (page) => void
 *  onSearch     (term) => void
 *  onToggle     (school) => void   — activate / deactivate
 *  search       string             — controlled search value
 */
const SchoolsTable = ({
  schools = [],
  loading = false,
  pagination = {},
  onPageChange,
  onSearch,
  onToggle,
  search = '',
  togglingId = null,
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
          <h2 className="text-base font-semibold text-slate-900">All Schools</h2>
          {pagination.total !== undefined && (
            <p className="text-xs text-slate-500 mt-0.5">
              {pagination.total} school{pagination.total !== 1 ? 's' : ''} registered
            </p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search schools…"
            className="input-field w-48 py-2"
          />
          <button
            type="submit"
            className="btn-primary btn-sm"
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
      ) : schools.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="No schools found"
          description={search ? `No results for "${search}"` : 'No schools have registered yet.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Contact</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => {
                const sub = school.subscriptions?.[0] || school.subscriptions || null
                const isToggling = togglingId === school.id

                return (
                  <tr key={school.id} className="hover:bg-gray-50 transition">
                    {/* School name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {school.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{school.name}</p>
                          <p className="text-xs text-gray-400">{school.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{school.email || '—'}</p>
                      <p className="text-xs text-gray-400">{school.phone || '—'}</p>
                    </td>

                    {/* Subscription */}
                    <td className="px-4 py-3">
                      {sub ? (
                        <>
                          <Badge
                            label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                            variant={subVariant(sub.status)}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {sub.plan_name || '—'} · expires {formatDate(sub.end_date)}
                          </p>
                        </>
                      ) : (
                        <Badge label="No plan" variant="neutral" />
                      )}
                    </td>

                    {/* Active status */}
                    <td className="px-4 py-3">
                      <Badge
                        label={school.is_active ? 'Active' : 'Inactive'}
                        variant={school.is_active ? 'success' : 'danger'}
                      />
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(school.created_at)}
                    </td>

                    {/* Toggle action */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggle?.(school)}
                        disabled={isToggling}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50
                          ${school.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                      >
                        {isToggling
                          ? '…'
                          : school.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
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
            Page {pagination.page} of {pagination.totalPages}
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

export default SchoolsTable
