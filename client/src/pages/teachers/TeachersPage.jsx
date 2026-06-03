import { useEffect, useState, useCallback } from 'react'
import useApi              from '../../hooks/useApi'
import PageHeader          from '../../components/ui/PageHeader'
import Modal               from '../../components/ui/Modal'
import FormField           from '../../components/ui/FormField'
import Input               from '../../components/ui/Input'
import Badge               from '../../components/ui/Badge'
import Spinner             from '../../components/ui/Spinner'
import EmptyState          from '../../components/ui/EmptyState'
import ConfirmDialog       from '../../components/ui/ConfirmDialog'
import PasswordRevealModal from '../../components/ui/PasswordRevealModal'
import {
  fetchTeachers, createTeacher, updateTeacher,
  deleteTeacher, resetTeacherPassword,
} from '../../services/teacher.service'
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers'

// ── Teacher Form ──────────────────────────────────────────────────────────────
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', employeeId: '', qualification: '', specialization: '' }

const TeacherForm = ({ open, onClose, onSubmit, teacher = null, loading = false }) => {
  const isEdit = !!teacher
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitErr, setSubmitErr] = useState('')

  useEffect(() => {
    if (teacher) {
      setForm({
        firstName:      teacher.users?.first_name    || '',
        lastName:       teacher.users?.last_name     || '',
        email:          teacher.users?.email         || '',
        phone:          teacher.users?.phone         || '',
        employeeId:     teacher.employee_id          || '',
        qualification:  teacher.qualification        || '',
        specialization: teacher.specialization       || '',
      })
    } else { setForm(EMPTY) }
    setErrors({})
    setSubmitErr('')
  }, [teacher, open])

  const set = (f) => (e) => { setForm((p) => ({ ...p, [f]: e.target.value })); setErrors((p) => ({ ...p, [f]: '' })) }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim())  errs.lastName  = 'Required'
    if (!form.email.trim())     errs.email     = 'Required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitErr('')
    try {
      await onSubmit({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone || undefined,
        employeeId: form.employeeId || undefined,
        qualification: form.qualification || undefined,
        specialization: form.specialization || undefined,
      })
    } catch (err) { setSubmitErr(getErrorMessage(err)) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Teacher' : 'Add Teacher'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitErr}</div>}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" required error={errors.firstName}>
            <Input value={form.firstName} onChange={set('firstName')} placeholder="John" error={!!errors.firstName} />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <Input value={form.lastName} onChange={set('lastName')} placeholder="Doe" error={!!errors.lastName} />
          </FormField>
        </div>
        <FormField label="Email" required error={errors.email}>
          <Input type="email" value={form.email} onChange={set('email')} placeholder="teacher@school.com" disabled={isEdit} error={!!errors.email} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" />
          </FormField>
          <FormField label="Employee ID">
            <Input value={form.employeeId} onChange={set('employeeId')} placeholder="EMP-001" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Qualification">
            <Input value={form.qualification} onChange={set('qualification')} placeholder="B.Sc Education" />
          </FormField>
          <FormField label="Specialization">
            <Input value={form.specialization} onChange={set('specialization')} placeholder="Mathematics" />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TeachersPage = () => {
  const { data, loading, execute: load, setData } = useApi(fetchTeachers, { teachers: [], pagination: {} })
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetLoading, setResetLoading]   = useState(null) // holds teacher id
  const [pwModal, setPwModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { load({ page, limit: 10, search }) }, [page, search, load])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateTeacher(editTarget.id, payload)
        setData((p) => ({ ...p, teachers: p.teachers.map((t) => t.id === updated.id ? updated : t) }))
        showToast('Teacher updated')
        setFormOpen(false); setEditTarget(null)
      } else {
        // createTeacher returns { teacher, generatedPassword }
        const result = await createTeacher(payload)
        setPage(1); load({ page: 1, limit: 10, search })
        setFormOpen(false); setEditTarget(null)
        // Show password reveal modal
        setPwModal({
          name:     `${result.teacher?.users?.first_name} ${result.teacher?.users?.last_name}`,
          email:    result.teacher?.users?.email,
          password: result.generatedPassword,
          isReset:  false,
        })
      }
    } catch (err) { throw err } finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteTeacher(deleteTarget.id)
      setData((p) => ({ ...p, teachers: p.teachers.filter((t) => t.id !== deleteTarget.id) }))
      showToast('Teacher deleted'); setDeleteTarget(null)
    } catch (err) { showToast(getErrorMessage(err), 'error') } finally { setDeleteLoading(false) }
  }

  const handleResetPassword = async (teacher) => {
    setResetLoading(teacher.id)
    try {
      const result = await resetTeacherPassword(teacher.id)
      setPwModal({
        name:     result.name,
        email:    result.email,
        password: result.generatedPassword,
        isReset:  true,
      })
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setResetLoading(null)
    }
  }

  const teachers   = data?.teachers   || []
  const pagination = data?.pagination || {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle="Manage teaching staff profiles and assignments."
        action={
          <button onClick={() => { setEditTarget(null); setFormOpen(true) }}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <span className="text-base leading-none">+</span> Add Teacher
          </button>
        }
      />

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All Teachers</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pagination.total || 0} teacher(s)</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, ID…"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Search</button>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : teachers.length === 0 ? (
          <EmptyState icon="👨‍🏫" title="No teachers found" description={search ? `No results for "${search}"` : 'Add your first teacher.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Teacher', 'Employee ID', 'Qualification', 'Specialization', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {getInitials(t.users?.first_name, t.users?.last_name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.users?.first_name} {t.users?.last_name}</p>
                          <p className="text-xs text-gray-400">{t.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{t.employee_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.qualification || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.specialization || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={t.users?.is_active ? 'Active' : 'Inactive'} variant={t.users?.is_active ? 'success' : 'danger'} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => { setEditTarget(t); setFormOpen(true) }}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                        <button
                          onClick={() => handleResetPassword(t)}
                          disabled={resetLoading === t.id}
                          className="px-2.5 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-lg hover:bg-yellow-100 disabled:opacity-50 transition">
                          {resetLoading === t.id ? '…' : '🔑 Reset'}
                        </button>
                        <button onClick={() => setDeleteTarget(t)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
            </div>
          </div>
        )}
      </div>

      <TeacherForm open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }}
        onSubmit={handleFormSubmit} teacher={editTarget} loading={formLoading} />

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Teacher"
        message={`Delete ${deleteTarget?.users?.first_name} ${deleteTarget?.users?.last_name}? This will permanently remove their account.`}
        confirmLabel="Delete Teacher" loading={deleteLoading} variant="danger" />

      <PasswordRevealModal
        open={!!pwModal}
        onClose={() => setPwModal(null)}
        name={pwModal?.name}
        email={pwModal?.email}
        password={pwModal?.password}
        isReset={pwModal?.isReset}
      />
    </div>
  )
}

export default TeachersPage
