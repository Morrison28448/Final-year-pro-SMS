import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import useApi     from '../../hooks/useApi'
import PageHeader from '../../components/ui/PageHeader'
import Select     from '../../components/ui/Select'
import FormField  from '../../components/ui/FormField'
import Spinner    from '../../components/ui/Spinner'
import { Icons }  from '../../components/ui/icons'
import { useAuth } from '../../context/AuthContext'

// ── Services ──────────────────────────────────────────────────────────────────
import { fetchAcademicYears }  from '../../services/academicYear.service'
import {
  fetchAssessmentSheet,
  saveAssessmentScores,
  uploadScores,
  fetchExamClasses,
  fetchSubjectsForClass,
} from '../../services/term.service'
import {
  fetchMyTeacherClasses,
  fetchMyTeacherSubjects,
} from '../../services/academics.service'
import api from '../../api/axios'
import { getErrorMessage } from '../../utils/helpers'

// ── Grade colour ──────────────────────────────────────────────────────────────
const gradeColor = (g) => {
  if (!g) return 'text-gray-300'
  if (g.startsWith('A')) return 'text-emerald-600 font-bold'
  if (g === 'B') return 'text-blue-600 font-bold'
  if (g === 'C') return 'text-amber-600 font-bold'
  if (g === 'D') return 'text-orange-600 font-bold'
  return 'text-red-600 font-bold'
}

