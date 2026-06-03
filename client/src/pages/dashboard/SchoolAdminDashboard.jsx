import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useModules } from '../../context/ModuleContext'
import useApi from '../../hooks/useApi'
import {
  fetchSchoolStats,
  fetchRecentActivity,
  fetchModules,
  toggleModule,
} from '../../services/schoolAdmin.service'

import PageHeader       from '../../components/ui/PageHeader'
import StatCard         from '../../components/ui/StatCard'
import AttendanceBar    from '../../components/school-admin/AttendanceBar'
import RecentActivity   from '../../components/school-admin/RecentActivity'
import ModuleToggleCard from '../../components/school-admin/ModuleToggleCard'

const SchoolAdminDashboard = () => {
  const { user } = useAuth()
  const { refreshModules } = useModules()

  // ── Stats ─────────────────────────────────────────────────────────────────
  const {
    data:    stats,
    loading: statsLoading,
    error:   statsError,
    execute: loadStats,
  } = useApi(fetchSchoolStats)

  // ── Recent activity ───────────────────────────────────────────────────────
  const {
    data:    activity,
    loading: activityLoading,
    execute: loadActivity,
  } = useApi(fetchRecentActivity, [])

  // ── Modules ───────────────────────────────────────────────────────────────
  const {
    data:    modules,
    loading: modulesLoading,
    execute: loadModules,
    setData: setModules,
  } = useApi(fetchModules, [])

  const [togglingModule, setTogglingModule] = useState(null)

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadStats()
    loadActivity()
    loadModules()
  }, [loadStats, loadActivity, loadModules])

  // ── Module toggle handler ─────────────────────────────────────────────────
  const handleToggleModule = useCallback(async (moduleName) => {
    setTogglingModule(moduleName)
    try {
      const updated = await toggleModule(moduleName)
      // Optimistically update local state
      setModules((prev) =>
        (prev || []).map((m) =>
          m.module_name === updated.module_name
            ? { ...m, is_enabled: updated.is_enabled }
            : m
        )
      )
      refreshModules()
    } catch {
      loadModules()
      refreshModules()
    } finally {
      setTogglingModule(null)
    }
  }, [setModules, loadModules, refreshModules])

  // ── Derived values ────────────────────────────────────────────────────────
  const attendance = stats?.attendance || {}

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────── */}
      <PageHeader
        title={`Welcome, ${user?.first_name} 👋`}
        subtitle={`${user?.school_name || 'Your school'} · School Admin Dashboard`}
      />

      {/* ── Error banner ────────────────────────────────────────── */}
      {statsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load stats: {statsError}
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.students ?? null}
          icon="🎓"
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Total Teachers"
          value={stats?.teachers ?? null}
          icon="👨‍🏫"
          color="purple"
          loading={statsLoading}
        />
        <StatCard
          title="Classes"
          value={stats?.classes ?? null}
          icon="📚"
          color="green"
          loading={statsLoading}
        />
        <StatCard
          title="Subjects"
          value={stats?.subjects ?? null}
          icon="📖"
          color="yellow"
          loading={statsLoading}
        />
      </div>

      {/* ── Attendance + Activity row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceBar
          present={attendance.present}
          absent={attendance.absent}
          late={attendance.late}
          total={attendance.total}
          rate={attendance.rate}
          loading={statsLoading}
        />
        <RecentActivity
          activity={activity || []}
          loading={activityLoading}
        />
      </div>

      {/* ── Module toggles ───────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Module Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Enable or disable features for your school.
          </p>
        </div>

        {modulesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {(modules || []).map((mod) => (
              <ModuleToggleCard
                key={mod.module_name}
                moduleName={mod.module_name}
                isEnabled={mod.is_enabled}
                loading={togglingModule === mod.module_name}
                onToggle={handleToggleModule}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SchoolAdminDashboard
