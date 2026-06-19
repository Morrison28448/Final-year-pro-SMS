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
import { Icons } from '../../components/ui/Icons'

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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <PageHeader
        title="Users"
        subtitle="All platform users across schools (excluding super admins)."
      />

      <div className="card overflow-hidden">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Icons.Users className="w-5 h-5 text-indigo-500" /> All Users
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-1">{pagination.total || 0} user(s) on platform</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="w-40 bg-white border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            >
              <option value="">All Roles</option>
              {['school_admin', 'teacher', 'student', 'parent'].map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Icons.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name or email…"
                  className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-56 transition-all shadow-sm"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm">
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
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden md:table-cell">School</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-50 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                          {getInitials(u.first_name, u.last_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{u.first_name} {u.last_name}</p>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={ROLE_LABELS[u.role] || u.role} variant={ROLE_VARIANT[u.role] || 'neutral'} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-xs font-semibold text-gray-700">{u.schools?.name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 hidden lg:table-cell">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/40">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition shadow-sm">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition shadow-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuperAdminUsersPage
