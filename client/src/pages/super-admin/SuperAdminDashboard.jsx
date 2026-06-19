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
    <div className={`card p-6 h-full group transition-all duration-300 ${to ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/20' : ''} flex flex-col justify-between`}>
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${accent}`}>
            <IconComp className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {delta !== undefined && !loading && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm ${delta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {delta >= 0 ? '+' : ''}{delta}
              </span>
            )}
            {to && <Icons.ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />}
          </div>
        </div>
        {loading ? (
          <div className="mt-2 h-10 w-24 bg-gray-200/50 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl font-black text-gray-900 tracking-tight leading-none">{value ?? '—'}</p>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100/50">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        {sub && !loading && <p className="text-[11px] font-medium text-gray-400 mt-1">{sub}</p>}
      </div>
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
      <div className="card p-6 border-l-4 border-l-indigo-500 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Icons.ShieldCheck className="w-4 h-4" /> Super Admin Portal
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
            <span>{user?.email}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2.5 px-4 py-2.5 bg-white/50 backdrop-blur-md rounded-xl border border-white/60 shadow-sm self-start sm:self-auto">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">All Systems Normal</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* School health chart */}
        <div className="card p-6 flex flex-col gap-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Icons.ChartPie className="w-4 h-4 text-indigo-400" /> School Health
          </p>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
          ) : (
            <DonutChart active={s.active || 0} inactive={s.inactive || 0} expired={b.expired || 0} />
          )}
        </div>

        {/* Subscription breakdown */}
        <div className="card p-6">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Icons.CreditCard className="w-4 h-4 text-blue-400" /> Subscription Status
          </p>
          {statsLoading ? (
            <div className="space-y-4">
              {[1,2,3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-5">
              {[
                { label: 'Active',    val: b.active    || 0, color: 'bg-emerald-500', bg: 'bg-emerald-50', max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
                { label: 'Expired',   val: b.expired   || 0, color: 'bg-amber-400',   bg: 'bg-amber-50', max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
                { label: 'Cancelled', val: b.cancelled || 0, color: 'bg-red-500',     bg: 'bg-red-50', max: (b.active || 0) + (b.expired || 0) + (b.cancelled || 0) || 1 },
              ].map(({ label, val, color, bg, max }) => (
                <div key={label} className="group">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-black text-gray-900">{val}</span>
                  </div>
                  <div className={`h-2.5 ${bg} rounded-full overflow-hidden shadow-inner`}>
                    <div className={`h-full rounded-full transition-all duration-1000 ${color}`}
                      style={{ width: `${(val / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue card */}
        <div className="card border-0 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-6 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-gray-900/20">
          {/* Decorative backdrop */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                <Icons.CurrencyDollar className="w-4 h-4" /> Total Revenue
              </p>
              <div className="px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                All Time
              </div>
            </div>
            {statsLoading ? (
              <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse mt-4" />
            ) : (
              <p className="text-4xl md:text-5xl font-black text-white mt-4 leading-tight tracking-tight drop-shadow-md">
                {fmt(r.total || 0)}
              </p>
            )}
            <p className="text-[11px] font-medium text-indigo-200 mt-2">Generated from active subscriptions</p>
          </div>
          <div className="relative z-10 mt-8 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm transition hover:bg-white/10">
              <p className="text-2xl font-black text-white">{s.active || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Active Schools</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm transition hover:bg-white/10">
              <p className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{b.active || 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 mt-1">Paying Schools</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent schools ─────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="card-header border-b border-white/40 flex items-center justify-between">
          <p className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Icons.BuildingOffice className="w-5 h-5 text-indigo-500" />
            Recently Registered Schools
          </p>
          <Link to="/super-admin/schools" className="px-3 py-1.5 bg-white/50 border border-white/60 rounded-lg text-xs font-bold text-indigo-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-1.5">
            View all <Icons.ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {schoolsLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : recentSchools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <Icons.BuildingOffice className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">No schools registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">School</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden sm:table-cell">Contact</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Subscription</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest hidden md:table-cell">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {recentSchools.map((school) => {
                  const sub = Array.isArray(school.subscriptions) ? school.subscriptions[0] : school.subscriptions
                  return (
                    <tr key={school.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                            {school.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{school.name}</p>
                            <p className="text-[10px] font-medium text-gray-400 font-mono mt-0.5">ID: {school.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <p className="text-xs font-semibold text-gray-700">{school.email || '—'}</p>
                        <p className="text-[10px] font-medium text-gray-500 mt-0.5">{school.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {sub ? (
                          <div>
                            <p className="text-xs font-bold text-gray-900">{sub.plan_name || '—'}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {sub.status || '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold italic text-gray-400">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${school.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${school.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                          {school.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-gray-500">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {NAV_CARDS.map(({ to, label, desc, icon: IconComp }) => (
          <Link key={to} to={to}
            className="card p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 flex flex-col gap-4 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-md">
                <IconComp className="w-6 h-6 text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <Icons.ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
            <div>
              <p className="text-base font-black text-gray-900">{label}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SuperAdminDashboard
