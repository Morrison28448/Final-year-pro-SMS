import { useState, useEffect } from 'react'
import Modal      from '../ui/Modal'
import FormField  from '../ui/FormField'
import Input      from '../ui/Input'
import Select     from '../ui/Select'
import Spinner    from '../ui/Spinner'
import { getErrorMessage } from '../../utils/helpers'

const GENDERS = ['Male', 'Female', 'Other']

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  gender: '', dateOfBirth: '', admissionNumber: '',
  classId: '', guardianName: '', guardianPhone: '', address: '',
}

/**
 * StudentForm — create or edit a student
 *
 * Props:
 *  open       boolean
 *  onClose    () => void
 *  onSubmit   (payload) => Promise<void>
 *  student    object | null   — if set, form is in edit mode
 *  classes    array           — [{ id, name, section }]
 *  loading    boolean
 */
const StudentForm = ({ open, onClose, onSubmit, student = null, classes = [], loading = false }) => {
  const isEdit = !!student
  const [form, setForm]   = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (student) {
      setForm({
        firstName:       student.users?.first_name    || '',
        lastName:        student.users?.last_name     || '',
        email:           student.users?.email         || '',
        phone:           student.users?.phone         || '',
        gender:          student.gender               || '',
        dateOfBirth:     student.date_of_birth        || '',
        admissionNumber: student.admission_number     || '',
        classId:         student.classes?.id          || '',
        guardianName:    student.guardian_name        || '',
        guardianPhone:   student.guardian_phone       || '',
        address:         student.address              || '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setSubmitError('')
  }, [student, open])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim())  errs.lastName  = 'Required'
    if (!form.email.trim())     errs.email     = 'Required'
    if (!isEdit && !form.email.includes('@')) errs.email = 'Invalid email'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitError('')
    try {
      await onSubmit({
        firstName:       form.firstName,
        lastName:        form.lastName,
        email:           form.email,
        phone:           form.phone       || undefined,
        gender:          form.gender      || undefined,
        dateOfBirth:     form.dateOfBirth || undefined,
        admissionNumber: form.admissionNumber || undefined,
        classId:         form.classId     || undefined,
        guardianName:    form.guardianName  || undefined,
        guardianPhone:   form.guardianPhone || undefined,
        address:         form.address     || undefined,
      })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Student' : 'Add New Student'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* ── Personal info ─────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Personal Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <Input
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="John"
                error={!!errors.firstName}
              />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <Input
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="Doe"
                error={!!errors.lastName}
              />
            </FormField>
            <FormField label="Email Address" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="student@school.com"
                disabled={isEdit}
                error={!!errors.email}
              />
            </FormField>
            <FormField label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+234 800 000 0000"
              />
            </FormField>
            <FormField label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="Date of Birth">
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
              />
            </FormField>
          </div>
        </div>

        {/* ── Academic info ─────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Academic Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Admission Number">
              <Input
                value={form.admissionNumber}
                onChange={set('admissionNumber')}
                placeholder="e.g. STU-2024-001"
              />
            </FormField>
            <FormField label="Assign Class">
              <Select value={form.classId} onChange={set('classId')}>
                <option value="">No class assigned</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.section ? ` — ${c.section}` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>

        {/* ── Guardian info ─────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Guardian Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Guardian Name">
              <Input
                value={form.guardianName}
                onChange={set('guardianName')}
                placeholder="Parent / Guardian name"
              />
            </FormField>
            <FormField label="Guardian Phone">
              <Input
                type="tel"
                value={form.guardianPhone}
                onChange={set('guardianPhone')}
                placeholder="+234 800 000 0000"
              />
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={set('address')}
                placeholder="Home address"
              />
            </FormField>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────── */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default StudentForm
