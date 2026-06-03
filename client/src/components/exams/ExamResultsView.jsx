import Badge      from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import Spinner    from '../ui/Spinner'
import { formatDate } from '../../utils/helpers'

const gradeVariant = (grade) => {
  if (!grade) return 'neutral'
  if (grade.startsWith('A')) return 'success'
  if (grade === 'B') return 'info'
  if (grade === 'C') return 'warning'
  return 'danger'
}

/**
 * ExamResultsView — read-only results grouped by student
 * Props: results (array from getExamResults), loading
 */
const ExamResultsView = ({ results = [], loading = false }) => {
  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No results yet"
        description="Enter scores using the Result Entry tab."
      />
    )
  }

  // Sort by average descending (class ranking)
  const sorted = [...results].sort((a, b) => b.average - a.average)

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{results.length} student(s) with results</p>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>Class avg: <strong className="text-gray-900">
            {Math.round(results.reduce((a, b) => a + b.average, 0) / results.length * 10) / 10}
          </strong></span>
          <span>Highest: <strong className="text-green-700">{Math.max(...results.map((r) => r.average))}</strong></span>
          <span>Lowest: <strong className="text-red-700">{Math.min(...results.map((r) => r.average))}</strong></span>
        </div>
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">Rank</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subjects</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Average</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((student, idx) => {
                const avgGrade = student.average >= 90 ? 'A+' : student.average >= 80 ? 'A'
                  : student.average >= 70 ? 'B' : student.average >= 60 ? 'C'
                  : student.average >= 50 ? 'D' : 'F'

                return (
                  <tr key={student.student_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{student.admission_number || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.subjects.map((sub) => (
                          <span key={sub.subject_id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {sub.subject_code || sub.subject_name}:
                            <span className="font-semibold text-gray-900">{sub.score}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{student.total}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{student.average}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge label={avgGrade} variant={gradeVariant(avgGrade)} />
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

export default ExamResultsView
