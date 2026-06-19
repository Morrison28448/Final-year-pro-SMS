import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import Modal         from '../../components/ui/Modal'
import FormField     from '../../components/ui/FormField'
import Input         from '../../components/ui/Input'
import Spinner       from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Icons }     from '../../components/ui/icons'
import {
  fetchTerms, createTerm, updateTerm, deleteTerm,
} from '../../services/term.service'
import { getErrorMessage } from '../../utils/helpers'

// ── Assessment weight builder ─────────────────────────────────────────────────
const DEFAULT_ASSESSMENTS = [
  { name: 'Midterm Exam',  weight: '30', maxScore: '100' },
  { name: 'Final Exam',    weight: '70', maxScore: '100' },
]

const AssessmentBuilder = ({ assessments, onChange }) => {
  const totalWeight = assessments.reduce((s, a) => s + parseFloat(a.weight || 0), 0)
  const isValid     = Math.abs(totalWeight - 100) < 0.01

  const add = () => onChange([...assessments, { name: '', weight: '', maxScore: '100' }])
  const remove = (i) => onChange(assessments.filter((_, idx) => idx !== i))
  const set = (i, field, val) => onChange(assessments.map((a, idx) => idx === i ? { ...a, [field]: val } : a))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-sm font-bold text-gray-900">Assessment Components</label>
          <p className="text-[10px] text-gray-500 mt-0.5">Define grading components. Weights must total exactly 100%.</p>
        </div>
        <div className={`flex flex-col items-end`}>
          <div className={`text-xs font-black px-2.5 py-1 rounded-lg ${isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200 shadow-sm animate-pulse'}`}>
            {totalWeight.toFixed(0)}% / 100%
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {assessments.map((a, i) => (
          <div key={i} className="flex gap-3 items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors group">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Component Name</label>
              <Input
                value={a.name}
                onChange={(e) => set(i, 'name', e.target.value)}
                placeholder="e.g. Midterm Exam"
                className="bg-white border-none shadow-sm focus:ring-indigo-500/20"
              />
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Weight %</label>
              <div className="relative">
                <Input
                  type="number" min="1" max="100"
                  value={a.weight}
                  onChange={(e) => set(i, 'weight', e.target.value)}
                  placeholder="%"
                  className="bg-white border-none shadow-sm pr-6 focus:ring-indigo-500/20 font-bold text-indigo-700"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-300">%</span>
              </div>
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Max Score</label>
              <Input
                type="number" min="1"
                value={a.maxScore}
                onChange={(e) => set(i, 'maxScore', e.target.value)}
                placeholder="Total"
                className="bg-white border-none shadow-sm focus:ring-indigo-500/20"
              />
            </div>
            <div className="w-8 flex justify-center pt-5">
              {assessments.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={add}
        className="w-full py-3 mt-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Add Another Component
      </button>

      {/* Visual weight bar */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
          {assessments.map((a, i) => {
            const w = parseFloat(a.weight || 0)
            if (w <= 0) return null
            const colors = ['bg-indigo-500', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400']
            return (
              <div key={i} style={{ width: `${w}%` }} className={`h-full ${colors[i % colors.length]} border-r border-white/20 last:border-0 transition-all duration-500`} title={`${a.name}: ${w}%`} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Term form modal ───────────────────────────────────────────────────────────
const TermForm = ({ open, onClose, onSubmit, term = null, loading = false }) => {
  const isEdit = !!term
  const [name, setName]           = useState('')
  const [academicYear, setYear]   = useState('')
  const [assessments, setAss]     = useState(DEFAULT_ASSESSMENTS)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (term) {
      setName(term.name || '')
      setYear(term.academic_year || '')
    } else {
      setName(''); setYear('')
      setAss(DEFAULT_ASSESSMENTS)
    }
    setError('')
  }, [term, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const total = assessments.reduce((s, a) => s + parseFloat(a.weight || 0), 0)
    if (!isEdit && Math.abs(total - 100) > 0.01) {
      setError('Assessment weights must sum to 100%'); return
    }
    try {
      await onSubmit({ name, academicYear, assessments: isEdit ? undefined : assessments })
    } catch (err) { setError(getErrorMessage(err)) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Term' : 'Create New Term'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-sm font-semibold text-red-700 shadow-sm flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}
        
        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Term Name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. First Semester" className="bg-white" />
            </FormField>
            <FormField label="Academic Year (Optional)">
              <Input value={academicYear} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2025/2026" className="bg-white" />
            </FormField>
          </div>
        </div>

        {!isEdit && (
          <div className="px-1">
            <AssessmentBuilder assessments={assessments} onChange={setAss} />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-5 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-60 transition-all shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Term'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TermsPage = () => {
  const { data: terms, loading, execute: load, setData } = useApi(fetchTerms, [])
  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast]             = useState(null)

  useEffect(() => { load() }, [load])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateTerm(editTarget.id, payload)
        setData((prev) => (prev || []).map((t) => t.id === updated.id ? { ...t, ...updated } : t))
        showToast('Term updated')
      } else {
        await createTerm(payload)
        load()
        showToast('Term created')
      }
      setFormOpen(false); setEditTarget(null)
    } catch (err) { throw err } finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteTerm(deleteTarget.id)
      setData((prev) => (prev || []).filter((t) => t.id !== deleteTarget.id))
      showToast('Term deleted'); setDeleteTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setDeleteLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <PageHeader
        title="Terms & Assessments"
        subtitle="Create academic terms and configure weighted assessment components."
        action={
          <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Term
          </button>
        }
      />

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : (terms || []).length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-3">
          <Icons.BookOpen className="w-10 h-10 text-gray-200" />
          <p className="text-base font-semibold text-gray-500">No terms yet</p>
          <p className="text-sm text-gray-400">Create your first term to start managing assessments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(terms || []).map((term) => (
            <div key={term.id} className="card overflow-hidden">
              {/* Term header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold text-gray-900">{term.name}</h3>
                    {term.is_active && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>
                  {term.academic_year && (
                    <p className="text-xs text-gray-400">{term.academic_year}</p>
                  )}
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => { setEditTarget(term); setFormOpen(true) }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(term)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Assessment weights */}
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assessment Components</p>
                {(term.assessments || []).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{a.name}</span>
                        <span className="font-bold text-gray-900">{a.weight}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full transition-all duration-700"
                          style={{ width: `${a.weight}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">/{a.max_score}</span>
                  </div>
                ))}

                {/* Action buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-50 mt-3">
                  <Link
                    to={`/exams/entry?termId=${term.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition">
                    <Icons.ClipboardList className="w-3.5 h-3.5" />
                    Enter Scores
                  </Link>
                  <Link
                    to={`/exams/report?termId=${term.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
                    <Icons.ChartBar className="w-3.5 h-3.5" />
                    Terminal Report
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TermForm
        open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleSubmit} term={editTarget} loading={formLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Term"
        message={`Delete "${deleteTarget?.name}"? All assessment scores for this term will also be permanently deleted.`}
        confirmLabel="Delete Term" loading={deleteLoading} variant="danger"
      />
    </div>
  )
}

export default TermsPage
