import { useState, useEffect, useCallback } from 'react'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { fetchAttendanceSheet, markAttendance } from '../../services/attendance.service'
import { getErrorMessage } from '../../utils/helpers'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-700 ring-green-300' },
  { value: 'absent',  label: 'Absent',  color: 'bg-red-100 text-red-700 ring-red-300' },
  { value: 'late',    label: 'Late',    color: 'bg-yellow-100 text-yellow-700 ring-yellow-300' },
]

const statusColor = (status) => {
  if (status === 'present') return 'bg-green-100 text-green-700'
  if (status === 'absent')  return 'bg-red-100 text-red-700'
  if (status === 'late')    return 'bg-yellow-100 text-yellow-700'
  return 'bg-gray-100 text-gray-500'
}

/**
 * MarkAttendanceSheet
 * Props: classId, date, onSaved (callback after successful save)
 */
const MarkAttendanceSheet = ({ classId, date, onSaved }) => {
  const [sheet, setSheet]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [alreadyMarked, setAlreadyMarked] = useState(false)

  // ── Load sheet when classId or date changes ───────────────────────────────
  useEffect(() => {
    if (!classId || !date) return
    const load = async () => {
      setLoading(true)
      setError('')
      setSuccess('')
      try {
        const result = await fetchAttendanceSheet({ classId, date })
        setSheet(result.sheet || [])
        // If all students already have a status, sheet was already marked
        const marked = result.sheet?.length > 0 && result.sheet.every((s) => s.status !== null)
        setAlreadyMarked(marked)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classId, date])

  // ── Mark all present / absent ─────────────────────────────────────────────
  const markAll = useCallback((status) => {
    setSheet((prev) => prev.map((s) => ({ ...s, status })))
  }, [])

  // ── Update a single student's status ─────────────────────────────────────
  const setStatus = useCallback((studentId, status) => {
    setSheet((prev) =>
      prev.map((s) => s.student_id === studentId ? { ...s, status } : s)
    )
  }, [])

  // ── Update remarks ────────────────────────────────────────────────────────
  const setRemarks = useCallback((studentId, remarks) => {
    setSheet((prev) =>
      prev.map((s) => s.student_id === studentId ? { ...s, remarks } : s)
    )
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const unmarked = sheet.filter((s) => !s.status)
    if (unmarked.length > 0) {
      setError(`${unmarked.length} student(s) have no status set. Mark all students before saving.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      await markAttendance({
        classId,
        date,
        records: sheet.map((s) => ({
          student_id: s.student_id,
          status:     s.status,
          remarks:    s.remarks || '',
        })),
      })
      setSuccess('Attendance saved successfully!')
      setAlreadyMarked(true)
      onSaved?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // ── Summary counts ────────────────────────────────────────────────────────
  const counts = sheet.reduce(
    (acc, s) => {
      if (s.status) acc[s.status] = (acc[s.status] || 0) + 1
      acc.total++
      return acc
    },
    { present: 0, absent: 0, late: 0, total: 0 }
  )

  if (!classId || !date) {
    return (
      <EmptyState
        icon="📋"
        title="Select a class and date"
        description="Choose a class and date above to load the attendance sheet."
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (sheet.length === 0) {
    return (
      <EmptyState
        icon="🎓"
        title="No students in this class"
        description="Add students to this class first before marking attendance."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Status messages ─────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ── Summary bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-3 flex-1">
          {[
            { label: 'Present', count: counts.present, color: 'text-green-700 bg-green-50' },
            { label: 'Absent',  count: counts.absent,  color: 'text-red-700 bg-red-50' },
            { label: 'Late',    count: counts.late,    color: 'text-yellow-700 bg-yellow-50' },
            { label: 'Total',   count: counts.total,   color: 'text-gray-700 bg-gray-50' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${color}`}>
              {label}: {count}
            </div>
          ))}
        </div>

        {/* Quick-mark buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => markAll('present')}
            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            All Present
          </button>
          <button
            onClick={() => markAll('absent')}
            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* ── Attendance sheet table ───────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Adm. No.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sheet.map((student, idx) => (
                <tr key={student.student_id} className="hover:bg-gray-50 transition">
                  {/* Row number */}
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>

                  {/* Student name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </p>
                  </td>

                  {/* Admission number */}
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {student.admission_number || '—'}
                  </td>

                  {/* Status toggle buttons */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(student.student_id, opt.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ring-1 ring-transparent
                            ${student.status === opt.value
                              ? `${opt.color} ring-2`
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Remarks */}
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={student.remarks || ''}
                      onChange={(e) => setRemarks(student.student_id, e.target.value)}
                      placeholder="Optional note…"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Save button ──────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {saving && <Spinner size="sm" className="border-white border-t-transparent" />}
          {saving ? 'Saving…' : alreadyMarked ? 'Update Attendance' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}

export default MarkAttendanceSheet
