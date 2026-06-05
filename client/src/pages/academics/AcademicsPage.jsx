import { useEffect, useState } from 'react'
import useApi        from '../../hooks/useApi'
import PageHeader    from '../../components/ui/PageHeader'
import Modal         from '../../components/ui/Modal'
import FormField     from '../../components/ui/FormField'
import Input         from '../../components/ui/Input'
import Select        from '../../components/ui/Select'
import Spinner       from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Icons }     from '../../components/ui/icons'
import {
  fetchClasses, createClass, updateClass, deleteClass,
  assignSubjectsToClass, assignTeacherToSubject,
  fetchSubjects, createSubject, updateSubject, deleteSubject,
} from '../../services/academics.service'
import { fetchTeachers } from '../../services/teacher.service'
import { getErrorMessage } from '../../utils/helpers'

// ── Simple single-field form modal ────────────────────────────────────────────
const SimpleForm = ({ open, onClose, onSubmit, title, fields, initial = {}, loading }) => {
  const [form, setForm] = useState(initial)
  const [err, setErr]   = useState('')

  useEffect(() => { setForm(initial); setErr('') }, [open])

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('')
    try { await onSubmit(form) }
    catch (e) { setErr(getErrorMessage(e)) }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {err && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{err}</div>}
        {fields.map((f) => (
          <FormField key={f.name} label={f.label} required={f.required}>
            <Input value={form[f.name] || ''} onChange={set(f.name)} placeholder={f.placeholder} />
          </FormField>
        ))}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center gap-2">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Assign Subjects + Teachers modal ──────────────────────────────────────────
const ClassSubjectsModal = ({ open, onClose, cls, allSubjects, allTeachers, onSaveSubjects, onAssignTeacher, loading }) => {
  const currentSubjectIds = (cls?.subjects || []).map((s) => s.subject_id)
  const [selected, setSelected] = useState(new Set(currentSubjectIds))
  const [savingTeacher, setSavingTeacher] = useState(null) // subject_id being saved
  const [step, setStep] = useState('subjects') // 'subjects' | 'teachers'

  useEffect(() => {
    setSelected(new Set((cls?.subjects || []).map((s) => s.subject_id)))
    setStep('subjects')
  }, [cls, open])

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const handleSaveSubjects = async () => {
    await onSaveSubjects(cls.id, [...selected])
    setStep('teachers')
  }

  const handleAssignTeacher = async (subjectId, teacherId) => {
    setSavingTeacher(subjectId)
    try { await onAssignTeacher(cls.id, subjectId, teacherId || null) }
    finally { setSavingTeacher(null) }
  }

  // Subjects assigned to this class (after save)
  const assignedSubjects = cls?.subjects || []

  return (
    <Modal open={open} onClose={onClose} title={cls?.name ? `${cls.name} — Subject & Teacher Setup` : 'Setup'} size="md">
      {/* Step tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[
          { id: 'subjects', label: '1. Assign Subjects' },
          { id: 'teachers', label: '2. Assign Teachers' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setStep(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${step === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Step 1: Subject selection */}
      {step === 'subjects' && (
        <>
          <div className="space-y-1 max-h-64 overflow-y-auto mb-5">
            {allSubjects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No subjects created yet. Add subjects first.</p>
            ) : allSubjects.map((s) => (
              <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                <span className="text-sm font-medium text-gray-900">{s.name}</span>
                {s.code && <span className="text-xs text-gray-400 font-mono ml-auto">{s.code}</span>}
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <button onClick={onClose} disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">
              Cancel
            </button>
            <button onClick={handleSaveSubjects} disabled={loading}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center gap-2">
              {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
              {loading ? 'Saving…' : `Save & Assign Teachers →`}
            </button>
          </div>
        </>
      )}

      {/* Step 2: Teacher assignment per subject */}
      {step === 'teachers' && (
        <>
          <p className="text-xs text-gray-500 mb-4">
            Assign a teacher to each subject. Teachers will only be able to enter scores for their assigned subjects.
          </p>
          {assignedSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Icons.BookOpen className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No subjects assigned to this class yet.</p>
              <button onClick={() => setStep('subjects')} className="text-xs text-blue-600 hover:underline">
                ← Go back to assign subjects
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {assignedSubjects.map((sub) => (
                <div key={sub.subject_id} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  {/* Subject info */}
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                    {sub.subject_code ? sub.subject_code.slice(0, 3) : sub.subject_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sub.subject_name}</p>
                    {sub.subject_code && <p className="text-[10px] text-gray-400 font-mono">{sub.subject_code}</p>}
                  </div>

                  {/* Teacher dropdown */}
                  <div className="w-48 shrink-0">
                    {savingTeacher === sub.subject_id ? (
                      <div className="flex justify-center"><Spinner size="sm" /></div>
                    ) : (
                      <Select
                        value={sub.teacher_id || ''}
                        onChange={(e) => handleAssignTeacher(sub.subject_id, e.target.value || null)}
                        className="text-xs"
                      >
                        <option value="">Unassigned</option>
                        {allTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.users?.first_name} {t.users?.last_name}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 mt-3">
            <button onClick={() => setStep('subjects')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              ← Back
            </button>
            <button onClick={onClose}
              className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition">
              Done
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('classes')

  const { data: classData,   loading: classLoading,   execute: loadClasses,  setData: setClassData }  = useApi(fetchClasses,  { classes: [], pagination: {} })
  const { data: subjectData, loading: subjectLoading, execute: loadSubjects, setData: setSubjectData } = useApi(fetchSubjects, { subjects: [], pagination: {} })
  const { data: teacherData, execute: loadTeachers }  = useApi(fetchTeachers, { teachers: [] })

  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [classSetupTarget, setClassSetupTarget] = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast]               = useState(null)

  useEffect(() => { loadClasses(); loadSubjects(); loadTeachers({ page: 1, limit: 100 }) }, [loadClasses, loadSubjects, loadTeachers])

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

  const handleSaveSubjects = async (classId, subjectIds) => {
    setFormLoading(true)
    try {
      await assignSubjectsToClass(classId, subjectIds)
      // Refresh classes to get updated subjects with teacher info
      await loadClasses()
      // Re-open modal at teacher step with fresh data
      const freshClass = (classData?.classes || []).find((c) => c.id === classId)
      if (freshClass) setClassSetupTarget(freshClass)
      showToast('Subjects saved')
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setFormLoading(false) }
  }

  const handleAssignTeacher = async (classId, subjectId, teacherId) => {
    const updated = await assignTeacherToSubject(classId, subjectId, teacherId)
    // Update local state
    setClassData((p) => ({
      ...p,
      classes: p.classes.map((c) => {
        if (c.id !== classId) return c
        return {
          ...c,
          subjects: c.subjects.map((s) =>
            s.subject_id === subjectId ? { ...s, teacher_id: updated.teacher_id, teacher_name: updated.teacher_name } : s
          ),
        }
      }),
    }))
    // Also refresh classSetupTarget
    setClassSetupTarget((prev) => {
      if (!prev || prev.id !== classId) return prev
      return {
        ...prev,
        subjects: prev.subjects.map((s) =>
          s.subject_id === subjectId ? { ...s, teacher_id: updated.teacher_id, teacher_name: updated.teacher_name } : s
        ),
      }
    })
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
  const teachers   = teacherData?.teachers || []

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Academics</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Classes & Subjects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage classes, create subjects, then assign each subject to a teacher.
          </p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
          className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition flex items-center gap-2 self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {isClasses ? 'Add Class' : 'Add Subject'}
        </button>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'classes',  label: 'Classes' },
          { id: 'subjects', label: 'Subjects' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setEditTarget(null); setFormOpen(false) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Icons.BookOpen className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No {isClasses ? 'classes' : 'subjects'} yet</p>
          </div>
        ) : isClasses ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60">
                  {['Class', 'Section', 'Students', 'Subjects & Teachers', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-gray-900">{cls.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{cls.section || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">{cls.student_count}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {cls.subjects?.length === 0 ? (
                        <span className="text-xs text-gray-400">None assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(cls.subjects || []).map((s) => (
                            <div key={s.subject_id} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                              <span className="text-xs font-semibold text-gray-700">{s.subject_code || s.subject_name}</span>
                              {s.teacher_name ? (
                                <span className="text-[10px] text-gray-500 border-l border-gray-300 pl-1">
                                  {s.teacher_name.split(' ').map((n) => n[0]).join('.')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-500 border-l border-gray-300 pl-1">unassigned</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => setClassSetupTarget(cls)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
                          Setup
                        </button>
                        <button onClick={() => { setEditTarget(cls); setFormOpen(true) }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget(cls)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          Delete
                        </button>
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
                <tr className="bg-gray-50/60">
                  {['Subject Name', 'Code', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{sub.name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{sub.code || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setEditTarget(sub); setFormOpen(true) }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                        <button onClick={() => setDeleteTarget(sub)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
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
            { name: 'name',    label: 'Class Name', required: true, placeholder: 'e.g. JSS 1' },
            { name: 'section', label: 'Section',                    placeholder: 'e.g. A (optional)' },
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
            { name: 'code', label: 'Subject Code',                 placeholder: 'e.g. MTH101 (optional)' },
          ]}
          initial={editTarget ? { name: editTarget.name, code: editTarget.code || '' } : {}}
          loading={formLoading}
        />
      )}

      {/* Class setup modal — subjects + teacher assignment */}
      <ClassSubjectsModal
        open={!!classSetupTarget}
        onClose={() => setClassSetupTarget(null)}
        cls={classSetupTarget}
        allSubjects={subjectData?.subjects || []}
        allTeachers={teachers}
        onSaveSubjects={handleSaveSubjects}
        onAssignTeacher={handleAssignTeacher}
        loading={formLoading}
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
