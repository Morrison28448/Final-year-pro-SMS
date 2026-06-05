import api from '../api/axios'

// ── Terms ─────────────────────────────────────────────────────────────────────
export const fetchTerms = async () => {
  const { data } = await api.get('/terms')
  return data.terms
}
export const fetchTermById = async (id) => {
  const { data } = await api.get(`/terms/${id}`)
  return data.term
}
export const createTerm = async (payload) => {
  const { data } = await api.post('/terms', payload)
  return data.term
}
export const updateTerm = async (id, payload) => {
  const { data } = await api.put(`/terms/${id}`, payload)
  return data.term
}
export const deleteTerm = async (id) => {
  await api.delete(`/terms/${id}`)
}

// ── Assessment score entry ────────────────────────────────────────────────────
export const fetchAssessmentSheet = async (assessmentId, { classId, subjectId }) => {
  const { data } = await api.get(`/terms/assessment/${assessmentId}/sheet`, {
    params: { classId, subjectId },
  })
  return data // { assessment, subject, class_id, sheet }
}
export const saveAssessmentScores = async (assessmentId, { subjectId, entries }) => {
  const { data } = await api.post(`/terms/assessment/${assessmentId}/scores`, { subjectId, entries })
  return data.results
}
export const downloadTemplate = (assessmentId, { classId, subjectId }) => {
  // Returns a URL for direct browser download
  return `/api/terms/assessment/${assessmentId}/template?classId=${classId}&subjectId=${subjectId}`
}
export const uploadScores = async (assessmentId, { classId, subjectId, csvText }) => {
  const { data } = await api.post(`/terms/assessment/${assessmentId}/upload`, {
    classId, subjectId, csvText,
  })
  return data // { results, warnings }
}

// ── Terminal report ───────────────────────────────────────────────────────────
export const fetchTerminalReport = async (termId, classId) => {
  const { data } = await api.get(`/terms/${termId}/report`, { params: { classId } })
  return data // { students, assessments, subjects }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export const fetchExamClasses = async () => {
  const { data } = await api.get('/exams/classes')
  return data.classes
}
export const fetchSubjectsForClass = async (classId) => {
  const { data } = await api.get(`/exams/classes/${classId}/subjects`)
  return data.subjects
}
