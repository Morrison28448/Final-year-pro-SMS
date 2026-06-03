import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useApi from '../../hooks/useApi'
import { fetchChildResults } from '../../services/portal.service'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ChildSelector from '../../components/parent/ChildSelector'
import ModuleGate from '../../components/ModuleGate'
import { formatDate } from '../../utils/helpers'

const gradeVariant = (grade) => {
  if (!grade) return 'neutral'
  if (grade.startsWith('A')) return 'success'
  if (grade === 'B') return 'info'
  if (grade === 'C') return 'warning'
  return 'danger'
}

const ParentResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [childId, setChildId] = useState(searchParams.get('child') || '')

  const { data, loading, execute: load } = useApi(
    (id) => fetchChildResults(id),
    { exams: [] }
  )

  useEffect(() => {
    if (childId) {
      load(childId)
      setSearchParams({ child: childId }, { replace: true })
    }
  }, [childId, load, setSearchParams])

  const exams = data?.exams || []

  return (
    <ModuleGate moduleName="exams">
      <div className="space-y-6">
        <PageHeader title="Child's Results" subtitle="View exam results for your linked children." />

        <ChildSelector selectedId={childId} onSelect={setChildId} />

        {!childId ? (
          <p className="text-sm text-gray-500">Select a child above to view results.</p>
        ) : loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : exams.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No exam results published yet.</p>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div key={exam.exam_id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{exam.exam_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(exam.exam_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{exam.average}</p>
                    <p className="text-xs text-gray-400">average</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exam.subjects.map((sub) => (
                    <div key={sub.subject_code || sub.subject_name}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                      <span className="text-gray-500">{sub.subject_code || sub.subject_name}:</span>
                      <span className="font-semibold">{sub.score}</span>
                      <Badge label={sub.grade || '—'} variant={gradeVariant(sub.grade)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleGate>
  )
}

export default ParentResultsPage
