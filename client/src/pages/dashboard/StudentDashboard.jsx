import { useEffect } from 'react'
import { useAuth }   from '../../context/AuthContext'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import StatCard      from '../../components/ui/StatCard'
import Badge         from '../../components/ui/Badge'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import {
  fetchMyAttendance,
  fetchMyResults,
  fetchMyTimetable,
} from '../../services/portal.service'
import { formatDate } from '../../utils/helpers'

const gradeVariant = (grade) => {
  if (!grade) return 'neutral'
  if (grade.startsWith('A')) return 'success'
  if (grade === 'B') return 'info'
  if (grade === 'C') return 'warning'
  return 'danger'
}

const StudentDashboard = () => {
  const { user } = useAuth()

  const { data: attData,  loading: attLoading,  execute: loadAtt }       = useApi(fetchMyAttendance,  { records: [], summary: {} })
  const { data: resData,  loading: resLoading,  execute: loadResults }   = useApi(fetchMyResults,     { exams: [] })
  const { data: ttData,   loading: ttLoading,   execute: loadTimetable } = useApi(fetchMyTimetable,   { subjects: [] })

  useEffect(() => {
    loadAtt()
    loadResults()
    loadTimetable()
  }, [loadAtt, loadResults, loadTimetable])

  const summary  = attData?.summary  || {}
  const exams    = resData?.exams    || []
  const subjects = ttData?.subjects  || []

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title={`Welcome, ${user?.first_name} 👋`}
        subtitle={`${user?.school_name || 'Your school'} · Student Portal`}
      />

      {/* ── Attendance stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Present"  value={summary.present ?? null} icon="✅" color="green"
          loading={attLoading} trend={`of ${summary.total || 0} days`} />
        <StatCard title="Absent"   value={summary.absent  ?? null} icon="❌" color="red"    loading={attLoading} />
        <StatCard title="Late"     value={summary.late    ?? null} icon="⏰" color="yellow" loading={attLoading} />
        <StatCard title="Rate"
          value={summary.rate !== undefined ? `${summary.rate}%` : null}
          icon="📊"
          color={summary.rate >= 80 ? 'green' : summary.rate >= 60 ? 'yellow' : 'red'}
          loading={attLoading}
        />
      </div>

      {/* ── Attendance rate bar ──────────────────────────────── */}
      {!attLoading && summary.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Overall Attendance Rate</span>
            <span className="font-bold text-gray-900">{summary.rate}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700
                ${summary.rate >= 80 ? 'bg-green-500' : summary.rate >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{ width: `${summary.rate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {summary.present} present · {summary.absent} absent · {summary.late} late · {summary.total} total days
          </p>
        </div>
      )}

      {/* ── Two-column: Results + Subjects ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Exam Results */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Exam Results</h3>
            <span className="text-xs text-gray-400">{exams.length} exam(s)</span>
          </div>

          {resLoading ? (
            <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
          ) : exams.length === 0 ? (
            <EmptyState icon="📝" title="No results yet" description="Your exam results will appear here once published." />
          ) : (
            <div className="divide-y divide-gray-100">
              {exams.map((exam) => (
                <div key={exam.exam_id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{exam.exam_name}</p>
                      <p className="text-xs text-gray-400">{formatDate(exam.exam_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{exam.average}</p>
                      <p className="text-xs text-gray-400">avg</p>
                    </div>
                  </div>
                  {/* Subject scores */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {exam.subjects.map((sub) => (
                      <div key={sub.subject_code || sub.subject_name}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500">{sub.subject_code || sub.subject_name}:</span>
                        <span className="text-xs font-semibold text-gray-900">{sub.score}</span>
                        <Badge label={sub.grade || '—'} variant={gradeVariant(sub.grade)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects / Timetable */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">My Subjects</h3>
            <span className="text-xs text-gray-400">{subjects.length} subject(s)</span>
          </div>

          {ttLoading ? (
            <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
          ) : subjects.length === 0 ? (
            <EmptyState icon="📚" title="No subjects assigned" description="Subjects will appear here once your class is set up." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {subjects.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                    {sub.teacher_name && (
                      <p className="text-xs text-gray-400">👨‍🏫 {sub.teacher_name}</p>
                    )}
                  </div>
                  {sub.code && (
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Recent attendance ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Recent Attendance</h3>
        </div>
        {attLoading ? (
          <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
        ) : (attData?.records || []).length === 0 ? (
          <EmptyState icon="📋" title="No attendance records" description="Your attendance will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Date', 'Class', 'Status', 'Remarks'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(attData?.records || []).slice(0, 10).map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700 text-xs">{formatDate(rec.attendance_date)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {rec.classes?.name}{rec.classes?.section ? ` · ${rec.classes.section}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        variant={rec.status === 'present' ? 'success' : rec.status === 'late' ? 'warning' : 'danger'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{rec.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard
