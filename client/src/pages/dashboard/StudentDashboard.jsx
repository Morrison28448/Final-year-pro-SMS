import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import useApi        from '../../hooks/useApi'
import Spinner       from '../../components/ui/Spinner'
import {
  fetchMyAttendance,
  fetchMyResults,
  fetchMyTimetable,
} from '../../services/portal.service'
import { formatDate } from '../../utils/helpers'

// ── SVG icons (no emojis) ─────────────────────────────────────────────────────
const Icon = {
  CheckCircle: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ChartBar: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Book: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  AcademicCap: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  User: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
}

// ── Grade color helper ────────────────────────────────────────────────────────
const gradeColor = (grade) => {
  if (!grade) return { text: 'text-gray-400', bg: 'bg-gray-50', bar: 'bg-gray-300' }
  if (grade.startsWith('A')) return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' }
  if (grade === 'B') return { text: 'text-blue-700', bg: 'bg-blue-50', bar: 'bg-blue-500' }
  if (grade === 'C') return { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-400' }
  if (grade === 'D') return { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-400' }
  return { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-500' }
}

const statusStyle = (status) => {
  if (status === 'present') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (status === 'late')    return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, delta, icon: IconComp, accentClass, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
        <IconComp className="w-5 h-5" />
      </div>
      {delta !== undefined && !loading && (
        <span className="text-xs font-medium text-gray-400">{delta}</span>
      )}
    </div>
    {loading ? (
      <div className="mt-4 h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
    ) : (
      <p className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">{value ?? '—'}</p>
    )}
    <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
  </div>
)

// ── Radial gauge ─────────────────────────────────────────────────────────────
const RadialGauge = ({ rate = 0, loading }) => {
  const radius = 52
  const circ   = 2 * Math.PI * radius
  const offset = circ - (rate / 100) * circ
  const color  = rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
          {!loading && (
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <div className="w-10 h-6 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-2xl font-black text-gray-900">{rate}%</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Rate</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ score, max = 100 }) => {
  const pct = Math.min(100, (score / max) * 100)
  const { bar } = gradeColor(
    score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F'
  )
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-7 text-right">{score}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeExam, setActiveExam] = useState(0)

  const { data: attData,  loading: attLoading,  execute: loadAtt }       = useApi(fetchMyAttendance,  { records: [], summary: {} })
  const { data: resData,  loading: resLoading,  execute: loadResults }   = useApi(fetchMyResults,     { exams: [] })
  const { data: ttData,   loading: ttLoading,   execute: loadTimetable } = useApi(fetchMyTimetable,   { subjects: [] })

  useEffect(() => { loadAtt(); loadResults(); loadTimetable() }, [loadAtt, loadResults, loadTimetable])

  const summary  = attData?.summary  || {}
  const exams    = resData?.exams    || []
  const subjects = ttData?.subjects  || []
  const records  = (attData?.records || []).slice(0, 8)
  const exam     = exams[activeExam]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Student Portal
          </p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.school_name}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm self-start">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Metric row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Present" value={summary.present}
          delta={summary.total ? `of ${summary.total} days` : undefined}
          icon={Icon.CheckCircle} accentClass="bg-emerald-50 text-emerald-600" loading={attLoading} />
        <MetricCard label="Absent" value={summary.absent}
          icon={Icon.XCircle} accentClass="bg-red-50 text-red-500" loading={attLoading} />
        <MetricCard label="Late" value={summary.late}
          icon={Icon.Clock} accentClass="bg-amber-50 text-amber-500" loading={attLoading} />
        <MetricCard label="Subjects" value={subjects.length || null}
          icon={Icon.Book} accentClass="bg-blue-50 text-blue-600" loading={ttLoading} />
      </div>

      {/* ── Middle row: gauge + attendance log + subjects ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance gauge */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest self-start w-full">
            Attendance Rate
          </p>
          <RadialGauge rate={summary.rate || 0} loading={attLoading} />
          {!attLoading && summary.total > 0 && (
            <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
              {[
                { label: 'Present', val: summary.present, cls: 'bg-emerald-500' },
                { label: 'Late',    val: summary.late,    cls: 'bg-amber-400' },
                { label: 'Absent',  val: summary.absent,  cls: 'bg-red-500' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="text-center">
                  <div className={`w-2 h-2 rounded-full ${cls} mx-auto mb-1`} />
                  <p className="text-base font-bold text-gray-900">{val}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent attendance log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recent Attendance</p>
            <span className="text-xs text-gray-400">{records.length} records</span>
          </div>
          {attLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Icon.ChartBar className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Class</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-gray-700">{formatDate(rec.attendance_date)}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {rec.classes?.name}{rec.classes?.section ? ` — ${rec.classes.section}` : ''}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle(rec.status)}`}>
                          {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{rec.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: exam results + subjects ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Exam results */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Exam Results</p>
            {exams.length > 1 && (
              <div className="flex gap-1">
                {exams.map((e, i) => (
                  <button
                    key={e.exam_id}
                    onClick={() => setActiveExam(i)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${i === activeExam ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {e.exam_name?.split(' ')[0] || `Exam ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {resLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Icon.AcademicCap className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No results published yet</p>
            </div>
          ) : exam ? (
            <div className="p-5">
              {/* Exam header */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-50">
                <div>
                  <p className="text-base font-bold text-gray-900">{exam.exam_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(exam.exam_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">{exam.average}</p>
                  <p className="text-xs text-gray-400">average</p>
                </div>
              </div>

              {/* Subject scores */}
              <div className="space-y-3">
                {exam.subjects.map((sub) => {
                  const { text, bg } = gradeColor(sub.grade)
                  return (
                    <div key={sub.subject_code || sub.subject_name} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{sub.subject_name || sub.subject_code}</p>
                        {sub.subject_code && sub.subject_name && (
                          <p className="text-[10px] text-gray-400">{sub.subject_code}</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <ScoreBar score={parseFloat(sub.score) || 0} />
                      </div>
                      <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${bg} ${text}`}>
                        {sub.grade || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Subjects */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">My Subjects</p>
            <span className="text-xs text-gray-400">{subjects.length}</span>
          </div>
          {ttLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Icon.Book className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No subjects assigned</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 overflow-y-auto max-h-[340px]">
              {subjects.map((sub, i) => (
                <li key={sub.id || i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      {sub.code ? sub.code.slice(0, 3) : sub.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{sub.name}</p>
                      {sub.teacher_name && (
                        <p className="text-xs text-gray-400 truncate">{sub.teacher_name}</p>
                      )}
                    </div>
                  </div>
                  {sub.code && (
                    <span className="shrink-0 ml-2 text-[10px] font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {sub.code}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
