import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useModules } from '../../context/ModuleContext'
import useApi from '../../hooks/useApi'
import Spinner from '../../components/ui/Spinner'
import { Icons } from '../../components/ui/icons'
import {
  fetchSchoolStats,
  fetchRecentActivity,
  fetchModules,
  toggleModule,
} from '../../services/schoolAdmin.service'
import { formatDate } from '../../utils/helpers'

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub, icon: IconComp, accent, to, loading }) => {
  const content = (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full group transition-all duration-200 ${to ? 'hover:shadow-md hover:border-gray-200 cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          <IconComp className="w-5 h-5" />
        </div>
        {to && <Icons.ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />}
      </div>
      {loading ? (
        <div className="mt-4 h-9 w-16 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <p className="mt-4 text-4xl font-black text-gray-900 tracking-tight">{value ?? '—'}</p>
      )}
      <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      {sub && !loading && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
  return to ? <Link to={to} className="block h-full">{content}</Link> : content
}

// ── Module toggle row ─────────────────────────────────────────────────────────
const MODULE_META = {
  attendance: { label: 'Attendance', icon: Icons.ClipboardList, desc: 'Daily student attendance tracking' },
  exams:      { label: 'Exams & Results', icon: Icons.BookOpen,      desc: 'Exam management and result publishing' },
  library:    { label: 'Library',     icon: Icons.BookOpen,      desc: 'Book inventory and borrowing' },
  transport:  { label: 'Transport',   icon: Icons.ChartBar,      desc: 'Bus routes and student assignments' },
}

const ModuleRow = ({ moduleName, isEnabled, loading, onToggle }) => {
  const meta = MODULE_META[moduleName] || { label: moduleName, icon: Icons.Cog, desc: '' }
  const IconComp = meta.icon

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200
      ${isEnabled ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
          ${isEnabled ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
          <IconComp className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {meta.label}
          </p>
          <p className="text-xs text-gray-400 truncate hidden sm:block">{meta.desc}</p>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => !loading && onToggle(moduleName)}
        disabled={loading}
        aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${meta.label}`}
        className="ml-4 shrink-0 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-11 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={`relative w-11 h-6 rounded-full transition-colors duration-200
            ${isEnabled ? 'bg-gray-900' : 'bg-gray-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
              ${isEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        )}
      </button>
    </div>
  )
}

// ── Activity feed ─────────────────────────────────────────────────────────────
const ActivityFeed = ({ activity, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-50">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Activity</p>
    </div>
    {loading ? (
      <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
    ) : !activity || activity.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Icons.ClipboardList className="w-8 h-8 text-gray-200" />
        <p className="text-sm text-gray-400">No recent activity</p>
      </div>
    ) : (
      <ul className="divide-y divide-gray-50">
        {activity.map((item, i) => {
          const isStudent = item.type === 'student'
          return (
            <li key={`${item.type}-${item.id}-${i}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs
                ${isStudent ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {item.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {isStudent ? 'Student enrolled' : 'Teacher added'} · {item.detail}
                </p>
              </div>
              <p className="text-xs text-gray-400 shrink-0">{formatDate(item.date)}</p>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)

// ── Attendance panel ──────────────────────────────────────────────────────────
const AttendancePanel = ({ present = 0, absent = 0, late = 0, total = 0, rate = 0, loading }) => {
  const pP = total > 0 ? (present / total) * 100 : 0
  const pL = total > 0 ? (late    / total) * 100 : 0
  const pA = total > 0 ? (absent  / total) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Attendance</p>
        {!loading && total > 0 && (
          <span className={`text-sm font-black ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {rate}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-3 bg-gray-100 rounded-full animate-pulse mb-4" />
      ) : total === 0 ? (
        <div className="h-3 bg-gray-100 rounded-full mb-4" />
      ) : (
        <div className="flex h-3 rounded-full overflow-hidden gap-px mb-4">
          {pP > 0 && <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pP}%` }} />}
          {pL > 0 && <div className="bg-amber-400 transition-all duration-700" style={{ width: `${pL}%` }} />}
          {pA > 0 && <div className="bg-red-500 transition-all duration-700 rounded-r-full" style={{ width: `${pA}%` }} />}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Present', val: present, dot: 'bg-emerald-500', text: 'text-emerald-700' },
          { label: 'Late',    val: late,    dot: 'bg-amber-400',   text: 'text-amber-700' },
          { label: 'Absent',  val: absent,  dot: 'bg-red-500',     text: 'text-red-700' },
        ].map(({ label, val, dot, text }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <div>
              {loading
                ? <div className="w-6 h-4 bg-gray-100 rounded animate-pulse" />
                : <p className={`text-sm font-bold ${text}`}>{val}</p>}
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {!loading && total > 0 && (
        <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-50">
          {total} students tracked today
        </p>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SchoolAdminDashboard = () => {
  const { user } = useAuth()
  const { refreshModules } = useModules()

  const { data: stats,    loading: statsLoading,    execute: loadStats }    = useApi(fetchSchoolStats)
  const { data: activity, loading: activityLoading, execute: loadActivity } = useApi(fetchRecentActivity, [])
  const { data: modules,  loading: modulesLoading,  execute: loadModules,
          setData: setModules } = useApi(fetchModules, [])

  const [togglingModule, setTogglingModule] = useState(null)

  useEffect(() => { loadStats(); loadActivity(); loadModules() }, [loadStats, loadActivity, loadModules])

  const handleToggle = useCallback(async (moduleName) => {
    setTogglingModule(moduleName)
    try {
      const updated = await toggleModule(moduleName)
      setModules((prev) =>
        (prev || []).map((m) => m.module_name === updated.module_name ? { ...m, is_enabled: updated.is_enabled } : m)
      )
      refreshModules()
    } catch { loadModules(); refreshModules() }
    finally { setTogglingModule(null) }
  }, [setModules, loadModules, refreshModules])

  const att = stats?.attendance || {}

  const QUICK_LINKS = [
    { to: '/students',   label: 'Students',   desc: 'Manage enrolments',     icon: Icons.Users },
    { to: '/teachers',   label: 'Teachers',   desc: 'Staff management',       icon: Icons.AcademicCap },
    { to: '/attendance', label: 'Attendance', desc: 'Mark daily records',     icon: Icons.ClipboardList },
    { to: '/exams',      label: 'Exams',      desc: 'Results and reports',    icon: Icons.BookOpen },
    { to: '/academics',  label: 'Academics',  desc: 'Classes and subjects',   icon: Icons.ChartBar },
    { to: '/billing',    label: 'Billing',    desc: 'Subscription status',    icon: Icons.CreditCard },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">School Admin</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{user?.school_name || 'Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Students" value={stats?.students ?? null} sub="Enrolled"
          icon={Icons.Users}        accent="bg-blue-50 text-blue-600"   loading={statsLoading} to="/students" />
        <MetricCard label="Teachers" value={stats?.teachers ?? null} sub="Active staff"
          icon={Icons.AcademicCap}  accent="bg-purple-50 text-purple-600" loading={statsLoading} to="/teachers" />
        <MetricCard label="Classes"  value={stats?.classes  ?? null} sub="Total classes"
          icon={Icons.BookOpen}     accent="bg-emerald-50 text-emerald-600" loading={statsLoading} to="/academics" />
        <MetricCard label="Subjects" value={stats?.subjects ?? null} sub="Across all classes"
          icon={Icons.ChartBar}     accent="bg-amber-50 text-amber-600"  loading={statsLoading} to="/academics" />
      </div>

      {/* ── Attendance + Activity ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendancePanel
          present={att.present} absent={att.absent} late={att.late}
          total={att.total} rate={att.rate} loading={statsLoading}
        />
        <ActivityFeed activity={activity} loading={activityLoading} />
      </div>

      {/* ── Module management ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Module Management</p>
            <p className="text-xs text-gray-400 mt-0.5">Enable or disable features for your school</p>
          </div>
        </div>
        {modulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {(modules || []).map((mod) => (
              <ModuleRow
                key={mod.module_name}
                moduleName={mod.module_name}
                isEnabled={mod.is_enabled}
                loading={togglingModule === mod.module_name}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick navigation ──────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ to, label, desc, icon: IconComp }) => (
            <Link key={to} to={to}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <IconComp className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SchoolAdminDashboard
