import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import useApi            from '../../hooks/useApi'
import ModuleGate from '../../components/ModuleGate'
import PageHeader        from '../../components/ui/PageHeader'
import Badge             from '../../components/ui/Badge'
import EmptyState        from '../../components/ui/EmptyState'
import Spinner           from '../../components/ui/Spinner'
import ConfirmDialog     from '../../components/ui/ConfirmDialog'
import ExamForm          from '../../components/exams/ExamForm'
import ExamResultsView   from '../../components/exams/ExamResultsView'
import ResultEntrySheet  from '../../components/exams/ResultEntrySheet'
import {
  fetchExams, fetchExamClasses, fetchExamResults,
  createExam, updateExam, deleteExam,
} from '../../services/exam.service'
import { formatDate, getErrorMessage } from '../../utils/helpers'

const TABS = [
  { id: 'exams',   label: '📝  Exams' },
  { id: 'entry',   label: '✏️  Result Entry' },
  { id: 'results', label: '📊  View Results' },
]

const ExamsPage = () => {
  const { isSchoolAdmin } = useAuth()
  const canManageExams = isSchoolAdmin
  const [activeTab, setActiveTab] = useState('exams')
  const [selectedExam, setSelectedExam] = useState(null)

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    data:    examsData,
    loading: examsLoading,
    execute: loadExams,
    setData: setExamsData,
  } = useApi(fetchExams, { exams: [], pagination: {} })

  const {
    data:    classes,
    execute: loadClasses,
  } = useApi(fetchExamClasses, [])

  const {
    data:    results,
    loading: resultsLoading,
    execute: loadResults,
  } = useApi(fetchExamResults, [])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formLoading, setFormLoading]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast]               = useState(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadExams(); loadClasses() }, [loadExams, loadClasses])

  useEffect(() => {
    if (activeTab === 'results' && selectedExam) {
      loadResults(selectedExam.id)
    }
  }, [activeTab, selectedExam, loadResults])

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit   = (exam) => { setEditTarget(exam); setFormOpen(true) }
  const closeForm  = () => { setFormOpen(false); setEditTarget(null) }

  const handleFormSubmit = async (payload) => {
    setFormLoading(true)
    try {
      if (editTarget) {
        const updated = await updateExam(editTarget.id, payload)
        setExamsData((prev) => ({
          ...prev,
          exams: prev.exams.map((e) => e.id === updated.id ? updated : e),
        }))
        showToast('Exam updated')
      } else {
        const created = await createExam(payload)
        setExamsData((prev) => ({
          ...prev,
          exams: [created, ...prev.exams],
          pagination: { ...prev.pagination, total: (prev.pagination.total || 0) + 1 },
        }))
        showToast('Exam created')
      }
      closeForm()
    } catch (err) {
      throw err
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteExam(deleteTarget.id)
      setExamsData((prev) => ({
        ...prev,
        exams: prev.exams.filter((e) => e.id !== deleteTarget.id),
      }))
      if (selectedExam?.id === deleteTarget.id) setSelectedExam(null)
      showToast('Exam deleted')
      setDeleteTarget(null)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const selectExamForTab = (exam, tab) => {
    setSelectedExam(exam)
    setActiveTab(tab)
  }

  return (
    <ModuleGate moduleName="exams">
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Exams & Results"
        subtitle={canManageExams
          ? 'Create exams, enter scores and view class performance.'
          : 'Enter scores and view class performance for your exams.'}
        action={canManageExams ? (
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            Create Exam
          </button>
        ) : null}
      />

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Exams list tab ──────────────────────────────────── */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {examsLoading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : (examsData?.exams || []).length === 0 ? (
            <EmptyState
              icon="📝"
              title="No exams yet"
              description="Create your first exam to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Exam Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(examsData?.exams || []).map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{exam.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {exam.classes ? (
                          <Badge label={`${exam.classes.name}${exam.classes.section ? ` · ${exam.classes.section}` : ''}`} variant="info" />
                        ) : (
                          <span className="text-gray-400 text-xs">General</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {exam.exam_date ? formatDate(exam.exam_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => selectExamForTab(exam, 'entry')}
                            className="px-2.5 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                          >
                            Enter Results
                          </button>
                          <button
                            onClick={() => selectExamForTab(exam, 'results')}
                            className="px-2.5 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition"
                          >
                            View Results
                          </button>
                          {canManageExams && (
                            <>
                              <button
                                onClick={() => openEdit(exam)}
                                className="px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(exam)}
                                className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Result Entry tab ────────────────────────────────── */}
      {activeTab === 'entry' && (
        <div className="space-y-4">
          {/* Exam selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam?.id || ''}
              onChange={(e) => {
                const exam = (examsData?.exams || []).find((ex) => ex.id === e.target.value)
                setSelectedExam(exam || null)
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
            >
              <option value="">Choose an exam…</option>
              {(examsData?.exams || []).map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          {selectedExam && (
            <ResultEntrySheet
              examId={selectedExam.id}
              onSaved={() => showToast('Results saved successfully')}
            />
          )}
        </div>
      )}

      {/* ── View Results tab ────────────────────────────────── */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Exam selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam?.id || ''}
              onChange={(e) => {
                const exam = (examsData?.exams || []).find((ex) => ex.id === e.target.value)
                setSelectedExam(exam || null)
                if (exam) loadResults(exam.id)
              }}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
            >
              <option value="">Choose an exam…</option>
              {(examsData?.exams || []).map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          {selectedExam && (
            <ExamResultsView results={results || []} loading={resultsLoading} />
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      <ExamForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        exam={editTarget}
        classes={classes || []}
        loading={formLoading}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Exam"
        message={`Delete "${deleteTarget?.name}"? All results for this exam will also be permanently deleted.`}
        confirmLabel="Delete Exam"
        loading={deleteLoading}
        variant="danger"
      />
    </div>
    </ModuleGate>
  )
}

export default ExamsPage
