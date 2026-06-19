import { useState } from 'react'
import Badge      from '../ui/Badge'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { Icons }  from '../ui/Icons'
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
      <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Icons.BuildingOffice className="w-5 h-5 text-indigo-500" /> All Schools
          </h2>
          {pagination.total !== undefined && (
            <p className="text-xs font-medium text-gray-500 mt-1">
              {pagination.total} school{pagination.total !== 1 ? 's' : ''} registered on the platform
            </p>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Icons.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search schools…"
              className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64 transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
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
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">School</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:table-cell">Contact</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Subscription</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden lg:table-cell">Joined</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => {
                const sub = school.subscriptions?.[0] || school.subscriptions || null
                const isToggling = togglingId === school.id

                return (
                  <tr key={school.id} className="hover:bg-white/40 transition-colors">
                    {/* School name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                          {school.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{school.name}</p>
                          <p className="text-[10px] font-medium text-gray-400 font-mono mt-0.5">ID: {school.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <p className="text-xs font-semibold text-gray-700">{school.email || '—'}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{school.phone || 'No phone'}</p>
                    </td>

                    {/* Subscription */}
                    <td className="px-6 py-4">
                      {sub ? (
                        <div>
                          <Badge
                            label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                            variant={subVariant(sub.status)}
                          />
                          <p className="text-[10px] font-medium text-gray-400 mt-1.5 whitespace-nowrap">
                            <span className="font-bold text-gray-600">{sub.plan_name || '—'}</span> · exp {formatDate(sub.end_date)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold italic text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">No plan</span>
                      )}
                    </td>

                    {/* Active status */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${school.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${school.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {school.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>

                    {/* Joined date */}
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 hidden lg:table-cell">
                      {formatDate(school.created_at)}
                    </td>

                    {/* Toggle action */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onToggle?.(school)}
                        disabled={isToggling}
                        className={`inline-flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          ${school.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20'
                          }`}
                      >
                        {isToggling ? (
                          <Spinner size="sm" color={school.is_active ? "text-red-600" : "text-white"} />
                        ) : school.is_active ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
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
