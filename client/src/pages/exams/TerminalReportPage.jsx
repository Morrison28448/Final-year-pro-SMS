import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import useApi     from '../../hooks/useApi'
import PageHeader from '../../components/ui/PageHeader'
import Select     from '../../components/ui/Select'
import FormField  from '../../components/ui/FormField'
import Spinner    from '../../components/ui/Spinner'
import { Icons }  from '../../components/ui/icons'
import { fetchAcademicYears }  from '../../services/academicYear.service'
import {
  fetchTerminalReport,
  fetchExamClasses,
} from '../../services/term.service'

const gradeColor = (grade) => {
  if (!grade) return 'text-gray-400'
  if (grade.startsWith('A')) return 'text-emerald-700 bg-emerald-50'
  if (grade === 'B') return 'text-blue-700 bg-blue-50'
  if (grade === 'C') return 'text-amber-700 bg-amber-50'
  if (grade === 'D') return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

const TerminalReportPage = () => {
  const [params]  = useSearchParams()

  const { data: academicYears, loading: yearsLoading, execute: loadYears } =
    useApi(fetchAcademicYears, [])
  const { data: classes, loading: classesLoading, execute: loadClasses } =
    useApi(fetchExamClasses, [])

  const [yearId,        setYearId]        = useState('')
  const [termId,        setTermId]        = useState(params.get('termId') || '')
  const [selectedClass, setSelectedClass] = useState('')
  const [report,        setReport]        = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const selectedYear = (academicYears || []).find((y) => y.id === yearId)
  const yearTerms    = selectedYear?.terms || []

  useEffect(() => { loadYears(); loadClasses() }, [loadYears, loadClasses])
  useEffect(() => { setTermId(''); setSelectedClass(''); setReport(null) }, [yearId])
  useEffect(() => { setSelectedClass(''); setReport(null) }, [termId])

  useEffect(() => {
    if (!termId || !selectedClass) return
    setReportLoading(true)
    fetchTerminalReport(termId, selectedClass)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false))
  }, [selectedClass, termId])

  const assessments = term?.assessments || []
  const students    = report?.students  || []
  const subjects    = report?.subjects  || []

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/exams" className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <PageHeader
          title="Terminal Report"
          subtitle={
            yearId && termId
              ? `${selectedYear?.name} — ${yearTerms.find((t) => t.id === termId)?.name}`
              : 'Select academic year and term'
          }
        />
      </div>

      {/* Class selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <FormField label="Academic Year">
            <Select value={yearId} onChange={(e) => setYearId(e.target.value)} disabled={yearsLoading}>
              <option value="">{yearsLoading ? 'Loading…' : 'Select year…'}</option>
              {(academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.is_active ? ' ★' : ''}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Term / Semester">
            <Select value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!yearId || yearTerms.length === 0}>
              <option value="">{!yearId ? '— select year first —' : 'Select term…'}</option>
              {yearTerms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Select Class">
            <Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={!termId || classesLoading}>
              <option value="">{!termId ? '— select term first —' : 'Choose a class…'}</option>
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>
              ))}
            </Select>
          </FormField>

          {/* Assessment weights summary */}
          {termId && (
            <div className="flex flex-wrap gap-1.5">
              {(yearTerms.find((t) => t.id === termId)?.assessments || []).map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-semibold">
                  {a.name}: {a.weight}%
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report table */}
      {reportLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : report && students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-2">
          <Icons.AcademicCap className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No students or no scores entered yet for this class</p>
        </div>
      ) : report && students.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Terminal Report Card</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {classes?.find((c) => c.id === selectedClass)?.name} · {students.length} students
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10 w-8">Rank</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-8 bg-gray-50 z-10 min-w-[160px]">Student</th>
                  {/* Per-subject columns */}
                  {subjects.map((sub) => (
                    <th key={sub.id} className="px-3 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[90px]">
                      <div>{sub.code || sub.name?.slice(0, 8)}</div>
                      {/* Per-assessment sub-columns */}
                      <div className="flex justify-center gap-1 mt-1">
                        {assessments.map((a) => (
                          <span key={a.id} className="text-[8px] font-normal text-gray-300 px-1 bg-gray-100 rounded">{a.weight}%</span>
                        ))}
                        <span className="text-[8px] font-bold text-gray-500 px-1 bg-gray-200 rounded">TOTAL</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px]">Average</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-400 sticky left-0 bg-white">{student.rank}</td>
                    <td className="px-4 py-3 sticky left-8 bg-white">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-[11px] font-mono text-gray-400">{student.admission_number || '—'}</p>
                    </td>
                    {student.subjects.map((sub) => (
                      <td key={sub.subject_id} className="px-3 py-3">
                        <div className="flex justify-center items-center gap-1">
                          {/* Raw scores per assessment */}
                          {assessments.map((a) => (
                            <span key={a.id} className={`text-xs px-1.5 py-0.5 rounded ${sub.scores[a.id] !== null && sub.scores[a.id] !== undefined ? 'text-gray-700 bg-gray-100' : 'text-gray-300'}`}>
                              {sub.scores[a.id] !== null && sub.scores[a.id] !== undefined ? sub.scores[a.id] : '—'}
                            </span>
                          ))}
                          {/* Terminal score */}
                          <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                            {sub.terminal_score !== undefined ? sub.terminal_score.toFixed(1) : '—'}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <span className="text-base font-black text-gray-900">{student.average.toFixed(1)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColor(student.overall_grade)}`}>
                        {student.overall_grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Class stats footer */}
          <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/30 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Class Average', val: students.length > 0 ? (students.reduce((s, st) => s + st.average, 0) / students.length).toFixed(1) : '—' },
              { label: 'Highest',       val: students.length > 0 ? Math.max(...students.map((s) => s.average)).toFixed(1) : '—' },
              { label: 'Lowest',        val: students.length > 0 ? Math.min(...students.map((s) => s.average)).toFixed(1) : '—' },
              { label: 'Total Students', val: students.length },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <p className="text-lg font-black text-gray-900">{val}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-2">
          <Icons.ChartBar className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">
            {!yearId ? 'Select an academic year to begin'
              : !termId ? 'Select a term to continue'
              : 'Select a class to generate the terminal report'}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default TerminalReportPage
