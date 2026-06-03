import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import useApi from '../../hooks/useApi'
import { fetchMyChildren } from '../../services/portal.service'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

const ParentDashboard = () => {
  const { user } = useAuth()
  const { data: children, loading, execute: load } = useApi(fetchMyChildren, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.first_name} 👋`}
        subtitle={`${user?.school_name || 'Your school'} · Parent Portal`}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !children?.length ? (
        <EmptyState
          icon="👨‍👩‍👧"
          title="No children linked"
          description="Your account must match guardian phone or name on a student record. Contact the school admin if you need help."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Linked Children" value={children.length} icon="🎓" color="blue" />
            <StatCard
              title="Quick access"
              value="View records"
              icon="📋"
              color="green"
              trend="Attendance & results"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {c.users?.first_name} {c.users?.last_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {c.classes?.name}{c.classes?.section ? ` · ${c.classes.section}` : ' — No class'}
                    </p>
                    {c.admission_number && (
                      <p className="text-xs text-gray-400 font-mono mt-1">{c.admission_number}</p>
                    )}
                  </div>
                  <span className="text-2xl">🎓</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/parent/attendance?child=${c.id}`}
                    className="flex-1 text-center px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition"
                  >
                    Attendance
                  </Link>
                  <Link
                    to={`/parent/results?child=${c.id}`}
                    className="flex-1 text-center px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                  >
                    Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ParentDashboard
