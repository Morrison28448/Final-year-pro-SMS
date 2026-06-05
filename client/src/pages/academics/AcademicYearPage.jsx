import { useEffect, useState } from 'react'
import useApi        from '../../hooks/useApi'
import Modal         from '../../components/ui/Modal'
import FormField     from '../../components/ui/FormField'
import Input         from '../../components/ui/Input'
import Spinner       from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Icons }     from '../../components/ui/icons'
import {
  fetchAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear,
  fetchClassLevels, saveClassLevels,
  enrolStudents, promoteStudents,
} from '../../services/academicYear.service'
import { fetchClasses } from '../../services/academics.service'
import { getErrorMessage } from '../../utils/helpers'

// ── Reusable weight builder (same pattern as TermsPage) ───────────────────────
const AssessmentBuilder = ({ assessments, onChange }) => {
  const total   = assessments.reduce((s, a) => s + parseFloat(a.weight || 0), 0)
  const isValid = Math.abs(total - 100) < 0.01
  const add    = () => onChange([...assessments, { name: '', weight: '', maxScore: '100' }])
  const remove = (i) => onChange(assessments.filter((_, idx) => idx !== i))
  const set    = (i, f, v) => onChange(assessments.map((a, idx) => idx === i ? { ...a, [f]: v } : a))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">Assessments</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {total.toFixed(0)}% / 100%
        </span>
      </div>
      {assessments.map((a, i) => (
        <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
          <input value={a.name} onChange={(e) => set(i, 'name', e.target.value)}
            placeholder="e.g. Midterm" className="col-span-5 px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400" />
          <div className="col-span-3 relative">
            <input type="number" min="1" max="100" value={a.weight} onChange={(e) => set(i, 'weight', e.target.value)}
              placeholder="%" className="w-full px-2.5 py-2 pr-5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
          </div>
          <div className="col-span-3 relative">
            <input type="number" min="1" value={a.maxScore} onChange={(e) => set(i, 'maxScore', e.target.value)}
              placeholder="Max" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gray-400" />
          </div>
          <div className="col-span-1">
            {assessments.length > 1 && (
              <button onClick={() => remove(i)} className="w-full flex justify-center text-gray-300 hover:text-red-500 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
      <button onClick={add} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Add component
      </button>
    </div>
  )
}

// ── Academic Year creation modal ──────────────────────────────────────────────
const DEFAULT_TERM = (n) => ({
  name: n === 1 ? 'First Semester' : n === 2 ? 'Second Semester' : `Term ${n}`,
  termNumber: n,
  assessments: [
    { name: 'Mid-Semester', weight: '30', maxScore: '100' },
    { name: 'End of Semester Exam', weight: '70', maxScore: '100' },
  ],
})

const CreateYearModal = ({ open, onClose, onSubmit, loading }) => {
  const [name, setName]           = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [numTerms, setNumTerms]   = useState(2)
  const [terms, setTerms]         = useState([DEFAULT_TERM(1), DEFAULT_TERM(2)])
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!open) { setName(''); setStartDate(''); setEndDate(''); setNumTerms(2); setTerms([DEFAULT_TERM(1), DEFAULT_TERM(2)]); setError('') }
  }, [open])

  const handleNumTermsChange = (n) => {
    const num = parseInt(n) || 1
    setNumTerms(num)
    setTerms(Array.from({ length: num }, (_, i) => terms[i] || DEFAULT_TERM(i + 1)))
  }

  const updateTerm = (i, field, val) =>
    setTerms((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  const updateAssessments = (i, assessments) =>
    setTerms((prev) => prev.map((t, idx) => idx === i ? { ...t, assessments } : t))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Academic year name is required'); return }
    for (const t of terms) {
      if (!t.name.trim()) { setError('All terms must have a name'); return }
      const total = t.assessments.reduce((s, a) => s + parseFloat(a.weight || 0), 0)
      if (Math.abs(total - 100) > 0.01) {
        setError(`${t.name}: assessment weights must sum to 100% (current: ${total.toFixed(0)}%)`); return
      }
      if (t.assessments.some((a) => !a.name.trim())) { setError(`${t.name}: all assessment names are required`); return }
    }
    try { await onSubmit({ name, startDate: startDate || undefined, endDate: endDate || undefined, terms }) }
    catch (err) { setError(getErrorMessage(err)) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Academic Year" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {/* Year info */}
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Academic Year Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2025/2026" />
          </FormField>
          <FormField label="Start Date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End Date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
        </div>

        {/* Number of semesters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-800">Number of Semesters / Terms</p>
            <p className="text-xs text-gray-400 mt-0.5">How many terms does this academic year have?</p>
          </div>
          <div className="flex gap-2 ml-auto">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" onClick={() => handleNumTermsChange(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition ${numTerms === n ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-4">
          {terms.map((term, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                  {i + 1}
                </div>
                <input
                  value={term.name}
                  onChange={(e) => updateTerm(i, 'name', e.target.value)}
                  placeholder={`Term ${i + 1} name`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div className="pl-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Assessment Components (must sum to 100%)
                </p>
                <AssessmentBuilder
                  assessments={term.assessments}
                  onChange={(a) => updateAssessments(i, a)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center gap-2">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Creating…' : 'Create Academic Year'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Class Level Progression modal ─────────────────────────────────────────────
const ClassLevelsModal = ({ open, onClose, classes, currentLevels, onSave, loading }) => {
  const [ordered, setOrdered] = useState([])
  const [graduating, setGraduating] = useState(null) // class_id of graduating class
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    // Pre-fill from existing levels or empty
    if (currentLevels.length > 0) {
      setOrdered(currentLevels.map((l) => l.class_id))
      const grad = currentLevels.find((l) => l.is_graduating)
      setGraduating(grad?.class_id || null)
    } else {
      setOrdered([])
      setGraduating(null)
    }
    setError('')
  }, [open, currentLevels])

  const unordered = classes.filter((c) => !ordered.includes(c.id))

  const addToOrder = (classId) => setOrdered((prev) => [...prev, classId])
  const removeFromOrder = (classId) => {
    setOrdered((prev) => prev.filter((id) => id !== classId))
    if (graduating === classId) setGraduating(null)
  }
  const moveUp   = (i) => { if (i === 0) return; const arr = [...ordered]; [arr[i-1], arr[i]] = [arr[i], arr[i-1]]; setOrdered(arr) }
  const moveDown = (i) => { if (i === ordered.length - 1) return; const arr = [...ordered]; [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; setOrdered(arr) }

  const handleSave = async () => {
    if (ordered.length === 0) { setError('Add at least one class to the progression'); return }
    if (!graduating) { setError('Mark the graduating (final) class'); return }
    setError('')
    const levels = ordered.map((classId, i) => ({
      classId, levelOrder: i + 1, isGraduating: classId === graduating,
    }))
    try { await onSave(levels) }
    catch (err) { setError(getErrorMessage(err)) }
  }

  const getClass = (id) => classes.find((c) => c.id === id)

  return (
    <Modal open={open} onClose={onClose} title="Class Progression Order" size="md">
      <div className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        <p className="text-xs text-gray-500 leading-relaxed">
          Drag classes into order from first year (bottom of school) to final year (graduating class).
          Students will be automatically moved up one level at year-end promotion.
        </p>

        {/* Ordered list */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progression Order</p>
          {ordered.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-xs text-gray-400">Click classes below to add them to the progression</p>
            </div>
          ) : (
            ordered.map((classId, i) => {
              const cls = getClass(classId)
              return (
                <div key={classId}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition
                    ${graduating === classId ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                  <span className="text-xs font-black text-gray-400 w-5 text-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{cls?.name}{cls?.section ? ` — ${cls.section}` : ''}</p>
                    {graduating === classId && (
                      <p className="text-[10px] text-amber-600 font-semibold">Graduating class</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setGraduating(graduating === classId ? null : classId)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition
                        ${graduating === classId ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-700'}`}>
                      Graduating
                    </button>
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === ordered.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button onClick={() => removeFromOrder(classId)} className="p-1 text-gray-400 hover:text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Available classes to add */}
        {unordered.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Classes</p>
            <div className="flex flex-wrap gap-2">
              {unordered.map((cls) => (
                <button key={cls.id} onClick={() => addToOrder(cls.id)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-900 hover:text-white transition">
                  + {cls.name}{cls.section ? ` — ${cls.section}` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center gap-2">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : 'Save Progression'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const AcademicYearPage = () => {
  const { data: years,  loading: yearsLoading,  execute: loadYears, setData: setYears } = useApi(fetchAcademicYears,  [])
  const { data: levels, loading: levelsLoading, execute: loadLevels, setData: setLevels } = useApi(fetchClassLevels, [])
  const { data: classData, execute: loadClasses } = useApi(fetchClasses, { classes: [] })

  const [createOpen, setCreateOpen]     = useState(false)
  const [levelsOpen, setLevelsOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [promoteTarget, setPromoteTarget] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [levelsLoading2, setLevelsLoading2] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [promoteLoading, setPromoteLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadYears(); loadLevels(); loadClasses() }, [loadYears, loadLevels, loadClasses])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  const handleCreate = async (payload) => {
    setCreateLoading(true)
    try {
      const year = await createAcademicYear(payload)
      setYears((prev) => [year, ...(prev || [])])
      setCreateOpen(false)
      showToast(`Academic year "${year.name}" created`)
    } catch (err) { throw err } finally { setCreateLoading(false) }
  }

  const handleSetActive = async (year) => {
    try {
      const updated = await updateAcademicYear(year.id, { isActive: true })
      setYears((prev) => (prev || []).map((y) => ({ ...y, is_active: y.id === updated.id })))
      showToast(`"${year.name}" set as active year`)
    } catch (err) { showToast(getErrorMessage(err), 'error') }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteAcademicYear(deleteTarget.id)
      setYears((prev) => (prev || []).filter((y) => y.id !== deleteTarget.id))
      showToast('Academic year deleted')
      setDeleteTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setDeleteLoading(false) }
  }

  const handleSaveLevels = async (levels) => {
    setLevelsLoading2(true)
    try {
      const saved = await saveClassLevels(levels)
      setLevels(saved)
      setLevelsOpen(false)
      showToast('Class progression saved')
    } catch (err) { throw err } finally { setLevelsLoading2(false) }
  }

  const handleEnrol = async (year) => {
    try {
      const result = await enrolStudents(year.id)
      showToast(`${result.enrolled} students enrolled in ${year.name}`)
    } catch (err) { showToast(getErrorMessage(err), 'error') }
  }

  const handlePromote = async () => {
    if (!promoteTarget) return
    const yearsList = years || []
    const currentIdx = yearsList.findIndex((y) => y.id === promoteTarget.id)
    // next year = the one before in the list (sorted newest first)
    const nextYear = yearsList[currentIdx - 1]
    if (!nextYear) { showToast('Create the next academic year first', 'error'); return }

    setPromoteLoading(true)
    try {
      const result = await promoteStudents(promoteTarget.id, nextYear.id)
      showToast(`Promotion complete: ${result.promoted} promoted, ${result.graduated} graduated`)
      setPromoteTarget(null)
      loadYears()
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setPromoteLoading(false) }
  }

  const classes = classData?.classes || []

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Academics</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Academic Years</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage academic years, terms, assessment weights and student progression.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setLevelsOpen(true)}
            className="px-4 py-2.5 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
            <Icons.ChartBar className="w-4 h-4" />
            Class Progression
          </button>
          <button onClick={() => setCreateOpen(true)}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Academic Year
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white max-w-xs ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Class progression summary */}
      {(levels || []).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class Progression</p>
            <button onClick={() => setLevelsOpen(true)} className="text-xs text-blue-600 hover:underline">Edit</button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(levels || []).map((l, i) => (
              <div key={l.class_id} className="flex items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${l.is_graduating ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-700'}`}>
                  {l.class_name}{l.section ? ` ${l.section}` : ''}
                  {l.is_graduating && ' 🎓'}
                </span>
                {i < (levels || []).length - 1 && (
                  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic years list */}
      {yearsLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (years || []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 gap-3">
          <Icons.BookOpen className="w-10 h-10 text-gray-200" />
          <p className="text-sm font-semibold text-gray-500">No academic years yet</p>
          <p className="text-xs text-gray-400">Create your first academic year to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(years || []).map((year) => (
            <div key={year.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${year.is_active ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-gray-100'}`}>

              {/* Year header */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-gray-900">{year.name}</h3>
                      {year.is_active && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                      {year.is_closed && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                          Closed
                        </span>
                      )}
                    </div>
                    {(year.start_date || year.end_date) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {year.start_date} {year.end_date ? `→ ${year.end_date}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!year.is_active && !year.is_closed && (
                    <button onClick={() => handleSetActive(year)}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition">
                      Set Active
                    </button>
                  )}
                  {year.is_active && (
                    <button onClick={() => handleEnrol(year)}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                      Enrol Students
                    </button>
                  )}
                  {year.is_active && (
                    <button onClick={() => setPromoteTarget(year)}
                      className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition">
                      Promote Students
                    </button>
                  )}
                  {!year.is_active && (
                    <button onClick={() => setDeleteTarget(year)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Terms */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(year.terms || []).map((term) => (
                  <div key={term.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-6 h-6 rounded-md bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        {term.term_number}
                      </div>
                      <p className="text-sm font-bold text-gray-900">{term.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      {(term.assessments || []).map((a) => (
                        <div key={a.id} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{a.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">{a.weight}%</span>
                            <span className="text-[10px] text-gray-400">/{a.max_score}</span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-gray-200 flex justify-between">
                        <span className="text-[10px] text-gray-400">Total</span>
                        <span className={`text-[10px] font-bold ${term.total_weight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {term.total_weight}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateYearModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} loading={createLoading} />

      <ClassLevelsModal
        open={levelsOpen} onClose={() => setLevelsOpen(false)}
        classes={classes} currentLevels={levels || []}
        onSave={handleSaveLevels} loading={levelsLoading2}
      />

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Academic Year"
        message={`Delete "${deleteTarget?.name}"? All terms and scores for this year will be permanently deleted.`}
        confirmLabel="Delete" loading={deleteLoading} variant="danger"
      />

      <ConfirmDialog
        open={!!promoteTarget} onClose={() => setPromoteTarget(null)} onConfirm={handlePromote}
        title="Promote Students"
        message={`This will move all students in "${promoteTarget?.name}" to the next class based on the progression order. Students in the graduating class will be marked as graduated. This action cannot be undone.`}
        confirmLabel="Promote All Students"
        loading={promoteLoading}
        variant="warning"
      />
    </div>
  )
}

export default AcademicYearPage
