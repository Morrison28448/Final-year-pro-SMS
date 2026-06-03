import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useApi from '../../hooks/useApi'
import { fetchDashboardStats } from '../../services/superAdmin.service'

import PageHeader from '../../components/ui/PageHeader'
import StatCard   from '../../components/ui/StatCard'

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(amount || 0)

const SuperAdminDashboard = () => {
  const { user } = useAuth()

  // ── Stats ─────────────────────────────────────────────────────────────────
  const {
    data:    stats,
    loading: statsLoading,
    error:   statsError,
    execute: loadStats,
  } = useApi(fetchDashboardStats)

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // ── Derived values ────────────────────────────────────────────────────────
  const totalSchools    = stats?.schools?.total        ?? null
  const activeSchools   = stats?.schools?.active       ?? null
  const activeSubs      = stats?.subscriptions?.active ?? null
  const totalRevenue    = stats?.revenue?.total        ?? null
  const totalUsers      = stats?.users?.total          ?? null

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader
        title="Super Admin Dashboard 🛡️"
        subtitle={`Welcome back, ${user?.first_name}. Here's the platform overview.`}
      />

      {/* ── Error banner ────────────────────────────────────────── */}
      {statsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load stats: {statsError}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Schools"
          value={totalSchools}
          icon="🏫"
          color="blue"
          loading={statsLoading}
          trend={activeSchools !== null ? `${activeSchools} active` : undefined}
        />
        <StatCard
          title="Active Subscriptions"
          value={activeSubs}
          icon="✅"
          color="green"
          loading={statsLoading}
          trend={
            stats?.subscriptions?.expired
              ? `${stats.subscriptions.expired} expired`
              : undefined
          }
        />
        <StatCard
          title="Total Revenue"
          value={totalRevenue !== null ? formatCurrency(totalRevenue) : null}
          icon="💰"
          color="yellow"
          loading={statsLoading}
          trend="Active subscriptions only"
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          color="purple"
          loading={statsLoading}
          trend="Across all schools"
        />
      </div>

      {/* ── Secondary stat row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Inactive Schools"
          value={stats?.schools?.inactive ?? null}
          icon="🔴"
          color="red"
          loading={statsLoading}
        />
        <StatCard
          title="Expired Subscriptions"
          value={stats?.subscriptions?.expired ?? null}
          icon="⏰"
          color="yellow"
          loading={statsLoading}
        />
        <StatCard
          title="Cancelled Subscriptions"
          value={stats?.subscriptions?.cancelled ?? null}
          icon="❌"
          color="red"
          loading={statsLoading}
        />
      </div>

      {/* ── Quick links ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/super-admin/schools', label: 'Manage Schools', icon: '🏫', desc: 'View and activate schools' },
          { to: '/super-admin/users',   label: 'Platform Users', icon: '👥', desc: 'Browse all school users' },
          { to: '/super-admin/billing', label: 'Billing',        icon: '💳', desc: 'Subscriptions & revenue' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition group"
          >
            <span className="text-2xl">{item.icon}</span>
            <p className="font-semibold text-gray-900 mt-3 group-hover:text-blue-600 transition">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SuperAdminDashboard
