import { useState, useEffect } from 'react'
import Spinner    from '../ui/Spinner'
import EmptyState from '../ui/EmptyState'
import { fetchResultSheet, saveResults } from '../../services/exam.service'
import { getErrorMessage } from '../../utils/helpers'

const gradeColor = (grade) => {
  if (!grade) return 'text-gray-400'
  if (grade.startsWith('A')) return 'text-green-600 font-semibold'
  if (grade === 'B')         return 'text-blue-600 font-semibold'
  if (grade === 'C')         return 'text-yellow-600 font-semibold'
  if (grade === 'D')         return 'text-orange-600 font-semibold'
  return 'text-red-600 font-semibold'
}

/**
 * ResultEntrySheet — enter/edit scores for all students in an exam
 * Props: examId, onSaved
 */
const ResultEntrySheet = ({ examId, onSaved }) => {
  const [sheet,   setSheet]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!examId) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchResultSheet(examId)
        setSheet(data)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examId])

  const setScore = (studentIdx, subjectIdx, value) => {
    setSheet((prev) => {
      const updated = { ...prev }
      updated.sheet = prev.sheet.map((s, si) => {
        if (si !== studentIdx) return s
        return {
          ...s,
          scores: s.scores.map((sc, sj) =>
            sj !== subjectIdx ? sc : { ...sc, score: value }
          ),
        }
      })
      return updated
    })
  }

  const handleSave = async () => {
    if (!sheet) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      // Build flat entries array — skip empty scores
      const entries = []
      sheet.sheet.forEach((student) => {
        student.scores.forEach((sc) => {
          if (sc.score === '' || sc.score === null || sc.score === undefined) return
          const score = parseFloat(sc.score)
          if (isNaN(score)) return
          entries.push({
            student_id: student.student_id,
            subject_id: sc.subject_id,
            score,
          })
        })
      })

      if (entries.length === 0) {
        setError('Enter at least one score before saving.')
        return
      }

      await saveResults(examId, entries)
      setSuccess(`${entries.length} result(s) saved successfully!`)
      onSaved?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!examId) {
    return <EmptyState icon="📝" title="Select an exam" description="Choose an exam to enter results." />
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
  }

  if (error && !sheet) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!sheet || sheet.sheet?.length === 0) {
    return (
      <EmptyState
        icon="🎓"
        title="No students found"
        description="This exam's class has no students enrolled."
      />
    )
  }

  if (!sheet.subjects || sheet.subjects.length === 0) {
    return (
      <EmptyState
        icon="📚"
        title="No subjects assigned"
        description="Assign subjects to this class before entering results."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Exam info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{sheet.exam?.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {sheet.exam?.classes?.name} · {sheet.sheet.length} students · {sheet.subjects.length} subjects
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2"
        >
          {saving && <Spinner size="sm" className="border-white border-t-transparent" />}
          {saving ? 'Saving…' : 'Save Results'}
        </button>
      </div>

      {error   && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {/* Score entry table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-10 min-w-[180px]">
                  Student
                </th>
                {sheet.subjects.map((sub) => (
                  <th key={sub.id} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center min-w-[100px]">
                    {sub.code || sub.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sheet.sheet.map((student, si) => {
                const scores  = student.scores.map((sc) => parseFloat(sc.score)).filter((n) => !isNaN(n))
                const average = scores.length > 0
                  ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                  : null

                return (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition">
                    {/* Student name */}
                    <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                      <p className="font-medium text-gray-900 text-xs leading-tight">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-gray-400 text-xs font-mono">{student.admission_number || '—'}</p>
                    </td>

                    {/* Score inputs */}
                    {student.scores.map((sc, sj) => (
                      <td key={sc.subject_id} className="px-2 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={sc.score}
                          onChange={(e) => setScore(si, sj, e.target.value)}
                          placeholder="—"
                          className="w-16 px-2 py-1.5 text-center text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </td>
                    ))}

                    {/* Average */}
                    <td className="px-4 py-2.5 text-center">
                      {average !== null ? (
                        <span className={`text-sm ${gradeColor(average >= 90 ? 'A+' : average >= 80 ? 'A' : average >= 70 ? 'B' : average >= 60 ? 'C' : average >= 50 ? 'D' : 'F')}`}>
                          {average}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ResultEntrySheet
