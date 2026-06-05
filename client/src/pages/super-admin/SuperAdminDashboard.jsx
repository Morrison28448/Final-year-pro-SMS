import { useEffect } from 'react'
import { Link }       from 'react-router-dom'
import { useAuth }    from '../../context/AuthContext'
import useApi         from '../../hooks/useApi'
import Spinner        from '../../components/ui/Spinner'
import { Icons }      from '../../components/ui/Icons'
import {
  fetchDashboardStats,
  fetchAllSchools,
} from '../../services/superAdmin.service'
import { formatDate } from '../../utils/helpers'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n || 0)

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: IconComp, accent, delta, loading, to }) => {
  const inner = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full group transition-all duration-200 ${to ? 'hover:shadow-md hover:border-gray-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          <IconComp className="w-5 h-5" />
        </div>
        {delta !== undefined && !loading && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {delta >= 0 ? '+' : ''}{delta}
          </span>
        )}
        {to && <Icons.ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <p className="mt-4 text-4xl font-black text-gray-900 tracking-tight">{value ?? '—'}</p>
      )}
      <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      {sub && !loading && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner
}

// ── Status dot ────────────────────────────────────────────────────────────────
const subStatus = (status) => {
  if (status === 'active')   return 'bg-emerald-500'
  if (status === 'expired')  return 'bg-amber-400'
  if (status === 'inactive') return 'bg-gray-300'
  return 'bg-red-400'
}

// ── Mini donut chart ──────────────────────────────────────────────────────────
const DonutChart = ({ active = 0, inactive = 0, expired = 0 }) => {
  const total = active + inactive + expired || 1
  const aP = (active   / total) * 283
  const iP = (inactive / total) * 283
  const eP = (expired  / total) * 283
  let offset = 0
  const slices = [
    { pct: aP, color: '#10b981', label: `Active (${active})` },
    { pct: eP, color: '#f59e0b', label: `Expired (${expired})` },
    { pct: iP, color: '#e5e7eb', label: `Inactive (${inactive})` },
  ]
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
          {slices.map((s, i) => {
            const el = (
              <circle key={i} cx="50" cy="50" r="45" fill="none"
                stroke={s.color} strokeWidth="10"
                strokeDasharray={`${s.pct} ${283 - s.pct}`}
                strokeDashoffset={-offset}
              />
            )
            offset += s.pct
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-gray-900">{active + inactive + expired}</span>
        </div>
      </div>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const { user } = useAuth()

  const { data: stats,   loading: statsLoading,   execute: loadStats }   = useApi(fetchDashboardStats)
  const { data: schoolsData, loading: schoolsLoading, execute: loadSchools } =
    useApi(fetchAllSchools, { schools: [], pagination: {} })

  useEffect(() => {
    loadStats()
    loadSchools({ page: 1, limit: 5 })
  }, [loadStats, loadSchools])

  const s = stats?.schools       || {}
  const b = stats?.subscriptions || {}
  const r = stats?.revenue       || {}
  const u = stats?.users         || {}

  const recentSchools = schoolsData?.schools || []

  const NAV_CARDS = [
    { to: '/super-admin/schools', label: 'Manage Schools', desc: 'Activate, deactivate and view details', icon: Icons.BuildingOffice },
    { to: '/super-admin/users',   label: 'Platform Users', desc: 'Browse all users across every school',  icon: Icons.Users },
    { to: '/super-admin/billing', label: 'Billing',        desc: 'Subscription history and revenue',      icon: Icons.CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Super Admin</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.email} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600">All systems operational</span>
        </div>
      </div>

      {/* ── Primary metrics ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Schools"        value={s.total}      sub={`${s.active || 0} active`}
          icon={Icons.BuildingOffice}  accent="bg-blue-50 text-blue-600"     loading={statsLoading}
          to="/super-admin/schools" />
        <MetricCard label="Active Subscriptions" value={b.active}     sub={`${b.expired || 0} expired`}
          icon={Icons.CheckCircle}    accent="bg-emerald-50 text-emerald-600" loading={statsLoading}
          to="/super-admin/billing" />
        <MetricCard label="Total Revenue"        value={r.total !== undefined ? fmt(r.total) : null}
          sub="From active plans"
          icon={Icons.CurrencyDollar} accent="bg-amber-50 text-amber-600"    loading={statsLoading} />
        <MetricCard label="Platform Users"       value={u.total}      sub="Across all schools"
          icon={Icons.Users}          accent="bg-purple-50 text-purple-600"  loading={statsLoading}
          to="/super-admin/users" />
      </div>

      {/* ── Mid row: donut + health breakdown ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* School health chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">School Health</p>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
          ) : (
            <DonutChart active={s.active || 0} inactive={s.inactive || 0} expired={b.expired || 0} />
          )}
        </div>

        {/* Subscription breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Subscription Status</p>
          {statsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Active',    val: b.active    || 0, color: 'bg-emerald-500', max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
                { label: 'Expired',   val: b.expired   || 0, color: 'bg-amber-400',   max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
                { label: 'Cancelled', val: b.cancelled || 0, color: 'bg-red-400',     max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
              ].map(({ label, val, color, max }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">{val}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                      style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue card */}
        <div className="bg-gray-900 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            {statsLoading ? (
              <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse mt-4" />
            ) : (
              <p className="text-4xl font-black text-white mt-4 leading-tight">
                {fmt(r.total || 0)}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">From active subscriptions</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-black text-white">{s.active || 0}</p>
              <p className="text-xs text-gray-500">Active schools</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{b.active || 0}</p>
              <p className="text-xs text-gray-500">Paying schools</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent schools ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recently Registered Schools</p>
          <Link to="/super-admin/schools" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
            View all <Icons.ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {schoolsLoading ? (
          <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
        ) : recentSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Icons.BuildingOffice className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No schools registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">School</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subscription</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentSchools.map((school) => {
                  const sub = Array.isArray(school.subscriptions) ? school.subscriptions[0] : school.subscriptions
                  return (
                    <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {school.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{school.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{school.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <p className="text-xs text-gray-600">{school.email || '—'}</p>
                        <p className="text-xs text-gray-400">{school.phone || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {sub ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{sub.plan_name || '—'}</p>
                            <p className="text-xs text-gray-400">{sub.status || '—'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No plan</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${school.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className="text-xs font-medium text-gray-600">{school.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-xs text-gray-500">
                        {formatDate(school.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Nav cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {NAV_CARDS.map(({ to, label, desc, icon: IconComp }) => (
          <Link key={to} to={to}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <IconComp className="w-4 h-4 text-white" />
              </div>
              <Icons.ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SuperAdminDashboard
