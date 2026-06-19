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
  const [colorClass, bgClass, glowClass] = accent.split(' ') // e.g. "text-blue-600 bg-blue-50 shadow-blue-500/20"
  
  const content = (
    <div className={`relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 h-full group transition-all duration-300 ${to ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer' : ''}`}>
      {/* Subtle background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60 ${bgClass}`} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} shadow-inner`}>
          <IconComp className="w-6 h-6" />
        </div>
        {to && (
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
             <Icons.ArrowUpRight className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="relative z-10 mt-6">
        {loading ? (
          <div className="h-10 w-20 bg-gray-200/50 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl font-black text-gray-900 tracking-tight">{value ?? '—'}</p>
        )}
        <p className="mt-2 text-sm font-bold text-gray-500 tracking-wide">{label}</p>
        {sub && !loading && <p className="text-xs text-gray-400 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{content}</Link> : content
}

// ── Module toggle row ─────────────────────────────────────────────────────────
const MODULE_META = {
  attendance: { label: 'Attendance Tracker', icon: Icons.ClipboardList, desc: 'Daily student attendance logs & statistics' },
  exams:      { label: 'Exams & Results',    icon: Icons.BookOpen,      desc: 'Publish assessments and terminal reports' },
  library:    { label: 'Library System',     icon: Icons.BookOpen,      desc: 'Book inventory and digital borrowing' },
  transport:  { label: 'Transport Routing',  icon: Icons.ChartBar,      desc: 'Bus routes and student assignment' },
}

const ModuleRow = ({ moduleName, isEnabled, loading, onToggle }) => {
  const meta = MODULE_META[moduleName] || { label: moduleName, icon: Icons.Cog, desc: '' }
  const IconComp = meta.icon

  return (
    <div className={`relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border transition-all duration-300
      ${isEnabled ? 'bg-white/80 border-indigo-100 shadow-sm' : 'bg-white/40 border-gray-100'}`}>
      
      {/* Active side border accent */}
      {isEnabled && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}

      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
          ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
          <IconComp className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-bold truncate ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>
            {meta.label}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{meta.desc}</p>
        </div>
      </div>

      <button
        onClick={() => !loading && onToggle(moduleName)}
        disabled={loading}
        className="ml-4 shrink-0 disabled:opacity-50 transition-opacity focus:outline-none"
      >
        {loading ? (
           <Spinner size="sm" className="text-indigo-600" />
        ) : (
          <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out shadow-inner
            ${isEnabled ? 'bg-indigo-500' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ease-in-out
              ${isEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        )}
      </button>
    </div>
  )
}

// ── Activity feed ─────────────────────────────────────────────────────────────
const ActivityFeed = ({ activity, loading }) => (
  <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl overflow-hidden flex flex-col h-full">
    <div className="px-6 py-5 border-b border-gray-100/50 flex items-center justify-between bg-white/30">
      <p className="text-sm font-bold text-gray-800">Recent Activity</p>
      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Live</span>
    </div>
    
    <div className="flex-1 overflow-y-auto p-2">
      {loading ? (
        <div className="flex items-center justify-center h-full min-h-[200px]"><Spinner size="md" /></div>
      ) : !activity || activity.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
            <Icons.ClipboardList className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No recent activity found</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {activity.map((item, i) => {
            const isStudent = item.type === 'student'
            return (
              <li key={`${item.type}-${item.id}-${i}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/60 transition-colors group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow-sm
                  ${isStudent ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {item.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{item.name}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {isStudent ? 'Student enrolled' : 'Teacher added'} <span className="text-gray-300 mx-1">•</span> {item.detail}
                  </p>
                </div>
                <p className="text-xs font-medium text-gray-400 shrink-0 bg-gray-50 px-2 py-1 rounded-md">{formatDate(item.date)}</p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  </div>
)

// ── Attendance panel ──────────────────────────────────────────────────────────
const AttendancePanel = ({ present = 0, absent = 0, late = 0, total = 0, rate = 0, loading }) => {
  const pP = total > 0 ? (present / total) * 100 : 0
  const pL = total > 0 ? (late    / total) * 100 : 0
  const pA = total > 0 ? (absent  / total) * 100 : 0

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full opacity-50" />
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-bold text-gray-800">Today's Attendance</p>
          <p className="text-xs text-gray-500 mt-1">Live snapshot of school presence</p>
        </div>
        {!loading && total > 0 && (
          <div className={`flex flex-col items-end`}>
            <span className={`text-3xl font-black tracking-tight ${rate >= 80 ? 'text-emerald-500' : rate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
              {rate}%
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="h-4 bg-gray-100 rounded-full animate-pulse mb-6" />
        ) : total === 0 ? (
          <div className="h-4 bg-gray-100 rounded-full mb-6" />
        ) : (
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-6 shadow-inner bg-gray-100 p-0.5">
            {pP > 0 && <div className="bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-1000" style={{ width: `${pP}%` }} />}
            {pL > 0 && <div className="bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)] transition-all duration-1000" style={{ width: `${pL}%` }} />}
            {pA > 0 && <div className="bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all duration-1000" style={{ width: `${pA}%` }} />}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 bg-white/40 rounded-2xl p-4 border border-white/50">
          {[
            { label: 'Present', val: present, dot: 'bg-emerald-500', text: 'text-emerald-700' },
            { label: 'Late',    val: late,    dot: 'bg-amber-400',   text: 'text-amber-700' },
            { label: 'Absent',  val: absent,  dot: 'bg-red-500',     text: 'text-red-700' },
          ].map(({ label, val, dot, text }) => (
            <div key={label} className="flex flex-col items-center text-center p-2 rounded-xl hover:bg-white/50 transition-colors">
              <div className={`w-3 h-3 rounded-full mb-2 shadow-sm ${dot}`} />
              {loading
                ? <div className="w-8 h-6 bg-gray-200/50 rounded animate-pulse mb-1" />
                : <p className={`text-xl font-black ${text} leading-none mb-1`}>{val}</p>}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {!loading && total > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {total} total students tracked today
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
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
    { to: '/students',   label: 'Students',   desc: 'Manage enrolments',      icon: Icons.Users,         color: 'from-blue-500 to-cyan-500' },
    { to: '/teachers',   label: 'Teachers',   desc: 'Staff directories',      icon: Icons.AcademicCap,   color: 'from-purple-500 to-pink-500' },
    { to: '/attendance', label: 'Attendance', desc: 'Daily registers',        icon: Icons.ClipboardList, color: 'from-emerald-400 to-teal-500' },
    { to: '/exams',      label: 'Exams',      desc: 'Results & reports',      icon: Icons.BookOpen,      color: 'from-amber-400 to-orange-500' },
    { to: '/academics',  label: 'Academics',  desc: 'Classes & subjects',     icon: Icons.ChartBar,      color: 'from-indigo-500 to-blue-600' },
    { to: '/billing',    label: 'Billing',    desc: 'Subscription & invoices',icon: Icons.CreditCard,    color: 'from-rose-400 to-red-500' },
  ]

  return (
    <div className="space-y-8 pb-10">

      {/* ── Welcome Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 text-white shadow-2xl p-8 sm:p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-10 -mb-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold backdrop-blur-sm mb-4">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
               System Active
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Welcome back,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                {user?.school_name || 'Admin'}
              </span>
            </h1>
            <p className="text-white/60 text-lg font-medium mt-2 max-w-xl">
              Here's what's happening at your school today, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl self-start md:self-auto">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl shadow-lg">
                {user?.school_name?.charAt(0).toUpperCase() || 'A'}
             </div>
             <div className="pr-4">
                <p className="text-sm font-bold text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-indigo-300">School Administrator</p>
             </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-black text-gray-900 tracking-tight">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {QUICK_LINKS.map(({ to, label, desc, icon: IconComp, color }) => (
            <Link key={to} to={to}
              className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-xl rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 flex flex-col items-start gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
              
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <IconComp className="w-6 h-6 text-white" />
              </div>
              <div className="relative">
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Students Enrolled" value={stats?.students ?? null} sub="Total active students"
          icon={Icons.Users}        accent="text-blue-600 bg-blue-50 shadow-blue-500/20"   loading={statsLoading} to="/students" />
        <MetricCard label="Teaching Staff" value={stats?.teachers ?? null} sub="Active personnel"
          icon={Icons.AcademicCap}  accent="text-purple-600 bg-purple-50 shadow-purple-500/20" loading={statsLoading} to="/teachers" />
        <MetricCard label="Total Classes"  value={stats?.classes  ?? null} sub="Across all levels"
          icon={Icons.BookOpen}     accent="text-emerald-600 bg-emerald-50 shadow-emerald-500/20" loading={statsLoading} to="/academics" />
        <MetricCard label="Subjects" value={stats?.subjects ?? null} sub="Curriculum subjects"
          icon={Icons.ChartBar}     accent="text-amber-600 bg-amber-50 shadow-amber-500/20"  loading={statsLoading} to="/academics" />
      </div>

      {/* ── Main Layout Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-8 flex flex-col h-full">
           <AttendancePanel
             present={att.present} absent={att.absent} late={att.late}
             total={att.total} rate={att.rate} loading={statsLoading}
           />
           
           {/* Modules Management */}
           <div className="bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl overflow-hidden flex-1">
             <div className="px-6 py-5 border-b border-gray-100/50 bg-white/30 flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-gray-800">Module Configuration</p>
                 <p className="text-xs text-gray-500 mt-0.5">Toggle features for your school</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Icons.Cog className="w-4 h-4 text-indigo-500 animate-[spin_4s_linear_infinite]" />
               </div>
             </div>
             
             <div className="p-6">
               {modulesLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                   ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
           </div>
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
           <ActivityFeed activity={activity} loading={activityLoading} />
        </div>
        
      </div>
    </div>
  )
}

export default SchoolAdminDashboard
