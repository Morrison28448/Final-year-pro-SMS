import { useEffect } from 'react'
import { useAuth }   from '../../context/AuthContext'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import StatCard      from '../../components/ui/StatCard'
import Badge         from '../../components/ui/Badge'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  fetchMyClasses,
  fetchMyStudents,
} from '../../services/portal.service'
import { fetchAttendanceStats } from '../../services/attendance.service'
import { getInitials } from '../../utils/helpers'

const TeacherDashboard = () => {
  const { user } = useAuth()

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

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title={`Welcome, ${user?.first_name} 👋`}
        subtitle={`${user?.school_name || 'Your school'} · Teacher Portal`}
      />

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Classes"
          value={classLoading ? null : classes.length}
          icon="📚"
          color="blue"
          loading={classLoading}
        />
        <StatCard
          title="My Students"
          value={studentLoading ? null : students.length}
          icon="🎓"
          color="purple"
          loading={studentLoading}
        />
        <StatCard
          title="Attendance Rate"
          value={attLoading ? null : summary.rate !== undefined ? `${summary.rate}%` : '—'}
          icon="✅"
          color={summary.rate >= 80 ? 'green' : summary.rate >= 60 ? 'yellow' : 'red'}
          loading={attLoading}
          trend="Across all classes"
        />
      </div>

      {/* ── Two-column: Classes + Students ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* My Classes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">My Classes</h3>
            <span className="text-xs text-gray-400">{classes.length} class(es)</span>
          </div>

          {classLoading ? (
            <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
          ) : classes.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No classes assigned"
              description="You haven't been assigned to any classes yet."
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {classes.map((cls) => (
                <li key={cls.class_id} className="px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {cls.class_name}
                        {cls.section && <span className="text-gray-400 font-normal"> · {cls.section}</span>}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(cls.subjects || []).map((sub) => (
                          <span key={sub.id}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {sub.code || sub.name}
                          </span>
                        ))}
                        {cls.subjects?.length === 0 && (
                          <span className="text-xs text-gray-400">No subjects assigned</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {cls.subjects?.length || 0} subject(s)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* My Students */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">My Students</h3>
            <span className="text-xs text-gray-400">{students.length} student(s)</span>
          </div>

          {studentLoading ? (
            <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
          ) : students.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="No students yet"
              description="Students in your assigned classes will appear here."
            />
          ) : (
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                    {getInitials(s.users?.first_name, s.users?.last_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {s.users?.first_name} {s.users?.last_name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {s.classes?.name}{s.classes?.section ? ` · ${s.classes.section}` : ''}
                      {s.admission_number ? ` · ${s.admission_number}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mark Attendance', href: '/attendance', icon: '✅', color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'View Students',   href: '/students',   icon: '🎓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Exams & Results', href: '/exams',      icon: '📝', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Settings',        href: '/settings',   icon: '⚙️', color: 'bg-gray-50 text-gray-700 border-gray-200' },
          ].map(({ label, href, icon, color }) => (
            <a key={label} href={href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center hover:shadow-sm transition ${color}`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
