import api from '../api/axios'

// ── Exams ─────────────────────────────────────────────────────────────────────
export const fetchExams = async ({ classId, page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/exams', { params: { classId, page, limit } })
  return data // { exams, pagination }
}

export const fetchExamById = async (id) => {
  const { data } = await api.get(`/exams/${id}`)
  return data.exam
}

export const createExam = async (payload) => {
  const { data } = await api.post('/exams', payload)
  return data.exam
}

export const updateExam = async (id, payload) => {
  const { data } = await api.put(`/exams/${id}`, payload)
  return data.exam
}

export const deleteExam = async (id) => {
  await api.delete(`/exams/${id}`)
}

// ── Results ───────────────────────────────────────────────────────────────────
export const fetchExamResults = async (examId) => {
  const { data } = await api.get(`/exams/${examId}/results`)
  return data.results
}

export const fetchResultSheet = async (examId) => {
  const { data } = await api.get(`/exams/${examId}/sheet`)
  return data // { exam, subjects, sheet }
}

export const saveResults = async (examId, entries) => {
  const { data } = await api.post(`/exams/${examId}/results`, { entries })
  return data.results
}

export const fetchStudentResults = async (studentId) => {
  const { data } = await api.get(`/exams/student/${studentId}/results`)
  return data.results
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
