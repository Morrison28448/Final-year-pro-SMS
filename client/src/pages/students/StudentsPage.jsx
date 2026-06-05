import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import useApi              from '../../hooks/useApi'
import PageHeader          from '../../components/ui/PageHeader'
import Button              from '../../components/ui/Button'
import StudentsTable       from '../../components/students/StudentsTable'
import StudentForm         from '../../components/students/StudentForm'
import ConfirmDialog       from '../../components/ui/ConfirmDialog'
import PasswordRevealModal from '../../components/ui/PasswordRevealModal'
import {
  fetchStudents,
  fetchClasses,
  createStudent,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
} from '../../services/student.service'
import { getErrorMessage } from '../../utils/helpers'

const StudentsPage = () => {
  const { isSchoolAdmin } = useAuth()
  const canManage = isSchoolAdmin

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    data:    studentsData,
    loading: studentsLoading,
    execute: loadStudents,
    setData: setStudentsData,
  } = useApi(fetchStudents, { students: [], pagination: {} })

  const { data: classes, execute: loadClasses } = useApi(fetchClasses, [])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [resetLoading, setResetLoading]   = useState(null) // holds student id being reset

  // Password reveal modal state
  const [pwModal, setPwModal] = useState(null) // { name, email, password, isReset }

  const [toast, setToast] = useState(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadClasses() }, [loadClasses])
  useEffect(() => { loadStudents({ page, limit: 10, search }) }, [page, search, loadStudents])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback((term) => { setSearch(term); setPage(1) }, [])
  const openCreate   = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit     = (student) => { setEditTarget(student); setFormOpen(true) }
  const closeForm    = () => { setFormOpen(false); setEditTarget(null) }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateStudent(editTarget.id, payload)
        setStudentsData((prev) => ({
          ...prev,
          students: prev.students.map((s) => s.id === updated.id ? updated : s),
        }))
        showToast('Student updated successfully')
        closeForm()
      } else {
        // createStudent returns { student, generatedPassword }
        const result = await createStudent(payload)
        setPage(1)
        loadStudents({ page: 1, limit: 10, search })
        closeForm()
        // Show password reveal modal
        setPwModal({
          name:     `${result.student?.users?.first_name} ${result.student?.users?.last_name}`,
          email:    result.student?.users?.email,
          password: result.generatedPassword,
          isReset:  false,
        })
      }
    } catch (err) {
      throw err // let StudentForm display the error
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteStudent(deleteTarget.id)
      setStudentsData((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== deleteTarget.id),
        pagination: { ...prev.pagination, total: Math.max(0, (prev.pagination.total || 1) - 1) },
      }))
      showToast('Student deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleResetPassword = async (student) => {
    setResetLoading(student.id)
    try {
      const result = await resetStudentPassword(student.id)
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

  const studentName = deleteTarget
    ? `${deleteTarget.users?.first_name} ${deleteTarget.users?.last_name}`
    : ''

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Students"
        subtitle="Manage student enrolments, profiles and class assignments."
        action={canManage ? (
          <Button onClick={openCreate}>
            <span className="text-base leading-none">+</span>
            Add Student
          </Button>
        ) : null}
      />

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-lg
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <StudentsTable
        students={studentsData?.students || []}
        loading={studentsLoading}
        pagination={studentsData?.pagination || {}}
        search={search}
        onSearch={handleSearch}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onResetPassword={canManage ? handleResetPassword : undefined}
        resetLoadingId={resetLoading}
        readOnly={!canManage}
      />

      {/* ── Add / Edit form modal ────────────────────────────── */}
      <StudentForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        student={editTarget}
        classes={classes || []}
        loading={formLoading}
      />

      {/* ── Delete confirmation ──────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentName}? This will permanently remove their account and all associated records.`}
        confirmLabel="Delete Student"
        loading={deleteLoading}
        variant="danger"
      />

      {/* ── Password reveal modal ────────────────────────────── */}
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

export default StudentsPage
