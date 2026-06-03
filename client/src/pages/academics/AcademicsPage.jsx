import { useEffect, useState, useCallback } from 'react'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import Modal         from '../../components/ui/Modal'
import FormField     from '../../components/ui/FormField'
import Input         from '../../components/ui/Input'
import Spinner       from '../../components/ui/Spinner'
import EmptyState    from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  fetchClasses, createClass, updateClass, deleteClass, assignSubjectsToClass,
  fetchSubjects, createSubject, updateSubject, deleteSubject,
} from '../../services/academics.service'
import { getErrorMessage } from '../../utils/helpers'

const TABS = [
  { id: 'classes',  label: '📚  Classes' },
  { id: 'subjects', label: '📖  Subjects' },
]

// ── Reusable simple form ──────────────────────────────────────────────────────
const SimpleForm = ({ open, onClose, onSubmit, title, fields, initial = {}, loading }) => {
  const [form, setForm]   = useState(initial)
  const [err, setErr]     = useState('')

  useEffect(() => { setForm(initial); setErr('') }, [open])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    try { await onSubmit(form) }
    catch (e) { setErr(getErrorMessage(e)) }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {err && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>}
        {fields.map((f) => (
          <FormField key={f.name} label={f.label} required={f.required}>
            <Input value={form[f.name] || ''} onChange={set(f.name)} placeholder={f.placeholder} />
          </FormField>
        ))}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Assign Subjects Modal ─────────────────────────────────────────────────────
const AssignSubjectsModal = ({ open, onClose, cls, allSubjects, onSave, loading }) => {
  const currentIds = (cls?.subjects || []).map((s) => s.id)
  const [selected, setSelected] = useState(new Set(currentIds))

  useEffect(() => {
    setSelected(new Set((cls?.subjects || []).map((s) => s.id)))
  }, [cls, open])

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <Modal open={open} onClose={onClose} title={`Assign Subjects — ${cls?.name || ''}`} size="sm">
      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
        {allSubjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No subjects created yet.</p>
        ) : allSubjects.map((s) => (
          <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-900">{s.name}</span>
            {s.code && <span className="text-xs text-gray-400 font-mono">{s.code}</span>}
          </label>
        ))}
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
        <button onClick={onClose} disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
        <button onClick={() => onSave(cls.id, [...selected])} disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
          {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
          {loading ? 'Saving…' : 'Save Assignments'}
        </button>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('classes')

  // Classes
  const { data: classData, loading: classLoading, execute: loadClasses, setData: setClassData } =
    useApi(fetchClasses, { classes: [], pagination: {} })

  // Subjects
  const { data: subjectData, loading: subjectLoading, execute: loadSubjects, setData: setSubjectData } =
    useApi(fetchSubjects, { subjects: [], pagination: {} })

  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [assignTarget, setAssignTarget] = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadClasses(); loadSubjects() }, [loadClasses, loadSubjects])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ── Class handlers ────────────────────────────────────────────────────────
  const handleClassSubmit = async (form) => {
    if (!form.name?.trim()) throw new Error('Class name is required')
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateClass(editTarget.id, form)
        setClassData((p) => ({ ...p, classes: p.classes.map((c) => c.id === updated.id ? { ...c, ...updated } : c) }))
        showToast('Class updated')
      } else {
        const created = await createClass(form)
        setClassData((p) => ({ ...p, classes: [{ ...created, student_count: 0, subject_count: 0, subjects: [] }, ...p.classes] }))
        showToast('Class created')
      }
      setFormOpen(false); setEditTarget(null)
    } finally { setFormLoading(false) }
  }

  const handleDeleteClass = async () => {
    setDeleteLoading(true)
    try {
      await deleteClass(deleteTarget.id)
      setClassData((p) => ({ ...p, classes: p.classes.filter((c) => c.id !== deleteTarget.id) }))
      showToast('Class deleted'); setDeleteTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setDeleteLoading(false) }
  }

  const handleAssignSubjects = async (classId, subjectIds) => {
    setFormLoading(true)
    try {
      await assignSubjectsToClass(classId, subjectIds)
      await loadClasses()
      showToast('Subjects assigned'); setAssignTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setFormLoading(false) }
  }

  // ── Subject handlers ──────────────────────────────────────────────────────
  const handleSubjectSubmit = async (form) => {
    if (!form.name?.trim()) throw new Error('Subject name is required')
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateSubject(editTarget.id, form)
        setSubjectData((p) => ({ ...p, subjects: p.subjects.map((s) => s.id === updated.id ? updated : s) }))
        showToast('Subject updated')
      } else {
        const created = await createSubject(form)
        setSubjectData((p) => ({ ...p, subjects: [created, ...p.subjects] }))
        showToast('Subject created')
      }
      setFormOpen(false); setEditTarget(null)
    } finally { setFormLoading(false) }
  }

  const handleDeleteSubject = async () => {
    setDeleteLoading(true)
    try {
      await deleteSubject(deleteTarget.id)
      setSubjectData((p) => ({ ...p, subjects: p.subjects.filter((s) => s.id !== deleteTarget.id) }))
      showToast('Subject deleted'); setDeleteTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setDeleteLoading(false) }
  }

  const isClasses  = activeTab === 'classes'
  const items      = isClasses ? (classData?.classes || []) : (subjectData?.subjects || [])
  const isLoading  = isClasses ? classLoading : subjectLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academics"
        subtitle="Manage classes, subjects and their assignments."
        action={
          <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <span className="text-base leading-none">+</span>
            {isClasses ? 'Add Class' : 'Add Subject'}
          </button>
        }
      />

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditTarget(null); setFormOpen(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={isClasses ? '📚' : '📖'} title={`No ${isClasses ? 'classes' : 'subjects'} yet`}
            description={`Create your first ${isClasses ? 'class' : 'subject'} to get started.`} />
        ) : isClasses ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Class', 'Section', 'Students', 'Subjects', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{cls.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{cls.section || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{cls.student_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(cls.subjects || []).slice(0, 3).map((s) => (
                          <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s.name}</span>
                        ))}
                        {(cls.subjects || []).length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">+{cls.subjects.length - 3}</span>
                        )}
                        {(cls.subjects || []).length === 0 && <span className="text-gray-400 text-xs">None assigned</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setAssignTarget(cls)}
                          className="px-2.5 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition">Subjects</button>
                        <button onClick={() => { setEditTarget(cls); setFormOpen(true) }}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                        <button onClick={() => setDeleteTarget(cls)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Subject Name', 'Code', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{sub.code || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditTarget(sub); setFormOpen(true) }}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                        <button onClick={() => setDeleteTarget(sub)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class form */}
      {isClasses && (
        <SimpleForm open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSubmit={handleClassSubmit}
          title={editTarget ? 'Edit Class' : 'Add Class'}
          fields={[
            { name: 'name', label: 'Class Name', required: true, placeholder: 'e.g. JSS 1' },
            { name: 'section', label: 'Section', placeholder: 'e.g. A (optional)' },
          ]}
          initial={editTarget ? { name: editTarget.name, section: editTarget.section || '' } : {}}
          loading={formLoading}
        />
      )}

      {/* Subject form */}
      {!isClasses && (
        <SimpleForm open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }}
          onSubmit={handleSubjectSubmit}
          title={editTarget ? 'Edit Subject' : 'Add Subject'}
          fields={[
            { name: 'name', label: 'Subject Name', required: true, placeholder: 'e.g. Mathematics' },
            { name: 'code', label: 'Subject Code', placeholder: 'e.g. MTH101 (optional)' },
          ]}
          initial={editTarget ? { name: editTarget.name, code: editTarget.code || '' } : {}}
          loading={formLoading}
        />
      )}

      {/* Assign subjects modal */}
      <AssignSubjectsModal
        open={!!assignTarget} onClose={() => setAssignTarget(null)}
        cls={assignTarget} allSubjects={subjectData?.subjects || []}
        onSave={handleAssignSubjects} loading={formLoading}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={isClasses ? handleDeleteClass : handleDeleteSubject}
        title={`Delete ${isClasses ? 'Class' : 'Subject'}`}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete" loading={deleteLoading} variant="danger"
      />
    </div>
  )
}

export default AcademicsPage
