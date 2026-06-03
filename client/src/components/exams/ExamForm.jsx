import { useState, useEffect } from 'react'
import Modal     from '../ui/Modal'
import FormField from '../ui/FormField'
import Input     from '../ui/Input'
import Select    from '../ui/Select'
import Spinner   from '../ui/Spinner'
import { getErrorMessage } from '../../utils/helpers'

const EMPTY = { name: '', classId: '', examDate: '' }

/**
 * ExamForm — create or edit an exam
 * Props: open, onClose, onSubmit, exam (null = create), classes, loading
 */
const ExamForm = ({ open, onClose, onSubmit, exam = null, classes = [], loading = false }) => {
  const isEdit = !!exam
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (exam) {
      setForm({
        name:      exam.name       || '',
        classId:   exam.classes?.id || '',
        examDate:  exam.exam_date  || '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
    setSubmitError('')
  }, [exam, open])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Exam name is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitError('')
    try {
      await onSubmit({
        name:     form.name,
        classId:  form.classId  || undefined,
        examDate: form.examDate || undefined,
      })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Exam' : 'Create Exam'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {submitError}
          </div>
        )}

        <FormField label="Exam Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. First Term Examination"
            error={!!errors.name}
          />
        </FormField>

        <FormField label="Class">
          <Select value={form.classId} onChange={set('classId')}>
            <option value="">All classes / General</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` — ${c.section}` : ''}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Exam Date">
          <Input type="date" value={form.examDate} onChange={set('examDate')} />
        </FormField>

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
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {loading && <Spinner size="sm" className="border-white border-t-transparent" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Exam'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ExamForm
