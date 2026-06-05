import { useEffect, useState, useCallback } from 'react'
import useApi                  from '../../hooks/useApi'
import PageHeader              from '../../components/ui/PageHeader'
import Select                  from '../../components/ui/Select'
import FormField               from '../../components/ui/FormField'
import MarkAttendanceSheet     from '../../components/attendance/MarkAttendanceSheet'
import AttendanceStatsCard     from '../../components/attendance/AttendanceStatsCard'
import AttendanceRecordsTable  from '../../components/attendance/AttendanceRecordsTable'
import ModuleGate from '../../components/ModuleGate'
import Tabs from '../../components/ui/Tabs'
import {
  fetchAttendanceClasses,
  fetchAttendanceStats,
  fetchAttendanceRecords,
} from '../../services/attendance.service'

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]

const monthStart = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'mark',    label: 'Mark Attendance' },
  { id: 'records', label: 'Records' },
  { id: 'stats',   label: 'Statistics' },
]

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState('mark')

  // ── Shared filters ────────────────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate,  setSelectedDate]  = useState(today())
  const [startDate,     setStartDate]     = useState(monthStart())
  const [endDate,       setEndDate]       = useState(today())
  const [recordsPage,   setRecordsPage]   = useState(1)

  // ── Classes dropdown ──────────────────────────────────────────────────────
  const {
    data:    classes,
    loading: classesLoading,
    execute: loadClasses,
  } = useApi(fetchAttendanceClasses, [])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const {
    data:    stats,
    loading: statsLoading,
    execute: loadStats,
  } = useApi(fetchAttendanceStats)

  // ── Records ───────────────────────────────────────────────────────────────
  const {
    data:    recordsData,
    loading: recordsLoading,
    execute: loadRecords,
  } = useApi(fetchAttendanceRecords, { records: [], pagination: {} })

  // ── Load classes once ─────────────────────────────────────────────────────
  useEffect(() => { loadClasses() }, [loadClasses])

  // ── Load stats when tab or filters change ─────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'stats') return
    loadStats({
      classId:   selectedClass || undefined,
      startDate: startDate     || undefined,
      endDate:   endDate       || undefined,
    })
  }, [activeTab, selectedClass, startDate, endDate, loadStats])

  // ── Load records when tab or filters change ───────────────────────────────
  useEffect(() => {
    if (activeTab !== 'records') return
    loadRecords({
      classId: selectedClass || undefined,
      date:    selectedDate  || undefined,
      page:    recordsPage,
      limit:   20,
    })
  }, [activeTab, selectedClass, selectedDate, recordsPage, loadRecords])

  // ── After marking attendance, refresh stats if on stats tab ──────────────
  const handleAttendanceSaved = useCallback(() => {
    if (activeTab === 'stats') {
      loadStats({ classId: selectedClass, startDate, endDate })
    }
  }, [activeTab, selectedClass, startDate, endDate, loadStats])

  return (
    <ModuleGate moduleName="attendance">
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────── */}
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance, view records and analyse trends."
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── Filters bar ─────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">

          {/* Class selector — shown on all tabs */}
          <FormField label="Class">
            <Select
              value={selectedClass}
              onChange={(e) => { setSelectedClass(e.target.value); setRecordsPage(1) }}
              className="w-48"
              disabled={classesLoading}
            >
              <option value="">All classes</option>
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.section ? ` — ${c.section}` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Date — shown on Mark + Records tabs */}
          {(activeTab === 'mark' || activeTab === 'records') && (
            <FormField label="Date">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setRecordsPage(1) }}
                max={today()}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          )}

          {/* Date range — shown on Stats tab */}
          {activeTab === 'stats' && (
            <>
              <FormField label="From">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
              <FormField label="To">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={today()}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </>
          )}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}

      {/* Mark Attendance */}
      {activeTab === 'mark' && (
        <div>
          {!selectedClass ? (
            <div className="alert-warning">
              Select a class above to load the attendance sheet.
            </div>
          ) : (
            <MarkAttendanceSheet
              classId={selectedClass}
              date={selectedDate}
              onSaved={handleAttendanceSaved}
            />
          )}
        </div>
      )}

      {/* Records */}
      {activeTab === 'records' && (
        <AttendanceRecordsTable
          records={recordsData?.records || []}
          loading={recordsLoading}
          pagination={recordsData?.pagination || {}}
          onPageChange={setRecordsPage}
        />
      )}

      {/* Statistics */}
      {activeTab === 'stats' && (
        <AttendanceStatsCard
          stats={stats}
          loading={statsLoading}
        />
      )}
    </div>
    </ModuleGate>
  )
}

export default AttendancePage
