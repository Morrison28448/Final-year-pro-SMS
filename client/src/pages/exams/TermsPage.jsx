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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">Assessment Components</label>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {totalWeight.toFixed(0)}% / 100%
        </div>
      </div>

      {assessments.map((a, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-5">
            <Input
              value={a.name}
              onChange={(e) => set(i, 'name', e.target.value)}
              placeholder="e.g. Midterm Exam"
            />
          </div>
          <div className="col-span-3">
            <div className="relative">
              <Input
                type="number" min="1" max="100"
                value={a.weight}
                onChange={(e) => set(i, 'weight', e.target.value)}
                placeholder="Weight %"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
          <div className="col-span-3">
            <div className="relative">
              <Input
                type="number" min="1"
                value={a.maxScore}
                onChange={(e) => set(i, 'maxScore', e.target.value)}
                placeholder="Max score"
              />
            </div>
          </div>
          <div className="col-span-1 flex justify-end pt-1">
            {assessments.length > 1 && (
              <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button onClick={add}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Component
        </button>
        {!isValid && (
          <p className="text-xs text-red-600">Weights must sum to exactly 100%</p>
        )}
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Term' : 'Create New Term'} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Term Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="First Semester 2025/2026" />
          </FormField>
          <FormField label="Academic Year">
            <Input value={academicYear} onChange={(e) => setYear(e.target.value)} placeholder="2025/2026" />
          </FormField>
        </div>

        {!isEdit && (
          <div className="pt-2 border-t border-gray-100">
            <AssessmentBuilder assessments={assessments} onChange={setAss} />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center gap-2">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <Icons.BookOpen className="w-10 h-10 text-gray-200" />
          <p className="text-base font-semibold text-gray-500">No terms yet</p>
          <p className="text-sm text-gray-400">Create your first term to start managing assessments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(terms || []).map((term) => (
            <div key={term.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
