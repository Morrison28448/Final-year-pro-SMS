import { useEffect, useState } from 'react'
import useApi from '../../hooks/useApi'
import { fetchBillingOverview } from '../../services/superAdmin.service'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import { Icons } from '../../components/ui/Icons'
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
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <PageHeader
        title="Platform Billing"
        subtitle="Subscription overview across all schools."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="card p-6 border-t-4 border-t-emerald-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <Icons.CheckCircle className="w-6 h-6" />
            </div>
          </div>
          {loading ? <div className="h-10 w-24 bg-gray-200/50 rounded-xl animate-pulse" /> : <p className="text-4xl font-black text-gray-900 leading-none">{summary.active ?? 0}</p>}
          <p className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-4 border-t border-gray-100/50">Active Subs</p>
        </div>

        <div className="card p-6 border-t-4 border-t-amber-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <Icons.Clock className="w-6 h-6" />
            </div>
          </div>
          {loading ? <div className="h-10 w-24 bg-gray-200/50 rounded-xl animate-pulse" /> : <p className="text-4xl font-black text-gray-900 leading-none">{summary.expired ?? 0}</p>}
          <p className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-4 border-t border-gray-100/50">Expired</p>
        </div>

        <div className="card p-6 border-t-4 border-t-red-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
              <Icons.XCircle className="w-6 h-6" />
            </div>
          </div>
          {loading ? <div className="h-10 w-24 bg-gray-200/50 rounded-xl animate-pulse" /> : <p className="text-4xl font-black text-gray-900 leading-none">{summary.cancelled ?? 0}</p>}
          <p className="mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-4 border-t border-gray-100/50">Cancelled</p>
        </div>

        <div className="card border-0 bg-gradient-to-br from-indigo-900 to-blue-900 p-6 flex flex-col justify-between relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-indigo-900/20">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10">
              <Icons.CurrencyDollar className="w-6 h-6" />
            </div>
          </div>
          <div className="relative z-10">
            {loading ? <div className="h-10 w-32 bg-white/10 rounded-xl animate-pulse" /> : <p className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight">{summary.totalRevenue != null ? formatCurrency(summary.totalRevenue) : '—'}</p>}
            <p className="mt-4 text-[11px] font-bold text-indigo-200 uppercase tracking-widest pt-4 border-t border-white/10">Active Revenue</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Icons.CreditCard className="w-5 h-5 text-indigo-500" /> All Subscriptions
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-1">{pagination.total || 0} record(s) found</p>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="w-48 bg-white border border-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          >
            <option value="">All Statuses</option>
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
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  {['School', 'Plan', 'Amount', 'Status', 'Period', 'Reference'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {subs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 leading-tight">{sub.schools?.name || '—'}</p>
                      <p className="text-[10px] font-medium text-gray-500 mt-0.5">{sub.schools?.email || ''}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{sub.plan_name}</td>
                    <td className="px-6 py-4 font-black text-indigo-700">{formatCurrency(sub.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge
                        label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                        variant={statusVariant(sub.status)}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[10px] font-medium tracking-wider uppercase">
                      {formatDate(sub.start_date)} → <br /> {formatDate(sub.end_date)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-[10px] tracking-wider">
                      {sub.payment_reference || '—'}
                    </td>
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

export default SuperAdminBillingPage
