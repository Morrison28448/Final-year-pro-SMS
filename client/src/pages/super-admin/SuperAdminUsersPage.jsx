import { useEffect, useState, useCallback } from 'react'
import useApi from '../../hooks/useApi'
import { fetchAllUsers } from '../../services/superAdmin.service'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import { formatDate, getInitials } from '../../utils/helpers'
import { ROLE_LABELS } from '../../utils/constants'

const ROLE_VARIANT = {
  school_admin: 'info',
  teacher:      'info',
  student:      'success',
  parent:       'warning',
}

const SuperAdminUsersPage = () => {
  const { data, loading, execute: load } = useApi(fetchAllUsers, { users: [], pagination: {} })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    load({ page, limit: 10, search, role: roleFilter })
  }, [page, search, roleFilter, load])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }, [searchInput])

  const users = data?.users || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="All platform users across schools (excluding super admins)."
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All Users</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pagination.total || 0} user(s)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="w-36"
            >
              <option value="">All roles</option>
              {['school_admin', 'teacher', 'student', 'parent'].map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or email…"
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                Search
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" description={search ? `No results for "${search}"` : 'No users match your filters.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['User', 'Role', 'School', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {getInitials(u.first_name, u.last_name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={ROLE_LABELS[u.role] || u.role} variant={ROLE_VARIANT[u.role] || 'neutral'} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {u.schools?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={u.is_active ? 'Active' : 'Inactive'} variant={u.is_active ? 'success' : 'danger'} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdminUsersPage
