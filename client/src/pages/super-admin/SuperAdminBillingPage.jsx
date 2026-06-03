import { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'
import { fetchBillingOverview } from '../../services/superAdmin.service'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import { formatDate } from '../../utils/helpers'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(amount || 0)

const statusVariant = (status) => {
  const map = { active: 'success', inactive: 'neutral', expired: 'warning', cancelled: 'danger' }
  return map[status] || 'neutral'
}

const SuperAdminBillingPage = () => {
  const { data, loading, execute: load } = useApi(fetchBillingOverview, {
    subscriptions: [],
    summary: {},
    pagination: {},
  })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    load({ page, limit: 10, status: statusFilter })
  }, [page, statusFilter, load])

  const summary = data?.summary || {}
  const subs = data?.subscriptions || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Billing"
        subtitle="Subscription overview across all schools."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Subs" value={summary.active ?? null} icon="✅" color="green" loading={loading} />
        <StatCard title="Expired" value={summary.expired ?? null} icon="⏰" color="yellow" loading={loading} />
        <StatCard title="Cancelled" value={summary.cancelled ?? null} icon="❌" color="red" loading={loading} />
        <StatCard
          title="Active Revenue"
          value={summary.totalRevenue != null ? formatCurrency(summary.totalRevenue) : null}
          icon="💰"
          color="blue"
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All Subscriptions</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pagination.total || 0} record(s)</p>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="w-40"
          >
            <option value="">All statuses</option>
            {['active', 'inactive', 'expired', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : subs.length === 0 ? (
          <EmptyState icon="💳" title="No subscriptions" description="No subscription records match your filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['School', 'Plan', 'Amount', 'Status', 'Period', 'Reference'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{sub.schools?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{sub.schools?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.plan_name}</td>
                    <td className="px-4 py-3">{formatCurrency(sub.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                        variant={statusVariant(sub.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(sub.start_date)} → {formatDate(sub.end_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {sub.payment_reference || '—'}
                    </td>
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

export default SuperAdminBillingPage