// ── Step indicator ────────────────────────────────────────────────────────────
const Steps = ({ steps, current }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {steps.map(({ label, done }, i) => (
      <div key={label} className="flex items-center gap-1.5">
        {i > 0 && <div className="w-3 h-px bg-gray-200" />}
        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg transition
          ${done ? 'bg-gray-900 text-white' : i === current ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-400'}`}>
          {done && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>}
          {label}
        </span>
      </div>
    ))}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const ScoreEntryPage = () => {
  const { user }  = useAuth()
  const isTeacher = user?.role === 'teacher'
  const fileRef   = useRef(null)

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: academicYears, loading: yearsLoading, execute: loadYears } =
    useApi(fetchAcademicYears, [])

  const { data: allClasses, loading: allClassesLoading, execute: loadAllClasses } =
    useApi(fetchExamClasses, [])
  const { data: myClasses, loading: myClassesLoading, execute: loadMyClasses } =
    useApi(fetchMyTeacherClasses, [])

  // ── Cascading selectors ───────────────────────────────────────────────────
  const [yearId,       setYearId]       = useState('')
  const [termId,       setTermId]       = useState('')
  const [assessmentId, setAssessmentId] = useState('')
  const [classId,      setClassId]      = useState('')
  const [subjectId,    setSubjectId]    = useState('')

  const [subjects,        setSubjects]        = useState([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // ── Sheet ─────────────────────────────────────────────────────────────────
  const [sheet,        setSheet]        = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [scores,       setScores]       = useState({})
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [toast,        setToast]        = useState(null)

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadYears()
    if (isTeacher) loadMyClasses()
    else loadAllClasses()
  }, [loadYears, isTeacher, loadMyClasses, loadAllClasses])

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedYear  = (academicYears || []).find((y) => y.id === yearId)
  const yearTerms     = selectedYear?.terms || []
  const selectedTerm  = yearTerms.find((t) => t.id === termId)
  const assessments   = selectedTerm?.assessments || []
  const classList     = isTeacher ? (myClasses || []) : (allClasses || [])

  // ── Reset cascade downstream ──────────────────────────────────────────────
  useEffect(() => { setTermId(''); setAssessmentId(''); setClassId(''); setSubjectId(''); setSubjects([]); setSheet(null); setScores({}) }, [yearId])
  useEffect(() => { setAssessmentId(''); setClassId(''); setSubjectId(''); setSubjects([]); setSheet(null); setScores({}) }, [termId])
  useEffect(() => { setClassId(''); setSubjectId(''); setSubjects([]); setSheet(null); setScores({}) }, [assessmentId])

  // ── Load subjects when class changes ─────────────────────────────────────
  useEffect(() => {
    if (!classId) { setSubjects([]); setSubjectId(''); setSheet(null); setScores({}); return }
    setSubjectsLoading(true)
    ;(isTeacher ? fetchMyTeacherSubjects(classId) : fetchSubjectsForClass(classId))
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false))
    setSubjectId(''); setSheet(null); setScores({})
  }, [classId, isTeacher])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4500)
  }

  const setScore   = (sid, val) => setScores((p) => ({ ...p, [sid]: { ...p[sid], score: val } }))
  const setRemarks = (sid, val) => setScores((p) => ({ ...p, [sid]: { ...p[sid], remarks: val } }))

  // ── Load score sheet ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!assessmentId || !classId || !subjectId) { setSheet(null); setScores({}); return }
    setSheetLoading(true)
    fetchAssessmentSheet(assessmentId, { classId, subjectId })
      .then((data) => {
        setSheet(data)
        const s = {}
        ;(data.sheet || []).forEach((r) => {
          s[r.student_id] = { score: r.score !== '' ? String(r.score) : '', remarks: r.remarks || '' }
        })
        setScores(s)
      })
      .catch((err) => showToast(getErrorMessage(err), 'error'))
      .finally(() => setSheetLoading(false))
  }, [assessmentId, classId, subjectId])

  const handleSave = async () => {
    const entries = Object.entries(scores)
      .filter(([, v]) => v.score !== '' && !isNaN(parseFloat(v.score)))
      .map(([student_id, v]) => ({ student_id, score: parseFloat(v.score), remarks: v.remarks }))
    if (!entries.length) { showToast('Enter at least one score before saving.', 'error'); return }
    setSaving(true)
    try {
      await saveAssessmentScores(assessmentId, { subjectId, entries })
      showToast(`${entries.length} score(s) saved`)
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally { setSaving(false) }
  }

  const handleDownloadTemplate = () => {
    api.get(`/terms/assessment/${assessmentId}/template`, {
      params: { classId, subjectId }, responseType: 'blob',
    }).then((res) => {
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = 'scores_template.csv'
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    }).catch(() => showToast('Failed to download template', 'error'))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const csvText = await file.text()
      const result  = await uploadScores(assessmentId, { classId, subjectId, csvText })
      showToast(`${result.results?.length || 0} scores imported`)
      if (result.warnings?.length) showToast(`Warnings: ${result.warnings.join('; ')}`, 'error')
      const updated = await fetchAssessmentSheet(assessmentId, { classId, subjectId })
      setSheet(updated)
      const s = {}
      ;(updated.sheet || []).forEach((r) => { s[r.student_id] = { score: r.score !== '' ? String(r.score) : '', remarks: r.remarks || '' } })
      setScores(s)
    } catch (err) { showToast(getErrorMessage(err), 'error') }
    finally { setUploading(false); e.target.value = '' }
  }

  const enteredCount  = Object.values(scores).filter((v) => v.score !== '' && !isNaN(parseFloat(v.score))).length
  const totalStudents = sheet?.sheet?.length || 0

  const stepData = [
    { label: 'Academic Year', done: !!yearId },
    { label: 'Term',          done: !!termId },
    { label: 'Assessment',    done: !!assessmentId },
    { label: 'Class',         done: !!classId },
    { label: 'Subject',       done: !!subjectId },
  ]
  const currentStep = stepData.findIndex((s) => !s.done)

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <Link to="/exams" className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score Entry</p>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            {selectedYear && selectedTerm
              ? `${selectedYear.name} — ${selectedTerm.name}`
              : 'Select academic year to begin'}
          </h1>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white max-w-sm
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Selector panel */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Make Your Selections</p>
          <Steps steps={stepData} current={currentStep} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* 1 — Academic Year */}
          <FormField label="Academic Year">
            <Select value={yearId} onChange={(e) => setYearId(e.target.value)} disabled={yearsLoading}>
              <option value="">{yearsLoading ? 'Loading…' : 'Select year…'}</option>
              {(academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}{y.is_active ? ' ★' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          {/* 2 — Term */}
          <FormField label="Term / Semester">
            <Select value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!yearId || yearTerms.length === 0}>
              <option value="">
                {!yearId ? '— select year first —' : yearTerms.length === 0 ? 'No terms' : 'Select term…'}
              </option>
              {yearTerms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormField>

          {/* 3 — Assessment */}
          <FormField label="Assessment">
            <Select value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} disabled={!termId || assessments.length === 0}>
              <option value="">
                {!termId ? '— select term first —' : assessments.length === 0 ? 'No assessments' : 'Select assessment…'}
              </option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.weight}%)</option>
              ))}
            </Select>
          </FormField>

          {/* 4 — Class */}
          <FormField label="Class">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)}
              disabled={!assessmentId || (isTeacher ? myClassesLoading : allClassesLoading)}>
              <option value="">
                {!assessmentId ? '— select assessment first —' : 'Select class…'}
              </option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>
              ))}
            </Select>
          </FormField>

          {/* 5 — Subject */}
          <FormField label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              disabled={!classId || subjectsLoading}>
              <option value="">
                {!classId ? '— select class first —'
                  : subjectsLoading ? 'Loading subjects…'
                  : subjects.length === 0 ? isTeacher ? 'No subjects assigned to you' : 'No subjects'
                  : 'Select subject…'}
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      {/* Score sheet */}
      {sheetLoading && (
        <div className="card flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!sheetLoading && sheet && (
        <div className="card overflow-hidden">
          {/* Sheet header */}
          <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {sheet.assessment?.name}
                <span className="text-gray-400 font-normal"> · {sheet.subject?.name}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Max: <strong className="text-gray-700">{sheet.assessment?.max_score}</strong>
                {' · '}Weight: <strong className="text-gray-700">{sheet.assessment?.weight}%</strong> of term grade
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl
                ${enteredCount === totalStudents && totalStudents > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {enteredCount} / {totalStudents} entered
              </span>
              <button onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                CSV Template
              </button>
              <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition cursor-pointer">
                {uploading ? <Spinner size="sm" /> : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
                Upload CSV
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* Table */}
          {sheet.sheet?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Icons.Users className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No students enrolled in this class</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-8">#</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Adm. No.</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Score <span className="font-normal text-gray-300">/ {sheet.assessment?.max_score}</span>
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Remarks</th>
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sheet.sheet.map((student, idx) => {
                      const val   = scores[student.student_id] || { score: '', remarks: '' }
                      const num   = parseFloat(val.score)
                      const pct   = !isNaN(num) ? (num / sheet.assessment.max_score) * 100 : null
                      const grade = pct !== null
                        ? pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'
                        : null
                      return (
                        <tr key={student.student_id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="px-5 py-3 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                          </td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {student.admission_number || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="number" min="0" max={sheet.assessment?.max_score} step="0.5"
                              value={val.score}
                              onChange={(e) => setScore(student.student_id, e.target.value)}
                              placeholder="—"
                              className="w-20 px-2.5 py-1.5 text-center text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition"
                            />
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell">
                            <input
                              type="text" value={val.remarks}
                              onChange={(e) => setRemarks(student.student_id, e.target.value)}
                              placeholder="Optional note…"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 transition"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-sm ${grade ? gradeColor(grade) : 'text-gray-300'}`}>
                              {grade || '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save bar */}
              <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
                <p className="text-xs text-gray-500">
                  {enteredCount} of {totalStudents} scores entered
                  {enteredCount === totalStudents && totalStudents > 0 && (
                    <span className="ml-2 text-emerald-600 font-semibold">— all done</span>
                  )}
                </p>
                <button onClick={handleSave} disabled={saving || enteredCount === 0}
                  className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2">
                  {saving && <Spinner size="sm" className="border-white border-t-transparent" />}
                  {saving ? 'Saving…' : 'Save Scores'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!sheetLoading && !sheet && (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <Icons.ClipboardList className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-semibold text-gray-500">
            {!yearId       ? 'Start by selecting an academic year'
              : !termId    ? 'Select a term / semester'
              : !assessmentId ? 'Select an assessment component'
              : !classId   ? 'Select your class'
              : 'Select a subject to load the score sheet'}
          </p>
          {!yearId && (academicYears || []).length === 0 && !yearsLoading && (
            <Link to="/academic-years"
              className="mt-1 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition">
              Create Academic Year →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default ScoreEntryPage
