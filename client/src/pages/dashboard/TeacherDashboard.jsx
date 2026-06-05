import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import useApi        from '../../hooks/useApi'
import Spinner       from '../../components/ui/Spinner'
import {
  fetchMyClasses,
  fetchMyStudents,
} from '../../services/portal.service'
import { fetchAttendanceStats } from '../../services/attendance.service'
import { getInitials } from '../../utils/helpers'

// ── SVG icon set ──────────────────────────────────────────────────────────────
const Icon = {
  Users: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  BookOpen: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  TrendingUp: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  ClipboardCheck: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
    </svg>
  ),
  AcademicCap: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  CalendarDays: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
}

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sublabel, icon: IconComp, accent, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
        <IconComp className="w-5 h-5" />
      </div>
    </div>
    {loading ? (
      <div className="mt-4 h-9 w-14 bg-gray-100 rounded-lg animate-pulse" />
    ) : (
      <p className="mt-4 text-4xl font-black text-gray-900 tracking-tight">{value ?? '—'}</p>
    )}
    <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
    {sublabel && !loading && (
      <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
    )}
  </div>
)

// ── Attendance mini-chart (horizontal bars per day) ───────────────────────────
const AttendanceBar = ({ present = 0, absent = 0, late = 0, total = 0, rate = 0, loading }) => {
  const pPresent = total > 0 ? (present / total) * 100 : 0
  const pLate    = total > 0 ? (late    / total) * 100 : 0
  const pAbsent  = total > 0 ? (absent  / total) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance Overview</p>
        {!loading && total > 0 && (
          <span className={`text-sm font-black ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {rate}%
          </span>
        )}
      </div>

      {/* Stacked bar */}
      {loading ? (
        <div className="h-4 bg-gray-100 rounded-full animate-pulse mb-4" />
      ) : total === 0 ? (
        <div className="h-4 bg-gray-100 rounded-full mb-4" />
      ) : (
        <div className="flex h-4 rounded-full overflow-hidden gap-px mb-4">
          {pPresent > 0 && <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${pPresent}%` }} />}
          {pLate    > 0 && <div className="bg-amber-400 transition-all duration-700" style={{ width: `${pLate}%` }} />}
          {pAbsent  > 0 && <div className="bg-red-500 transition-all duration-700 rounded-r-full" style={{ width: `${pAbsent}%` }} />}
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
              {loading ? (
                <div className="w-6 h-4 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className={`text-sm font-bold ${text}`}>{val}</p>
              )}
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const { user } = useAuth()
  const [activeClass, setActiveClass] = useState(0)

  const { data: classData,   loading: classLoading,   execute: loadClasses }  = useApi(fetchMyClasses,       { classes: [] })
  const { data: studentData, loading: studentLoading, execute: loadStudents } = useApi(fetchMyStudents,      { students: [] })
  const { data: attStats,    loading: attLoading,     execute: loadAttStats } = useApi(fetchAttendanceStats, null)

  useEffect(() => {
    loadClasses()
    loadStudents()
    loadAttStats({})
  }, [loadClasses, loadStudents, loadAttStats])

  const classes  = classData?.classes   || []
  const students = studentData?.students || []
  const summary  = attStats?.summary    || {}

  // Students in the currently selected class
  const cls            = classes[activeClass]
  const classStudents  = cls
    ? students.filter((s) => s.classes?.id === cls.class_id || s.classes?.name === cls.class_name)
    : students

  const QUICK_LINKS = [
    { label: 'Mark Attendance', href: '/attendance', icon: Icon.CalendarDays,   desc: 'Record today\'s attendance' },
    { label: 'Enter Results',   href: '/exams',      icon: Icon.AcademicCap,    desc: 'Publish exam scores' },
    { label: 'View Students',   href: '/students',   icon: Icon.Users,          desc: 'Browse student profiles' },
    { label: 'Settings',        href: '/settings',   icon: Icon.ClipboardCheck, desc: 'Update your profile' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Teacher Portal</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.school_name}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── Metrics row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="My Classes"
          value={classLoading ? null : classes.length}
          sublabel={classes.length === 1 ? '1 class assigned' : `${classes.length} classes assigned`}
          icon={Icon.BookOpen}
          accent="bg-blue-50 text-blue-600"
          loading={classLoading}
        />
        <MetricCard
          label="My Students"
          value={studentLoading ? null : students.length}
          sublabel="Across all classes"
          icon={Icon.Users}
          accent="bg-purple-50 text-purple-600"
          loading={studentLoading}
        />
        <MetricCard
          label="Attendance Rate"
          value={attLoading ? null : summary.rate !== undefined ? `${summary.rate}%` : '—'}
          sublabel={summary.total ? `${summary.total} total records` : 'No records yet'}
          icon={Icon.TrendingUp}
          accent={summary.rate >= 80 ? 'bg-emerald-50 text-emerald-600' : summary.rate >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}
          loading={attLoading}
        />
      </div>

      {/* ── Main content: classes + students ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Class list + subject pills */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Classes</p>
          </div>

          {classLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Icon.BookOpen className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No classes assigned yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {classes.map((cls, i) => (
                <li key={cls.class_id}>
                  <button
                    onClick={() => setActiveClass(i)}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors
                      ${activeClass === i ? 'bg-gray-900' : 'hover:bg-gray-50/60'}`}
                  >
                    {/* Class initial */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0
                      ${activeClass === i ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-700'}`}>
                      {cls.class_name?.charAt(0) || 'C'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${activeClass === i ? 'text-white' : 'text-gray-900'}`}>
                        {cls.class_name}
                        {cls.section && <span className={`font-normal ${activeClass === i ? 'text-gray-300' : 'text-gray-400'}`}> — {cls.section}</span>}
                      </p>
                      <p className={`text-xs mt-0.5 ${activeClass === i ? 'text-gray-400' : 'text-gray-400'}`}>
                        {cls.subjects?.length || 0} subject{cls.subjects?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <Icon.ChevronRight className={`w-4 h-4 shrink-0 ${activeClass === i ? 'text-gray-500' : 'text-gray-300'}`} />
                  </button>

                  {/* Subject pills — shown for active class */}
                  {activeClass === i && (cls.subjects || []).length > 0 && (
                    <div className="px-5 pb-4 bg-gray-900 flex flex-wrap gap-1.5">
                      {cls.subjects.map((sub) => (
                        <span key={sub.id}
                          className="px-2.5 py-1 rounded-lg bg-white/10 text-white/70 text-[11px] font-semibold">
                          {sub.code || sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Students in selected class */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {cls ? `${cls.class_name} Students` : 'All Students'}
            </p>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
              {classStudents.length}
            </span>
          </div>

          {studentLoading ? (
            <div className="flex items-center justify-center flex-1 py-12"><Spinner size="md" /></div>
          ) : classStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 gap-2">
              <Icon.Users className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No students in this class</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[380px] flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Adm. No.</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classStudents.map((s) => {
                    const initials = getInitials(s.users?.first_name, s.users?.last_name)
                    // Deterministic color from name
                    const colors   = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-indigo-600']
                    const color    = colors[initials.charCodeAt(0) % colors.length]
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {s.users?.first_name} {s.users?.last_name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{s.users?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {s.admission_number || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-500">
                          {s.classes?.name}
                          {s.classes?.section ? ` — ${s.classes.section}` : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: attendance bar + quick links ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <AttendanceBar
            present={summary.present}
            absent={summary.absent}
            late={summary.late}
            total={summary.total}
            rate={summary.rate}
            loading={attLoading}
          />
        </div>

        {/* Quick links */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ label, href, icon: IconComp, desc }) => (
            <a
              key={label}
              href={href}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                  <IconComp className="w-4 h-4 text-white" />
                </div>
                <Icon.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
