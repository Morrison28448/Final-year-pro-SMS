import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import useApi        from '../../hooks/useApi'
import Spinner       from '../../components/ui/Spinner'
import {
  fetchMyAttendance,
  fetchMyResults,
  fetchMyTimetable,
} from '../../services/portal.service'

// ── SVG icons ─────────────────────────────────────────────────────────────────
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
  Book: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  AcademicCap: (p) => (
    <svg {...p} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
}

// ── Grade helpers ─────────────────────────────────────────────────────────────
const gradeColor = (grade) => {
  if (!grade) return { text: 'text-gray-400', bg: 'bg-gray-50', bar: 'bg-gray-300' }
  if (grade.startsWith('A')) return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500' }
  if (grade === 'B') return { text: 'text-blue-700', bg: 'bg-blue-50', bar: 'bg-blue-500' }
  if (grade === 'C') return { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-400' }
  if (grade === 'D') return { text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-400' }
  return { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-500' }
}

const statusStyle = (s) => {
  if (s === 'present') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (s === 'late')    return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

// ── Score bar ─────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const pct   = Math.min(100, Math.max(0, score))
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
  const { bar } = gradeColor(grade)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 tabular-nums w-9 text-right">
        {score.toFixed(1)}%
      </span>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard = ({ label, value, icon: IconComp, accent, loading, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
      <IconComp className="w-5 h-5" />
    </div>
    {loading ? (
      <div className="mt-4 h-8 w-14 bg-gray-100 rounded-lg animate-pulse" />
    ) : (
      <p className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">{value ?? '—'}</p>
    )}
    <p className="mt-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
    {sub && !loading && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

// ── Main ──────────────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth()
  const [activeTermIdx, setActiveTermIdx] = useState(0)

  const { data: attData,  loading: attLoading,  execute: loadAtt }     = useApi(fetchMyAttendance, { records: [], summary: {} })
  const { data: resData,  loading: resLoading,  execute: loadResults } = useApi(fetchMyResults,    { terms: [] })
  const { data: ttData,   loading: ttLoading,   execute: loadTimetable } = useApi(fetchMyTimetable, { subjects: [] })

  useEffect(() => { loadAtt(); loadResults(); loadTimetable() }, [loadAtt, loadResults, loadTimetable])

  const summary  = attData?.summary  || {}
  const terms    = resData?.terms    || []
  const subjects = ttData?.subjects  || []
  const records  = (attData?.records || []).slice(0, 8)
  const term     = terms[activeTermIdx]

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Student Portal</p>
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

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Present"  value={summary.present}  icon={Icon.CheckCircle}
          accent="bg-emerald-50 text-emerald-600" loading={attLoading}
          sub={summary.total ? `of ${summary.total} days` : undefined} />
        <MetricCard label="Absent"   value={summary.absent}   icon={Icon.XCircle}
          accent="bg-red-50 text-red-500" loading={attLoading} />
        <MetricCard label="Late"     value={summary.late}     icon={Icon.Clock}
          accent="bg-amber-50 text-amber-500" loading={attLoading} />
        <MetricCard label="Subjects" value={subjects.length || null} icon={Icon.Book}
          accent="bg-blue-50 text-blue-600" loading={ttLoading} />
      </div>

      {/* Attendance rate */}
      {!attLoading && summary.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">Overall Attendance Rate</span>
            <span className="font-black text-gray-900">{summary.rate}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700
                ${summary.rate >= 80 ? 'bg-emerald-500' : summary.rate >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
              style={{ width: `${summary.rate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {summary.present} present · {summary.absent} absent · {summary.late} late · {summary.total} total days
          </p>
        </div>
      )}

      {/* Results + Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Results — one terminal score per subject per term */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Results</p>
            {terms.length > 1 && (
              <div className="flex gap-1">
                {terms.map((t, i) => (
                  <button key={t.term_id} onClick={() => setActiveTermIdx(i)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all
                      ${i === activeTermIdx ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    {t.term_name?.split(' ')[0] || `Term ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {resLoading ? (
            <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
          ) : terms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Icon.AcademicCap className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No results published yet</p>
            </div>
          ) : term ? (
            <div className="p-5">
              {/* Term header */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-50">
                <div>
                  <p className="text-base font-bold text-gray-900">{term.term_name}</p>
                  {term.academic_year_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{term.academic_year_name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">{term.average.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">average</p>
                </div>
              </div>

              {/* One row per subject — shows computed terminal % + grade */}
              <div className="space-y-3">
                {(term.subjects || []).map((sub) => {
                  const { text, bg } = gradeColor(sub.grade)
                  return (
                    <div key={sub.subject_id} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{sub.subject_name}</p>
                        {sub.subject_code && (
                          <p className="text-[10px] text-gray-400">{sub.subject_code}</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <ScoreBar score={sub.terminal_score} />
                      </div>
                      <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${bg} ${text}`}>
                        {sub.grade}
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
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Subjects</p>
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

      {/* Recent attendance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Attendance</p>
        </div>
        {attLoading ? (
          <div className="flex items-center justify-center py-8"><Spinner size="md" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-sm text-gray-400">No attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60">
                  {['Date', 'Class', 'Status', 'Remarks'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">
                      {new Date(rec.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {rec.classes?.name}{rec.classes?.section ? ` · ${rec.classes.section}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusStyle(rec.status)}`}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{rec.remarks || '—'}</td>
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
