import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useApi from '../../hooks/useApi'
import { fetchChildAttendance } from '../../services/portal.service'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import StatCard from '../../components/ui/StatCard'
import ChildSelector from '../../components/parent/ChildSelector'
import ModuleGate from '../../components/ModuleGate'
import { formatDate } from '../../utils/helpers'

const ParentAttendancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [childId, setChildId] = useState(searchParams.get('child') || '')

  const { data, loading, execute: load } = useApi(
    (id) => fetchChildAttendance(id),
    { records: [], summary: {} }
  )

  useEffect(() => {
    if (childId) {
      load(childId)
      setSearchParams({ child: childId }, { replace: true })
    }
  }, [childId, load, setSearchParams])

  const summary = data?.summary || {}
  const records = data?.records || []

  return (
    <ModuleGate moduleName="attendance">
      <div className="space-y-6">
        <PageHeader title="Child's Attendance" subtitle="View attendance records for your linked children." />

        <ChildSelector
          selectedId={childId}
          onSelect={setChildId}
        />

        {!childId ? (
          <p className="text-sm text-gray-500">Select a child above to view attendance.</p>
        ) : loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard title="Present" value={summary.present ?? 0} icon="✅" color="green" />
              <StatCard title="Absent" value={summary.absent ?? 0} icon="❌" color="red" />
              <StatCard title="Late" value={summary.late ?? 0} icon="⏰" color="yellow" />
              <StatCard title="Rate" value={`${summary.rate ?? 0}%`} icon="📊" color="blue" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Attendance history</h3>
              </div>
              {records.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">No attendance records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        {['Date', 'Class', 'Status', 'Remarks'].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs">{formatDate(rec.attendance_date)}</td>
                          <td className="px-4 py-3 text-xs">
                            {rec.classes?.name}{rec.classes?.section ? ` · ${rec.classes.section}` : ''}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              label={rec.status}
                              variant={rec.status === 'present' ? 'success' : rec.status === 'late' ? 'warning' : 'danger'}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{rec.remarks || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ModuleGate>
  )
}

export default ParentAttendancePage
